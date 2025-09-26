// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "studio-6364470734-ca235",
  "appId": "1:1019464814663:web:5c08cf93e446fdd266e162",
  "apiKey": "AIzaSyDqmlvuyt-i1g6lancir4c9zVRK0XdZ4Tc",
  "authDomain": "studio-6364470734-ca235.firebaseapp.com",
  "measurementId": "G-5G3W59E19C",
  "messagingSenderId": "1019464814663",
  "storageBucket": "studio-6364470734-ca235.appspot.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a Firestore instance
export const db = getFirestore(app);
