import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// import { useAuth } from "./App/App-auth/UseAuth";

// const currentUser = useAuth();

const firebaseConfig = {
  apiKey: "AIzaSyCVcMVKUF9pF_qovkb-vHtmcsrPYB1kUiU",
  authDomain: "evanis-interiors-a09b0.firebaseapp.com",
  projectId: "evanis-interiors-a09b0",
  storageBucket: "evanis-interiors-a09b0.appspot.com",
  messagingSenderId: "1078203333014",
  appId: "1:1078203333014:web:720961c48653f0ffa145b7",
  measurementId: "G-LSP9R581LP"
};

const app = initializeApp(firebaseConfig);
export const txtdb = getFirestore(app);
export const imgdb = getStorage(app);
export const auth = getAuth(app);

//profile pic
