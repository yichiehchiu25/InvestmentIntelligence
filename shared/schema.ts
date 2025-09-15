import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Economic Indicators
export const economicIndicators = pgTable("economic_indicators", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  value: text("value").notNull(),
  change: text("change"),
  period: text("period").notNull(),
  source: text("source").notNull(),
  category: text("category").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Financial Calendar Events
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  category: text("category").notNull(),
  importance: text("importance").notNull(),
  source: text("source").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// News Articles
export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary"),
  content: text("content"),
  source: text("source").notNull(),
  category: text("category").notNull(),
  url: text("url").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Summaries
export const aiSummaries = pgTable("ai_summaries", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  newsCount: integer("news_count").notNull(),
  keywords: json("keywords").$type<string[]>(),
  sentiment: text("sentiment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System Configuration
export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Taiwan Stocks (台股前10大權值股)
export const taiwanStocks = pgTable("taiwan_stocks", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(), // e.g. "2330.TW"
  name: text("name").notNull(), // e.g. "台積電"
  nameEn: text("name_en").notNull(), // e.g. "TSMC"
  price: real("price"), // 當前價格
  change: real("change"), // 漲跌幅
  changePercent: real("change_percent"), // 漲跌百分比
  volume: integer("volume"), // 成交量
  marketCap: text("market_cap"), // 市值
  isActive: boolean("is_active").default(true), // 是否啟用追蹤
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// US Stock Portfolio (美股投資組合)
export const usStockPortfolio = pgTable("us_stock_portfolio", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(), // e.g. "VTI", "VOO"
  name: text("name").notNull(), // e.g. "Vanguard Total Stock Market ETF"
  price: real("price"), // 當前價格
  change: real("change"), // 漲跌金額
  changePercent: real("change_percent"), // 漲跌百分比
  volume: integer("volume"), // 成交量
  weight: real("weight"), // 投組權重 (%)
  avgVolume: integer("avg_volume"), // 平均成交量
  isActive: boolean("is_active").default(true), // 是否啟用追蹤
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Stock Watchlist (股票關注清單)
export const stockWatchlist = pgTable("stock_watchlist", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(), // e.g. "AAPL", "2330.TW"
  name: text("name").notNull(), // 公司名稱
  exchange: text("exchange").notNull(), // "US" or "TW"
  price: real("price"), // 當前價格
  change: real("change"), // 漲跌金額
  changePercent: real("change_percent"), // 漲跌百分比
  volume: integer("volume"), // 成交量
  addedAt: timestamp("added_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schemas
export const insertEconomicIndicatorSchema = createInsertSchema(economicIndicators).omit({
  id: true,
  updatedAt: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
});

export const insertNewsArticleSchema = createInsertSchema(newsArticles).omit({
  id: true,
  createdAt: true,
});

export const insertAiSummarySchema = createInsertSchema(aiSummaries).omit({
  id: true,
  createdAt: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  updatedAt: true,
});

export const insertTaiWanStockSchema = createInsertSchema(taiwanStocks).omit({
  id: true,
  updatedAt: true,
});

export const insertUsStockPortfolioSchema = createInsertSchema(usStockPortfolio).omit({
  id: true,
  updatedAt: true,
});

export const insertStockWatchlistSchema = createInsertSchema(stockWatchlist).omit({
  id: true,
  addedAt: true,
  updatedAt: true,
});

// Types
export type EconomicIndicator = typeof economicIndicators.$inferSelect;
export type InsertEconomicIndicator = z.infer<typeof insertEconomicIndicatorSchema>;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;

export type NewsArticle = typeof newsArticles.$inferSelect;
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;

export type AiSummary = typeof aiSummaries.$inferSelect;
export type InsertAiSummary = z.infer<typeof insertAiSummarySchema>;

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;

export type TaiWanStock = typeof taiwanStocks.$inferSelect;
export type InsertTaiWanStock = z.infer<typeof insertTaiWanStockSchema>;

export type UsStockPortfolio = typeof usStockPortfolio.$inferSelect;
export type InsertUsStockPortfolio = z.infer<typeof insertUsStockPortfolioSchema>;

export type StockWatchlist = typeof stockWatchlist.$inferSelect;
export type InsertStockWatchlist = z.infer<typeof insertStockWatchlistSchema>;
