
export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string; 
  roomNumber?: string;
  // dietaryRestrictions: string[]; // Déprécié, utiliser diets et textures
  allergies: string[];
  medicalSpecificities: string; 
  isActive: boolean; 
  avatarUrl?: string;
  unit: string;
  contraindications: string[];
  textures: string[];
  diets: string[];
  createdAt?: any; 
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

export type AttendanceStatus = 'present' | 'absent' | 'external';
export type MealLocation = 'dining_hall' | 'room' | 'not_applicable';

export interface AttendanceRecord {
  id: string;
  residentId: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  status: AttendanceStatus;
  mealLocation?: MealLocation;
  notes?: string;
}

export interface Notification {
  id:string;
  timestamp: string; // ISO date string
  type: 'attendance' | 'absence' | 'outing' | 'allergy_alert' | 'emergency' | 'info' | 'attendance_reminder' | 'urgent_diet_request';
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

// Pour la structure des plats dans le planning hebdomadaire
export interface PlannedMealItem {
  name: string;
  category: Meal['category'];
  dietTags: string[];
  allergenTags: string[];
  description?: string;
}

// Pour la structure des repas (déjeuner/dîner) d'une journée dans le planning
export interface DailyPlannedMeals {
  lunch: { main?: PlannedMealItem; dessert?: PlannedMealItem; starter?: PlannedMealItem };
  dinner: { main?: PlannedMealItem; dessert?: PlannedMealItem; starter?: PlannedMealItem };
}

// Pour la structure d'une journée dans le planning hebdomadaire (ce qui sera stocké/utilisé)
export interface WeeklyDayPlan {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "Lundi", "Mardi", etc.
  meals: DailyPlannedMeals;
}

// Pour les données du formulaire de gestion des résidents
export type ResidentFormData = Omit<Resident, 'id' | 'createdAt'>;

// Pour le résumé par unité destiné aux cuisiniers
export interface UnitSummary {
  unit: string;
  date: string; // YYYY-MM-DD
  items: Array<{
    mealId: string; // ID du plat global
    mealName: string; // Nom du plat global
    mealType: MealType;
    totalCount: number; // Nombre total de ce plat pour l'unité
    textures: Record<string, number>; // ex: { "Normal": 10, "Mixé": 2 }
    diets: Record<string, number>; // ex: { "Sans Sel": 5, "Végétarien": 1 }
  }>;
  notes?: string; 
}

// Pour les réservations de repas par les familles/AS
export interface MealReservation {
  id: string; // ID de la réservation
  residentId: string;
  residentName?: string; // Pour affichage facile
  mealDate: string; // YYYY-MM-DD
  mealType: 'lunch' | 'dinner';
  numberOfGuests: number; // Nombre d'invités EN PLUS du résident
  comments?: string;
  reservedBy: string; // ID ou nom de l'utilisateur ayant fait la réservation
  createdAt: any; // Firestore timestamp
}

export interface MealReservationFormData {
  residentId: string;
  mealDate: Date;
  mealType: 'lunch' | 'dinner';
  numberOfGuests: number;
  comments?: string;
}

// Pour la suggestion de menu par IA
export interface MenuSuggestionInput {
  dietaryNeeds: string; // e.g., "Végétarien, sans gluten"
  mealType: 'starter' | 'main' | 'dessert';
  preferences?: string; // e.g., "aime les plats épicés, n'aime pas les champignons"
}

export interface MenuSuggestionOutput {
  suggestedDishName: string;
  description: string;
  reasoning?: string; // Why this dish fits the criteria
}
