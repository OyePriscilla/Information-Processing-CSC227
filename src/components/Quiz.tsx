import { useState } from "react";
import computerSoftwareQuestions from "../json/ComputerSoftware.json";
import databaseQuestions from "../json/Database.json";
import infoSystemQuestions from "../json/InfoSystem.json";
import inputOutputStorageQuestions from "../json/inputoutputstorage.json";
import internetQuestions from "../json/internet.json";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  rationale: string;
}

interface TopicData {
  id: string;
  name: string;
  questions: Question[];
}

interface QuizProps {
  onSaveResult?: (result: {
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
  }) => void;
}

const topics: TopicData[] = [
  {
    id: "computerSoftware",
    name: "Computer Software",
    questions: computerSoftwareQuestions as Question[]
  },
  {
    id: "database",
    name: "Database",
    questions: databaseQuestions as Question[]
  },
  {
    id: "infoSystem",
    name: "Information System",
    questions: infoSystemQuestions as Question[]
  },
  {
    id: "inputOutputStorage",
    name: "Input, Output & Storage",
    questions: inputOutputStorageQuestions as Question[]
  },
  {
    id: "internet",
    name: "Internet",
    questions: internetQuestions as Question[]
  }  
];

export default function Quiz({ onSaveResult }: QuizProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [answers, setAnswers] = useState<{ [topicId: string]: { [key: number]: string } }>({});
  const [submitted, setSubmitted] = useState<{ [topicId: string]: boolean }>({});
  const [scores, setScores] = useState<{ [topicId: string]: number }>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const currentTopic = topics[activeTab];
  const currentAnswers = answers[currentTopic.id] || {};
  const isCurrentTopicSubmitted = submitted[currentTopic.id] || false;
  const currentScore = scores[currentTopic.id] || 0;

  const handleChange = (qIndex: number, option: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentTopic.id]: {
        ...prev[currentTopic.id],
        [qIndex]: option
      }
    }));
  };

  const handleSubmit = () => {
    let newScore = 0;
    const detailedAnswers: Array<{
      questionIndex: number;
      selectedAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }> = [];

    currentTopic.questions.forEach((q, index) => {
      const selectedAnswer = currentAnswers[index] || "";
      const isCorrect = selectedAnswer === q.correctAnswer;
      
      // Add to detailed answers
      detailedAnswers.push({
        questionIndex: index,
        selectedAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect
      });

      // Count correct answers
      if (isCorrect) {
        newScore++;
      }
    });
    
    const percentage = Math.round((newScore / currentTopic.questions.length) * 100);
    
    setScores(prev => ({
      ...prev,
      [currentTopic.id]: newScore
    }));
    
    setSubmitted(prev => ({
      ...prev,
      [currentTopic.id]: true
    }));

    // Save result to parent component (Dashboard)
    if (onSaveResult) {
      onSaveResult({
        topicId: currentTopic.id,
        topicName: currentTopic.name,
        score: newScore,
        totalQuestions: currentTopic.questions.length,
        percentage,
        completedAt: new Date().toISOString(),
        answers: detailedAnswers
      });
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }
  };

  const resetQuiz = (topicId: string) => {
    setAnswers(prev => ({
      ...prev,
      [topicId]: {}
    }));
    setSubmitted(prev => ({
      ...prev,
      [topicId]: false
    }));
    setScores(prev => ({
      ...prev,
      [topicId]: 0
    }));
  };

  const tabStyle = (isActive: boolean) => ({
    padding: "14px 28px",
    border: "none",
    backgroundColor: isActive ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#ffffff",
    color: isActive ? "white" : "#4a5568",
    cursor: "pointer",
    borderRadius: "12px 12px 0 0",
    marginRight: "2px",
    fontSize: "14px",
    fontWeight: isActive ? "600" : "500",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: isActive 
      ? "0 4px 14px 0 rgba(102, 126, 234, 0.39)" 
      : "0 2px 4px 0 rgba(0, 0, 0, 0.1)",
    transform: isActive ? "translateY(-2px)" : "translateY(0)",
    background: isActive 
      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
      : "#ffffff",
    borderBottom: isActive ? "none" : "2px solid #e2e8f0"
  });

  const contentStyle = {
    border: "none",
    borderTop: "none",
    padding: "32px",
    borderRadius: "0 12px 12px 12px",
    backgroundColor: "#ffffff",
    minHeight: "500px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)"
  };

  return (
    <div style={{ 
      padding: "32px", 
      maxWidth: "1200px", 
      margin: "auto",
      backgroundColor: "#f7fafc",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      position: "relative"
    }}>
      
      {/* Success Message */}
      {showSuccessMessage && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#48bb78",
          color: "white",
          padding: "16px 24px",
          borderRadius: "12px",
          boxShadow: "0 8px 25px rgba(72, 187, 120, 0.3)",
          zIndex: 1000,
          fontSize: "16px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          animation: "slideDown 0.3s ease-out"
        }}>
          <span>🎉</span>
          Quiz completed! Your result has been saved to your dashboard.
        </div>
      )}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "20px",
        padding: "32px",
        marginBottom: "32px",
        textAlign: "center",
        boxShadow: "0 20px 40px rgba(102, 126, 234, 0.3)"
      }}>
        <h1 style={{ 
          margin: "0",
          color: "white",
          fontSize: "2.5rem",
          fontWeight: "700",
          textShadow: "0 2px 4px rgba(0,0,0,0.1)",
          letterSpacing: "-0.025em"
        }}>
          CSC 227 Practise Questions And Explanations
        </h1>
        <p style={{
          margin: "12px 0 0 0",
          color: "rgba(255,255,255,0.9)",
          fontSize: "1.1rem",
          fontWeight: "400"
        }}>
          Test your knowledge across the topics taught in class.
        </p>
      </div>

      {/* Tab Headers */}
      <div style={{ 
        display: "flex", 
        marginBottom: "0",
        flexWrap: "wrap",
        gap: "4px",
        padding: "0 4px"
      }}>
        {topics.map((topic, index) => (
          <div
            key={topic.id}
            style={tabStyle(activeTab === index)}
            onClick={() => setActiveTab(index)}
          >
            {topic.name}
            {submitted[topic.id] && (
              <span style={{ 
                marginLeft: "8px", 
                fontSize: "12px",
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: "2px 6px",
                borderRadius: "10px",
                fontWeight: "600"
              }}>
                ✓ {scores[topic.id]}/{topic.questions.length}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div style={contentStyle}>
        <h2 style={{ 
          marginBottom: "32px", 
          color: "#2d3748",
          fontSize: "1.75rem",
          fontWeight: "600",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textAlign: "center"
        }}>
          📚 {currentTopic.name}
        </h2>

        {!isCurrentTopicSubmitted ? (
          <>
            {currentTopic.questions.map((q, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "28px",
                  padding: "24px",
                  border: "none",
                  borderRadius: "16px",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  transition: "all 0.3s ease",
                  borderLeft: "4px solid #667eea"
                }}
              >
                <p style={{ 
                  marginBottom: "12px", 
                  fontSize: "15px", 
                  lineHeight: "1.5",
                  color: "#2d3748",
                  fontWeight: "500",
                  textAlign: "left",
                  wordBreak: "break-word"
                }}>
                  <span style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: "700"
                  }}>
                  Q{index + 1}:
                  </span>{" "}
                  {q.question}
                </p>
                <div style={{ marginLeft: "0" }}>
                  {q.options.map((option, oIndex) => (
                    <label 
                      key={oIndex} 
                      style={{ 
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "12px",
                        cursor: "pointer",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        backgroundColor: currentAnswers[index] === option ? "#e6f3ff" : "#f8fafc",
                        border: `2px solid ${currentAnswers[index] === option ? "#667eea" : "#e2e8f0"}`,
                        transform: "scale(1)"
                      }}
                      onMouseEnter={(e) => {
                        const element = e.target as HTMLElement;
                        if (currentAnswers[index] !== option) {
                          element.style.backgroundColor = "#f0f4f8";
                          element.style.transform = "translateY(-1px)";
                          element.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        const element = e.target as HTMLElement;
                        if (currentAnswers[index] !== option) {
                          element.style.backgroundColor = "#f8fafc";
                          element.style.transform = "translateY(0)";
                          element.style.boxShadow = "none";
                        }
                      }}
                    >
                      <input
                        type="radio"
                        name={`question-${currentTopic.id}-${index}`}
                        value={option}
                        checked={currentAnswers[index] === option}
                        onChange={() => handleChange(index, option)}
                        style={{ 
                          marginRight: "12px",
                          transform: "scale(1.2)",
                          accentColor: "#667eea"
                        }}
                      />
                      <span style={{
                        fontSize: "15px",
                        color: "#4a5568",
                        fontWeight: "500"
                      }}>
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <button 
                onClick={handleSubmit} 
                style={{ 
                  padding: "16px 40px", 
                  fontSize: "16px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "50px",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
                  transform: "translateY(0)",
                  letterSpacing: "0.5px"
                }}
                onMouseEnter={(e) => {
                  const element = e.target as HTMLElement;
                  element.style.transform = "translateY(-2px)";
                  element.style.boxShadow = "0 12px 25px rgba(102, 126, 234, 0.4)";
                }}
                onMouseLeave={(e) => {
                  const element = e.target as HTMLElement;
                  element.style.transform = "translateY(0)";
                  element.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.3)";
                }}
              >
                🎯 Submit {currentTopic.name} Quiz
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ 
              textAlign: "center", 
              marginBottom: "40px",
              padding: "32px",
              background: currentScore === currentTopic.questions.length 
                ? "linear-gradient(135deg, #48bb78 0%, #38a169 100%)" 
                : "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
              borderRadius: "20px",
              color: "white",
              boxShadow: currentScore === currentTopic.questions.length
                ? "0 10px 30px rgba(72, 187, 120, 0.3)"
                : "0 10px 30px rgba(237, 137, 54, 0.3)"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                {currentScore === currentTopic.questions.length ? "🎉" : "📈"}
              </div>
              <h2 style={{ 
                color: "white",
                margin: "0 0 12px 0",
                fontSize: "2rem",
                fontWeight: "700"
              }}>
                Your Score: {currentScore} / {currentTopic.questions.length}
              </h2>
              <p style={{ 
                margin: "0 0 20px 0",
                fontSize: "1.1rem",
                opacity: "0.9",
                fontWeight: "500"
              }}>
                {currentScore === currentTopic.questions.length 
                  ? "Perfect! Excellent work! �" 
                  : `You scored ${Math.round((currentScore / currentTopic.questions.length) * 100)}%. Keep practicing! 💪`
                }
              </p>
              <button 
                onClick={() => resetQuiz(currentTopic.id)}
                style={{
                  padding: "12px 24px",
                  fontSize: "14px",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderRadius: "25px",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  backdropFilter: "blur(10px)"
                }}
              >
                🔄 Retake Quiz
              </button>
            </div>

            {currentTopic.questions.map((q, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "28px",
                  padding: "24px",
                  border: "none",
                  borderRadius: "16px",
                  backgroundColor: "white",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                  borderLeft: `6px solid ${currentAnswers[index] === q.correctAnswer ? "#48bb78" : "#f56565"}`,
                  transition: "all 0.3s ease"
                }}
              >
                <p style={{ 
                  marginBottom: "16px", 
                  fontSize: "16px", 
                  lineHeight: "1.6",
                  color: "#2d3748",
                  fontWeight: "500"
                }}>
                  <span style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontWeight: "700"
                  }}>
                    Q{index + 1}:
                  </span>{" "}
                  {q.question}
                </p>
                
                <div style={{ marginBottom: "12px", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                  <p style={{ margin: "0", fontSize: "14px", fontWeight: "600" }}>
                    <span style={{ color: "#4a5568" }}>Your Answer:</span>{" "}
                    <span style={{ 
                      color: currentAnswers[index] === q.correctAnswer ? "#48bb78" : "#f56565",
                      fontWeight: "700"
                    }}>
                      {currentAnswers[index] || "No answer"}
                      {currentAnswers[index] === q.correctAnswer ? " ✅" : " ❌"}
                    </span>
                  </p>
                </div>
                
                <div style={{ marginBottom: "12px", padding: "12px", backgroundColor: "#edf2f7", borderRadius: "8px" }}>
                  <p style={{ margin: "0", fontSize: "14px", fontWeight: "600" }}>
                    <span style={{ color: "#4a5568" }}>Correct Answer:</span>{" "}
                    <span style={{ color: "#48bb78", fontWeight: "700" }}>
                      {q.correctAnswer} ✅
                    </span>
                  </p>
                </div>
                
                <div style={{ 
                  padding: "16px", 
                  backgroundColor: "#f0f4f8", 
                  borderRadius: "12px",
                  borderLeft: "4px solid #667eea"
                }}>
                  <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.5", color: "#4a5568" }}>
                    <span style={{ fontWeight: "700", color: "#2d3748" }}>💡 Explanation:</span><br/>
                    {q.rationale}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      
      {/* CSS Animation for success message */}
      <style>{`
        @keyframes slideDown {
          0% {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
          }
          100% {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
