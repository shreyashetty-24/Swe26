// Mock/in-memory seed data for the HaaS (Hardware-as-a-Service) PoC.
// Domain: Users (Students) -> Projects (joined by project ID) -> Hardware Sets (global shared capacity)

export const initialHardwareSets = [
  { id: 'hw1', name: 'Hardware Set 1', totalCapacity: 10, available: 10 },
  { id: 'hw2', name: 'Hardware Set 2', totalCapacity: 5, available: 5 },
];

// Projects can only be joined by entering their project ID.
export const initialProjects = [
  {
    id: 'PRJ-1001',
    name: 'Project Alpha',
    startDate: '2026-10-01',
    endDate: '2026-10-05',
    memberIds: [],
    checkouts: [],
  },
  {
    id: 'PRJ-1002',
    name: 'Project Beta',
    startDate: '2026-10-03',
    endDate: '2026-10-04',
    memberIds: [],
    checkouts: [],
  },
];

// Populated by signup. Shape: { id, username, password }
export const initialUsers = [];
