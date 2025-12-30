export class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.lastCleanup = Date.now();
  }

  // 辅助函数：自动清理过期的 IP 记录
  _cleanup() {
    const now = Date.now();
    // 每小时清理一次全局 Map
    if (now - this.lastCleanup < 3600000) return;
    
    for (const [ip, timestamps] of this.requests.entries()) {
      // 如果该 IP 超过一小时没有活动，直接删除
      if (timestamps.length === 0 || now - timestamps[timestamps.length - 1] > 3600000) {
        this.requests.delete(ip);
      }
    }
    this.lastCleanup = now;
  }

  isAllowed(ip, maxRequests = 10, windowMs = 60000) {
    this._cleanup();
    
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(ip)) {
      this.requests.set(ip, []);
    }
    
    let userRequests = this.requests.get(ip);
    
    // 过滤掉当前时间窗口之外的请求
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (userRequests.length >= maxRequests) {
      return false;
    }
    
    userRequests.push(now);
    this.requests.set(ip, userRequests);
    
    return true;
  }

  getRemainingRequests(ip, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(ip)) return maxRequests;
    
    const userRequests = this.requests.get(ip).filter(timestamp => timestamp > windowStart);
    return Math.max(0, maxRequests - userRequests.length);
  }
}