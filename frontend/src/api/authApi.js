// Client for the backend's auth endpoints (see ../../backend/routes/auth.py).
import { request } from './http';

export function signupRequest(username, password) {
  return request('POST', '/api/signup', { username, password });
}

export function loginRequest(username, password) {
  return request('POST', '/api/login', { username, password });
}
