// Shared fetch wrapper for every API module. Always resolves (never throws)
// with a { ok, ... } shape so callers handle success/failure the same way.

export async function request(method, path, body) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { ok: false, error: 'Could not reach the server. Is the backend running?' };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: 'Unexpected response from the server.' };
  }

  if (!res.ok || !data.ok) {
    return { ok: false, error: data.error || 'Something went wrong.' };
  }

  return data;
}
