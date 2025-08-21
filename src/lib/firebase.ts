import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase configuration with your project credentials
const firebaseConfig = {
  apiKey: "AIzaSyAXym88G3jnv3tI4suKKfbUTBEHhlqqhDE",
  authDomain: "csc227-a7932.firebaseapp.com",
  projectId: "csc227-a7932",
  storageBucket: "csc227-a7932.firebasestorage.app",
  messagingSenderId: "863563068320",
  appId: "1:863563068320:web:97d3c2125438aa524daac5",
  measurementId: "G-GG61Y602H3"
};

// Validate configuration
console.log('🔥 Initializing Firebase with config:', {
  apiKey: firebaseConfig.apiKey ? '✓ Present' : '✗ Missing',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId ? '✓ Present' : '✗ Missing'
})

// Initialize Firebase
console.log('🚀 Creating Firebase app...')
const app = initializeApp(firebaseConfig)
console.log('✅ Firebase app created successfully')

// Initialize services
console.log('🔧 Initializing Firebase services...')
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

console.log('✅ All Firebase services initialized successfully')
console.log('Auth instance:', auth)
console.log('Firestore instance:', db)

// Log successful initialization
console.log('✅ Firebase initialized successfully!')

export default app
