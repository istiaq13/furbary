import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCsA1O2jvsa7SMWmRpxeTDOLnry_rbvezA",
  authDomain: "furbari-8a084.firebaseapp.com",
  databaseURL: "https://furbari-8a084-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "furbari-8a084",
  storageBucket: "furbari-8a084.firebasestorage.app",
  messagingSenderId: "326057786717",
  appId: "1:326057786717:web:9c03e4d196a42e95ebbcb4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);
export default app;