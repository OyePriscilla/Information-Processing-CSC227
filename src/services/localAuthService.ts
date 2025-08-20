import studentsData from '../json/students.json'

interface Student {
  matricNumber: string
  password: string
}

interface AuthUser {
  uid: string
  matricNumber: string
  email: string
  displayName?: string
}

class LocalAuthService {
  private currentUser: AuthUser | null = null
  private authStateListeners: Array<(user: AuthUser | null) => void> = []

  // Convert matric number to email format
  private matricToEmail(matricNumber: string): string {
    return `${matricNumber.toLowerCase().replace(/\//g, '-')}@student.app`
  }

  // Find student in local data
  private findLocalStudent(matricNumber: string, password: string): Student | undefined {
    return studentsData.find(student => 
      student.matricNumber === matricNumber && student.password === password
    )
  }

  // Create user object from matric number
  private createUserObject(matricNumber: string): AuthUser {
    return {
      uid: btoa(matricNumber).replace(/[^a-zA-Z0-9]/g, ''), // Create a simple UID from matric number
      matricNumber,
      email: this.matricToEmail(matricNumber),
      displayName: matricNumber
    }
  }

  // Login with local validation
  async login(matricNumber: string, password: string) {
    try {
      const localStudent = this.findLocalStudent(matricNumber, password)
      if (!localStudent) {
        return { user: null, error: 'Invalid matric number or password' }
      }

      // Create user object and set as current user
      const user = this.createUserObject(matricNumber)
      this.currentUser = user

      // Store in localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(user))

      // Notify listeners
      this.notifyAuthStateChange(user)

      return { user, error: null }
    } catch (error: any) {
      console.error('Login error:', error)
      return { user: null, error: error.message }
    }
  }

  // Logout
  async logout() {
    try {
      this.currentUser = null
      localStorage.removeItem('currentUser')
      
      // Notify listeners
      this.notifyAuthStateChange(null)
      
      return { error: null }
    } catch (error: any) {
      console.error('Logout error:', error)
      return { error: error.message }
    }
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    if (this.currentUser) {
      return this.currentUser
    }

    // Try to restore from localStorage
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser)
        return this.currentUser
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('currentUser')
      }
    }

    return null
  }

  // Auth state change listener
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    // Add callback to listeners
    this.authStateListeners.push(callback)

    // Immediately call with current user
    const currentUser = this.getCurrentUser()
    callback(currentUser)

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback)
      if (index > -1) {
        this.authStateListeners.splice(index, 1)
      }
    }
  }

  // Notify all listeners of auth state change
  private notifyAuthStateChange(user: AuthUser | null) {
    this.authStateListeners.forEach(callback => {
      try {
        callback(user)
      } catch (error) {
        console.error('Error in auth state listener:', error)
      }
    })
  }

  // Get user profile (for compatibility)
  async getUserProfile() {
    const user = this.getCurrentUser()
    if (!user) {
      return { profile: null, error: 'No user logged in' }
    }

    return {
      profile: {
        id: user.uid,
        matricNumber: user.matricNumber,
        email: user.email,
        fullName: user.displayName || user.matricNumber,
        isActive: true
      },
      error: null
    }
  }
}

// Export singleton instance
export const localAuthService = new LocalAuthService()
