import { useState, useEffect } from 'react'
import type { User } from 'firebase/auth'
import { firebaseAuthService } from './services/firebaseAuthService'
import './App.css'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import AdminDashboard from './components/AdminDashboard'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if current user is admin
  const isAdmin = (user: User | null): boolean => {
    return user?.displayName === 'Administrator' || user?.email?.includes('admin@') || false;
  };

  useEffect(() => {
    
    // Clear any existing localStorage data to ensure Firebase-only operation
    localStorage.removeItem('quizResults')
    localStorage.removeItem('currentUser')
    
    // Listen to authentication state changes
    const unsubscribe = firebaseAuthService.onAuthStateChange((user: User | null) => {
      setUser(user)
      setLoading(false)
    })

    // Also check current auth state immediately
    const checkCurrentUser = async () => {
      try {
        // Import Firebase auth to check current user
        const { auth } = await import('./lib/firebase')
        const currentUser = auth.currentUser
        
        if (currentUser && !user) {
          setUser(currentUser)
        }
        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
    }
    
    checkCurrentUser()

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  // Show loading spinner while checking authentication state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Show Login if not authenticated, otherwise show Dashboard
  
  if (!user) {
    return <Login />
  }

  // Show AdminDashboard for admin users, regular Dashboard for students
  if (isAdmin(user)) {
    return <AdminDashboard />
  }
  // Responsive mobile UI: Add a wrapper div for Dashboard with mobile-friendly styles
  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '16px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <Dashboard />
    </div>
  )
  return <Dashboard />
}

export default App
