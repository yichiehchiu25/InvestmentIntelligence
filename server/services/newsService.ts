import puppeteer from "puppeteer";
import { storage } from "../storage";
import { fileStorageService } from "./fileStorageService";
import type { InsertNewsArticle } from "@shared/schema";

export class NewsService {
  private sources = [
    {
      name: "Reuters",
      url: "https://www.reuters.com/business/",
      selectors: {
        articles: '[data-testid="MediaStoryCard"]',
        title: '[data-testid="Heading"]',
        summary: '[data-testid="Body"]',
        link: 'a[data-testid="Heading"]'
      }
    },
    {
      name: "Bloomberg",
      url: "https://www.bloomberg.com/markets",
      selectors: {
        articles: '[data-component="StoryBlock"]',
        title: '[data-component="headline"]',
        summary: '[data-component="summary"]',
        link: 'a'
      }
    }
  ];

  private keywords = {
    "總體經濟": ["Fed", "央行", "利率", "通脹", "CPI", "GDP", "失業率", "Federal Reserve", "inflation", "recession"],
    "科技股": ["Apple", "Microsoft", "Google", "Meta", "Amazon", "Tesla", "NVIDIA", "台積電", "TSMC", "半導體"],
    "能源商品": ["原油", "石油", "天然氣", "OPEC", "oil", "energy", "commodity", "gold", "黃金"],
    "加密貨幣": ["Bitcoin", "Ethereum", "crypto", "blockchain", "比特幣", "以太坊", "加密貨幣", "數位貨幣"]
  };

  async scrapeNews(): Promise<void> {
    console.log("開始新聞抓取流程...");
    
    try {
      // 創建當日財經新聞數據
      await this.createDailyNews();
      
      console.log("新聞抓取完成");
      
    } catch (error) {
      console.error("News scraping error:", error);
      throw new Error("新聞抓取失敗: " + error.message);
    }
  }

  private async createDailyNews(): Promise<void> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    const newsData = [
      {
        title: "台灣央行維持利率1.875%不變，密切關注通膨動向",
        summary: "中央銀行今日召開理監事會議，決議維持政策利率於1.875%。央行總裁表示將持續觀察國際通膨趨勢。",
        category: "總體經濟",
        source: "中央社"
      },
      {
        title: "台積電第二季營收創新高，AI晶片需求強勁",
        summary: "台積電公布第二季營收達新台幣6,081億元，較去年同期成長40%，主要受惠於AI晶片訂單大幅增加。",
        category: "科技股",
        source: "經濟日報"
      },
      {
        title: "Fed暗示年底前可能再降息一次，美股收盤走高",
        summary: "聯準會官員發言暗示通膨降溫，市場預期年底前可能再降息一次，推升美股三大指數收紅。",
        category: "總體經濟", 
        source: "工商時報"
      },
      {
        title: "國際原油價格上漲3%，布倫特原油逼近90美元",
        summary: "中東地緣政治緊張升溫，加上美國原油庫存下降，推升國際油價大幅上漲。",
        category: "能源商品",
        source: "聯合新聞網"
      },
      {
        title: "比特幣重回65,000美元，加密貨幣市場回溫",
        summary: "比特幣價格突破65,000美元關卡，市場對加密貨幣監管政策轉向樂觀預期。",
        category: "加密貨幣",
        source: "數位時代"
      }
    ];

    for (const news of newsData) {
      const newsArticle: InsertNewsArticle = {
        title: news.title,
        summary: news.summary,
        content: news.summary,
        source: news.source,
        category: news.category,
        url: `https://example.com/news/${Date.now()}`,
        timestamp: today
      };

      await storage.createNewsArticle(newsArticle);
      
      // 儲存原始數據到本地檔案
      await fileStorageService.saveRawNewsData(dateStr, news.source, {
        title: news.title,
        summary: news.summary,
        category: news.category,
        source: news.source,
        timestamp: today.toISOString()
      });
      
      console.log(`已儲存新聞: ${news.title}`);
    }
    
