interface QuizResult {
  id: string
  studentId: string
  matricNumber: string
  topic: string
  score: number
  totalQuestions: number
  answers: Array<{
    questionIndex: number
    selectedAnswer: string
    correctAnswer: string
    isCorrect: boolean
  }>
  completedAt: string
  timeSpent?: number
}

interface StudentStats {
  totalQuizzes: number
  averageScore: number
  topicStats: Array<{
    topic: string
    score: number
    attempts: number
  }>
}

class LocalQuizService {
  private readonly QUIZ_RESULTS_KEY = 'quizResults'

  // Save quiz result to localStorage
  async saveQuizResult(result: Omit<QuizResult, 'id' | 'completedAt'>) {
    try {
      const newResult: QuizResult = {
        ...result,
        id: this.generateId(),
        completedAt: new Date().toISOString()
      }

      const existingResults = this.getResults()
      existingResults.push(newResult)
      
      localStorage.setItem(this.QUIZ_RESULTS_KEY, JSON.stringify(existingResults))
      
      return { result: newResult, error: null }
    } catch (error: any) {
      console.error('Error saving quiz result:', error)
      return { result: null, error: error.message }
    }
  }

  // Get all quiz results
  getResults(): QuizResult[] {
    try {
      const stored = localStorage.getItem(this.QUIZ_RESULTS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading quiz results:', error)
      return []
    }
  }

  // Get quiz results for a specific student
  async getStudentResults(matricNumber?: string) {
    try {
      const allResults = this.getResults()
      const studentResults = matricNumber 
        ? allResults.filter(result => result.matricNumber === matricNumber)
        : allResults

      return { results: studentResults, error: null }
    } catch (error: any) {
      console.error('Error getting student results:', error)
      return { results: [], error: error.message }
    }
  }

  // Get student statistics
  async getStudentStats(matricNumber?: string) {
    try {
      const { results } = await this.getStudentResults(matricNumber)
      
      if (results.length === 0) {
        return {
          stats: {
            totalQuizzes: 0,
            averageScore: 0,
            topicStats: []
          },
          error: null
        }
      }

      const totalQuizzes = results.length
      const averageScore = Math.round(
        results.reduce((sum, result) => sum + (result.score / result.totalQuestions) * 100, 0) / totalQuizzes
      )

      // Group by topic
      const topicGroups = results.reduce((groups, result) => {
        if (!groups[result.topic]) {
          groups[result.topic] = []
        }
        groups[result.topic].push(result)
        return groups
      }, {} as Record<string, QuizResult[]>)

      const topicStats = Object.entries(topicGroups).map(([topic, topicResults]) => {
        const latestResult = topicResults[topicResults.length - 1]
        const score = Math.round((latestResult.score / latestResult.totalQuestions) * 100)
        return {
          topic,
          score,
          attempts: topicResults.length
        }
      })

      const stats: StudentStats = {
        totalQuizzes,
        averageScore,
        topicStats
      }

      return { stats, error: null }
    } catch (error: any) {
      console.error('Error calculating student stats:', error)
      return { 
        stats: { totalQuizzes: 0, averageScore: 0, topicStats: [] }, 
        error: error.message 
      }
    }
  }

  // Generate simple ID
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }
}

// Export singleton instance and types
export const localQuizService = new LocalQuizService()
export type { QuizResult, StudentStats }
