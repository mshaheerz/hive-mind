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
