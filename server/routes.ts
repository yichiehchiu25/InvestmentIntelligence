import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { newsService } from "./services/newsService";
import { economicDataService } from "./services/economicDataService";
import { aiService } from "./services/aiService";
import { calendarService } from "./services/calendarService";
import { schedulerService } from "./services/schedulerService";
import { fileStorageService } from "./services/fileStorageService";
import { yahooFinanceService } from "./services/yahooFinanceService";
import { insertNewsArticleSchema, insertCalendarEventSchema, insertSystemConfigSchema } from "@shared/schema";
import { taiwanStockService } from "./services/taiwanStockService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  await calendarService.initializeCalendarEvents();
  schedulerService.start();

  // Economic Indicators
  app.get("/api/economic-indicators", async (req, res) => {
    try {
      const indicators = await economicDataService.getEconomicIndicators();
      res.json(indicators);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch economic indicators" });
    }
  });

  app.post("/api/economic-indicators/refresh", async (req, res) => {
    try {
      await economicDataService.fetchEconomicData();
      const indicators = await economicDataService.getEconomicIndicators();
      res.json({ message: "Economic data refreshed successfully", data: indicators });
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh economic data" });
    }
  });

  // Yahoo Finance API Routes
  app.get("/api/yahoo-finance/taiwan-market", async (req, res) => {
    try {
      const taiwanData = await yahooFinanceService.fetchTaiwanMarketData();
      if (!taiwanData) {
        return res.status(500).json({ error: "Failed to fetch Taiwan market data" });
      }
      res.json(taiwanData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Taiwan market data" });
    }
  });

  app.get("/api/yahoo-finance/symbol/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const data = await yahooFinanceService.fetchYahooFinanceData(symbol);
      if (!data) {
        return res.status(404).json({ error: "Symbol not found or failed to fetch data" });
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch symbol data" });
    }
  });

  app.post("/api/yahoo-finance/multiple-symbols", async (req, res) => {
    try {
      const { symbols } = req.body;
      if (!symbols || !Array.isArray(symbols)) {
        return res.status(400).json({ error: "Symbols array is required" });
      }
      
      const data = await yahooFinanceService.fetchMultipleSymbols(symbols);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch multiple symbols data" });
    }
  });

  app.get("/api/yahoo-finance/popular-taiwan-stocks", async (req, res) => {
    try {
      const symbols = yahooFinanceService.getPopularTaiwanStocks();
      const data = await yahooFinanceService.fetchMultipleSymbols(symbols);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch popular Taiwan stocks" });
    }
  });

  app.get("/api/yahoo-finance/taiwan-indices", async (req, res) => {
    try {
      const symbols = yahooFinanceService.getTaiwanIndices();
      const data = await yahooFinanceService.fetchMultipleSymbols(symbols);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Taiwan indices" });
    }
  });

  // Enhanced Taiwan Stock Service API Routes
  app.get("/api/taiwan-stocks/market-status", async (req, res) => {
    try {
      const status = taiwanStockService.getTaiwanMarketStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get market status" });
    }
  });

  app.get("/api/taiwan-stocks/stock/:stockId", async (req, res) => {
    try {
      const { stockId } = req.params;
      const data = await taiwanStockService.getStockData(stockId);
      if (!data) {
        return res.status(404).json({ error: "Stock data not found" });
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock data" });
    }
  });

  app.post("/api/taiwan-stocks/multiple", async (req, res) => {
    try {
      const { stockIds } = req.body;
      if (!stockIds || !Array.isArray(stockIds)) {
        return res.status(400).json({ error: "stockIds array is required" });
      }
      const data = await taiwanStockService.getMultipleStocks(stockIds);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch multiple stocks data" });
    }
  });

  app.get("/api/taiwan-stocks/popular", async (req, res) => {
    try {
      const stockIds = taiwanStockService.getPopularTaiwanStocks();
      const data = await taiwanStockService.getMultipleStocks(stockIds);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch popular Taiwan stocks" });
    }
  });

  // News Keywords Management API Routes
  app.get("/api/news/keywords", async (req, res) => {
    try {
      const savedKeywords = await fileStorageService.readFile('news-keywords.json');
      if (savedKeywords) {
        res.json(JSON.parse(savedKeywords));
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch keywords" });
    }
  });

  app.post("/api/news/keywords", async (req, res) => {
    try {
      const { keywords } = req.body;
      if (!keywords || !Array.isArray(keywords)) {
        return res.status(400).json({ error: "keywords array is required" });
      }
      
      await fileStorageService.saveFile('news-keywords.json', JSON.stringify(keywords, null, 2));
      res.json({ message: "Keywords saved successfully", keywords });
    } catch (error) {
      res.status(500).json({ error: "Failed to save keywords" });
    }
  });

  app.post("/api/news/scrape-with-keywords", async (req, res) => {
    try {
      const { keywords, categories } = req.body;
      
      // Use custom keywords if provided, otherwise use defaults
      if (keywords && Array.isArray(keywords)) {
        // Extract unique keywords for search
        const activeKeywords = keywords
          .filter((k: any) => k.isActive)
          .map((k: any) => k.keyword);
        
        if (activeKeywords.length > 0) {
          await newsService.searchGoogleNews(activeKeywords, 20);
        }
      }
      
      // Also run regular news scraping
      await newsService.scrapeNews();
      
      const news = await newsService.getNews(50);
      res.json({ message: "News scraping with keywords completed", articles: news.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to scrape news with keywords" });
    }
  });

  // Calendar Events
  app.get("/api/calendar-events", async (req, res) => {
    try {
      const { date } = req.query;
      if (date) {
        const events = await calendarService.getEventsByDate(date as string);
        res.json(events);
      } else {
        const events = await calendarService.getCalendarEvents();
        res.json(events);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });

  app.get("/api/calendar-events/upcoming", async (req, res) => {
    try {
      const { days = 7 } = req.query;
      const events = await calendarService.getUpcomingEvents(Number(days));
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upcoming events" });
    }
  });

  app.post("/api/calendar-events", async (req, res) => {
    try {
      const validatedEvent = insertCalendarEventSchema.parse(req.body);
      const event = await calendarService.addCalendarEvent(validatedEvent);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid event data" });
    }
  });

  // News Articles
  app.get("/api/news", async (req, res) => {
    try {
      const { limit, category } = req.query;
      const news = await newsService.getNews(
        limit ? Number(limit) : undefined,
        category as string
      );
      res.json(news);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  app.post("/api/news/scrape", async (req, res) => {
    try {
      await newsService.scrapeNews();
      res.json({ message: "News scraping completed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to scrape news" });
    }
  });

  app.post("/api/news/search", async (req, res) => {
    try {
      const { keywords, limit = 20 } = req.body;
      if (!keywords || !Array.isArray(keywords)) {
        return res.status(400).json({ error: "Keywords array is required" });
      }
      
      await newsService.searchGoogleNews(keywords, limit);
      res.json({ message: "News search completed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to search news" });
    }
  });

  // AI Summaries
  app.get("/api/ai-summaries", async (req, res) => {
    try {
      const { limit, date, category } = req.query;
      
      if (date) {
        const summary = await storage.getAiSummaryByDate(date as string, category as string);
        res.json(summary);
      } else {
        const summaries = await storage.getAiSummaries(limit ? Number(limit) : undefined);
        res.json(summaries);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch AI summaries" });
    }
  });

  app.post("/api/ai-summaries/generate", async (req, res) => {
    try {
      const { date } = req.body;
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      await aiService.generateDailySummary(targetDate);
      res.json({ message: "AI summary generation completed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate AI summary" });
    }
  });

  app.get("/api/ai-summaries/today", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const summaries = await storage.getAiSummaries();
      const todaySummaries = summaries.filter(s => s.date === today);
      
      if (todaySummaries.length > 0) {
        // Return the most comprehensive summary for today
        const mainSummary = todaySummaries.find(s => s.category === "總體經濟") || todaySummaries[0];
        res.json(mainSummary);
      } else {
        res.json({ 
          content: "今日AI分析摘要正在生成中，請稍後查看。",
          newsCount: 0,
          date: today 
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch today's AI summary" });
    }
  });

  // System Configuration
  app.get("/api/config", async (req, res) => {
    try {
      const config = await storage.getAllSystemConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system configuration" });
    }
  });

  app.get("/api/config/:key", async (req, res) => {
    try {
      const config = await storage.getSystemConfig(req.params.key);
      if (!config) {
        return res.status(404).json({ error: "Configuration not found" });
      }
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  app.post("/api/config", async (req, res) => {
    try {
      const validatedConfig = insertSystemConfigSchema.parse(req.body);
      const config = await storage.setSystemConfig(validatedConfig);
      res.json(config);
    } catch (error) {
      res.status(400).json({ error: "Invalid configuration data" });
    }
  });

  // AI Service Test
  app.get("/api/ai/test-connection", async (req, res) => {
    try {
      const isConnected = await aiService.testConnection();
      res.json({ 
        connected: isConnected,
        status: isConnected ? "AI服務連接正常" : "AI服務連接失敗" 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to test AI connection" });
    }
  });

  // Manual Scheduler Triggers
  app.post("/api/scheduler/trigger-news", async (req, res) => {
    try {
      await schedulerService.triggerNewsCollection();
      res.json({ message: "News collection triggered successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to trigger news collection" });
    }
  });

  app.post("/api/scheduler/trigger-economic", async (req, res) => {
    try {
      await schedulerService.triggerEconomicDataUpdate();
      res.json({ message: "Economic data update triggered successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to trigger economic data update" });
    }
  });

  app.post("/api/scheduler/trigger-ai", async (req, res) => {
    try {
      await schedulerService.triggerAISummaryGeneration();
      res.json({ message: "AI summary generation triggered successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to trigger AI summary generation" });
    }
  });

  app.get("/api/scheduler/status", async (req, res) => {
    try {
      const status = schedulerService.getJobStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get scheduler status" });
    }
  });

  // File Storage API Routes for Streamlit Integration
  app.get("/api/storage/summaries", async (req, res) => {
    try {
      const dates = await fileStorageService.getAvailableDates();
      res.json({ availableDates: dates });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch available summary dates" });
    }
  });

  app.get("/api/storage/summaries/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const summaries = await fileStorageService.getSummariesForDate(date);
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch summaries for date" });
    }
  });

  app.get("/api/storage/summaries/:date/:category", async (req, res) => {
    try {
      const { date, category } = req.params;
      const summary = await fileStorageService.readDailySummary(date, category);
      
      if (!summary) {
        return res.status(404).json({ error: "Summary not found" });
      }
      
      res.json({ content: summary, date, category });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch summary" });
    }
  });

  app.post("/api/storage/export-streamlit", async (req, res) => {
    try {
      const exportPath = await fileStorageService.exportForStreamlit();
      await fileStorageService.createStreamlitIndex();
      
      res.json({ 
        message: "Streamlit export completed successfully",
        exportPath: exportPath,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to export for Streamlit" });
    }
  });

  app.post("/api/storage/cleanup", async (req, res) => {
    try {
      const { daysToKeep = 30 } = req.body;
      await fileStorageService.cleanupOldFiles(daysToKeep);
      
      res.json({ 
        message: `Cleanup completed, kept files from last ${daysToKeep} days`
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to cleanup old files" });
    }
  });

  app.get("/api/storage/index", async (req, res) => {
    try {
      await fileStorageService.createStreamlitIndex();
      const dates = await fileStorageService.getAvailableDates();
      
      res.json({
        totalDates: dates.length,
        availableDates: dates,
        storageStructure: {
          summaries: "storage/summaries/YYYY-MM-DD/category.md",
          raw: "storage/raw/YYYY-MM-DD/source_timestamp.json"
        },
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to create storage index" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import { realNewsService } from "./services/realNewsService";
import { earningsApiService } from "./services/earningsApiService";

// 真實新聞抓取API
app.post("/api/news/real-scrape", async (req, res) => {
  try {
    const result = await realNewsService.scrapeRealNews();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to scrape real news" });
  }
});

// 真實Earnings API
app.post("/api/earnings/update", async (req, res) => {
  try {
    await earningsApiService.updateEarningsCalendar();
    const earnings = await earningsApiService.getWeeklyEarnings();
    res.json({ success: true, data: earnings });
  } catch (error) {
    res.status(500).json({ error: "Failed to update earnings" });
  }
});

app.get("/api/earnings/weekly", async (req, res) => {
  try {
    const earnings = await earningsApiService.getWeeklyEarnings();
    res.json(earnings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch earnings" });
  }
});
