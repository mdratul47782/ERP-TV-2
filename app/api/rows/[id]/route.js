// app/api/rows/[id]/route.js
export const dynamic = 'force-dynamic';

const getStore = () => (globalThis.__ROW_STORE__ ?? (globalThis.__ROW_STORE__ = []));

export async function PATCH(req, { params }) {
  const body = await req.json();
  const store = getStore();
  const idx = store.findIndex(r => r.id === params.id);

  if (idx === -1) {
    return new Response(JSON.stringify({ message: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  store[idx] = {
    ...store[idx],
    ...body,
    updatedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(store[idx]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
