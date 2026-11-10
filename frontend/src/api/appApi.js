// Very small client for the backend's project/hardware endpoints (see
// ../../backend/app.py). The backend's routes are plain GET endpoints with
// query-string args (same basic style as HW6/app.py), so this just builds
// query strings and calls fetch -- no REST verbs, no request bodies.
//
// Every function resolves (never throws) with a { ok, ... } shape.

async function get(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${path}?${query}` : path;

  let res;
  try {
    res = await fetch(url);
  } catch {
    return { ok: false, error: 'Could not reach the server. Is the backend running?' };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: 'Unexpected response from the server.' };
  }

  return { ok: res.ok, data, error: res.ok ? undefined : data.message || 'Something went wrong.' };
}

// Wraps `get` for endpoints that return an object with a "message" (plus
// whatever other fields), flattening it onto the result like the auth API.
async function getJson(path, params = {}) {
  const { ok, data, error } = await get(path, params);
  if (!ok) {
    return { ok: false, error };
  }
  return { ok: true, ...data };
}

// /api/projects and /api/hardware return a plain JSON array, not an
// object, so they can't be flattened the same way -- keep the list intact.
export async function fetchProjects() {
  const { ok, data, error } = await get('/api/projects');
  if (!ok) {
    return { ok: false, error };
  }
  return { ok: true, projects: data };
}

export async function fetchHardware() {
  const { ok, data, error } = await get('/api/hardware');
  if (!ok) {
    return { ok: false, error };
  }
  return { ok: true, hardwareSets: data };
}

export function createProjectRequest(name, startDate, endDate, userId) {
  return getJson('/api/createProject', { name, startDate, endDate, userId });
}

export function joinProjectRequest(projectId, userId) {
  return getJson('/api/joinProject', { projectId, userId });
}

export function leaveProjectRequest(projectId, userId) {
  return getJson('/api/leaveProject', { projectId, userId });
}

export function checkOutHardwareRequest(projectId, hardwareId, qty) {
  return getJson('/api/checkOutHardware', { projectId, hardwareId, qty });
}

export function checkInHardwareRequest(projectId, checkoutId) {
  return getJson('/api/checkInHardware', { projectId, checkoutId });
}
