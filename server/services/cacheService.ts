import NodeCache from 'node-cache';

class CacheService {
  private cache: NodeCache;
  private apiCallCounts: Map<string, number>;
  private lastReset: Date;

  constructor() {
    // 建立快取實例，設定預設TTL為1小時
    this.cache = new NodeCache({ 
      stdTTL: 3600, // 1小時
      checkperiod: 600, // 每10分鐘檢查過期項目
      useClones: false // 提高性能
    });
    
    this.apiCallCounts = new Map();
    this.lastReset = new Date();
    
    // 每小時重置API調用計數
    setInterval(() => {
      this.resetApiCounts();
    }, 60 * 60 * 1000);
  }

  // 獲取快取數據
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  // 設定快取數據
  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl);
  }

  // 刪除快取數據
  del(key: string): number {
    return this.cache.del(key);
  }

  // 清空所有快取
  flushAll(): void {
    this.cache.flushAll();
  }

  // 獲取快取統計
  getStats() {
    return this.cache.getStats();
  }

  // API調用限制管理
  incrementApiCall(endpoint: string): boolean {
    const current = this.apiCallCounts.get(endpoint) || 0;
    const limit = this.getApiLimit(endpoint);
    
    if (current >= limit) {
      console.warn(`API limit reached for ${endpoint}: ${current}/${limit}`);
      return false;
    }
    
    this.apiCallCounts.set(endpoint, current + 1);
    return true;
  }

  // 獲取API調用次數
  getApiCallCount(endpoint: string): number {
    return this.apiCallCounts.get(endpoint) || 0;
  }

  // 重置API調用計數
  private resetApiCounts(): void {
    this.apiCallCounts.clear();
    this.lastReset = new Date();
    console.log('API call counts reset at:', this.lastReset.toISOString());
  }

  // 獲取API限制
  private getApiLimit(endpoint: string): number {
    const limits: { [key: string]: number } = {
      'alpha_vantage': 500, // Alpha Vantage每日限制
      'news_api': 100, // NewsAPI每日限制（免費版）
      'financial_modeling_prep': 250, // FMP每日限制
      'openai': 50, // OpenAI每小時限制
      'google_news': 1000, // Google News無官方限制，自設限制
      'default': 100
    };
    
    return limits[endpoint] || limits['default'];
  }

  // 智能快取 - 根據數據類型設定不同的TTL
  setWithSmartTTL<T>(key: string, value: T, dataType: 'news' | 'earnings' | 'ai_summary' | 'market_data' | 'economic_data'): boolean {
    const ttlSettings = {
      'news': 30 * 60, // 30分鐘
      'earnings': 4 * 60 * 60, // 4小時
      'ai_summary': 2 * 60 * 60, // 2小時  
      'market_data': 15 * 60, // 15分鐘
      'economic_data': 12 * 60 * 60 // 12小時
    };
    
    const ttl = ttlSettings[dataType] || 3600;
    return this.cache.set(key, value, ttl);
  }

  // 獲取或設置快取（常用模式）
  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttl?: number,
    apiEndpoint?: string
  ): Promise<T> {
    // 檢查快取
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      console.log(`Cache hit for key: ${key}`);
      return cached;
    }

    // 檢查API限制
    if (apiEndpoint && !this.incrementApiCall(apiEndpoint)) {
      throw new Error(`API rate limit exceeded for ${apiEndpoint}`);
    }

    console.log(`Cache miss for key: ${key}, fetching data...`);
    
    try {
      const data = await fetchFunction();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error(`Error fetching data for key ${key}:`, error);
      throw error;
    }
  }

  // 預載快取
  async preloadCache(): Promise<void> {
    console.log('Starting cache preload...');
    
    const preloadTasks = [
      // 可以在這裡添加需要預載的數據
      // 例如：熱門股票數據、今日財報等
    ];

    await Promise.allSettled(preloadTasks);
    console.log('Cache preload completed');
  }

  // 獲取快取鍵的模式匹配
  getKeys(pattern?: string): string[] {
    const keys = this.cache.keys();
    if (!pattern) return keys;
    
    const regex = new RegExp(pattern);
    return keys.filter(key => regex.test(key));
  }

  // 批量刪除快取
  deleteByPattern(pattern: string): number {
    const keys = this.getKeys(pattern);
    return this.cache.del(keys);
  }

  // 快取健康檢查
  healthCheck(): {
    status: 'healthy' | 'warning' | 'error';
    stats: any;
    apiCounts: { [key: string]: number };
    lastReset: string;
  } {
    const stats = this.getStats();
    const hitRate = stats.hits / (stats.hits + stats.misses) || 0;
    
    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    
    if (hitRate < 0.5) {
      status = 'warning';
    }
    
    if (stats.keys > 10000) { // 如果快取項目過多
      status = 'error';
    }

    return {
      status,
      stats: {
        ...stats,
        hitRate: Math.round(hitRate * 100) + '%'
      },
      apiCounts: Object.fromEntries(this.apiCallCounts),
      lastReset: this.lastReset.toISOString()
    };
  }
}

// 建立單例實例
export const cacheService = new CacheService();

// 建立快取鍵輔助函數
export const CacheKeys = {
  earnings: (days: number) => `earnings:upcoming:${days}`,
  economicEvents: (days: number) => `economic:events:${days}`,
  news: (category?: string, limit?: number) => `news:${category || 'all'}:${limit || 20}`,
  marketSentiment: () => 'market:sentiment',
  aiSummary: (date: string) => `ai:summary:${date}`,
  top5Summary: (date: string) => `ai:top5:${date}`,
  stockData: (symbol: string) => `stock:${symbol}`,
  marketData: (market: string) => `market:${market}`,
  watchlistNews: (symbols: string[], limit: number) => `watchlist:news:${symbols.join(',')}:${limit}`
};

export default cacheService;