import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// import { useAuth } from "./App/App-auth/UseAuth";

// const currentUser = useAuth();

const firebaseConfig = {
 apiKey: "AIzaSyDxJWyFWXTfpZqqbwl96V4xF5C99ixj2_k",
  authDomain: "evanisthree-f9e63.firebaseapp.com",
  projectId: "evanisthree-f9e63",
  storageBucket: "evanisthree-f9e63.appspot.com",
  messagingSenderId: "824555536122",
  appId: "1:824555536122:web:af6219b7e2ff4626fd5343",
  measurementId: "G-PLQSTKS3PR"
};

const app = initializeApp(firebaseConfig);
export const txtdb = getFirestore(app);
export const imgdb = getStorage(app);
export const auth = getAuth(app);

//profile pic
