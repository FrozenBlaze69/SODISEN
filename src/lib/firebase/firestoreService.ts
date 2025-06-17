
'use server'; 

// Ce fichier contient la logique backend (Server Actions) pour interagir avec Firestore.
// Toutes les fonctions exportées ici s'exécutent côté serveur.
// RÔLE BACKEND : Ce fichier agit comme votre backend pour les opérations sur les résidents.
// Il communique directement avec Firebase Firestore pour lire et écrire des données.

// #####################################################################################
// # IMPORTANT : POUR QUE CE CODE FONCTIONNE (AJOUT/MODIFICATION/SUPPRESSION DE DONNÉES) #
// #####################################################################################
//
// 1. CONFIGURATION FIREBASE DANS `src/lib/firebase/config.ts` :
//    Assurez-vous que les clés (apiKey, projectId, etc.) sont CORRECTEMENT remplies
//    avec les informations de VOTRE projet Firebase.
//
// 2. FIRESTORE DATABASE ACTIVÉE :
//    Dans votre console Firebase, la base de données Firestore doit être créée et activée
//    (choisissez le mode Natif).
//
// 3. RÈGLES DE SÉCURITÉ FIRESTORE (CAUSE PRINCIPALE DE L'ERREUR "PERMISSION_DENIED") :
//    Vous DEVEZ configurer les règles de sécurité dans la console Firebase pour autoriser
//    les écritures sur la collection `residents`.
//    Pour le DÉVELOPPEMENT, utilisez ces règles dans Firebase Console > Firestore > Règles :
//    ----------------------------------------------------------------------------------
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /residents/{residentId} {
//          // AUTORISE TOUTE LECTURE ET ÉCRITURE POUR LE DÉVELOPPEMENT
//          // ATTENTION : NON SÉCURISÉ POUR LA PRODUCTION !
//          allow read, write: if true;
//        }
//        match /reservations/{reservationId} {
//           allow read, write: if true; // Ajustez selon vos besoins d'authentification
//        }
//        match /notifications_shared/{notificationId} {
//           allow read, write: if true; // Pour développement. Sécurisez en production.
//        }
//        // Ajoutez ici des règles pour d'autres collections si nécessaire
//      }
//    }
//    ----------------------------------------------------------------------------------
//    SANS CES RÈGLES (ou des règles équivalentes permettant l'écriture), VOUS OBTIENDREZ
//    DES ERREURS "PERMISSION_DENIED" LORS DE L'AJOUT DE RÉSIDENTS.
//
// 4. COLLECTION `residents` :
//    Elle sera créée automatiquement dans Firestore lors du premier ajout réussi
//    si elle n'existe pas déjà. Vous n'avez pas besoin de la créer manuellement
//    dans la console Firebase au préalable.
//
// #####################################################################################

import { db } from './config';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { RESIDENTS_COLLECTION, NOTIFICATIONS_SHARED_COLLECTION } from './constants';
import type { Resident, Notification as AppNotification } from '@/types';


export type ResidentFormData = Omit<Resident, 'id' | 'createdAt'>;
export type NotificationFormData = Omit<AppNotification, 'id' | 'timestamp'> & { timestamp?: Timestamp | Date };


export async function addOrUpdateResident(residentData: ResidentFormData, residentId?: string): Promise<string> {
  try {
    const dataWithTimestamp = {
      ...residentData,
      allergies: residentData.allergies || [],
      contraindications: residentData.contraindications || [],
      textures: residentData.textures || [],
      diets: residentData.diets || [],
      updatedAt: serverTimestamp(), 
    };

    if (residentId) {
      const residentDocRef = doc(db, RESIDENTS_COLLECTION, residentId);
      await setDoc(residentDocRef, dataWithTimestamp, { merge: true }); 
      return residentId;
    } else {
      const dataForAdd = {
        ...dataWithTimestamp,
        createdAt: serverTimestamp(), 
      };
      const docRef = await addDoc(collection(db, RESIDENTS_COLLECTION), dataForAdd);
      return docRef.id;
    }
  } catch (e) {
    console.error("Error adding or updating document to Firestore: ", e);
    let errorMessage = "Could not save resident due to an unknown server error.";
    if (e instanceof Error) {
      errorMessage = `Impossible d'ajouter le résident. ${e.message}`;
    } else if (typeof e === 'string') {
      errorMessage = `Impossible d'ajouter le résident: ${e}`;
    } else if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
      errorMessage = `Impossible d'ajouter le résident. ${e.message}`;
    } else if (e && typeof e === 'object' && 'toString' in e) {
      errorMessage = `Impossible d'ajouter le résident: ${e.toString()}`;
    }
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
            errorMessage = `Impossible de supprimer le résident: ${e.message}`;
        } else if (typeof e === 'string') {
            errorMessage = `Impossible de supprimer le résident: ${e}`;
        } else if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
            errorMessage = `Impossible de supprimer le résident. ${e.message}`;
        } else if (e && typeof e === 'object' && 'toString' in e) {
            errorMessage = `Impossible de supprimer le résident: ${e.toString()}`;
        }
        throw new Error(errorMessage);
    }
}


export async function addSharedNotificationToFirestore(notificationData: NotificationFormData): Promise<string> {
  try {
    const dataToSave = {
      ...notificationData,
      timestamp: notificationData.timestamp instanceof Date 
        ? Timestamp.fromDate(notificationData.timestamp) 
        : serverTimestamp(),
      isRead: false, // Default to unread, 'isRead' will be managed client-side locally or via different mechanism if per-user server-side
    };
    const docRef = await addDoc(collection(db, NOTIFICATIONS_SHARED_COLLECTION), dataToSave);
    return docRef.id;
  } catch (e) {
    console.error("Error adding shared notification to Firestore: ", e);
    let errorMessage = "Could not save notification.";
     if (e instanceof Error) {
      errorMessage = `Impossible d'enregistrer la notification. ${e.message}`;
    }
    throw new Error(errorMessage);
  }
}

export async function deleteSharedNotificationFromFirestore(notificationId: string): Promise<void> {
  try {
    const notifDocRef = doc(db, NOTIFICATIONS_SHARED_COLLECTION, notificationId);
    await deleteDoc(notifDocRef);
  } catch (e) {
    console.error("Error deleting shared notification from Firestore: ", e);
    let errorMessage = "Could not delete notification.";
    if (e instanceof Error) {
      errorMessage = `Impossible de supprimer la notification: ${e.message}`;
    }
    throw new Error(errorMessage);
  }
}
    

