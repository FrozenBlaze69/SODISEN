
'use server'; 

import { db } from './config';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { RESIDENTS_COLLECTION } from './constants';

// Functions like addResidentToFirestore, updateResidentPresenceInFirestore, deleteResidentFromFirestore remain here

export async function addResidentToFirestore(name: string): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, RESIDENTS_COLLECTION), {
      firstName: name,
      lastName: "", 
      present: true, 
      isActive: true, 
      createdAt: serverTimestamp(),
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

export async function deleteResidentFromFirestore(residentId: string): Promise<void> {
    try {
        const residentDocRef = doc(db, RESIDENTS_COLLECTION, residentId);
        await deleteDoc(residentDocRef);
    } catch (e) {
        console.error("Error deleting document: ", e);
        throw new Error("Could not delete resident");
    }
}
