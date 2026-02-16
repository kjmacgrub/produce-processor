import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAOtKt-nDBvAod23fAX04nXpCxmA7FnWKk",
  authDomain: "process-6d2dc.firebaseapp.com",
  databaseURL: "https://process-6d2dc-default-rtdb.firebaseio.com",
  projectId: "process-6d2dc",
  storageBucket: "process-6d2dc.firebasestorage.app",
  messagingSenderId: "955601669952",
  appId: "1:955601669952:web:871e3dd2c562c8aa6274a5",
  measurementId: "G-X5Z5CC3Q44",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);
