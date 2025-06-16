
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
  apiKey: "AIzaSyCMLPSozmzZQ3pp8gLDeI3MHtSU1x-vi2c",
  authDomain: "sodisen-6cd03.firebaseapp.com",
  projectId: "sodisen-6cd03",
  storageBucket: "sodisen-6cd03.firebasestorage.app",
  messagingSenderId: "59897635478",
  appId: "1:59897635478:web:0f622f1acb3ea00ca498b7",
  measurementId: "G-NW0S8WJ34X"
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
