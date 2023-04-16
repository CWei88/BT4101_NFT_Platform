import {initializeApp} from 'firebase/app';
import { getFirestore} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBF1pZVTgpzazwCbnKXOt1q0tLnztaEIxM",
  authDomain: "nft-rental.firebaseapp.com",
  projectId: "nft-rental",
  storageBucket: "nft-rental.appspot.com",
  messagingSenderId: "419840388811",
  appId: "1:419840388811:web:67290cfb23c90ba92bf54e",
  measurementId: "G-CE5S494FTR"
};

const app = initializeApp(firebaseConfig);
const database = getFirestore(app);
export default database;
