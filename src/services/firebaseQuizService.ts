import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

interface QuizResult {
  id: string
  studentId: string
  matricNumber: string
  topic: string
  score: number
  totalQuestions: number
  percentage: number
  answers: Array<{
    questionIndex: number
    selectedAnswer: string
    correctAnswer: string
    isCorrect: boolean
  }>
  completedAt: any
  timeSpent?: number
}

interface StudentStats {
  totalQuizzes: number
  averageScore: number
  bestScore: number
  topicStats: Array<{
    topic: string
    score: number
    percentage: number
    attempts: number
    lastAttempt: string
  }>
}

export class FirebaseQuizService {
  // Save quiz result to Firestore
  async saveQuizResult(result: {
    topic: string
    score: number
    totalQuestions: number
    answers: Array<{
      questionIndex: number
      selectedAnswer: string
      correctAnswer: string
      isCorrect: boolean
    }>
    timeSpent?: number
  }) {
    try {
      const user = auth.currentUser
      if (!user) {
        return { result: null, error: 'User not authenticated' }
      }

      const matricNumber = user.displayName || 'Unknown'
      const percentage = Math.round((result.score / result.totalQuestions) * 100)
      
      const quizResult = {
        studentId: user.uid,
        matricNumber,
        topic: result.topic,
        score: result.score,
        totalQuestions: result.totalQuestions,
        percentage,
        answers: result.answers,
        completedAt: serverTimestamp(),
        timeSpent: result.timeSpent || 0
      }

      const docRef = await addDoc(collection(db, 'quizResults'), quizResult)
      
      const savedResult: QuizResult = {
        id: docRef.id,
        ...quizResult,
        completedAt: new Date().toISOString()
      }

      console.log('✅ Quiz result saved to Firestore:', savedResult.id)
      return { result: savedResult, error: null }
      
    } catch (error: any) {
      console.error('❌ Error saving quiz result to Firestore:', error)
      return { result: null, error: error.message }
    }
  }

  // Get quiz results for current student from Firestore
  async getStudentResults() {
    try {
      const user = auth.currentUser
      if (!user) {
        return { results: [], error: 'User not authenticated' }
      }

      const q = query(
        collection(db, 'quizResults'),
        where('studentId', '==', user.uid)
        // Temporarily removed orderBy to avoid index requirement
        // Add back after creating composite index in Firebase Console
      )

      const querySnapshot = await getDocs(q)
      const results: QuizResult[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as QuizResult[]

      // Sort in JavaScript since we removed orderBy from the query
      results.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())

      console.log(`📊 Loaded ${results.length} quiz results from Firestore`)
      return { results, error: null }
      
    } catch (error: any) {
      console.error('❌ Error getting student results from Firestore:', error)
      return { results: [], error: error.message }
    }
  }

  // Calculate student statistics
  async getStudentStats() {
    try {
      const { results, error } = await this.getStudentResults()
      if (error) {
        return { stats: null, error }
      }

      if (results.length === 0) {
        return {
          stats: {
            totalQuizzes: 0,
            averageScore: 0,
            bestScore: 0,
            topicStats: []
          },
          error: null
        }
      }

      const totalQuizzes = results.length
      const averageScore = Math.round(
        results.reduce((sum, result) => sum + result.percentage, 0) / totalQuizzes
      )
      const bestScore = Math.max(...results.map(result => result.percentage))

      // Group results by topic
      const topicGroups = results.reduce((groups, result) => {
        if (!groups[result.topic]) {
          groups[result.topic] = []
        }
        groups[result.topic].push(result)
        return groups
      }, {} as Record<string, QuizResult[]>)

      const topicStats = Object.entries(topicGroups).map(([topic, topicResults]) => {
        const latestResult = topicResults[0] // Already sorted by date desc
        const attempts = topicResults.length
        const bestTopicScore = Math.max(...topicResults.map(r => r.percentage))
        
        return {
          topic,
          score: latestResult.score,
          percentage: bestTopicScore,
          attempts,
          lastAttempt: latestResult.completedAt
        }
      })

      const stats: StudentStats = {
        totalQuizzes,
        averageScore,
        bestScore,
        topicStats
      }

      console.log('📈 Calculated student stats:', stats)
      return { stats, error: null }
    } catch (error: any) {
      console.error('❌ Error calculating student stats:', error)
      return { 
        stats: {
          totalQuizzes: 0,
          averageScore: 0,
          bestScore: 0,
          topicStats: []
        }, 
        error: error.message 
      }
    }
  }

  // Get all quiz results (for admin/teacher view)
  async getAllResults() {
    try {
      const q = query(
        collection(db, 'quizResults')
        // Removed orderBy to avoid index requirement for admin view
      )

      const querySnapshot = await getDocs(q)
      const results: QuizResult[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as QuizResult[]

      // Sort in JavaScript instead
      results.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())

      return { results, error: null }
    } catch (error: any) {
      return { results: [], error: error.message }
    }
  }
}

// Export singleton instance and types
export const firebaseQuizService = new FirebaseQuizService()
export type { QuizResult, StudentStats }
