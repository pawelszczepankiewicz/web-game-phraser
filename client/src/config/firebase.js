import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4LrQBwqhuwrbgw95decrbmgIGlKqEDkA",
  authDomain: "game-phaser-web.firebaseapp.com",
  projectId: "game-phaser-web",
  storageBucket: "game-phaser-web.firebasestorage.app",
  messagingSenderId: "493148182804",
  appId: "1:493148182804:web:575997071baeb449960a01",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
