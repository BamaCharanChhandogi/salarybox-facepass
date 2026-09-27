import { User } from '../types';

/**
 * Pre-seeded dummy credentials for the demo.
 * The Admin user is always present. Staff users are also seeded
 * but more can be added through the Admin flow.
 */
export const SEED_USERS: Omit<User, 'id' | 'createdAt'>[] = [
  {
    employeeId: 'ADMIN001',
    name: 'Admin User',
    role: 'admin',
    password: 'admin123',
    profilePhotoUri: null,
  },
  {
    employeeId: 'EMP001',
    name: 'Rahul Sharma',
    role: 'staff',
    password: 'staff123',
    profilePhotoUri: null,
  },
  {
    employeeId: 'EMP002',
    name: 'Priya Patel',
    role: 'staff',
    password: 'staff456',
    profilePhotoUri: null,
  },
];
