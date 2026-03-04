// app/api/data/route.js
/**
 * Simple in‑memory data store.
 * In a real app this would be replaced with a DB call.
 */
let data = [
  { id: 1, name: "First item" },
  { id: 2, name: "Second item" },
];

export async function GET(request) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body?.name?.trim()) {
      return new Response(
        JSON.stringify({ error: "Name is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const newItem = {
      id: data.length ? data[data.length - 1].id + 1 : 1,
      name: body.name.trim(),
    };
    data.push(newItem);

    return new Response(JSON.stringify(newItem), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
