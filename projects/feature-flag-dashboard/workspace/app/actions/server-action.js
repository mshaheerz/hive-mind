// app/actions/server-action.js
/**
 * Server Action to add a new item.
 * It receives a FormData object from the client,
 * forwards the data to the internal API route,
 * and returns the created record.
 */
export async function addData(formData) {
  "use server";

  const name = formData.get("name");
  if (!name) {
    throw new Error("Name is required");
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to add data");
  }

  return await res.json(); // returns the newly created item
}
