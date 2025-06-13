
'use server'; // Indirection, mais les fonctions appelées par le client le seront via des Server Actions ou le client directement

import { db } from './config';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import type { Resident } from '@/types';

const RESIDENTS_COLLECTION = 'residents';

export async function addResidentToFirestore(name: string): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, RESIDENTS_COLLECTION), {
      firstName: name,
      lastName: "", // Initialisé à vide
      present: true, // Par défaut présent
      isActive: true, // Par défaut actif dans l'établissement
      createdAt: serverTimestamp(),
      // Initialiser les autres champs obligatoires de Resident avec des valeurs par défaut
      dietaryRestrictions: [],
      allergies: [],
      medicalSpecificities: "",
      unit: "Non assignée",
      contraindications: [],
      textures: ["Normal"],
      diets: [],
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw new Error("Could not add resident");
  }
}

export async function updateResidentPresenceInFirestore(residentId: string, present: boolean): Promise<void> {
  try {
    const residentDocRef = doc(db, RESIDENTS_COLLECTION, residentId);
    await updateDoc(residentDocRef, {
      present: present
    });
  } catch (e) {
    console.error("Error updating document: ", e);
    throw new Error("Could not update resident presence");
  }
}

// Cette fonction est pour le client, donc pas 'use server' ici.
// Elle établit un listener temps réel.
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
        present: data.present === undefined ? true : data.present,
        isActive: data.isActive === undefined ? true : data.isActive,
        dietaryRestrictions: data.dietaryRestrictions || [],
        allergies: data.allergies || [],
        medicalSpecificities: data.medicalSpecificities || "",
        unit: data.unit || "Non assignée",
        contraindications: data.contraindications || [],
        textures: data.textures || ["Normal"],
        diets: data.diets || [],
        // Assurez-vous que tous les champs de l'interface Resident sont gérés
        dateOfBirth: data.dateOfBirth,
        roomNumber: data.roomNumber,
        avatarUrl: data.avatarUrl,

      });
    });
    callback(residentsList);
  }, (error) => {
    console.error("Error listening to residents collection: ", error);
    // Gérer l'erreur de manière appropriée, par exemple en informant l'utilisateur
  });

  return unsubscribe; // Retourne la fonction pour se désabonner
}

export async function deleteResidentFromFirestore(residentId: string): Promise<void> {
    try {
        const residentDocRef = doc(db, RESIDENTS_COLLECTION, residentId);
        await deleteDoc(residentDocRef);
    } catch (e) {
        console.error("Error deleting document: ", e);
        throw new Error("Could not delete resident");
    }
}
