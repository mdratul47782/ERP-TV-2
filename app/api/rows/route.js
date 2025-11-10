// app/api/rows/route.js
export const dynamic = 'force-dynamic';

const getStore = () => (globalThis.__ROW_STORE__ ?? (globalThis.__ROW_STORE__ = []));

const genId = () =>
  (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export async function POST(req) {
  const body = await req.json();
  const record = {
    id: genId(),
    ...body,
    createdAt: new Date().toISOString(),
  };
  const store = getStore();
  store.push(record);

  return new Response(JSON.stringify(record), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET() {
  return new Response(JSON.stringify(getStore()), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
