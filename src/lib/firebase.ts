import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase configuration with your project credentials
const firebaseConfig = {
  apiKey: "AIzaSyDq2B8a-QtUxCF2iel_uXW7DbTASB9CTuI",
  authDomain: "cos102.firebaseapp.com",
  projectId: "cos102",
  storageBucket: "cos102.firebasestorage.app",
  messagingSenderId: "121639323657",
  appId: "1:121639323657:web:e710ac864d94f8139e50d8"
}

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
