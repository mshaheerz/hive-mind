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
