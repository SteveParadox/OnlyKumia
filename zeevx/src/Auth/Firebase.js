import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAR1J45p0ePpVqZzz93X7JGiSRy-1Seryg",
  authDomain: "onlykumia.firebaseapp.com",
  projectId: "onlykumia",
  storageBucket: "onlykumia.appspot.com",
  messagingSenderId: "674830747175",
  appId: "1:674830747175:web:b7e28ee399d40ec6ef7002",
  measurementId: "G-M283T6N2W7"
};


const App = initializeApp(firebaseConfig);
// const analytics = getAnalytics(App);
const FirebaseAuth = getAuth(App);
const provider = new GoogleAuthProvider();
const storage = getStorage(App);

export { FirebaseAuth, provider, storage };
