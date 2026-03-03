// File: src/services/apiService.ts
async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}
