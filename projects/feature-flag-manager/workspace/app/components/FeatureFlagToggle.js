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
