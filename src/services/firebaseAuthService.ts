import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import studentsData from '../json/students.json'

interface StudentProfile {
  id: string
  matricNumber: string
  email: string
  fullName: string
  createdAt: any
  lastLoginAt: any
  isActive: boolean
  migratedFromLocal: boolean
}

export class FirebaseAuthService {
  // Convert matric number to email format
  private matricToEmail(matricNumber: string): string {
    return `${matricNumber.toLowerCase().replace(/\//g, '-')}@student.edu`
  }

  // Check if student exists in local data
  private findLocalStudent(matricNumber: string, password: string) {
    return studentsData.find(student => 
      student.matricNumber === matricNumber && student.password === password
    )
  }

  // Check if student already exists in Firebase
  private async studentExistsInFirebase(matricNumber: string): Promise<boolean> {
    try {
      const studentsRef = collection(db, 'students')
      const q = query(studentsRef, where('matricNumber', '==', matricNumber))
      const querySnapshot = await getDocs(q)
      return !querySnapshot.empty
    } catch (error) {
      console.error('Error checking if student exists:', error)
      return false
    }
  }

  // Migrate a student from local data to Firebase
  private async migrateStudentToFirebase(matricNumber: string, password: string) {
    try {
      const email = this.matricToEmail(matricNumber)
      console.log(`🚀 Migrating student ${matricNumber} to Firebase...`)

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update display name
      await updateProfile(user, { displayName: matricNumber })
      console.log(`✅ Created Firebase Auth user for ${matricNumber}`)

      // Create student profile in Firestore
      const studentProfile: Omit<StudentProfile, 'id'> = {
        matricNumber,
        email,
        fullName: matricNumber,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isActive: true,
        migratedFromLocal: true
      }

      await setDoc(doc(db, 'students', user.uid), studentProfile)
      console.log(`📝 Created Firestore profile for ${matricNumber}`)

      console.log(`✅ Successfully migrated ${matricNumber}`)
      return { user, error: null }
    } catch (error: any) {
      console.error(`❌ Failed to migrate ${matricNumber}:`, error)
      return { user: null, error: error.message }
    }
  }

  // Login with automatic migration
  async login(matricNumber: string, password: string) {
    try {
      console.log(`🔑 Attempting login for ${matricNumber}`)
      
      // First, validate against local students data
      const localStudent = this.findLocalStudent(matricNumber, password)
      if (!localStudent) {
        console.log(`❌ ${matricNumber} not found in local students data`)
        return { user: null, error: 'Invalid matric number or password' }
      }

      console.log(`✅ ${matricNumber} validated against local data`)
      const email = this.matricToEmail(matricNumber)
      console.log(`📧 Using email: ${email}`)
      
      try {
        // Try to sign in with Firebase (student might already be migrated)
        console.log(`🔥 Attempting Firebase signin for ${email}`)
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        // Update last login time in Firestore
        const studentDoc = doc(db, 'students', user.uid)
        await setDoc(studentDoc, { 
          lastLoginAt: new Date().toISOString() 
        }, { merge: true })
        console.log(`📝 Updated last login time for ${matricNumber}`)

        console.log(`✅ ${matricNumber} logged in successfully via existing Firebase account`)
        return { user, error: null }

      } catch (firebaseError: any) {
        console.log(`⚠️ Firebase signin failed for ${email}:`, firebaseError.code)
        
        // If user doesn't exist in Firebase, migrate them automatically
        if (firebaseError.code === 'auth/user-not-found' || 
            firebaseError.code === 'auth/invalid-credential' ||
            firebaseError.code === 'auth/invalid-login-credentials' ||
            firebaseError.code === 'auth/wrong-password') {
          
          console.log(`🔄 Auto-migrating ${matricNumber} to Firebase...`)
          return await this.migrateStudentToFirebase(matricNumber, password)
        }
        
        // If it's a configuration error, provide helpful message
        if (firebaseError.code === 'auth/configuration-not-found') {
          console.error('❌ Firebase configuration error:', firebaseError)
          return { user: null, error: 'Firebase configuration error. Please check Firebase project setup.' }
        }
        
        throw firebaseError
      }
    } catch (error: any) {
      console.error('❌ Login error:', error)
      return { user: null, error: `Login failed: ${error.message}` }
    }
  }

  // Logout
  async logout() {
    try {
      await signOut(auth)
      return { error: null }
    } catch (error: any) {
      console.error('Logout error:', error)
      return { error: error.message }
    }
  }

  // Get current user profile from Firestore
  async getCurrentUserProfile() {
    try {
      const user = auth.currentUser
      if (!user) {
        return { profile: null, error: 'No user logged in' }
      }

      const studentDoc = await getDoc(doc(db, 'students', user.uid))
      if (studentDoc.exists()) {
        const profile = { id: user.uid, ...studentDoc.data() } as StudentProfile
        return { profile, error: null }
      } else {
        return { profile: null, error: 'Student profile not found in Firestore' }
      }
    } catch (error: any) {
      console.error('Error getting user profile from Firestore:', error)
      return { profile: null, error: error.message }
    }
  }

  // Auth state change listener
  onAuthStateChange(callback: (user: User | null) => void) {
    console.log('🔗 Setting up Firebase onAuthStateChanged listener')
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔥 Firebase onAuthStateChanged fired:', user ? `${user.displayName} (${user.uid})` : 'null')
      callback(user)
    })
    
    return unsubscribe
  }

  // Bulk migrate all students (optional - for admin use)
  async migrateAllStudents() {
    console.log('🚀 Starting bulk migration of all students...')
    const results = []
    
    for (const student of studentsData) {
      const exists = await this.studentExistsInFirebase(student.matricNumber)
      if (!exists) {
        const result = await this.migrateStudentToFirebase(student.matricNumber, student.password)
        results.push({ matricNumber: student.matricNumber, success: !result.error })
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      } else {
        console.log(`⏭️  ${student.matricNumber} already exists in Firebase`)
      }
    }
    
    const successful = results.filter(r => r.success).length
    const total = results.length
    console.log(`✅ Migration complete: ${successful}/${total} students migrated`)
    
    return results
  }
}

// Export singleton instance
export const firebaseAuthService = new FirebaseAuthService()
