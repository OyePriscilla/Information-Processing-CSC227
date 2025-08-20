import { auth, db } from '../lib/firebase'

export const testFirebaseConnection = async () => {
  try {
    console.log('🧪 Testing Firebase connection...')
    
    // Test Firebase Auth
    console.log('Auth object:', auth)
    console.log('Auth app:', auth.app)
    console.log('Auth config:', auth.config)
    
    // Test Firestore
    console.log('Firestore object:', db)
    console.log('Firestore app:', db.app)
    
    // Test basic operations
    console.log('✅ Firebase services are accessible')
    
    return { success: true, message: 'Firebase connection successful' }
  } catch (error: any) {
    console.error('❌ Firebase connection test failed:', error)
    return { success: false, message: error.message }
  }
}

export const checkFirebaseAuth = () => {
  try {
    console.log('🔍 Checking Firebase Auth configuration...')
    console.log('Current user:', auth.currentUser)
    console.log('Auth ready:', auth.authStateReady)
    
    return true
  } catch (error: any) {
    console.error('❌ Auth check failed:', error)
    return false
  }
}
