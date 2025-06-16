
'use server'; 

// Ce fichier contient la logique backend (Server Actions) pour interagir avec Firestore.
// Toutes les fonctions exportées ici s'exécutent côté serveur.
// RÔLE BACKEND : Ce fichier agit comme votre backend pour les opérations sur les résidents.
// Il communique directement avec Firebase Firestore pour lire et écrire des données.

// AVANT QUE CE CODE NE FONCTIONNE, ASSUREZ-VOUS D'AVOIR :
// 1. CONFIGURÉ CORRECTEMENT VOS CLÉS FIREBASE dans `src/lib/firebase/config.ts`.
// 2. ACTIVÉ FIRESTORE DATABASE dans votre projet Firebase sur la console.
// 3. CONFIGURÉ LES RÈGLES DE SÉCURITÉ FIRESTORE pour autoriser les écritures et lectures
//    sur la collection 'residents'. Pour le développement, des règles comme
//    `allow read, write: if true;` pour la collection peuvent être utilisées temporairement.
//    Exemple de règles pour commencer (À PLACER DANS LA CONSOLE FIREBASE -> FIRESTORE -> RÈGLES):
//    ----------------------------------------------------------------------------------
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /residents/{residentId} {
//          // Pour le développement, pour permettre aux Server Actions d'écrire sans authentification Firebase complète :
//          allow read, write: if true;
//          // Pour la production, vous devriez utiliser quelque chose comme :
//          // allow read, write: if request.auth != null; // (si vous utilisez Firebase Auth)
//        }
//      }
//    }
//    ----------------------------------------------------------------------------------

import { db } from './config';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { RESIDENTS_COLLECTION } from './constants';
import type { Resident } from '@/types';

// Type pour les données envoyées pour ajouter/mettre à jour un résident
// createdAt sera géré par serverTimestamp, id est généré ou fourni pour la mise à jour
export type ResidentFormData = Omit<Resident, 'id' | 'createdAt'>;

/**
 * Ajoute un nouveau résident ou met à jour un résident existant dans Firestore.
 * La collection `RESIDENTS_COLLECTION` (par exemple, "residents") sera automatiquement
 * créée dans Firestore si elle n'existe pas lors du premier ajout réussi d'un document.
 * @param residentData Les données du résident à sauvegarder.
 * @param residentId L'ID du résident à mettre à jour. Si non fourni, un nouveau résident sera créé.
 * @returns L'ID du résident ajouté ou mis à jour.
 * @throws Error si la sauvegarde échoue.
 */
export async function addOrUpdateResident(residentData: ResidentFormData, residentId?: string): Promise<string> {
  try {
    const dataWithTimestamp = {
      ...residentData,
      // Les champs array doivent être initialisés s'ils sont undefined
      allergies: residentData.allergies || [],
      contraindications: residentData.contraindications || [],
      textures: residentData.textures || [],
      diets: residentData.diets || [],
      updatedAt: serverTimestamp(), // Toujours mettre à jour 'updatedAt'
    };

    if (residentId) {
      // Mise à jour d'un résident existant
      const residentDocRef = doc(db, RESIDENTS_COLLECTION, residentId);
      // Utiliser setDoc avec merge: true pour mettre à jour ou créer si l'ID est connu mais le doc n'existe pas (moins probable ici)
      // ou pour ne pas écraser les champs non fournis si on ne les envoie pas tous.
      await setDoc(residentDocRef, dataWithTimestamp, { merge: true }); 
      return residentId;
    } else {
      // Ajout d'un nouveau résident
      const dataForAdd = {
        ...dataWithTimestamp,
        createdAt: serverTimestamp(), // Ajouter 'createdAt' uniquement pour les nouveaux résidents
      };
      const docRef = await addDoc(collection(db, RESIDENTS_COLLECTION), dataForAdd);
      return docRef.id;
    }
  } catch (e) {
    // Log de l'erreur côté serveur pour le débogage
    console.error("Error adding or updating document to Firestore: ", e);

    // Construction d'un message d'erreur plus explicite
    let errorMessage = "Could not save resident due to an unknown server error.";
    if (e instanceof Error) {
      // e.message contient souvent des informations utiles de Firebase (ex: "Missing or insufficient permissions.")
      errorMessage = `Could not save resident: ${e.message}`;
    } else if (typeof e === 'string') {
      errorMessage = `Could not save resident: ${e}`;
    } else if (e && typeof e === 'object' && 'toString' in e) {
      errorMessage = `Could not save resident: ${e.toString()}`;
    }
    // Renvoyer l'erreur pour qu'elle puisse être attrapée par le client (et affichée dans le toast)
    throw new Error(errorMessage);
  }
}


export async function deleteResidentFromFirestore(residentId: string): Promise<void> {
    try {
        const residentDocRef = doc(db, RESIDENTS_COLLECTION, residentId);
        await deleteDoc(residentDocRef);
    } catch (e) {
        console.error("Error deleting document from Firestore: ", e);
        let errorMessage = "Could not delete resident due to an unknown server error.";
        if (e instanceof Error) {
            errorMessage = `Could not delete resident: ${e.message}`;
        } else if (typeof e === 'string') {
            errorMessage = `Could not delete resident: ${e}`;
        } else if (e && typeof e === 'object' && 'toString' in e) {
            errorMessage = `Could not delete resident: ${e.toString()}`;
        }
        throw new Error(errorMessage);
    }
}

// NOTE POUR LE DÉVELOPPEMENT :
// Si vous rencontrez des erreurs lors de l'ajout/modification/suppression :
// 1. VÉRIFIEZ LA CONFIGURATION FIREBASE : src/lib/firebase/config.ts doit avoir les bonnes clés.
// 2. VÉRIFIEZ LES RÈGLES DE SÉCURITÉ FIRESTORE : Dans la console Firebase, assurez-vous que les écritures
//    sont autorisées pour la collection 'residents'.
// 3. CONSULTEZ LA CONSOLE DU NAVIGATEUR ET DU SERVEUR (TERMINAL NEXTJS) : Des messages d'erreur
//    plus détaillés y apparaîtront.
    
