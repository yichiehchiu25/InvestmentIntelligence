import puppeteer from "puppeteer";
import { storage } from "../storage";
import { fileStorageService } from "./fileStorageService";
import type { InsertNewsArticle } from "@shared/schema";

export class RealNewsService {
  private browser: any = null;

  // 新聞來源配置
  private newsSources = {
    taiwan: [
      {
        name: "鉅亨網",
        url: "https://news.cnyes.com/news/cat/headline",
        selectors: {
          articles: '.news-list .news-item, .newslist-container .news-item',
          title: '.news-title a, h3 a, .title a',
          summary: '.news-summary, .summary, .content',
          link: '.news-title a, h3 a, .title a',
          time: '.news-time, .time, .date'
        },
        baseUrl: "https://news.cnyes.com"
      },
      {
        name: "經濟日報",
        url: "https://money.udn.com/money/index",
        selectors: {
          articles: '.story-list__item, .list-item',
          title: '.story-list__text a, .title a',
          summary: '.story-list__summary, .summary',
          link: '.story-list__text a, .title a',
          time: '.story-list__time, .time'
        },
        baseUrl: "https://money.udn.com"
      }
    ],
    international: [
      {
        name: "Yahoo Finance",
        url: "https://finance.yahoo.com/news/",
        selectors: {
          articles: '[data-test-locator="mega"], .js-stream-content li',
          title: 'h3 a, .title a',
          summary: '.summary, .content',
          link: 'h3 a, .title a',
          time: '.time, time'
        },
        baseUrl: "https://finance.yahoo.com"
      }
    ]
  };

  async scrapeRealNews(): Promise<{ success: number; failed: number; articles: any[] }> {
    console.log("開始抓取真實財經新聞...");
    
    await this.initializeBrowser();
    
    let allArticles: any[] = [];
    let successCount = 0;
    let failedCount = 0;

    try {
      const sourcesToScrape = [...this.newsSources.taiwan, ...this.newsSources.international];

      for (const source of sourcesToScrape) {
        try {
          console.log(`正在抓取 ${source.name} 的新聞...`);
          const articles = await this.scrapeNewsSource(source);
          allArticles.push(...articles);
          successCount += articles.length;
          console.log(`${source.name}: 成功抓取 ${articles.length} 篇新聞`);
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`抓取 ${source.name} 失敗:`, error.message);
          failedCount++;
        }
      }

      // 儲存到資料庫
      for (const article of allArticles) {
        try {
          await this.saveArticleToDatabase(article);
        } catch (error) {
          console.error("儲存文章失敗:", error.message);
        }
      }

      console.log(`新聞抓取完成: 成功 ${successCount} 篇，失敗 ${failedCount} 個來源`);
      
      return { success: successCount, failed: failedCount, articles: allArticles };

    } catch (error) {
      console.error("新聞抓取過程出錯:", error);
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }

  private async initializeBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
    }
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // ... 其他方法實作
}

export const realNewsService = new RealNewsService();
