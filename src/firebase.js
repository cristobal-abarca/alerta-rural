import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDxxxxx",  // Tu clave real aquí
  authDomain: "alerta-rural-39a26.firebaseapp.com",
  projectId: "alerta-rural-39a26",
  storageBucket: "alerta-rural-39a26.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);