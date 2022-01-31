// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAVAtRaIEe5xjYyro-qTlVvTI92v0P2mQQ',
  authDomain: 'house-marketplace-react.firebaseapp.com',
  projectId: 'house-marketplace-react',
  storageBucket: 'house-marketplace-react.appspot.com',
  messagingSenderId: '618150673097',
  appId: '1:618150673097:web:603da8e9bfd9a803ce2b18',
};

// Initialize Firebase
initializeApp(firebaseConfig);
export const db = getFirestore();
