// Very small client for the backend's auth endpoints (see ../../backend).
// Both functions always resolve (never throw) with a { ok, ... } shape so
// callers can handle them the same way the old in-memory reducer did.

async function postJson(path, body) {
  let res;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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

  return data; // { ok: true, user: { id, username } }
}

export function signupRequest(username, password) {
  return postJson('/api/signup', { username, password });
}

export function loginRequest(username, password) {
  return postJson('/api/login', { username, password });
}
