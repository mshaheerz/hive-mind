import { toggleFeatureFlag } from "@/app/actions/toggleFeatureFlag";
import { readFlags } from "@/utils/featureFlags";

describe("toggleFeatureFlag", () => {
  it("should toggle the enabled state of a feature flag", async () => {
    const initialFlags = [
      createFlag({ key: "test-key-1", description: "Test Description" })
    ];

    expect(await readFlags()).toHaveLength(1);

    await toggleFeatureFlag(initialFlags[0].id);
    expect((await readFlags())[0]).toEqual({
      ...initialFlags[0],
      enabled: true,
      version: 2
    });

    await toggleFeatureFlag(initialFlags[0].id);
    expect((await readFlags())[0]).toEqual({
      ...initialFlags[0],
      enabled: false,
      version: 3
    });
  });

  it("should throw an error if the flag is not found", async () => {
    expect(() => toggleFeatureFlag("non-existing-id")).toThrow("Feature flag not found");
  });
});
