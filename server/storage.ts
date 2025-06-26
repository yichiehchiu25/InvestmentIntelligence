import { 
  economicIndicators, 
  calendarEvents, 
  newsArticles, 
  aiSummaries, 
  systemConfig,
  type EconomicIndicator,
  type InsertEconomicIndicator,
  type CalendarEvent,
  type InsertCalendarEvent,
  type NewsArticle,
  type InsertNewsArticle,
  type AiSummary,
  type InsertAiSummary,
  type SystemConfig,
  type InsertSystemConfig
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
}

export class MemStorage implements IStorage {
  private economicIndicators: Map<number, EconomicIndicator> = new Map();
  private calendarEvents: Map<number, CalendarEvent> = new Map();
  private newsArticles: Map<number, NewsArticle> = new Map();
  private aiSummaries: Map<number, AiSummary> = new Map();
  private systemConfig: Map<string, SystemConfig> = new Map();
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
}

export const storage = new MemStorage();
