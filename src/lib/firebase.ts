// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();


// Get a Firestore instance
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence
if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db)
    .catch((err) => {
        if (err.code == 'failed-precondition') {
        // This can happen if multiple tabs are open.
        console.warn("Firestore persistence failed. This can happen if you have multiple tabs open.");
        } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence.
        console.warn("Firestore persistence is not supported in this browser.");
        }
    });
}
