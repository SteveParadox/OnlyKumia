import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAbqT36SYzz1JqKRy-ERma5GMBuUN3OGtY",
  authDomain: "training-263022.firebaseapp.com",
  projectId: "training-263022",
  storageBucket: "training-263022.appspot.com",
  messagingSenderId: "686365316167",
  appId: "1:686365316167:web:4396a46f6d8ed957864d62",
  measurementId: "G-H80MNH4ZT4"
};

const App = initializeApp(firebaseConfig);
const analytics = getAnalytics(App);
const FirebaseAuth = getAuth(App);
const provider = new GoogleAuthProvider();
const storage = getStorage(App);

export { FirebaseAuth, provider, storage };
