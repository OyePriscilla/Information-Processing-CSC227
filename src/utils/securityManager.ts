// Security utilities for student authentication
export class SecurityManager {
  private static readonly MAX_LOGIN_ATTEMPTS = 3;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private static readonly SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

  // Generate device fingerprint
  static generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL(),
      webgl: this.getWebGLFingerprint(),
      timestamp: Date.now()
    };
    
    return btoa(JSON.stringify(fingerprint)).slice(0, 32);
  }

  private static getWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (!gl) return 'no-webgl';
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '';
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
      
      return `${vendor}-${renderer}`;
    } catch {
      return 'webgl-error';
    }
  }

  // Check if access is allowed based on time
  static isAccessTimeAllowed(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Allow access Monday-Friday, 8AM-6PM (adjust as needed)
    const isWeekday = day >= 1 && day <= 5;
    const isBusinessHours = hour >= 8 && hour < 18;
    
    // For development, always allow access
    // In production, uncomment the line below:
    // return isWeekday && isBusinessHours;
    return true;
  }

  // Check login attempts for a student
  static checkLoginAttempts(matricNumber: string): { allowed: boolean; remainingAttempts: number; lockoutTime?: number } {
    const key = `login_attempts_${matricNumber}`;
    const data = localStorage.getItem(key);
    
    if (!data) {
      return { allowed: true, remainingAttempts: this.MAX_LOGIN_ATTEMPTS };
    }
    
    const attempts = JSON.parse(data);
    const now = Date.now();
    
    // Check if lockout period has expired
    if (attempts.lockedUntil && now > attempts.lockedUntil) {
      localStorage.removeItem(key);
      return { allowed: true, remainingAttempts: this.MAX_LOGIN_ATTEMPTS };
    }
    
    // If still locked out
    if (attempts.lockedUntil && now <= attempts.lockedUntil) {
      return { 
        allowed: false, 
        remainingAttempts: 0, 
        lockoutTime: attempts.lockedUntil 
      };
    }
    
    // Check remaining attempts
    const remaining = this.MAX_LOGIN_ATTEMPTS - attempts.count;
    return { 
      allowed: remaining > 0, 
      remainingAttempts: Math.max(0, remaining) 
    };
  }

  // Record failed login attempt
  static recordFailedLogin(matricNumber: string): void {
    const key = `login_attempts_${matricNumber}`;
    const data = localStorage.getItem(key);
    const now = Date.now();
    
    let attempts = data ? JSON.parse(data) : { count: 0, firstAttempt: now };
    attempts.count++;
    attempts.lastAttempt = now;
    
    if (attempts.count >= this.MAX_LOGIN_ATTEMPTS) {
      attempts.lockedUntil = now + this.LOCKOUT_DURATION;
    }
    
    localStorage.setItem(key, JSON.stringify(attempts));
  }

  // Clear login attempts after successful login
  static clearLoginAttempts(matricNumber: string): void {
    const key = `login_attempts_${matricNumber}`;
    localStorage.removeItem(key);
  }

  // Check for suspicious activity
  static detectSuspiciousActivity(matricNumber: string, deviceFingerprint: string): { 
    suspicious: boolean; 
    reason?: string;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const sessionKey = `device_${matricNumber}`;
    const lastDevice = localStorage.getItem(sessionKey);
    
    // First login from this device
    if (!lastDevice) {
      localStorage.setItem(sessionKey, JSON.stringify({
        fingerprint: deviceFingerprint,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        loginCount: 1
      }));
      return { suspicious: false, riskLevel: 'low' };
    }
    
    const deviceData = JSON.parse(lastDevice);
    const now = Date.now();
    
    // Different device fingerprint
    if (deviceData.fingerprint !== deviceFingerprint) {
      // Update with new device
      localStorage.setItem(sessionKey, JSON.stringify({
        fingerprint: deviceFingerprint,
        firstSeen: deviceData.firstSeen,
        lastSeen: now,
        loginCount: deviceData.loginCount + 1,
        previousDevice: deviceData.fingerprint
      }));
      
      return {
        suspicious: true,
        reason: 'Login from new device detected',
        riskLevel: 'medium'
      };
    }
    
    // Multiple rapid logins (possible sharing)
    const timeSinceLastLogin = now - deviceData.lastSeen;
    const isRapidLogin = timeSinceLastLogin < 10 * 60 * 1000; // 10 minutes
    const hasHighLoginCount = deviceData.loginCount > 10;
    
    // Update device data
    deviceData.lastSeen = now;
    deviceData.loginCount++;
    localStorage.setItem(sessionKey, JSON.stringify(deviceData));
    
    if (isRapidLogin && hasHighLoginCount) {
      return {
        suspicious: true,
        reason: 'Unusually frequent login activity',
        riskLevel: 'high'
      };
    }
    
    return { suspicious: false, riskLevel: 'low' };
  }

  // Format lockout time remaining
  static formatLockoutTime(lockoutTime: number): string {
    const remaining = Math.ceil((lockoutTime - Date.now()) / 1000 / 60);
    return `${remaining} minute${remaining !== 1 ? 's' : ''}`;
  }

  // Validate session
  static isSessionValid(): boolean {
    const sessionStart = localStorage.getItem('session_start');
    if (!sessionStart) return false;
    
    const elapsed = Date.now() - parseInt(sessionStart);
    return elapsed < this.SESSION_TIMEOUT;
  }

  // Start new session
  static startSession(): void {
    localStorage.setItem('session_start', Date.now().toString());
  }

  // End session
  static endSession(): void {
    localStorage.removeItem('session_start');
  }
}
