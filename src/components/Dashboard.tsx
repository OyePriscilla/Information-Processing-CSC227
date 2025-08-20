import { useState, useEffect } from "react";
import Quiz from "./Quiz";
import { firebaseAuthService } from "../services/firebaseAuthService";
import { firebaseQuizService, type QuizResult, type StudentStats } from "../services/firebaseQuizService";

interface StudentProfile {
  id: string
  matricNumber: string
  email: string
  fullName: string
  isActive: boolean
}

interface QuestionData {
  question: string
  options: string[]
  correctAnswer: string
  rationale: string
}

export default function Dashboard() {
  const [activeView, setActiveView] = useState<"dashboard" | "quiz">("dashboard");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [studentResults, setStudentResults] = useState<QuizResult[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<QuizResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [questionData, setQuestionData] = useState<Record<string, QuestionData[]>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load question data from JSON files
  const loadQuestionData = async () => {
    try {
      const topicFiles = [
        { key: 'Topic 1: Problem Solving and Algorithm Design', file: 'topic1' },
        { key: 'Topic 2: Programming Basics and Syntax', file: 'topic2' }, 
        { key: 'Topic 3: Control Structures and Functions', file: 'topic3' },
        { key: 'Topic 4: Data Structures and File Handling', file: 'topic4' }
      ];
      
      const topicData: Record<string, QuestionData[]> = {};
      
      for (const topic of topicFiles) {
        try {
          const response = await import(`../json/${topic.file}.json`);
          topicData[topic.key] = response.default;
          topicData[topic.file] = response.default; // Also map by file name for backup
        } catch (err) {
        }
      }
      
      setQuestionData(topicData);
    } catch (error) {
    }
  };

  // Show detailed results for a quiz
  const showResultDetails = (result: QuizResult) => {
    setSelectedResult(result);
    setShowDetailModal(true);
  };

  // Close detail modal
  const closeDetailModal = () => {
    setSelectedResult(null);
    setShowDetailModal(false);
  };

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
    loadQuestionData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Also get current Firebase Auth user for fallback
      const { auth } = await import('../lib/firebase');
      const firebaseUser = auth.currentUser;
      setCurrentUser(firebaseUser);
      console.log('Firebase user:', firebaseUser?.displayName, firebaseUser?.email);

      // Load user profile
      const userProfile = await firebaseAuthService.getCurrentUserProfile();
      
      if (userProfile.profile) {
        setProfile(userProfile.profile);
        // Temporary debug to see profile data
        console.log('Profile loaded:', userProfile.profile);
      } else if (userProfile.error) {
        console.log('Profile error:', userProfile.error);
      }

      // Load quiz results
      const { results, error: resultsError } = await firebaseQuizService.getStudentResults();
      
      if (resultsError) {
      } else {
        setStudentResults(results);
      }

      // Load statistics
      const { stats: studentStats, error: statsError } = await firebaseQuizService.getStudentStats();
      
      if (statsError) {
      } else {
        setStats(studentStats);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuizResult = async (result: {
    topicId: string;
    topicName: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    completedAt: string;
    answers: Array<{
      questionIndex: number;
      selectedAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }>;
  }) => {
    try {
      
      const { result: savedResult, error } = await firebaseQuizService.saveQuizResult({
        topic: result.topicName,
        score: result.score,
        totalQuestions: result.totalQuestions,
        answers: result.answers,
        timeSpent: 0
      });

      if (error) {
      } else {
        
        // Refresh dashboard data to show new result
        await loadDashboardData();
        
        // Show success message and redirect back to dashboard
        setTimeout(() => {
          setActiveView("dashboard");
        }, 2000);
      }
    } catch (error) {
    }
  };

  const handleLogout = async () => {
    await firebaseAuthService.logout();
    // Auth state change will be handled by App.tsx
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "#48bb78"; // Green
    if (percentage >= 80) return "#38b2ac"; // Teal
    if (percentage >= 70) return "#ed8936"; // Orange
    if (percentage >= 60) return "#ecc94b"; // Yellow
    return "#f56565"; // Red
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  const calculateOverallStats = () => {
    if (!stats || studentResults.length === 0) return { averageScore: 0, totalQuizzes: 0, bestScore: 0 };
    
    // Calculate best score from results
    const bestScore = studentResults.length > 0 
      ? Math.max(...studentResults.map(result => Math.round((result.score / result.totalQuestions) * 100)))
      : 0;
    
    return {
      averageScore: stats.averageScore || 0,
      totalQuizzes: stats.totalQuizzes || 0,
      bestScore: bestScore
    };
  };

  const overallStats = calculateOverallStats();

  // Show loading spinner while loading data
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
    );
  }

  if (activeView === "quiz") {
    return (
      <div style={{ position: "relative" }}>
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          display: "flex",
          gap: "12px"
        }}>
          <button
            onClick={() => setActiveView("dashboard")}
            style={{
              padding: "12px 20px",
              backgroundColor: "#4299e1",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              boxShadow: "0 4px 12px rgba(66, 153, 225, 0.3)"
            }}
          >
            📊 Back to Dashboard
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: "12px 20px",
              backgroundColor: "#f56565",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              boxShadow: "0 4px 12px rgba(245, 101, 101, 0.3)"
            }}
          >
            🚪 Logout
          </button>
        </div>
        <Quiz onSaveResult={handleSaveQuizResult} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f7fafc",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "24px 32px",
        color: "white",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          <div>
            <h1 style={{
              margin: "0 0 4px 0",
              fontSize: "28px",
              fontWeight: "700"
            }}>
              🎓Dashboard
            </h1>
            <p style={{
              margin: "0",
              fontSize: "16px",
              opacity: "0.9"
            }}>
              Welcome back, <strong>{profile?.matricNumber || profile?.fullName || currentUser?.displayName || currentUser?.email || "Student"}</strong>
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setActiveView("quiz")}
              style={{
                padding: "12px 24px",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "25px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.3s ease",
                backdropFilter: "blur(10px)"
              }}
            >
              📝 Take Quiz
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: "12px 24px",
                backgroundColor: "rgba(245, 101, 101, 0.9)",
                color: "white",
                border: "none",
                borderRadius: "25px",
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
      </div>

      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "32px"
      }}>
        {/* Stats Cards */}
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
            borderLeft: "4px solid #48bb78"
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "24px", marginRight: "12px" }}>📊</span>
              <h3 style={{ margin: "0", color: "#2d3748", fontSize: "18px" }}>Average Score</h3>
            </div>
            <p style={{
              margin: "0",
              fontSize: "32px",
              fontWeight: "700",
              color: "#48bb78"
            }}>
              {overallStats.averageScore}%
            </p>
          </div>

          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            borderLeft: "4px solid #4299e1"
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "24px", marginRight: "12px" }}>📚</span>
              <h3 style={{ margin: "0", color: "#2d3748", fontSize: "18px" }}>Quizzes Completed</h3>
            </div>
            <p style={{
              margin: "0",
              fontSize: "32px",
              fontWeight: "700",
              color: "#4299e1"
            }}>
              {stats?.totalQuizzes || 0}/20
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
              <span style={{ fontSize: "24px", marginRight: "12px" }}>🏆</span>
              <h3 style={{ margin: "0", color: "#2d3748", fontSize: "18px" }}>Best Score</h3>
            </div>
            <p style={{
              margin: "0",
              fontSize: "32px",
              fontWeight: "700",
              color: "#ed8936"
            }}>
              {overallStats.bestScore}%
            </p>
          </div>
        </div>

        {/* Quiz Results */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          overflow: "hidden"
        }}>
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
              📈 Quiz Results History
            </h2>
          </div>

          {studentResults.length === 0 ? (
            <div style={{
              padding: "48px 32px",
              textAlign: "center",
              color: "#718096"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
              <h3 style={{ margin: "0 0 8px 0", color: "#4a5568" }}>No Quiz Results Yet</h3>
              <p style={{ margin: "0", fontSize: "16px" }}>
                Take your first quiz to see your results here!
              </p>
              <button
                onClick={() => setActiveView("quiz")}
                style={{
                  marginTop: "20px",
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "25px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "16px"
                }}
              >
                🚀 Start First Quiz
              </button>
            </div>
          ) : (
            <div style={{ padding: "0" }}>
              {studentResults.map((result, index) => (
                <div
                  key={result.id}
                  onClick={() => showResultDetails(result)}
                  style={{
                    padding: "24px 32px",
                    borderBottom: index < studentResults.length - 1 ? "1px solid #f1f5f9" : "none",
                    transition: "all 0.2s ease",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px"
                    }}>
                      <div style={{ flex: "1", minWidth: "250px" }}>
                        <h3 style={{
                          margin: "0 0 8px 0",
                          color: "#2d3748",
                          fontSize: "18px",
                          fontWeight: "600"
                        }}>
                          {result.topic}
                        </h3>
                        <p style={{
                          margin: "0",
                          color: "#718096",
                          fontSize: "14px"
                        }}>
                          Completed on {formatDate(result.completedAt)} • Click for details
                        </p>
                      </div>                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "20px"
                    }}>
                      <div style={{
                        textAlign: "center",
                        minWidth: "80px"
                      }}>
                        <div style={{
                          fontSize: "24px",
                          fontWeight: "700",
                          color: getGradeColor(Math.round((result.score / result.totalQuestions) * 100)),
                          marginBottom: "4px"
                        }}>
                          {result.score}/{result.totalQuestions}
                        </div>
                        <div style={{
                          fontSize: "12px",
                          color: "#718096",
                          fontWeight: "500"
                        }}>
                          {Math.round((result.score / result.totalQuestions) * 100)}%
                        </div>
                      </div>

                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        backgroundColor: getGradeColor(Math.round((result.score / result.totalQuestions) * 100)),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "18px",
                        fontWeight: "700"
                      }}>
                        {getGradeLetter(Math.round((result.score / result.totalQuestions) * 100))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Section */}
        <div style={{
          marginTop: "32px",
          textAlign: "center",
          padding: "32px",
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
        }}>
          <h3 style={{
            margin: "0 0 16px 0",
            color: "#2d3748",
            fontSize: "20px",
            fontWeight: "600"
          }}>
            🎯 Ready for More Practice?
          </h3>
          
          <button
            onClick={() => setActiveView("quiz")}
            style={{
              padding: "16px 32px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "25px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "16px",
              transition: "all 0.3s ease",
              boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 12px 25px rgba(102, 126, 234, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.3)";
            }}
          >
            🚀 Take Quiz Now
          </button>
        </div>
      </div>

      {/* Detailed Result Modal */}
      {showDetailModal && selectedResult && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            maxWidth: "800px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "24px 32px",
              borderBottom: "1px solid #e2e8f0",
              background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h2 style={{
                  margin: "0",
                  fontSize: "24px",
                  fontWeight: "700"
                }}>
                  📊 {selectedResult.topic} - Detailed Results
                </h2>
                <p style={{
                  margin: "8px 0 0 0",
                  opacity: 0.9,
                  fontSize: "14px"
                }}>
                  Score: {selectedResult.score}/{selectedResult.totalQuestions} ({Math.round((selectedResult.score / selectedResult.totalQuestions) * 100)}%) • {formatDate(selectedResult.completedAt)}
                </p>
              </div>
              <button
                onClick={closeDetailModal}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  color: "white",
                  fontSize: "24px",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{
              padding: "0",
              maxHeight: "calc(90vh - 120px)",
              overflowY: "auto"
            }}>
              {selectedResult.answers && selectedResult.answers.length > 0 ? (
                selectedResult.answers.map((answer, index) => {
                  // Try to find the question data for this topic
                  const questions = questionData[selectedResult.topic] || 
                                  questionData['topic1'] || 
                                  questionData['topic2'] || 
                                  questionData['topic3'] || 
                                  questionData['topic4'] || 
                                  [];
                  const questionInfo = questions[answer.questionIndex] || questions[index];
                  
                  return (
                    <div
                      key={index}
                      style={{
                        padding: "24px 32px",
                        borderBottom: index < selectedResult.answers.length - 1 ? "1px solid #f1f5f9" : "none"
                      }}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "16px",
                        marginBottom: "16px"
                      }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: answer.isCorrect ? "#48bb78" : "#f56565",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "700",
                          fontSize: "14px",
                          flexShrink: 0
                        }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            margin: "0 0 12px 0",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#2d3748",
                            lineHeight: "1.5"
                          }}>
                            {questionInfo?.question || `Question ${index + 1}`}
                          </h4>
                          
                          {/* Answer Details */}
                          <div style={{ marginBottom: "16px" }}>
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "8px"
                            }}>
                              <span style={{ fontSize: "14px", color: "#718096", fontWeight: "500" }}>Your Answer:</span>
                              <span style={{
                                fontSize: "14px",
                                fontWeight: "600",
                                color: answer.isCorrect ? "#48bb78" : "#f56565"
                              }}>
                                {answer.selectedAnswer}
                              </span>
                              <span style={{
                                fontSize: "12px",
                                color: answer.isCorrect ? "#48bb78" : "#f56565",
                                fontWeight: "600"
                              }}>
                                {answer.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                              </span>
                            </div>
                            
                            {!answer.isCorrect && (
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "8px"
                              }}>
                                <span style={{ fontSize: "14px", color: "#718096", fontWeight: "500" }}>Correct Answer:</span>
                                <span style={{
                                  fontSize: "14px",
                                  fontWeight: "600",
                                  color: "#48bb78"
                                }}>
                                  {answer.correctAnswer}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Rationale */}
                          {questionInfo?.rationale && (
                            <div style={{
                              backgroundColor: "#f8fafc",
                              padding: "12px 16px",
                              borderRadius: "8px",
                              borderLeft: "4px solid #4299e1"
                            }}>
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                marginBottom: "6px"
                              }}>
                                <span style={{ fontSize: "12px", color: "#4299e1", fontWeight: "600" }}>💡 EXPLANATION:</span>
                              </div>
                              <p style={{
                                margin: "0",
                                fontSize: "14px",
                                color: "#4a5568",
                                lineHeight: "1.5"
                              }}>
                                {questionInfo.rationale}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{
                  padding: "48px 32px",
                  textAlign: "center",
                  color: "#718096"
                }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
                  <h3 style={{ margin: "0 0 8px 0", color: "#4a5568" }}>No detailed answers available</h3>
                  <p style={{ margin: "0", fontSize: "16px" }}>
                    This quiz result doesn't contain detailed answer information.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
