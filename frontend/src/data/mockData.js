// Mock/in-memory seed data for the HaaS (Hardware-as-a-Service) PoC.
// Domain: Users (Employees) -> Projects (Pastry recipes/orders) -> Hardware Sets (Equipment)

export const initialHardwareSets = [
  { id: 'hw1', name: 'KitchenAid 8Qt Stand Mixer', totalCapacity: 10, available: 10 },
  { id: 'hw2', name: 'Espresso Machine', totalCapacity: 4, available: 4 },
  { id: 'hw3', name: 'Proofing Cabinet', totalCapacity: 3, available: 3 },
  { id: 'hw4', name: 'Commercial Dehydrator', totalCapacity: 2, available: 2 },
];

export const initialProjects = [
  {
    id: 'p1',
    name: 'Wedding Cake Project',
    startDate: '2026-10-01',
    endDate: '2026-10-05',
    memberIds: [],
    checkouts: [],
  },
  {
    id: 'p2',
    name: 'Artisan Sourdough Batch',
    startDate: '2026-10-03',
    endDate: '2026-10-04',
    memberIds: [],
    checkouts: [],
  },
];

// Populated by signup. Shape: { id, username, password }
export const initialUsers = [];
