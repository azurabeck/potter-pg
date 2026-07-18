// src/services/firebase_settings.ts
// Inicializacao central do Firebase. Todo o resto da aplicacao (actions/*)
// deve importar `db` (e `analytics` quando necessario) a partir deste arquivo,
// nunca chamar initializeApp em outro lugar.

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC_OYmWETF6-SVLRz0ZQf93RudIQRNSFew",
  authDomain: "potterpg.firebaseapp.com",
  projectId: "potterpg",
  storageBucket: "potterpg.firebasestorage.app",
  messagingSenderId: "63155685001",
  appId: "1:63155685001:web:45211a37a9ae5402ef2858",
  measurementId: "G-21N374E7ZW",
};

export const app: FirebaseApp = initializeApp(firebaseConfig);

export const db: Firestore = getFirestore(app);

export const auth: Auth = getAuth(app);

export const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();

// getAnalytics falha em ambientes sem suporte (SSR, alguns navegadores).
// isSupported() evita quebrar o app nesses casos.
export let analytics: Analytics | undefined;
isSupported()
  .then((supported) => {
    if (supported) analytics = getAnalytics(app);
  })
  .catch(() => {
    analytics = undefined;
  });
