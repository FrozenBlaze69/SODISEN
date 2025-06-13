
import { db } from './config';
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import type { Resident } from '@/types';
import { RESIDENTS_COLLECTION } from './constants'; // Import the constant

// This function is for the client, so no 'use server' here.
// It establishes a real-time listener.
export function onResidentsUpdate(callback: (residents: Resident[]) => void): () => void {
  const q = query(collection(db, RESIDENTS_COLLECTION), orderBy("createdAt", "desc"));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
        textures: data.textures || [], // Defaulting to empty array if not present
        diets: data.diets || [],       // Defaulting to empty array if not present
        dateOfBirth: data.dateOfBirth,
        roomNumber: data.roomNumber,
        avatarUrl: data.avatarUrl,
        // createdAt is implicitly handled by Firestore and available in doc.metadata or via serverTimestamp on write
      });
    });
    callback(residentsList);
  }, (error) => {
    console.error("Error listening to residents collection: ", error);
  });

  return unsubscribe; // Returns the function to unsubscribe
}

