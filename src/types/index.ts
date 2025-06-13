
export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  roomNumber?: string;
  dietaryRestrictions: string[]; // Consolidate diets here, or rename if diets field is preferred
  allergies: string[];
  medicalSpecificities: string;
  isActive: boolean;
  avatarUrl?: string;
  unit: string; // Identificateur de l’unité MAS
  contraindications: string[];
  textures: string[]; // e.g., ["Normal", "Mixé", "Haché"]
  diets: string[]; // e.g., ["Sans sel", "Diabétique", "Végétarien"]
}

export interface Meal {
  id: string;
  name: string;
  description?: string;
  category: 'starter' | 'main' | 'dessert' | 'drink' | 'snack';
  dietTags?: string[]; // General tags, can be used for global filtering
  allergenTags?: string[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MenuItem {
  mealId: string;
  mealType: MealType;
}

export interface Menu {
  id: string;
  date: string; // YYYY-MM-DD
  items: MenuItem[];
  notes?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'external';

export interface AttendanceRecord {
  id: string;
  residentId: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  status: AttendanceStatus;
  notes?: string;
}

export interface Notification {
  id:string;
  timestamp: string; // ISO date string
  type: 'attendance' | 'absence' | 'outing' | 'allergy_alert' | 'emergency' | 'info';
  title: string;
  message: string;
  isRead: boolean;
  userIds?: string[];
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

// Nouvelles interfaces
export interface MenuPersonalized {
  id: string; // Firestore document ID
  residentId: string;
  date: string; // YYYY-MM-DD
  unit: string;
  items: Array<{
    mealId: string;
    originalMealName: string; // For reference
    mealNameAdapted?: string; // If name changes due to adaptation
    mealType: MealType;
    textureApplied: string; // The specific texture applied for this resident
    dietApplied: string[]; // Specific diets considered for this meal for this resident
    notes?: string; // e.g., "Substituted X for Y due to allergy"
  }>;
}

export interface UnitSummary {
  unit: string;
  date: string; // YYYY-MM-DD
  items: Array<{
    mealId: string; // Could be an aggregation if multiple original meals lead to same displayed item
    mealName: string; // Name of the meal item for the unit (could be generic)
    mealType: MealType;
    totalCount: number; // Total for this meal item in this unit
    textures: Record<string, number>; // e.g., { "Normal": 10, "Mixé": 5 }
    diets: Record<string, number>; // e.g., { "Sans Sel": 8, "Végétarien": 2 }
    // allergenAvoidances?: Record<string, number>; // How many instances avoided specific allergens
  }>;
  notes?: string; // General notes for the unit's preparation
}
