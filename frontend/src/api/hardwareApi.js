// Client for the global hardware inventory (see ../../backend/routes/hardware.py).
import { request } from './http';

export function fetchHardware(userId) {
  return request('GET', `/api/hardware?userId=${encodeURIComponent(userId)}`);
}
