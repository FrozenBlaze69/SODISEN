
export interface Resident {
  id: string;
  firstName: string;
  lastName:string;
  dateOfBirth?: string; 
  roomNumber?: string;
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

export type MealType = 'lunch' | 'dinner' | 'snack';

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
  type: 'attendance' | 'absence' | 'outing' | 'allergy_alert' | 'emergency' | 'info' | 'attendance_reminder' | 'urgent_diet_request' | 'reservation_made';
  title: string;
  message: string;
  isRead: boolean;
  userIds?: string[];
  relatedResidentId?: string;
}

export type UserRole = 'chef_gerant' | 'cuisinier' | 'soignant' | 'famille_invite' | null;

export interface User {
  id: string; 
  name: string; 
  email?: string; 
  role: UserRole;
  avatarUrl?: string;
}

export interface PlannedMealItem {
  name: string;
  category: Meal['category'];
  dietTags: string[];
  allergenTags: string[];
  description?: string;
}

export interface DailyPlannedMeals {
  lunch: { main?: PlannedMealItem; dessert?: PlannedMealItem; starter?: PlannedMealItem };
  dinner: { main?: PlannedMealItem; dessert?: PlannedMealItem; starter?: PlannedMealItem };
}

export interface WeeklyDayPlan {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; 
  meals: DailyPlannedMeals;
}

export type ResidentFormData = Omit<Resident, 'id' | 'createdAt'>;

export interface UnitSummary {
  unit: string;
  date: string; // YYYY-MM-DD
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

// MealReservation now reflects data as stored in Firestore (id will be Firestore doc ID)
// createdAt will be a Firestore Timestamp server-side, converted to ISO string for client
export interface MealReservation {
  id: string; 
  residentName: string; 
  mealDate: string; // YYYY-MM-DD
  mealType: 'lunch' | 'dinner';
  numberOfGuests: number; 
  comments?: string;
  reservedBy: string; // Placeholder for user who made reservation, can be enhanced later
  createdAt: string; // ISO string on client, from Firestore Timestamp
}

// FormData for the client-side form
export interface MealReservationFormData {
  residentName: string;
  mealDate: Date; // Client uses Date object for picker
  mealType: 'lunch' | 'dinner';
  numberOfGuests: number;
  comments?: string;
}

export interface AuthContextType {
  currentUser: User | null;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export default function AiMenuSuggestionPagePlaceholder() {
  return null;
}
