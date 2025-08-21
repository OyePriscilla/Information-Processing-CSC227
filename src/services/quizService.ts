import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export interface QuizResult {
  id?: string
  studentId: string
  matricNumber: string
  topicId: string
  topicName: string
  score: number
  totalQuestions: number
  percentage: number
  timeSpent?: number
  answers: { [questionIndex: number]: string }
  correctAnswers: { [questionIndex: number]: boolean }
  completedAt: any
  submittedAt: any
}

export interface QuizTopic {
  id: string
  topicId: string
  topicName: string
  description: string
  totalQuestions: number
  difficulty: string
  estimatedTime: number
  createdAt: any
}

export class QuizService {
  // Save quiz result
  async saveQuizResult(result: {
    topicId: string
    topicName: string
    score: number
    totalQuestions: number
    percentage: number
    answers: { [questionIndex: number]: string }
    correctAnswers: { [questionIndex: number]: boolean }
    timeSpent?: number
  }) {
    try {
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')

      // Get student profile to get matric number
      const studentDoc = await getDoc(doc(db, 'students', user.uid))
      if (!studentDoc.exists()) {
        throw new Error('Student profile not found')
      }
      
      const studentData = studentDoc.data()

      const quizResult: Omit<QuizResult, 'id'> = {
        ...result,
        studentId: user.uid,
        matricNumber: studentData.matricNumber,
        completedAt: serverTimestamp(),
        submittedAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'quizResults'), quizResult)
      
      return { id: docRef.id, error: null }
    } catch (error: any) {
      console.error('Error saving quiz result:', error)
      return { id: null, error: error.message }
    }
  }

  // Get student's quiz results
  async getStudentResults(): Promise<{ results: QuizResult[], error: string | null }> {
    try {
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')

      const q = query(
        collection(db, 'quizResults'),
        where('studentId', '==', user.uid),
        orderBy('completedAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      const results: QuizResult[] = []

  querySnapshot.forEach((doc: any) => {
        const data = doc.data()
        results.push({ 
          id: doc.id, 
          ...data,
          // Convert Firestore timestamps to readable format
          completedAt: data.completedAt?.toDate?.() || data.completedAt,
          submittedAt: data.submittedAt?.toDate?.() || data.submittedAt
        } as QuizResult)
      })

      return { results, error: null }
    } catch (error: any) {
      console.error('Error getting student results:', error)
      return { results: [], error: error.message }
    }
  }

  // Get quiz topics (if stored in Firestore)
  async getQuizTopics(): Promise<{ topics: QuizTopic[], error: string | null }> {
    try {
      const querySnapshot = await getDocs(collection(db, 'quizTopics'))
      const topics: QuizTopic[] = []

  querySnapshot.forEach((doc: any) => {
        topics.push({ id: doc.id, ...doc.data() } as QuizTopic)
      })

      return { topics, error: null }
    } catch (error: any) {
      console.error('Error getting quiz topics:', error)
      return { topics: [], error: error.message }
    }
  }

  // Get student's statistics
  async getStudentStats() {
    try {
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')

      const { results, error } = await this.getStudentResults()
      if (error) throw new Error(error)

      // Calculate statistics
      const stats = {
        totalQuizzes: results.length,
        averageScore: 0,
        bestScore: 0,
        topicStats: {} as { [topicId: string]: { bestScore: number, attempts: number, averageScore: number } }
      }

      if (results.length > 0) {
        const totalPercentage = results.reduce((sum, result) => sum + result.percentage, 0)
        stats.averageScore = Math.round(totalPercentage / results.length)
        stats.bestScore = Math.max(...results.map(r => r.percentage))

        // Calculate topic-specific stats
        results.forEach(result => {
          if (!stats.topicStats[result.topicId]) {
            stats.topicStats[result.topicId] = {
              bestScore: result.percentage,
              attempts: 1,
              averageScore: result.percentage
            }
          } else {
            const topicStat = stats.topicStats[result.topicId]
            topicStat.bestScore = Math.max(topicStat.bestScore, result.percentage)
            topicStat.attempts += 1
            topicStat.averageScore = Math.round(
              (topicStat.averageScore * (topicStat.attempts - 1) + result.percentage) / topicStat.attempts
            )
          }
        })
      }

      return { stats, error: null }
    } catch (error: any) {
      console.error('Error getting student stats:', error)
      return { stats: null, error: error.message }
    }
  }

  // Create a quiz attempt record (optional - for tracking in-progress quizzes)
  async startQuizAttempt(topicId: string, topicName: string) {
    try {
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')

      const attemptData = {
        studentId: user.uid,
        topicId,
        topicName,
        startedAt: serverTimestamp(),
        status: 'in_progress'
      }

      const docRef = await addDoc(collection(db, 'quizAttempts'), attemptData)
      return { id: docRef.id, error: null }
    } catch (error: any) {
      console.error('Error starting quiz attempt:', error)
      return { id: null, error: error.message }
    }
  }
}

export const quizService = new QuizService()
