import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// import { useAuth } from "./App/App-auth/UseAuth";

// const currentUser = useAuth();

const firebaseConfig = {
  apiKey: "AIzaSyC4Xhj11Xrwx4VTyPTXed8pQZe475BPNDU",
  authDomain: "evanis-interiors-5ff2c.firebaseapp.com",
  projectId: "evanis-interiors-5ff2c",
  storageBucket: "evanis-interiors-5ff2c.appspot.com",
  messagingSenderId: "305655159315",
  appId: "1:305655159315:web:b58ed367033a87a996fde6"
};

const app = initializeApp(firebaseConfig);
export const txtdb = getFirestore(app);
export const imgdb = getStorage(app);
export const auth = getAuth(app);

//profile pic
