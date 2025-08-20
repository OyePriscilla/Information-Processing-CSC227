import { useState } from "react";
import { firebaseAuthService } from "../services/firebaseAuthService";
import { SecurityManager } from "../utils/securityManager";

export default function Login() {
  const [matricNumber, setMatricNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // <-- New state for toggling
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [securityWarning, setSecurityWarning] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {      
      // Simulate loading time for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      const { error: loginError } = await firebaseAuthService.login(matricNumber, password);
      
      if (loginError) {
        setError(loginError);
      } else {        
        // Wait a moment for Firebase to update auth state
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user is authenticated
        const { auth } = await import('../lib/firebase');
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          setError('Authentication state not updated. Please try refreshing the page.');
        } else {
          // Force a page refresh if auth state isn't updating properly
          setTimeout(() => {
            if (window.location.pathname === '/') {
              window.location.reload();
            }
          }, 2000);
        }
      }
    } catch (error: any) {
      setError(`Login failed: ${error.message}`);
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "48px",
        borderRadius: "20px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
        width: "100%",
        maxWidth: "400px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative background */}
        <div style={{
          position: "absolute",
          top: "-50%",
          right: "-50%",
          width: "200%",
          height: "200%",
          background: "linear-gradient(45deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)",
          borderRadius: "50%",
          zIndex: 0
        }} />
        
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ 
              fontSize: "48px", 
              marginBottom: "16px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "50%",
              width: "80px",
              height: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
              color: "white"
            }}>
              🎓
            </div>
            <h1 style={{
              margin: "0 0 8px 0",
              color: "#2d3748",
              fontSize: "28px",
              fontWeight: "700"
            }}>
              CSC 227: PRACTISE QUESTIONS WITH EXPLANATION
            </h1>
            <p style={{
              margin: "0",
              color: "#718096",
              fontSize: "16px"
            }}>
              Login to access your Dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "24px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#4a5568",
                fontSize: "14px",
                fontWeight: "600",
                letterSpacing: "0.5px"
              }}>
                MATRIC NUMBER
              </label>
              <input
                type="text"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
                placeholder="240816299"
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "16px",
                  color: "#2d3748",
                  backgroundColor: "#f8fafc",
                  transition: "all 0.3s ease",
                  outline: "none",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#667eea";
                  e.target.style.backgroundColor = "#ffffff";
                  e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.backgroundColor = "#f8fafc";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#4a5568",
                fontSize: "14px",
                fontWeight: "600",
                letterSpacing: "0.5px"
              }}>
                PASSWORD
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 44px 14px 16px", // add right padding for the icon
                    border: "2px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "16px",
                    color: "#2d3748",
                    backgroundColor: "#f8fafc",
                    transition: "all 0.3s ease",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#667eea";
                    e.target.style.backgroundColor = "#ffffff";
                    e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.backgroundColor = "#f8fafc";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "16px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "18px",
                    color: "#667eea"
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                backgroundColor: "#fed7d7",
                color: "#c53030",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "24px",
                fontSize: "14px",
                fontWeight: "500",
                border: "1px solid #feb2b2",
                textAlign: "center"
              }}>
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "16px",
                background: isLoading 
                  ? "linear-gradient(135deg, #a0aec0 0%, #718096 100%)"
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                transform: "translateY(0)",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                letterSpacing: "0.5px"
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
                }
              }}
            >
              {isLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{
                    width: "20px",
                    height: "20px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTop: "2px solid white",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    marginRight: "8px"
                  }} />
                  Logging in...
                </div>
              ) : (
                <>🚀 Login to Dashboard</>
              )}
            </button>
          </form>          
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}