// Web version of lib/firebase.ts: the browser build of firebase/auth has no
// getReactNativePersistence; getAuth keeps the session in the browser by default
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDIQsN2jyack2aUspLMx4cG6LQ8Om_hY88",
  authDomain: "nextstep-992f0.firebaseapp.com",
  projectId: "nextstep-992f0",
  databaseURL: "https://nextstep-992f0-default-rtdb.firebaseio.com",
  storageBucket: "nextstep-992f0.firebasestorage.app",
  messagingSenderId: "1049225172309",
  appId: "1:1049225172309:web:043f5229b323202dd48bdc",
  measurementId: "G-LNS0E2XMZL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
