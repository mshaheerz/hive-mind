## System Overview
The Postman-to-SDK tool is a CLI application that generates fully-typed API client SDKs in TypeScript, Python, and Go directly from Postman collections. The tool utilizes the Postman API to fetch collections, converts them to OpenAPI definitions, and then leverages code generation libraries to produce SDKs. This process aims to automate the conversion of Postman collections to usable code, reducing manual effort and potential errors.

## Component Diagram (Mermaid)
```mermaid
graph LR
    A[Postman API] -->|Fetches Collections|> B[Collection Parser]
    B -->|Converts to OpenAPI|> C[OpenAPI Generator]
    C -->|Generates SDKs|> D[SDK Generator]
    D -->|Produces SDKs|> E[Output]
    E -->|Stores SDKs|> F[SDK Repository]
    G[CLI] -->|Handles User Input|> B
    G -->|Parses CLI Args|> B
```

## Data Flow
1. The user interacts with the CLI tool, providing a Postman collection ID or file path.
2. The CLI tool uses the Postman API to fetch the collection.
3. The collection is parsed and converted to an OpenAPI definition.
4. The OpenAPI definition is used to generate SDKs in TypeScript, Python, and Go.
5. The generated SDKs are stored in a repository for future use.

## File/Folder Structure
```markdown
postman-to-sdk/
├── cmd/
│   └── postman-to-sdk.go
├── internal/
│   ├── collection_parser/
│   │   └── parser.go
│   ├── openapi_generator/
│   │   └── generator.go
│   ├── sdk_generator/
│   │   └── generator.go
│   └── utils/
│       └── utils.go
├── models/
│   ├── collection.go
│   └── openapi.go
├── pkg/
│   ├── postman_api/
│   │   └── client.go
│   └── sdk_repository/
│       └── repository.go
├── test/
│   └── integration_test.go
├── README.md
└── main.go
```

## Key Technical Decisions + Justification
* **Programming languages:** TypeScript, Python, and Go for SDK generation. This allows for a wide range of target languages and ecosystems.
* **CLI framework:** Commander.js (for Node.js) or Click (for Python) to build the CLI tool. This provides a robust and user-friendly interface for users.
* **Postman API:** Utilize the Postman API to fetch collections and convert them to SDKs. This allows for seamless integration with Postman's existing ecosystem.
* **Code generation libraries:** Leverage libraries like Swagger Codegen or OpenAPI Generator to generate SDKs from OpenAPI definitions. This reduces development effort and ensures high-quality SDKs.

## What FORGE Needs to Know to Start Coding
To begin coding, FORGE needs to know:
* The specific requirements for the CLI tool's user interface and input handling.
* The details of the Postman API and how to interact with it.
* The OpenAPI definition format and how to convert Postman collections to it.
* The target SDK formats (TypeScript, Python, Go) and their respective code generation libraries.
* The desired output format for the generated SDKs (e.g., file structure, naming conventions).
* Any specific error handling or logging requirements.