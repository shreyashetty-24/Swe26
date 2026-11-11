// Client for project, membership and hardware check-out endpoints
// (see ../../backend/routes/projects.py). Every call says which user is
// acting via `userId`.
import { request } from './http';

const enc = encodeURIComponent;

export function fetchProjects(userId) {
  return request('GET', `/api/projects?userId=${enc(userId)}`);
}

export function createProjectRequest(userId, { id, name, startDate, endDate }) {
  return request('POST', '/api/projects', { userId, id, name, startDate, endDate });
}

export function joinProjectRequest(userId, id) {
  return request('POST', '/api/projects/join', { userId, id });
}

export function leaveProjectRequest(userId, projectId) {
  return request('POST', `/api/projects/${enc(projectId)}/leave`, { userId });
}

// Both resolve with { ok, project, hardwareSets } so the UI can update the
// project and the global pool from one response.
export function checkOutRequest(userId, projectId, hardwareId, quantity) {
  return request('POST', `/api/projects/${enc(projectId)}/checkout`, {
    userId,
    hardwareId,
    quantity,
  });
}

export function checkInRequest(userId, projectId, hardwareId, quantity) {
  return request('POST', `/api/projects/${enc(projectId)}/checkin`, {
    userId,
    hardwareId,
    quantity,
  });
}
