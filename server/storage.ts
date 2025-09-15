import { 
  economicIndicators, 
  calendarEvents, 
  newsArticles, 
  aiSummaries, 
  systemConfig,
  taiwanStocks,
  usStockPortfolio,
  stockWatchlist,
  type EconomicIndicator,
  type InsertEconomicIndicator,
  type CalendarEvent,
  type InsertCalendarEvent,
  type NewsArticle,
  type InsertNewsArticle,
  type AiSummary,
  type InsertAiSummary,
  type SystemConfig,
  type InsertSystemConfig,
  type TaiWanStock,
  type InsertTaiWanStock,
  type UsStockPortfolio,
  type InsertUsStockPortfolio,
  type StockWatchlist,
  type InsertStockWatchlist
} from "@shared/schema";

export interface IStorage {
  // Economic Indicators
  getEconomicIndicators(): Promise<EconomicIndicator[]>;
  createEconomicIndicator(indicator: InsertEconomicIndicator): Promise<EconomicIndicator>;
  updateEconomicIndicator(id: number, indicator: Partial<InsertEconomicIndicator>): Promise<EconomicIndicator>;
  
  // Calendar Events
  getCalendarEvents(): Promise<CalendarEvent[]>;
  getCalendarEventsByDate(date: string): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  
  // News Articles
  getNewsArticles(limit?: number, category?: string): Promise<NewsArticle[]>;
  createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle>;
  getNewsArticlesByDateRange(startDate: Date, endDate: Date): Promise<NewsArticle[]>;
  
  // AI Summaries
  getAiSummaries(limit?: number): Promise<AiSummary[]>;
  getAiSummaryByDate(date: string, category?: string): Promise<AiSummary | undefined>;
  createAiSummary(summary: InsertAiSummary): Promise<AiSummary>;
  
  // System Configuration
  getSystemConfig(key: string): Promise<SystemConfig | undefined>;
  setSystemConfig(config: InsertSystemConfig): Promise<SystemConfig>;
  getAllSystemConfig(): Promise<SystemConfig[]>;
  
  // Taiwan Stocks
  getTaiwanStocks(): Promise<TaiWanStock[]>;
  createTaiwanStock(stock: InsertTaiWanStock): Promise<TaiWanStock>;
  updateTaiwanStock(symbol: string, stock: Partial<InsertTaiWanStock>): Promise<TaiWanStock>;
  getTaiwanStockBySymbol(symbol: string): Promise<TaiWanStock | undefined>;
  
  // US Stock Portfolio
  getUsStockPortfolio(): Promise<UsStockPortfolio[]>;
  createUsStockPortfolio(stock: InsertUsStockPortfolio): Promise<UsStockPortfolio>;
  updateUsStockPortfolio(symbol: string, stock: Partial<InsertUsStockPortfolio>): Promise<UsStockPortfolio>;
  getUsStockBySymbol(symbol: string): Promise<UsStockPortfolio | undefined>;
  
  // Stock Watchlist
  getStockWatchlist(): Promise<StockWatchlist[]>;
  addToWatchlist(stock: InsertStockWatchlist): Promise<StockWatchlist>;
  removeFromWatchlist(symbol: string): Promise<boolean>;
  updateWatchlistStock(symbol: string, stock: Partial<InsertStockWatchlist>): Promise<StockWatchlist>;
}

export class MemStorage implements IStorage {
  private economicIndicators: Map<number, EconomicIndicator> = new Map();
  private calendarEvents: Map<number, CalendarEvent> = new Map();
  private newsArticles: Map<number, NewsArticle> = new Map();
  private aiSummaries: Map<number, AiSummary> = new Map();
  private systemConfig: Map<string, SystemConfig> = new Map();
  private taiwanStocks: Map<string, TaiWanStock> = new Map();
  private usStockPortfolio: Map<string, UsStockPortfolio> = new Map();
  private stockWatchlist: Map<string, StockWatchlist> = new Map();
  private currentId = 1;

