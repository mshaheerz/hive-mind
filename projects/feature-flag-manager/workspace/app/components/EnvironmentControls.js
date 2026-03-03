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