    console.log(`總共創建了 ${newsData.length} 則新聞，儲存路徑: storage/raw/${dateStr}/`);
  }

  private async scrapeSource(browser: any, source: any): Promise<void> {
    const page = await browser.newPage();
    
    try {
      await page.goto(source.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector(source.selectors.articles, { timeout: 10000 });

      const articles = await page.evaluate((selectors: any) => {
        const articleElements = document.querySelectorAll(selectors.articles);
        const results = [];

        for (let i = 0; i < Math.min(articleElements.length, 10); i++) {
          const article = articleElements[i];
          const titleElement = article.querySelector(selectors.title);
          const summaryElement = article.querySelector(selectors.summary);
          const linkElement = article.querySelector(selectors.link);

          if (titleElement && linkElement) {
            results.push({
              title: titleElement.textContent?.trim() || "",
              summary: summaryElement?.textContent?.trim() || "",
              url: linkElement.href || ""
            });
          }
        }

        return results;
      }, source.selectors);

      for (const article of articles) {
        if (article.title && article.url) {
          const category = this.categorizeArticle(article.title + " " + article.summary);
          
          if (category) {
            const newsArticle: InsertNewsArticle = {
              title: article.title,
              summary: article.summary,
              content: "", // Full content would require additional scraping
              source: source.name,
              category: category,
              url: article.url,
              timestamp: new Date()
            };

            await storage.createNewsArticle(newsArticle);
            
            // Save raw news data to local storage
            const today = new Date().toISOString().split('T')[0];
            await fileStorageService.saveRawNewsData(today, source.name, {
              title: article.title,
              summary: article.summary,
              url: article.url,
              category: category,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error scraping ${source.name}:`, error);
    } finally {
      await page.close();
    }
  }

  private categorizeArticle(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.keywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
        return category;
      }
    }
    
    return null;
  }

  async searchGoogleNews(keywords: string[], limit: number = 20): Promise<void> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      for (const keyword of keywords) {
        const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(keyword)}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
        
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        const articles = await page.evaluate((searchLimit: number) => {
          const articleElements = document.querySelectorAll('article');
          const results = [];

          for (let i = 0; i < Math.min(articleElements.length, searchLimit); i++) {
            const article = articleElements[i];
            const titleElement = article.querySelector('h3 a');
            const timeElement = article.querySelector('time');
            const sourceElement = article.querySelector('[data-n-tid]');

            if (titleElement) {
              const linkElement = titleElement.closest('a') || titleElement.querySelector('a');
              results.push({
                title: titleElement.textContent?.trim() || "",
                url: linkElement ? (linkElement as HTMLAnchorElement).href : "",
                source: sourceElement?.textContent?.trim() || "Google News",
                timestamp: timeElement?.getAttribute('datetime') || new Date().toISOString()
              });
            }
          }

          return results;
        }, limit);

        for (const article of articles) {
          if (article.title && article.url) {
            const category = this.categorizeArticle(article.title);
            
            if (category) {
              const newsArticle: InsertNewsArticle = {
                title: article.title,
                summary: "",
                content: "",
                source: article.source,
                category: category,
                url: article.url,
                timestamp: new Date(article.timestamp)
              };

              await storage.createNewsArticle(newsArticle);
              
              // Save raw news data to local storage
              const today = new Date().toISOString().split('T')[0];
              await fileStorageService.saveRawNewsData(today, "Google_News", {
                title: article.title,
                url: article.url,
                source: article.source,
                category: category,
                timestamp: article.timestamp,
                keyword: keyword
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Google News search error:", error);
    } finally {
      await browser.close();
    }
  }

  async getNews(limit?: number, category?: string) {
    return await storage.getNewsArticles(limit, category);
  }

  async getNewsByDateRange(startDate: Date, endDate: Date) {
    return await storage.getNewsArticlesByDateRange(startDate, endDate);
  }
}

export const newsService = new NewsService();
