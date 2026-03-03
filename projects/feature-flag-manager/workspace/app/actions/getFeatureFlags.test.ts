import { getFeatureFlags } from "@/app/actions/getFeatureFlags";
import { readFlags } from "@/utils/featureFlags";

describe("getFeatureFlags", () => {
  it("should return all feature flags", async () => {
    const initialFlags = [
      createFlag({ key: "test-key-1", description: "Test Description" }),
      createFlag({ key: "test-key-2", description: "Test Description" })
    ];

    const updatedFlags = await readFlags();
    expect(updatedFlags).toHaveLength(2);

    expect(await getFeatureFlags()).toEqual([
      { id: expect.any(String), ...updatedFlags[0] },
      { id: expect.any(String), ...updatedFlags[1] }
    ]);
  });

  it("should return feature flags for a specific environment", async () => {
    const initialFlags = [
      createFlag({ key: "test-key-1", description: "Test Description", environment: "development" }),
      createFlag({ key: "test-key-2", description: "Test Description", environment: "staging" })
    ];

    expect(await getFeatureFlags("development")).toEqual([
      { id: expect.any(String), ...initialFlags[0] }
    ]);

    expect(await getFeatureFlags("staging")).toEqual([
      { id: expect.any(String), ...initialFlags[1] }
    ]);
  });
});

function createFlag({ key, description, environment = "development" }) {
  return {
    id: uuidv4(),
    key,
    description,
    environment,
    enabled: false,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
