
export interface Resident {
  id: string;
  firstName: string; // Sera utilisé comme 'nom' pour la nouvelle fonctionnalité
  lastName: string;
  dateOfBirth?: string;
  roomNumber?: string;
  dietaryRestrictions: string[];
  allergies: string[];
  medicalSpecificities: string;
  isActive: boolean; // Statut général (actif/inactif dans l'établissement)
  present: boolean; // Statut de présence quotidien (présent/absent pour les repas par ex.)
  avatarUrl?: string;
  unit: string;
  contraindications: string[];
  textures: string[];
  diets: string[];
}

export interface Meal {
  id: string;
  name: string;
  description?: string;
  category: 'starter' | 'main' | 'dessert' | 'drink' | 'snack';
  dietTags?: string[];
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

export type AttendanceStatus = 'present' | 'absent' | 'external'; // Peut être utilisé pour une logique de présence plus détaillée

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

export interface MenuPersonalized {
  id: string;
  residentId: string;
  date: string;
  items: Array<{ mealId: string; originalMealName: string; mealNameAdapted?: string; mealType: MealType; textureApplied: string; dietApplied: string[]; notes?: string; }>;
  unit: string;
}

export interface UnitSummary {
  unit: string;
  date: string;
  items: Array<{
    mealId: string;
    mealName: string;
    mealType: MealType;
    totalCount: number;
    textures: Record<string, number>;
    diets: Record<string, number>;
  }>;
  notes?: string;
}
