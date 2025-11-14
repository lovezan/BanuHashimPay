import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDzURAREVj1-fMblLmpciZlFcJ5Ag3qM0s",
  authDomain: "banuhashimmanagement.firebaseapp.com",
  projectId: "banuhashimmanagement",
  storageBucket: "banuhashimmanagement.firebasestorage.app",
  messagingSenderId: "1024591276830",
  appId: "1:1024591276830:web:e5ce408d8dad654352770f",
  measurementId: "G-524XQ9B1SJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("[v0] Persistence error:", error);
});

if (typeof window !== "undefined") {
  getAnalytics(app);
}
