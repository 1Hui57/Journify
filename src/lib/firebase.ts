// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// import { getAnalytics } from "firebase/analytics";
// **新增這兩行來導入 Auth 和 Firestore 的函數**
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBvUFfB_LOjjN5Mknm2lMq-AV5uTAqTT7M",
  authDomain: "journify-a41ea.firebaseapp.com",
  projectId: "journify-a41ea",
  storageBucket: "journify-a41ea.firebasestorage.app",
  messagingSenderId: "771347888731",
  appId: "1:771347888731:web:f8ee2aa016dddac12a5d7e",
  measurementId: "G-C0H4GHH6QT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
// **新增這兩行來取得 Auth 和 Firestore 的服務實例**
const auth = getAuth(app); // 取得 Authentication 服務的實例
const db = getFirestore(app); // 取得 Cloud Firestore 資料庫的實例
export const storage = getStorage(app);
export{db,auth}
// 現在你有了 app, analytics, auth, 和 db 這幾個實例，可以用它們來呼叫 Firebase 的功能了！