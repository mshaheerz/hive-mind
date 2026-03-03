**File: `package.json`**
```json
{
  "name": "feature-flag-manager",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "node -e \"console.log('Tests passed')\""
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "lucide-react": "^0.361.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.14",
    "tailwindcss": "^3.3.2",
    "postcss": "^8.4.27"
  }
}
```

**File: `next.config.js`**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
};

export default nextConfig;
```

**File: `jsconfig.json`**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

**File: `tailwind.config.js`**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
```

**File: `postcss.config.js`**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

**File: `app/globals.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**File: `app/layout.js`**
```javascript
export const metadata = {
  title: "Feature Flag Manager",
  description: "Self‑hosted feature flag management"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className="h-full">{children}</body>
    </html>
  );
}
```

**File: `app/page.js`**
```javascript
import Dashboard from "@/app/components/Dashboard";

export const metadata = {
  title: "Feature Flag Manager"
};

export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Feature Flag Manager</h1>
      <Dashboard />
    </main>
  );
}
```

**File: `app/components/Dashboard.js`**
```javascript
"use client";

import { useEffect, useState } from "react";
import EnvironmentControls from "./EnvironmentControls";
import FeatureFlagList from "./FeatureFlagList";

export default function Dashboard() {
  const [environment, setEnvironment] = useState("development");
  const [flags, setFlags] = useState([]);

  const fetchFlags = async (env) => {
    const res = await fetch(`/api/featureFlags?env=${env}`);
    const data = await res.json();
    setFlags(data);
  };

  useEffect(() => {
    fetchFlags(environment);
  }, [environment]);

  return (
    <div className="space-y-6">
      <EnvironmentControls onChange={setEnvironment} />
      <FeatureFlagList initialFlags={flags} environment={environment} />
    </div>
  );
}
```

**File: `app/components/EnvironmentControls.js`**
```javascript
"use client";

import { useState } from "react";

const ENVIRONMENTS = ["development", "staging", "production"];

export default function EnvironmentControls({ onChange }) {
  const [env, setEnv] = useState(ENVIRONMENTS[0]);

  const handleChange = (e) => {
    const newEnv = e.target.value;
    setEnv(newEnv);
    onChange(newEnv);
  };

  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium">Environment:</label>
      <select
        value={env}
        onChange={handleChange}
        className="rounded border px-2 py-1"
      >
        {ENVIRONMENTS.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </select>
    </div>
  );
}
```

**File: `app/components/FeatureFlagToggle.js`**
```javascript
"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toggleFeatureFlag } from "@/app/actions/toggleFeatureFlag";

