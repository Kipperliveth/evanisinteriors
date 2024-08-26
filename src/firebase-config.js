import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// import { useAuth } from "./App/App-auth/UseAuth";

// const currentUser = useAuth();

const firebaseConfig = {
  apiKey: "AIzaSyBq4daywRRlsO_FErfEfnC6fA2Xjbb-1M0",
  authDomain: "evanis-two.firebaseapp.com",
  databaseURL: "https://evanis-two-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "evanis-two",
  storageBucket: "evanis-two.appspot.com",
  messagingSenderId: "655724391920",
  appId: "1:655724391920:web:896f91cfe1f79d9bc7c135",
  measurementId: "G-JM5BCZVP0T"
};

const app = initializeApp(firebaseConfig);
export const txtdb = getFirestore(app);
export const imgdb = getStorage(app);
export const auth = getAuth(app);

//profile pic
