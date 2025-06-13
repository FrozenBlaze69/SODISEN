
'use server'; 

import { db } from './config';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { RESIDENTS_COLLECTION } from './constants';
import type { Resident } from '@/types';

// Type pour les données envoyées pour ajouter/mettre à jour un résident
// createdAt sera géré par serverTimestamp, id est généré ou fourni pour la mise à jour
export type ResidentFormData = Omit<Resident, 'id' | 'createdAt'>;

export async function addOrUpdateResident(residentData: ResidentFormData, residentId?: string): Promise<string> {
  try {
    const dataWithTimestamp = {
      ...residentData,
      // Les champs array doivent être initialisés s'ils sont undefined
      allergies: residentData.allergies || [],
      contraindications: residentData.contraindications || [],
      textures: residentData.textures || [],
      diets: residentData.diets || [],
      updatedAt: serverTimestamp(),
    };

    if (residentId) {
      // Mise à jour d'un résident existant
      const residentDocRef = doc(db, RESIDENTS_COLLECTION, residentId);
      await setDoc(residentDocRef, dataWithTimestamp, { merge: true }); // merge: true pour ne pas écraser les champs non fournis
      return residentId;
    } else {
      // Ajout d'un nouveau résident
      const dataForAdd = {
        ...dataWithTimestamp,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, RESIDENTS_COLLECTION), dataForAdd);
      return docRef.id;
    }
  } catch (e) {
    console.error("Error adding or updating document: ", e);
    if (e instanceof Error) {
      throw new Error(`Could not save resident: ${e.message}`);
    }
    throw new Error("Could not save resident due to an unknown error.");
  }
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
