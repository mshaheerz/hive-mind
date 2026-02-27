**Implementation Overview**

The solution is a Go‑based CLI tool that:

1. **Accepts** a Postman collection ID (fetched via the Postman API) **or** a local collection file path.  
2. **Parses** the collection JSON into a Go struct (`models.Collection`).  
3. **Converts** the collection to an OpenAPI 3.0 definition (a very small, illustrative conversion – a production version would use a dedicated library).  
4. **Runs** the OpenAPI Generator CLI (`openapi-generator-cli`) to produce SDKs for TypeScript, Python and Go.  
5. **Writes** the generated SDKs to a user‑specified output directory.

All functions include GoDoc comments, named constants replace magic numbers/strings, and every async/IO operation is wrapped with proper error handling. The CLI is built with **Cobra**, HTTP calls use **Resty**, and the code is split into logical packages that mirror the architecture diagram.

---

## 1. Complete source files

### `go.mod`
```go
module github.com/yourorg/postman-to-sdk

go 1.22

require (
    github.com/go-resty/resty/v2 v2.12.0
    github.com/spf13/cobra v1.8.0
)
```

---

### `main.go`
```go
// main.go
// Entry point for the Postman‑to‑SDK CLI tool.
// It simply executes the root command defined in cmd/postman-to-sdk.go.
package main

import (
	"github.com/yourorg/postman-to-sdk/cmd"
)

func main() {
	cmd.Execute()
}
```

---

### `cmd/postman-to-sdk.go`
```go
// cmd/postman-to-sdk.go
// Defines the Cobra CLI command, parses flags and delegates work to the internal packages.
package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/yourorg/postman-to-sdk/internal/collection_parser"
	"github.com/yourorg/postman-to-sdk/internal/openapi_generator"
	"github.com/yourorg/postman-to-sdk/internal/sdk_generator"
	"github.com/yourorg/postman-to-sdk/pkg/postman_api"
	"github.com/yourorg/postman-to-sdk/pkg/sdk_repository"
)

const (
	// Flag names
	flagCollectionID = "collection-id"
	flagFilePath     = "file"
	flagOutputDir    = "output"
	flagApiKeyEnv    = "POSTMAN_API_KEY"
)

// rootCmd is the base command when called without any sub‑commands.
var rootCmd = &cobra.Command{
	Use:   "postman-to-sdk",
	Short: "Generate TypeScript, Python and Go SDKs from a Postman collection",
	RunE:  run,
}

// Execute runs the root command. It is called from main.main().
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "CLI error: %v\n", err)
		os.Exit(1)
	}
}

// init registers CLI flags.
func init() {
	rootCmd.Flags().String(flagCollectionID, "", "Postman collection ID (requires POSTMAN_API_KEY env var)")
	rootCmd.Flags().String(flagFilePath, "", "Path to a local Postman collection JSON file")
	rootCmd.Flags().String(flagOutputDir, "./sdks", "Directory where generated SDKs will be written")
}

// run is the main execution flow for the command.
func run(cmd *cobra.Command, _ []string) error {
	collectionID, _ := cmd.Flags().GetString(flagCollectionID)
	filePath, _ := cmd.Flags().GetString(flagFilePath)
	outputDir, _ := cmd.Flags().GetString(flagOutputDir)

	if collectionID == "" && filePath == "" {
		return fmt.Errorf("either --%s or --%s must be provided", flagCollectionID, flagFilePath)
	}

	// 1️⃣ Fetch or read the collection JSON.
	var collectionBytes []byte
	var err error
	if collectionID != "" {
		apiKey := os.Getenv(flagApiKeyEnv)
		if apiKey == "" {
			return fmt.Errorf("environment variable %s is required for collection ID mode", flagApiKeyEnv)
		}
		collectionBytes, err = postman_api.FetchCollection(collectionID, apiKey)
		if err != nil {
			return fmt.Errorf("failed to fetch collection from Postman API: %w", err)
		}
	} else {
		collectionBytes, err = os.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("failed to read collection file: %w", err)
		}
	}

	// 2️⃣ Parse collection JSON into a struct.
	collection, err := collection_parser.Parse(collectionBytes)
	if err != nil {
		return fmt.Errorf("failed to parse collection JSON: %w", err)
	}

	// 3️⃣ Convert to OpenAPI spec.
	openAPISpec, err := openapi_generator.Convert(collection)
	if err != nil {
		return fmt.Errorf("failed to convert collection to OpenAPI: %w", err)
	}

	// 4️⃣ Generate SDKs for each language.
	languages := []string{"typescript", "python", "go"}
	for _, lang := range languages {
		sdkPath, err := sdk_generator.Generate(lang, openAPISpec, outputDir)
		if err != nil {
			return fmt.Errorf("SDK generation failed for %s: %w", lang, err)
		}
		fmt.Printf("✅ %s SDK generated at %s\n", lang, sdkPath)
	}

	// 5️⃣ Record the SDKs in the repository (optional future use).
	if err := sdk_repository.Save(outputDir); err != nil {
		// Not a fatal error – just log.
		fmt.Fprintf(os.Stderr, "warning: failed to update SDK repository: %v\n", err)
	}
	return nil
}
```

---

### `internal/collection_parser/parser.go`
```go
// internal/collection_parser/parser.go
// Parses raw Postman collection JSON into a strongly‑typed Go struct.
package collection_parser

import (
	"encoding/json"

	"github.com/yourorg/postman-to-sdk/models"
)

// Parse converts a JSON byte slice into a models.Collection.
// It returns an error if the JSON is malformed.
func Parse(data []byte) (*models.Collection, error) {
	var col models.Collection
	if err := json.Unmarshal(data, &col); err != nil {
		return nil, err
	}
	return &col, nil
}
```

---

### `internal/openapi_generator/generator.go`
```go
// internal/openapi_generator/generator.go
// Very small, illustrative conversion from a Postman collection to an OpenAPI 3.0 spec.
// A real implementation would need a dedicated library or a much richer mapping.
package openapi_generator

import (
	"encoding/json"
	"fmt"

	"github.com/yourorg/postman-to-sdk/models"
)

// Convert transforms a Postman collection into an OpenAPI spec (as JSON bytes).
func Convert(col *models.Collection) ([]byte, error) {
	if col.Info.Name == "" {
		return nil, fmt.Errorf("collection has no name")
	}

	// Basic skeleton of an OpenAPI document.
	openapi := map[string]interface{}{
		"openapi": "3.0.3",
		"info": map[string]string{
			"title":   col.Info.Name,
			"version": "1.0.0",
		},
		"paths": map[string]interface{}{},
	}

	// Very naive conversion: each request becomes a GET operation at /{{request.name}}.
	for _, item := range col.Item {
		if item.Request == nil {
			continue
		}
		path := "/" + sanitizePath(item.Name)
		method := "get" // default to GET for demo purposes

		paths := openapi["paths"].(map[string]interface{})
		if _, exists := paths[path]; !exists {
			paths