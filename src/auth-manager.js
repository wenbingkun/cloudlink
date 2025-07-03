// 认证管理模块
export class AuthManager {
  constructor() {
    this.tokenKey = 'cloudlink_auth_token';
    this.tokenExpiry = 'cloudlink_token_expiry';
    this.sessionDuration = 24 * 60 * 60 * 1000; // 24小时
  }

  // 生成认证token
  generateToken(password) {
    const timestamp = Date.now();
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const randomString = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // 简单的token生成（生产环境应该使用更安全的方法）
    const payload = {
      pwd: this.hashPassword(password),
      timestamp: timestamp,
      random: randomString
    };
    
    return btoa(JSON.stringify(payload));
  }

  // 验证token
  verifyToken(token, expectedPassword) {
    try {
      const payload = JSON.parse(atob(token));
      const now = Date.now();
      
      // 检查token是否过期
      if (now - payload.timestamp > this.sessionDuration) {
        return false;
      }
      
      // 验证密码hash
      return payload.pwd === this.hashPassword(expectedPassword);
    } catch (error) {
      return false;
    }
  }

  // 简单的密码hash（使用浏览器内置的crypto API）
  hashPassword(password) {
    // 简单的hash，生产环境应该使用更安全的方法
    let hash = 0;
    const salt = 'cloudlink_salt_2024';
    const input = password + salt;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString(36);
  }

  // 保存认证状态到localStorage
  saveAuth(password) {
    const token = this.generateToken(password);
    const expiry = Date.now() + this.sessionDuration;
    
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.tokenExpiry, expiry.toString());
    
    return token;
  }

  // 检查本地认证状态
  checkLocalAuth(expectedPassword) {
    const token = localStorage.getItem(this.tokenKey);
    const expiry = localStorage.getItem(this.tokenExpiry);
    
    if (!token || !expiry) {
      return false;
    }
    
    // 检查是否过期
    if (Date.now() > parseInt(expiry)) {
      this.clearAuth();
      return false;
    }
    
    // 验证token
    if (this.verifyToken(token, expectedPassword)) {
      return token;
    } else {
      this.clearAuth();
      return false;
    }
  }

  // 清除认证状态
  clearAuth() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.tokenExpiry);
  }

  // 获取当前token
  getCurrentToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // 检查是否已认证
  isAuthenticated() {
    const expiry = localStorage.getItem(this.tokenExpiry);
    return expiry && Date.now() < parseInt(expiry);
  }

  // 刷新token（延长有效期）
  refreshToken(password) {
    if (this.checkLocalAuth(password)) {
      return this.saveAuth(password);
    }
    return null;
  }
}

// 后端认证验证器
export class ServerAuthManager {
  constructor() {
    this.sessionDuration = 24 * 60 * 60 * 1000; // 24小时
  }

  // 验证认证token
  verifyAuthToken(token, expectedPassword) {
    try {
      const payload = JSON.parse(atob(token));
      const now = Date.now();
      
      // 检查token是否过期
      if (now - payload.timestamp > this.sessionDuration) {
        return { valid: false, reason: 'expired' };
      }
      
      // 验证密码hash
      const expectedHash = this.hashPassword(expectedPassword);
      if (payload.pwd !== expectedHash) {
        return { valid: false, reason: 'invalid' };
      }
      
      return { valid: true, timestamp: payload.timestamp };
    } catch (error) {
      return { valid: false, reason: 'malformed' };
    }
  }

  // 与前端相同的hash方法
  hashPassword(password) {
    let hash = 0;
    const salt = 'cloudlink_salt_2024';
    const input = password + salt;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return hash.toString(36);
  }

  // 生成新token（服务端）
  generateToken(password) {
    const timestamp = Date.now();
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const randomString = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    
    const payload = {
      pwd: this.hashPassword(password),
      timestamp: timestamp,
      random: randomString
    };
    
    return btoa(JSON.stringify(payload));
  }
}