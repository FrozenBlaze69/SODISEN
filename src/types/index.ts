export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string; // Optional, can be used to calculate age or for records
  roomNumber?: string;
  dietaryRestrictions: string[]; // e.g., ["sans sel", "diabétique"]
  allergies: string[]; // e.g., ["arachides", "lactose"]
  medicalSpecificities: string; // General text field for other important info
  isActive: boolean; // To mark if resident is currently in EHPAD
  avatarUrl?: string; // Optional for placeholder
}

export interface Meal {
  id: string;
  name: string; // e.g., "Poulet rôti et haricots verts"
  description?: string;
  category: 'starter' | 'main' | 'dessert' | 'drink' | 'snack';
  dietTags?: string[]; // e.g., ["sans porc", "mixé"]
  allergenTags?: string[]; // e.g., ["gluten-free"]
}

export interface MenuItem {
  mealId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface Menu {
  id: string;
  date: string; // YYYY-MM-DD
  items: MenuItem[]; // Could be structured by meal time: breakfast, lunch, dinner
  notes?: string; // e.g., "Menu spécial Pâques"
}

export type AttendanceStatus = 'present' | 'absent' | 'external';

export interface AttendanceRecord {
  id: string;
  residentId: string;
  date: string; // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner';
  status: AttendanceStatus;
  notes?: string; // e.g., "Déjeune en famille" for external
}

export interface Notification {
  id: string;
  timestamp: string; // ISO date string
  type: 'attendance' | 'absence' | 'outing' | 'allergy_alert' | 'emergency' | 'info';
  title: string;
  message: string;
  isRead: boolean;
  userIds?: string[]; // For role-based notifications, who should see this
  relatedResidentId?: string;
}

export type UserRole = 'chef_gerant' | 'cuisinier' | 'soignant' | 'famille_invite';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}
