import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {

  apiKey: "AIzaSyArm67xwto3LvDcSEznmQDJwI3o9-cWj6c",

  authDomain: "delinquents-tour.firebaseapp.com",

  projectId: "delinquents-tour",

  storageBucket: "delinquents-tour.firebasestorage.app",

  messagingSenderId: "943467538581",

  appId: "1:943467538581:web:bb699e324b4b55b8f0d39c"

};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);