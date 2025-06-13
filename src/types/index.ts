
export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string; // Format YYYY-MM-DD ou laisser en string simple pour l'instant
  roomNumber?: string;
  // dietaryRestrictions: string[]; // Redondant avec diets, on utilisera diets
  allergies: string[];
  medicalSpecificities: string; // Champ texte libre pour spécificités médicales
  isActive: boolean; // Statut général (actif/inactif dans l'établissement)
  // present: boolean; // Ce champ était pour la présence quotidienne, géré ailleurs maintenant (ex: Attendance)
  avatarUrl?: string;
  unit: string;
  contraindications: string[];
  textures: string[];
  diets: string[];
  createdAt?: any; // Pour serverTimestamp
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

// Nouvelle interface pour les menus personnalisés par résident
export interface MenuPersonalized {
  id: string; // Id du document dans Firestore
  residentId: string;
  date: string; // YYYY-MM-DD
  items: Array<{ 
    mealId: string; 
    originalMealName: string; // Nom du plat global
    mealNameAdapted?: string; // Nom du plat si adapté (ex: "Steak Haché" pour "Steak Frites")
    mealType: MealType; 
    textureApplied: string; // Ex: "Mixé lisse", "Normal"
    dietApplied: string[]; // Ex: ["Sans sel", "Diabétique"]
    notes?: string; // Notes spécifiques pour la préparation de ce plat pour ce résident
  }>;
  unit: string; // Unité du résident au moment de la génération
}

// Nouvelle interface pour le résumé par unité destiné aux cuisiniers
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
    // On pourrait ajouter ici les noms adaptés si besoin, ou les gérer au niveau MenuPersonalized
  }>;
  notes?: string; // Notes générales pour l'unité pour cette date
}
