import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDQWT5QDPSlxum7ae5mT6054hodXlkIVSE",
  authDomain: "chatteris-town-fc-photo-wall.firebaseapp.com",
  projectId: "chatteris-town-fc-photo-wall",
  storageBucket: "chatteris-town-fc-photo-wall.firebasestorage.app",
  messagingSenderId: "972531982601",
  appId: "1:972531982601:web:457efd29aca3136e9a73d8",
};

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
export const db = getFirestore(app);