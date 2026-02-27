// ...

it('should handle null input correctly', async () => {
  expect.assertions(1);
  const result = await new AnalyzeDependencies().analyze(null as any);
  expect(result).toBeNull();
});

it('should raise an error for non-objects or arrays', async () => {
  expect.assertions(1);
  try {
    await new AnalyzeDependencies().analyze('not an object');
  } catch (error) {
    expect(error instanceof TypeError).toBeTruthy();
  }
});
