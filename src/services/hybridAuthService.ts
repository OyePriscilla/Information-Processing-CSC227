import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import studentsData from '../json/students.json'

export interface StudentProfile {
  id: string
  matricNumber: string
  email: string
  fullName?: string
  profilePicture?: string
  createdAt: any
  lastLoginAt: any
  isActive: boolean
  source: 'json' | 'signup' // Track where student came from
}

export class HybridAuthService {
  // Convert matric number to email format
  private matricToEmail(matricNumber: string): string {
    return `${matricNumber.toLowerCase().replace(/\//g, '-')}@student.app`
  }

  // Check if student exists in local JSON data
  private findLocalStudent(matricNumber: string, password: string) {
    return studentsData.find(student => 
      student.matricNumber === matricNumber && student.password === password
    )
  }

  // Migrate local student to Firebase
  private async migrateLocalStudent(matricNumber: string, password: string) {
    try {
      const email = this.matricToEmail(matricNumber)
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Create student profile in Firestore
      const studentProfile: Omit<StudentProfile, 'id'> = {
        matricNumber,
        email,
        fullName: matricNumber, // Default to matric number
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        isActive: true,
        source: 'json' // Mark as migrated from JSON
      }

      await setDoc(doc(db, 'students', user.uid), studentProfile)
      
      console.log(`✅ Migrated student ${matricNumber} to Firebase`)
      return { user, error: null }
    } catch (error: any) {
      console.error('Migration error:', error)
      return { user: null, error: error.message }
    }
  }

  // Register new student (signup form)
  async registerStudent(matricNumber: string, password: string, fullName?: string) {
    try {
      const email = this.matricToEmail(matricNumber)
      
      // Check if matric number already exists in Firestore
      const existingStudents = await getDoc(doc(db, 'matricNumbers', matricNumber))
      if (existingStudents.exists()) {
        return { user: null, error: 'Matric number already registered' }
      }
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update display name
      if (fullName) {
        await updateProfile(user, { displayName: fullName })
      }

      // Create student profile in Firestore
      const studentProfile: Omit<StudentProfile, 'id'> = {
        matricNumber,
        email,
        fullName: fullName || '',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        isActive: true,
        source: 'signup' // Mark as new signup
      }

      await setDoc(doc(db, 'students', user.uid), studentProfile)
      
      // Also store matric number mapping for uniqueness check
      await setDoc(doc(db, 'matricNumbers', matricNumber), { uid: user.uid })

      return { user, error: null }
    } catch (error: any) {
      console.error('Registration error:', error)
      let errorMessage = 'Registration failed. Please try again.'
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This matric number is already registered.'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.'
      }
      
      return { user: null, error: errorMessage }
    }
  }

  // Login with hybrid approach
  async login(matricNumber: string, password: string) {
    try {
      const email = this.matricToEmail(matricNumber)
      
      try {
        // Try Firebase login first (for already migrated users)
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        // Update last login time
        await updateDoc(doc(db, 'students', user.uid), {
          lastLoginAt: serverTimestamp()
        })

        return { user, error: null }
      } catch (firebaseError: any) {
        // If Firebase login fails, check local JSON data
        if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/invalid-credential') {
          const localStudent = this.findLocalStudent(matricNumber, password)
          
          if (localStudent) {
            // Migrate local student to Firebase
            console.log(`🔄 Migrating ${matricNumber} to Firebase...`)
            return await this.migrateLocalStudent(matricNumber, password)
          } else {
            return { user: null, error: 'Invalid matric number or password' }
          }
        }
        
        throw firebaseError
      }
    } catch (error: any) {
      console.error('Login error:', error)
      let errorMessage = 'Login failed. Please check your credentials.'
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid password. Please try again.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.'
      }
      
      return { user: null, error: errorMessage }
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

  // Get current user profile
  async getCurrentUserProfile() {
    try {
      const user = auth.currentUser
      if (!user) {
        return { profile: null, error: 'No user logged in' }
      }

      const profileDoc = await getDoc(doc(db, 'students', user.uid))
      if (profileDoc.exists()) {
        const profile = { id: user.uid, ...profileDoc.data() } as StudentProfile
        return { profile, error: null }
      } else {
        return { profile: null, error: 'Profile not found' }
      }
    } catch (error: any) {
      console.error('Error getting profile:', error)
      return { profile: null, error: error.message }
    }
  }

  // Auth state listener
  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback)
  }

  // Update student profile
  async updateProfile(updates: Partial<Pick<StudentProfile, 'fullName' | 'profilePicture'>>) {
    try {
      const user = auth.currentUser
      if (!user) {
        return { error: 'No user logged in' }
      }

      // Update Firestore profile
      await updateDoc(doc(db, 'students', user.uid), {
        ...updates,
        lastUpdated: serverTimestamp()
      })

      // Update Firebase Auth display name if provided
      if (updates.fullName) {
        await updateProfile(user, { displayName: updates.fullName })
      }

      return { error: null }
    } catch (error: any) {
      console.error('Profile update error:', error)
      return { error: error.message }
    }
  }

  // Admin function: Migrate all students from JSON to Firebase
  async migrateAllStudents() {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const student of studentsData) {
      try {
        const result = await this.migrateLocalStudent(student.matricNumber, student.password)
        if (result.error) {
          results.failed++
          results.errors.push(`${student.matricNumber}: ${result.error}`)
        } else {
          results.success++
        }
      } catch (error: any) {
        results.failed++
        results.errors.push(`${student.matricNumber}: ${error.message}`)
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return results
  }
}

// Export singleton instance
export const hybridAuthService = new HybridAuthService()
