export class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  isAllowed(ip, maxRequests = 10, windowMs = 60000) { // 每分钟最多10次请求
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(ip)) {
      this.requests.set(ip, []);
    }
    
    const userRequests = this.requests.get(ip);
    
    // 清理过期请求
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(ip, validRequests);
    
    return true;
  }

  getRemainingRequests(ip, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(ip)) {
      return maxRequests;
    }
    
    const userRequests = this.requests.get(ip);
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, maxRequests - validRequests.length);
  }
}