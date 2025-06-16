
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration
//
// ÉTAPES CRUCIALES POUR FAIRE FONCTIONNER LE BACKEND FIREBASE:
// 1. CRÉEZ UN PROJET FIREBASE : Rendez-vous sur https://console.firebase.google.com/
// 2. ACTIVEZ FIRESTORE : Dans votre projet Firebase, activez Firestore Database (en mode Natif).
// 3. OBTENEZ VOS CLÉS DE CONFIGURATION :
//    - Dans la console Firebase -> Paramètres du projet (icône engrenage) -> Général.
//    - Faites défiler jusqu'à "Vos applications".
//    - Si vous n'avez pas d'application web, ajoutez-en une (icône </>).
//    - Copiez l'objet de configuration `firebaseConfig` fourni par Firebase.
// 4. REMPLACEZ LES VALEURS CI-DESSOUS : Collez ici les valeurs de votre propre projet Firebase.
//    Si ces valeurs ne sont pas correctes, l'application NE POURRA PAS se connecter à Firestore.
//
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Remplacez par votre clé API
  authDomain: "YOUR_AUTH_DOMAIN", // Remplacez par votre domaine d'authentification
  projectId: "YOUR_PROJECT_ID", // Remplacez par votre ID de projet
  storageBucket: "YOUR_STORAGE_BUCKET", // Remplacez par votre bucket de stockage
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Remplacez par votre ID d'expéditeur de messagerie
  appId: "YOUR_APP_ID" // Remplacez par votre ID d'application
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);

export { app, db };
