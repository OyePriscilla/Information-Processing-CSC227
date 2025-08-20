import { useState, useEffect } from "react";
import { firebaseQuizService, type QuizResult } from "../services/firebaseQuizService";
import { firebaseAuthService } from "../services/firebaseAuthService";

interface StudentResult {
  matricNumber: string;
  fullName: string;
  attempts: Array<{
    topic: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    completedAt: string;
  }>;
  totalAttempts: number;
  averageScore: number;
}

export default function AdminDashboard() {
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'matricNumber' | 'averageScore' | 'totalAttempts'>('matricNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadAllStudentResults();
  }, []);

  const loadAllStudentResults = async () => {
    try {
      setLoading(true);
      
      // Get all quiz results from Firestore
      const { results, error } = await firebaseQuizService.getAllResults();
      
      if (error) {
        return;
      }

      // Group results by student
      const studentMap = new Map<string, StudentResult>();
      
      for (const result of results) {
        if (!studentMap.has(result.matricNumber)) {
          studentMap.set(result.matricNumber, {
            matricNumber: result.matricNumber,
            fullName: result.studentId || result.matricNumber, // Use studentId as fallback for name
            attempts: [],
            totalAttempts: 0,
            averageScore: 0
          });
        }

        const student = studentMap.get(result.matricNumber)!;
        student.attempts.push({
          topic: result.topic,
          score: result.score,
          totalQuestions: result.totalQuestions,
          percentage: Math.round((result.score / result.totalQuestions) * 100),
          completedAt: result.completedAt
        });
      }

      // Calculate statistics for each student
      const studentsArray = Array.from(studentMap.values()).map(student => {
        student.totalAttempts = student.attempts.length;
        student.averageScore = student.attempts.length > 0 
          ? Math.round(student.attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / student.attempts.length)
          : 0;
        
        // Sort attempts by date (newest first)
        student.attempts.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        
        return student;
      });

      setStudentResults(studentsArray);
      
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: 'matricNumber' | 'averageScore' | 'totalAttempts') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedResults = [...studentResults].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'matricNumber':
        aValue = a.matricNumber;
        bValue = b.matricNumber;
        break;
      case 'averageScore':
        aValue = a.averageScore;
        bValue = b.averageScore;
        break;
      case 'totalAttempts':
        aValue = a.totalAttempts;
        bValue = b.totalAttempts;
        break;
      default:
        aValue = a.matricNumber;
        bValue = b.matricNumber;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else {
      return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return '#48bb78';
    if (percentage >= 70) return '#ed8936';
    if (percentage >= 60) return '#ecc94b';
    return '#f56565';
  };

  const handleLogout = async () => {
    await firebaseAuthService.logout();
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          backgroundColor: "white",
          padding: "32px",
          borderRadius: "16px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
        }}>
          <div style={{
            fontSize: "48px",
            marginBottom: "16px"
          }}>📊</div>
          <h2 style={{ margin: "0", color: "#2d3748" }}>Loading Admin Dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        padding: "20px 0"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h1 style={{
              margin: "0",
              color: "#2d3748",
              fontSize: "28px",
              fontWeight: "700"
            }}>
              🎓 Admin Dashboard
            </h1>
            <p style={{
              margin: "4px 0 0 0",
              color: "#718096",
              fontSize: "16px"
            }}>
              Student Quiz Results Overview
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "12px 24px",
              backgroundColor: "#e53e3e",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.3s ease"
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "32px"
      }}>
        {/* Summary Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "24px",
          marginBottom: "32px"
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            borderLeft: "4px solid #4299e1"
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "24px", marginRight: "12px" }}>👥</span>
              <h3 style={{ margin: "0", color: "#2d3748", fontSize: "18px" }}>Total Students</h3>
            </div>
            <p style={{
              margin: "0",
              fontSize: "32px",
              fontWeight: "700",
              color: "#4299e1"
            }}>
              {studentResults.length}
            </p>
          </div>

          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            borderLeft: "4px solid #48bb78"
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "24px", marginRight: "12px" }}>📝</span>
              <h3 style={{ margin: "0", color: "#2d3748", fontSize: "18px" }}>Total Attempts</h3>
            </div>
            <p style={{
              margin: "0",
              fontSize: "32px",
              fontWeight: "700",
              color: "#48bb78"
            }}>
              {studentResults.reduce((sum, student) => sum + student.totalAttempts, 0)}
            </p>
          </div>

          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            borderLeft: "4px solid #ed8936"
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "24px", marginRight: "12px" }}>📊</span>
              <h3 style={{ margin: "0", color: "#2d3748", fontSize: "18px" }}>Overall Average</h3>
            </div>
            <p style={{
              margin: "0",
              fontSize: "32px",
              fontWeight: "700",
              color: "#ed8936"
            }}>
              {studentResults.length > 0 
                ? Math.round(studentResults.reduce((sum, student) => sum + student.averageScore, 0) / studentResults.length)
                : 0}%
            </p>
          </div>
        </div>

        {/* Student Results Table */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          overflow: "hidden"
        }}>
          {/* Table Header */}
          <div style={{
            padding: "24px 32px",
            borderBottom: "1px solid #e2e8f0",
            background: "linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)"
          }}>
            <h2 style={{
              margin: "0",
              color: "#2d3748",
              fontSize: "24px",
              fontWeight: "700"
            }}>
              📈 Student Quiz Results ({studentResults.length} students)
            </h2>
          </div>

          {/* Sort Controls */}
          <div style={{
            padding: "16px 32px",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            display: "flex",
            gap: "12px",
            alignItems: "center"
          }}>
            <span style={{ fontSize: "14px", color: "#718096", fontWeight: "500" }}>Sort by:</span>
            {(['matricNumber', 'averageScore', 'totalAttempts'] as const).map(field => (
              <button
                key={field}
                onClick={() => handleSort(field)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: sortBy === field ? "#667eea" : "white",
                  color: sortBy === field ? "white" : "#4a5568",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                {field === 'matricNumber' && 'Matric Number'}
                {field === 'averageScore' && 'Average Score'}
                {field === 'totalAttempts' && 'Attempts'}
                {sortBy === field && (
                  <span style={{ fontSize: "10px" }}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Results */}
          {sortedResults.length === 0 ? (
            <div style={{
              padding: "48px 32px",
              textAlign: "center",
              color: "#718096"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
              <h3 style={{ margin: "0 0 8px 0", color: "#4a5568" }}>No Student Results Found</h3>
              <p style={{ margin: "0", fontSize: "16px" }}>
                No students have taken any quizzes yet.
              </p>
            </div>
          ) : (
            <div style={{ padding: "0" }}>
              {sortedResults.map((student, index) => (
                <div
                  key={student.matricNumber}
                  style={{
                    padding: "24px 32px",
                    borderBottom: index < sortedResults.length - 1 ? "1px solid #f1f5f9" : "none"
                  }}
                >
                  {/* Student Header */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px"
                  }}>
                    <div>
                      <h3 style={{
                        margin: "0",
                        color: "#2d3748",
                        fontSize: "18px",
                        fontWeight: "600"
                      }}>
                        {student.matricNumber}
                      </h3>
                      <p style={{
                        margin: "4px 0 0 0",
                        color: "#718096",
                        fontSize: "14px"
                      }}>
                        {student.totalAttempts} attempt{student.totalAttempts !== 1 ? 's' : ''} • {student.averageScore}% average
                      </p>
                    </div>
                    <div style={{
                      padding: "8px 16px",
                      backgroundColor: getScoreColor(student.averageScore),
                      color: "white",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: "600"
                    }}>
                      {student.averageScore}%
                    </div>
                  </div>

                  {/* Student Attempts */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "12px"
                  }}>
                    {student.attempts.map((attempt, attemptIndex) => (
                      <div
                        key={attemptIndex}
                        style={{
                          padding: "16px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "8px",
                          borderLeft: `4px solid ${getScoreColor(attempt.percentage)}`
                        }}
                      >
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "8px"
                        }}>
                          <h4 style={{
                            margin: "0",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#2d3748",
                            lineHeight: "1.3"
                          }}>
                            {attempt.topic}
                          </h4>
                          <span style={{
                            fontSize: "16px",
                            fontWeight: "700",
                            color: getScoreColor(attempt.percentage)
                          }}>
                            {attempt.score}/{attempt.totalQuestions}
                          </span>
                        </div>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <span style={{
                            fontSize: "12px",
                            color: "#718096"
                          }}>
                            {formatDate(attempt.completedAt)}
                          </span>
                          <span style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: getScoreColor(attempt.percentage)
                          }}>
                            {attempt.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
