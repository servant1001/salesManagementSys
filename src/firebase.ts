// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import type { Analytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBmz7Ft5DSwvtA_OMwjNUIm9bdbQUdlmG4",
    authDomain: "sales-management-system-82d97.firebaseapp.com",
    projectId: "sales-management-system-82d97",
    storageBucket: "sales-management-system-82d97.firebasestorage.app",
    messagingSenderId: "550574429915",
    appId: "1:550574429915:web:cdd33f68ae6835502b9efe",
    measurementId: "G-VNSB24SW9L"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
export const analytics: Analytics = getAnalytics(app);
export const db: Database = getDatabase(app);
export const auth = getAuth(app);