import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
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
}

export class AuthService {
  // Convert matric number to email format
  private matricToEmail(matricNumber: string): string {
    return `${matricNumber.toLowerCase().replace(/\//g, '-')}@student.app`
  }

  // Check if student exists in local data
  private findLocalStudent(matricNumber: string, password: string) {
    return studentsData.find(student => 
      student.matricNumber === matricNumber && student.password === password
    )
  }

  // Register new student (for admin use or self-registration)
  async registerStudent(matricNumber: string, password: string, fullName?: string) {
    try {
      const email = this.matricToEmail(matricNumber)
      
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
        isActive: true
      }

      await setDoc(doc(db, 'students', user.uid), studentProfile)

      return { user, error: null }
    } catch (error: any) {
      console.error('Registration error:', error)
      return { user: null, error: error.message }
    }
  }

  // Login student
  async login(matricNumber: string, password: string) {
    try {
      // First, check if student exists in local data
      const localStudent = this.findLocalStudent(matricNumber, password)
      if (!localStudent) {
        return { user: null, error: 'Invalid matric number or password' }
      }

      const email = this.matricToEmail(matricNumber)
      
      try {
        // Try to sign in with Firebase (student might already be registered)
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        // Update last login time
        await updateDoc(doc(db, 'students', user.uid), {
          lastLoginAt: serverTimestamp()
        })

        return { user, error: null }
      } catch (firebaseError: any) {
        // If user doesn't exist in Firebase, create them automatically
        if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/invalid-credential') {
          console.log('Creating new Firebase user for:', matricNumber)
          return await this.registerStudent(matricNumber, password)
        }
        throw firebaseError
      }
    } catch (error: any) {
      console.error('Login error:', error)
      return { user: null, error: error.message }
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
  async getCurrentUserProfile(): Promise<StudentProfile | null> {
    try {
      const user = auth.currentUser
      if (!user) return null

      const docSnap = await getDoc(doc(db, 'students', user.uid))
      if (docSnap.exists()) {
        return { id: user.uid, ...docSnap.data() } as StudentProfile
      }
      return null
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback)
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser
  }
}

export const authService = new AuthService()
