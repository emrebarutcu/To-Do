import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCaGKUyd3u2vbYxRIs_Qordep4ueJww8wY",
  authDomain: "todo-b3f70.firebaseapp.com",
  projectId: "todo-b3f70",
  storageBucket: "todo-b3f70.firebasestorage.app",
  messagingSenderId: "394123906658",
  appId: "1:394123906658:web:4848390f32e4c0b9db4b3b",
  measurementId: "G-X86SSKC4HT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Connect to emulators in development (web only)
if (__DEV__ && Platform.OS === 'web') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
  } catch (error) {
    console.log('Emulator connection failed:', error);
  }
}

export default app;