// Firebase Config - REPLACE WITH YOUR PROJECT CONFIG
// Get from Firebase Console → Project Settings → Web app

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "123456789",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const analytics = firebase.analytics();
const db = firebase.firestore();

export { analytics, db };