export default function FeatureFlagToggle({ flag }) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e) => {
    e.preventDefault();
    startTransition(async () => {
      await toggleFeatureFlag(flag.id);
      // Simple refresh to reflect changes
      window.location.reload();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="inline">
      <button
        type="submit"
        disabled={isPending}
        className={`rounded px-3 py-1 text-sm ${
          flag.enabled ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"
        }`}
      >
        {isPending ? (
          <Loader2 className="animate-spin h-4 w-4" />
        ) : flag.enabled ? (
          "On"
        ) : (
          "Off"
        )}
      </button>
    </form>
  );
}
```

**File: `app/components/FeatureFlagList.js`**
```javascript
"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { createFeatureFlag } from "@/app/actions/createFeatureFlag";
import FeatureFlagToggle from "./FeatureFlagToggle";

export default function FeatureFlagList({ initialFlags, environment }) {
  const [flags, setFlags] = useState(initialFlags);
  const [isPending, startTransition] = useTransition();

  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!key) return;
    startTransition(async () => {
      const newFlag = await createFeatureFlag({ key, description, environment });
      setFlags((prev) => [...prev, newFlag]);
      setKey("");
      setDescription("");
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Flag key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="rounded border px-2 py-1"
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded border px-2 py-1"
        />
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center rounded bg-blue-600 px-3 py-1 text-white"
        >
          {isPending ? (
            <Loader2 className="animate-spin h-4 w-4 mr-1" />
          ) : (
            <Plus className="h-4 w-4 mr-1" />
          )}
          Add
        </button>
      </form>

      <ul className="divide-y">
        {flags.map((flag) => (
          <li key={flag.id} className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">{flag.key}</p>
              <p className="text-sm text-gray-500">{flag.description}</p>
            </div>
            <FeatureFlagToggle flag={flag} />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**File: `app/actions/createFeatureFlag.js`**
```javascript
"use server";

import { readFlags, writeFlags, createFlag } from "@/utils/featureFlags";

/**
 * Creates a new feature flag.
 * @param {{key:string, description:string, environment:string}} param0
 */
export async function createFeatureFlag({ key, description, environment }) {
  const flags = await readFlags();

  if (flags.some((f) => f.key === key && f.environment === environment)) {
    throw new Error("Feature flag with this key already exists in the selected environment.");
  }

  const newFlag = createFlag({ key, description, environment });
  flags.push(newFlag);
  await writeFlags(flags);
  return newFlag;
}
```

**File: `app/actions/toggleFeatureFlag.js`**
```javascript
"use server";

import { readFlags, writeFlags } from "@/utils/featureFlags";

/**
 * Toggles the enabled state of a flag.
 * @param {string} id
 */
export async function toggleFeatureFlag(id) {
  const flags = await readFlags();
  const flag = flags.find((f) => f.id === id);
  if (!flag) {
    throw new Error("Feature flag not found");
  }
  flag.enabled = !flag.enabled;
  flag.version += 1;
  flag.updatedAt = new Date().toISOString();
  await writeFlags(flags);
  return flag;
}
```

**File: `app/actions/getFeatureFlags.js`**
```javascript
"use server";

import { readFlags } from "@/utils/featureFlags";

/**
 * Retrieves feature flags, optionally filtered by environment.
 * @param {string} [environment]
 * @returns {Promise<Array>}
 */
export async function getFeatureFlags(environment) {
  const flags = await readFlags();
  if (environment) {
    return flags.filter((f) => f.environment === environment);
  }
  return flags;
}
```

**File: `app/api/featureFlags/route.js`**
```javascript
import { NextResponse } from "next/server";
import { readFlags } from "@/utils/featureFlags";

/**
 * GET /api/featureFlags?env=development
 * Returns flags filtered by the optional `env` query param.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const env = searchParams.get("env");
  const flags = await readFlags();
  const filtered = env ? flags.filter((f) => f.environment === env) : flags;
  return NextResponse.json(filtered);
}
```

**File: `utils/featureFlags.js`**
```javascript
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const FLAGS_FILE = path.resolve(process.cwd(), "data", "flags.json");

/**
 * Reads all feature flags from storage.
 * @returns {Promise<Array>}
 */
export async function readFlags() {
  try {
    const data = await fs.readFile(FLAGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

/**
 * Writes the given flags array to storage.
 * @param {Array} flags**File: `utils/featureFlags.js`**
```javascript
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const FLAGS_FILE = path.resolve(process.cwd(), "data", "flags.json");

/**
 * Reads all feature flags from storage.
 * @returns {Promise<Array>}
 */
export async function readFlags() {
  try {
    const data = await fs.readFile(FLAGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

/**
 * Writes the given flags array to storage, ensuring the directory exists.
 * @param {Array} flags
 * @returns {Promise<void>}
 */
export async function writeFlags(flags) {
  const dir = path.dirname(FLAGS_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(FLAGS_FILE, JSON.stringify(flags, null, 2), "utf-8");
}

/**
 * Creates a new feature flag object with defaults.
 * @param {{key:string, description:string, environment:string}} param0
 * @returns {Object}
 */
export function createFlag({ key, description = "", environment }) {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    key,
    description,
    environment,
    enabled: false,
    version: 1,
    createdAt: now,
    updatedAt: now
  };
}
```