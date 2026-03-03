it("should not throw an error if description is empty string", async () => {
  const initialFlags = [];
  const flagKey = "test-key";
  const description = "";

  expect(async () => {
    await createFeatureFlag({ key: flagKey, description });
  }).not.toThrow();
});