  // Economic Indicators
  async getEconomicIndicators(): Promise<EconomicIndicator[]> {
    return Array.from(this.economicIndicators.values());
  }

  async createEconomicIndicator(indicator: InsertEconomicIndicator): Promise<EconomicIndicator> {
    const id = this.currentId++;
    const newIndicator: EconomicIndicator = { 
      ...indicator, 
      id, 
      change: indicator.change ?? null,
      updatedAt: new Date() 
    };
    this.economicIndicators.set(id, newIndicator);
    return newIndicator;
  }

  async updateEconomicIndicator(id: number, indicator: Partial<InsertEconomicIndicator>): Promise<EconomicIndicator> {
    const existing = this.economicIndicators.get(id);
    if (!existing) throw new Error("Economic indicator not found");
    
    const updated: EconomicIndicator = { 
      ...existing, 
      ...indicator, 
      updatedAt: new Date() 
    };
    this.economicIndicators.set(id, updated);
    return updated;
  }

  // Calendar Events
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values());
  }

  async getCalendarEventsByDate(date: string): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values()).filter(event => event.date === date);
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = this.currentId++;
    const newEvent: CalendarEvent = { 
      ...event, 
      id, 
      description: event.description ?? null,
      createdAt: new Date() 
    };
    this.calendarEvents.set(id, newEvent);
    return newEvent;
  }

  // News Articles
  async getNewsArticles(limit?: number, category?: string): Promise<NewsArticle[]> {
    let articles = Array.from(this.newsArticles.values());
    
    if (category) {
      articles = articles.filter(article => article.category === category);
    }
    
    articles = articles.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    if (limit) {
      articles = articles.slice(0, limit);
    }
    
    return articles;
  }

  async createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle> {
    const id = this.currentId++;
    const newArticle: NewsArticle = { 
      ...article, 
      id, 
      summary: article.summary ?? null,
      content: article.content ?? null,
      createdAt: new Date() 
    };
    this.newsArticles.set(id, newArticle);
    return newArticle;
  }

  async getNewsArticlesByDateRange(startDate: Date, endDate: Date): Promise<NewsArticle[]> {
    return Array.from(this.newsArticles.values()).filter(article => 
      article.timestamp >= startDate && article.timestamp <= endDate
    );
  }

  // AI Summaries
  async getAiSummaries(limit?: number): Promise<AiSummary[]> {
    let summaries = Array.from(this.aiSummaries.values());
    summaries = summaries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (limit) {
      summaries = summaries.slice(0, limit);
    }
    
    return summaries;
  }

  async getAiSummaryByDate(date: string, category?: string): Promise<AiSummary | undefined> {
    return Array.from(this.aiSummaries.values()).find(summary => 
      summary.date === date && (!category || summary.category === category)
    );
  }

  async createAiSummary(summary: InsertAiSummary): Promise<AiSummary> {
    const id = this.currentId++;
    const newSummary: AiSummary = { 
      ...summary, 
      id, 
      keywords: summary.keywords ? (Array.isArray(summary.keywords) ? summary.keywords : null) : null,
      sentiment: summary.sentiment ?? null,
      createdAt: new Date() 
    };
    this.aiSummaries.set(id, newSummary);
    return newSummary;
  }

  // System Configuration
  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    return this.systemConfig.get(key);
  }

  async setSystemConfig(config: InsertSystemConfig): Promise<SystemConfig> {
    const existing = this.systemConfig.get(config.key);
    const newConfig: SystemConfig = {
      id: existing?.id || this.currentId++,
      ...config,
      updatedAt: new Date()
    };
    this.systemConfig.set(config.key, newConfig);
    return newConfig;
  }

  async getAllSystemConfig(): Promise<SystemConfig[]> {
    return Array.from(this.systemConfig.values());
  }

  // Taiwan Stocks
  async getTaiwanStocks(): Promise<TaiWanStock[]> {
    return Array.from(this.taiwanStocks.values());
  }

  async createTaiwanStock(stock: InsertTaiWanStock): Promise<TaiWanStock> {
    const newStock: TaiWanStock = {
      ...stock,
      id: this.currentId++,
      price: stock.price ?? null,
      change: stock.change ?? null,
      changePercent: stock.changePercent ?? null,
      volume: stock.volume ?? null,
      marketCap: stock.marketCap ?? null,
      isActive: stock.isActive ?? true,
      updatedAt: new Date()
    };
    this.taiwanStocks.set(stock.symbol, newStock);
    return newStock;
  }

  async updateTaiwanStock(symbol: string, stock: Partial<InsertTaiWanStock>): Promise<TaiWanStock> {
    const existing = this.taiwanStocks.get(symbol);
    if (!existing) throw new Error("Taiwan stock not found");
    
    const updated: TaiWanStock = {
      ...existing,
      ...stock,
      updatedAt: new Date()
    };
    this.taiwanStocks.set(symbol, updated);
    return updated;
  }

  async getTaiwanStockBySymbol(symbol: string): Promise<TaiWanStock | undefined> {
    return this.taiwanStocks.get(symbol);
  }

  // US Stock Portfolio
  async getUsStockPortfolio(): Promise<UsStockPortfolio[]> {
    return Array.from(this.usStockPortfolio.values());
  }

  async createUsStockPortfolio(stock: InsertUsStockPortfolio): Promise<UsStockPortfolio> {
    const newStock: UsStockPortfolio = {
      ...stock,
      id: this.currentId++,
      price: stock.price ?? null,
      change: stock.change ?? null,
      changePercent: stock.changePercent ?? null,
      volume: stock.volume ?? null,
      weight: stock.weight ?? null,
      avgVolume: stock.avgVolume ?? null,
      isActive: stock.isActive ?? true,
      updatedAt: new Date()
    };
    this.usStockPortfolio.set(stock.symbol, newStock);
    return newStock;
  }

  async updateUsStockPortfolio(symbol: string, stock: Partial<InsertUsStockPortfolio>): Promise<UsStockPortfolio> {
    const existing = this.usStockPortfolio.get(symbol);
    if (!existing) throw new Error("US stock not found");
    
    const updated: UsStockPortfolio = {
      ...existing,
      ...stock,
      updatedAt: new Date()
    };
    this.usStockPortfolio.set(symbol, updated);
    return updated;
  }

  async getUsStockBySymbol(symbol: string): Promise<UsStockPortfolio | undefined> {
    return this.usStockPortfolio.get(symbol);
  }

  // Stock Watchlist
  async getStockWatchlist(): Promise<StockWatchlist[]> {
    return Array.from(this.stockWatchlist.values());
  }

  async addToWatchlist(stock: InsertStockWatchlist): Promise<StockWatchlist> {
    const newStock: StockWatchlist = {
      ...stock,
      id: this.currentId++,
      price: stock.price ?? null,
      change: stock.change ?? null,
      changePercent: stock.changePercent ?? null,
      volume: stock.volume ?? null,
      addedAt: new Date(),
      updatedAt: new Date()
    };
    this.stockWatchlist.set(stock.symbol, newStock);
    return newStock;
  }

  async removeFromWatchlist(symbol: string): Promise<boolean> {
    return this.stockWatchlist.delete(symbol);
  }

  async updateWatchlistStock(symbol: string, stock: Partial<InsertStockWatchlist>): Promise<StockWatchlist> {
    const existing = this.stockWatchlist.get(symbol);
    if (!existing) throw new Error("Stock not found in watchlist");
    
    const updated: StockWatchlist = {
      ...existing,
      ...stock,
      updatedAt: new Date()
    };
    this.stockWatchlist.set(symbol, updated);
    return updated;
  }
}

export const storage = new MemStorage();
