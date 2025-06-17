
import { db } from './config';
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import type { Resident, MealReservation } from '@/types';
import { RESIDENTS_COLLECTION, RESERVATIONS_COLLECTION } from './constants';

const mockResidentsForPreview: Resident[] = [
  {
    id: 'mockres-1',
    firstName: 'Alain',
    lastName: 'Delaroche',
    unit: 'Unité Bleue',
    roomNumber: '101',
    dateOfBirth: '1935-10-05',
    avatarUrl: 'https://placehold.co/40x40.png?text=AD',
    medicalSpecificities: 'Hypertension, Mobilité réduite',
    diets: ['Sans sel', 'Pauvre en sucre'],
    textures: ['Normal'],
    allergies: ['Pénicilline'],
    contraindications: ['Aspirine'],
    isActive: true,
  },
  {
    id: 'mockres-2',
    firstName: 'Brigitte',
    lastName: 'Lefevre',
    unit: 'Unité Verte',
    roomNumber: '203',
    dateOfBirth: '1942-03-12',
    avatarUrl: 'https://placehold.co/40x40.png?text=BL',
    medicalSpecificities: 'Diabète type 2',
    diets: ['Diabétique'],
    textures: ['Mixé lisse'],
    allergies: [],
    contraindications: [],
    isActive: true,
  },
  {
    id: 'mockres-3',
    firstName: 'Claude',
    lastName: 'Moreau',
    unit: 'Unité Bleue',
    roomNumber: '105',
    dateOfBirth: '1938-07-22',
    avatarUrl: 'https://placehold.co/40x40.png?text=CM',
    medicalSpecificities: 'Alzheimer léger',
    diets: [],
    textures: ['Normal'],
    allergies: ['Fruits de mer'],
    contraindications: [],
    isActive: true,
  },
  {
    id: 'mockres-4',
    firstName: 'Denise',
    lastName: 'Garnier',
    unit: 'Unité Rouge',
    roomNumber: '301',
    dateOfBirth: '1945-11-15',
    avatarUrl: 'https://placehold.co/40x40.png?text=DG',
    medicalSpecificities: 'Arthrose sévère',
    diets: [],
    textures: ['Haché fin'],
    allergies: [],
    contraindications: [],
    isActive: false, 
  },
  {
    id: 'mockres-5',
    firstName: 'Étienne',
    lastName: 'Bernard',
    unit: 'Unité Verte',
    roomNumber: '207',
    dateOfBirth: '1933-02-01',
    avatarUrl: 'https://placehold.co/40x40.png?text=EB',
    medicalSpecificities: 'Problèmes cardiaques',
    diets: ['Sans sel', 'Pauvre en cholestérol'],
    textures: ['Normal'],
    allergies: [],
    contraindications: [],
    isActive: true,
  },
  {
    id: 'mockres-6',
    firstName: 'Françoise',
    lastName: 'Petit',
    unit: 'Unité Rouge',
    roomNumber: '305',
    dateOfBirth: '1940-09-30',
    avatarUrl: 'https://placehold.co/40x40.png?text=FP',
    medicalSpecificities: '',
    diets: ['Végétarien'],
    textures: ['Normal'],
    allergies: ['Lactose'],
    contraindications: [],
    isActive: true,
  },
  {
    id: 'mockres-7',
    firstName: 'Gérard',
    lastName: 'Lambert',
    unit: 'Unité Bleue',
    roomNumber: '108',
    dateOfBirth: '1937-06-18',
    avatarUrl: 'https://placehold.co/40x40.png?text=GL',
    medicalSpecificities: 'Insuffisance rénale légère',
    diets: ['Pauvre en potassium'],
    textures: ['Morceaux tendres'],
    allergies: [],
    contraindications: [],
    isActive: true,
  },
  {
    id: 'mockres-8',
    firstName: 'Hélène',
    lastName: 'Roux',
    unit: 'Unité Verte',
    roomNumber: '210',
    dateOfBirth: '1948-04-03',
    avatarUrl: 'https://placehold.co/40x40.png?text=HR',
    medicalSpecificities: 'Ostéoporose',
    diets: ['Riche en calcium'],
    textures: ['Normal'],
    allergies: [],
    contraindications: [],
    isActive: true,
  },
  {
    id: 'mockres-9',
    firstName: 'Isabelle',
    lastName: 'Dubois',
    unit: 'Unité Rouge',
    roomNumber: '308',
    dateOfBirth: '1939-12-25',
    avatarUrl: 'https://placehold.co/40x40.png?text=ID',
    medicalSpecificities: 'Faiblesse générale',
    diets: ['Hypercalorique'],
    textures: ['Mixé lisse'],
    allergies: ['Noix'],
    contraindications: [],
    isActive: true,
  },
  {
    id: 'mockres-10',
    firstName: 'Jacques',
    lastName: 'Mercier',
    unit: 'Unité Bleue',
    roomNumber: '112',
    dateOfBirth: '1930-08-10',
    avatarUrl: 'https://placehold.co/40x40.png?text=JM',
    medicalSpecificities: 'Perte d\'appétit',
    diets: ['Enrichi'],
    textures: ['Normal'],
    allergies: [],
    contraindications: ['Certains anti-inflammatoires'],
    isActive: true,
  },
];

export function onResidentsUpdate(
  callback: (residents: Resident[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(collection(db, RESIDENTS_COLLECTION), orderBy("lastName", "asc"));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    if (querySnapshot.empty && !querySnapshot.metadata.hasPendingWrites) {
      console.log("Firestore 'residents' collection is empty. Using mock data for preview.");
      callback(mockResidentsForPreview);
      return;
    }

    const residentsList: Resident[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      residentsList.push({
        id: doc.id,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        isActive: data.isActive === undefined ? true : data.isActive,
        allergies: data.allergies || [],
        medicalSpecificities: data.medicalSpecificities || "",
        unit: data.unit || "Non assignée",
        contraindications: data.contraindications || [],
        textures: data.textures || [],
        diets: data.diets || [],
        dateOfBirth: data.dateOfBirth, 
        roomNumber: data.roomNumber,
        avatarUrl: data.avatarUrl,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      });
    });
    callback(residentsList);
  }, (error) => {
    console.error("Error listening to residents collection: ", error);
    if (onError) {
      onError(error);
    }
    // Fallback to mock data if there's an error (e.g. permission denied)
    // This helps in development if Firestore rules are not set up yet.
    callback(mockResidentsForPreview);
  });

  return unsubscribe;
}

export function onReservationsUpdate(
  callback: (reservations: MealReservation[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(collection(db, RESERVATIONS_COLLECTION), orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const reservationsList: MealReservation[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reservationsList.push({
        id: doc.id,
        residentName: data.residentName || "N/A",
        mealDate: data.mealDate, // Should be YYYY-MM-DD string
        mealType: data.mealType,
        numberOfGuests: data.numberOfGuests || 0,
        comments: data.comments || "",
        reservedBy: data.reservedBy || "System",
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      });
    });
    callback(reservationsList);
  }, (error) => {
    console.error("Error listening to reservations collection: ", error);
    if (onError) {
      onError(error);
    }
    // If there's an error, provide an empty list rather than mock data for reservations.
    callback([]);
  });

  return unsubscribe;
}
