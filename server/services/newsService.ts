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
    },
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
    }
  ];

  // 增強的關鍵字庫 - 包含股票代號和關鍵詞
  private keywords = {
    "總體經濟": [
      "Fed", "央行", "利率", "通脹", "CPI", "PPI", "GDP", "失業率", "Federal Reserve", 
      "inflation", "recession", "聯準會", "通膨", "經濟成長", "升息", "降息", "貨幣政策",
      "美國經濟", "中國經濟", "歐洲經濟", "日本經濟", "台灣經濟", "DXY", "美元指數"
    ],
    "科技股": [
      "Apple", "AAPL", "Microsoft", "MSFT", "Google", "GOOGL", "GOOG", "Meta", "META", 
      "Amazon", "AMZN", "Tesla", "TSLA", "NVIDIA", "NVDA", "台積電", "TSMC", "2330",
      "半導體", "AI", "人工智慧", "晶片", "iPhone", "AWS", "云端", "電動車", "自駕車"
    ],
    "能源商品": [
      "原油", "石油", "天然氣", "OPEC", "oil", "energy", "commodity", "gold", "黃金",
      "WTI", "布倫特", "Brent", "煤炭", "銅", "鐵礦砂", "鋰", "稀土", "供應鏈"
    ],
    "加密貨幣": [
      "Bitcoin", "BTC", "Ethereum", "ETH", "crypto", "blockchain", "比特幣", "以太坊", 
      "加密貨幣", "數位貨幣", "虛擬貨幣", "Dogecoin", "DOGE", "Solana", "SOL", "NFT"
    ],
    "金融股": [
      "銀行", "JPMorgan", "JPM", "Wells Fargo", "WFC", "Bank of America", "BAC",
      "Goldman Sachs", "GS", "富邦金", "2881", "國泰金", "2882", "中信金", "2891"
    ]
  };

  // 股票代號檢測模式
  private stockPatterns = {
    us: /\b[A-Z]{1,5}\b/g,  // 美股代號 (1-5個大寫字母)
    taiwan: /\b\d{4}\b/g,   // 台股代號 (4位數字)
    crypto: /\b(BTC|ETH|ADA|DOT|SOL|DOGE|SHIB|MATIC)\b/gi
  };

  // 市場信心關鍵字
  private sentimentKeywords = {
    positive: ["上漲", "看漲", "樂觀", "買進", "增長", "成長", "突破", "創新高", "強勁", "好轉"],
    negative: ["下跌", "看跌", "悲觀", "賣出", "衰退", "下滑", "跌破", "創新低", "疲軟", "惡化"],
    neutral: ["持平", "觀望", "中性", "維持", "穩定", "小幅", "微幅", "震盪"]
  };

  async scrapeNews(): Promise<{ success: number; failed: number; articles: any[] }> {
    console.log("開始增強型新聞抓取流程...");
    
    let allArticles: any[] = [];
    let successCount = 0;
    let failedCount = 0;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      // 先抓取Google新聞
      const googleArticles = await this.scrapeGoogleNewsEnhanced(browser);
      allArticles.push(...googleArticles);
      successCount += googleArticles.length;

      // 然後抓取各個新聞來源
      for (const source of this.sources) {
        try {
          console.log(`正在抓取 ${source.name} 的新聞...`);
          const articles = await this.scrapeSource(browser, source);
          allArticles.push(...articles);
          successCount += articles.length;
          console.log(`${source.name}: 成功抓取 ${articles.length} 篇新聞`);
          
          // 添加延遲避免被封鎖
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`抓取 ${source.name} 失敗:`, error.message);
          failedCount++;
        }
      }

      // 按日期排序 (最新的在前)
      allArticles.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // 儲存到資料庫
      for (const article of allArticles) {
        try {
          await this.saveEnhancedArticle(article);
        } catch (error) {
          console.error("儲存文章失敗:", error.message);
        }
      }

      console.log(`新聞抓取完成: 成功 ${successCount} 篇，失敗 ${failedCount} 個來源`);
      
      return { success: successCount, failed: failedCount, articles: allArticles };

    } catch (error) {
      console.error("News scraping error:", error);
      throw new Error("新聞抓取失敗: " + error.message);
    } finally {
      await browser.close();
    }
  }

  private async scrapeGoogleNewsEnhanced(browser: any): Promise<any[]> {
    const page = await browser.newPage();
    const allArticles: any[] = [];

    try {
      // 設定用戶代理避免被偵測
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      const searchQueries = [
        "台積電 TSMC",
        "聯準會 Fed 利率",
        "美股 股市",
        "比特幣 Bitcoin",
        "原油價格",
        "通膨 CPI",
        "科技股"
      ];

      for (const query of searchQueries) {
        const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
        
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForTimeout(2000);

        const articles = await page.evaluate(() => {
          const articleElements = document.querySelectorAll('article');
          const results = [];

          for (let i = 0; i < Math.min(articleElements.length, 10); i++) {
            const article = articleElements[i];
            const titleElement = article.querySelector('h3 a');
            const timeElement = article.querySelector('time');
            const sourceElement = article.querySelector('[data-n-tid]');

            if (titleElement) {
              results.push({
                title: titleElement.textContent?.trim() || "",
                url: titleElement.href || "",
                source: sourceElement?.textContent?.trim() || "Google News",
                timestamp: timeElement?.getAttribute('datetime') || new Date().toISOString()
              });
            }
          }

          return results;
        });

        for (const article of articles) {
          if (article.title && article.url) {
            const enhancedArticle = await this.enhanceArticleData(article);
            if (enhancedArticle.relevanceScore > 0.3) {  // 只保留相關性高的新聞
              allArticles.push(enhancedArticle);
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error("Google News enhanced scraping error:", error);
    } finally {
      await page.close();
    }

    return allArticles;
  }

  private async enhanceArticleData(article: any): Promise<any> {
    const text = (article.title + " " + (article.summary || "")).toLowerCase();
    
    // 檢測股票代號
    const detectedStocks = this.detectStockSymbols(article.title + " " + (article.summary || ""));
    
    // 計算關鍵字相關性得分
    const relevanceScore = this.calculateRelevanceScore(text);
    
    // 分析市場情緒
    const sentiment = this.analyzeSentiment(text);
    
    // 分類文章
    const category = this.categorizeArticle(text);

    return {
      ...article,
      detectedStocks,
      relevanceScore,
      sentiment,
      category: category || "其他",
      enhancedTimestamp: new Date()
    };
  }

  private detectStockSymbols(text: string): { us: string[], taiwan: string[], crypto: string[] } {
    const detected = {
      us: [],
      taiwan: [],
      crypto: []
    };

    // 檢測美股代號
    const usMatches = text.match(this.stockPatterns.us) || [];
    detected.us = [...new Set(usMatches.filter(symbol => 
      symbol.length <= 5 && 
      !['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HOW', 'ITS', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WHO', 'BOY', 'DID', 'GOT', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE'].includes(symbol)
    ))];

    // 檢測台股代號
    const taiwanMatches = text.match(this.stockPatterns.taiwan) || [];
    detected.taiwan = [...new Set(taiwanMatches.filter(symbol => 
      parseInt(symbol) >= 1000 && parseInt(symbol) <= 9999
    ))];

    // 檢測加密貨幣代號
    const cryptoMatches = text.match(this.stockPatterns.crypto) || [];
    detected.crypto = [...new Set(cryptoMatches.map(symbol => symbol.toUpperCase()))];

    return detected;
  }

  private calculateRelevanceScore(text: string): number {
    let score = 0;
    let totalKeywords = 0;

    for (const [category, keywords] of Object.entries(this.keywords)) {
      for (const keyword of keywords) {
        totalKeywords++;
        if (text.includes(keyword.toLowerCase())) {
          score += 1;
          // 給予重要關鍵字更高權重
          if (['fed', '央行', '利率', 'tsmc', '台積電', 'bitcoin'].includes(keyword.toLowerCase())) {
            score += 1;
          }
        }
      }
    }

    return totalKeywords > 0 ? score / totalKeywords : 0;
  }

  private analyzeSentiment(text: string): string {
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    for (const keyword of this.sentimentKeywords.positive) {
      if (text.includes(keyword)) positiveCount++;
    }
    for (const keyword of this.sentimentKeywords.negative) {
      if (text.includes(keyword)) negativeCount++;
    }
    for (const keyword of this.sentimentKeywords.neutral) {
      if (text.includes(keyword)) neutralCount++;
    }

    if (positiveCount > negativeCount && positiveCount > neutralCount) return "positive";
    if (negativeCount > positiveCount && negativeCount > neutralCount) return "negative";
    return "neutral";
  }

  private async saveEnhancedArticle(article: any): Promise<void> {
    const newsArticle: InsertNewsArticle = {
      title: article.title,
      summary: article.summary || "",
      content: article.content || article.summary || "",
      source: article.source,
      category: article.category,
      url: article.url,
      timestamp: new Date(article.timestamp)
    };

    await storage.createNewsArticle(newsArticle);
    
    // 儲存增強數據到檔案
    const today = new Date().toISOString().split('T')[0];
    await fileStorageService.saveRawNewsData(today, article.source, {
      ...article,
      savedAt: new Date().toISOString()
    });
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

  private async scrapeSource(browser: any, source: any): Promise<any[]> {
    const page = await browser.newPage();
    const articles = [];
    
    try {
      await page.goto(source.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector(source.selectors.articles, { timeout: 10000 });

      const rawArticles = await page.evaluate((selectors: any) => {
        const articleElements = document.querySelectorAll(selectors.articles);
        const results = [];

        for (let i = 0; i < Math.min(articleElements.length, 10); i++) {
          const article = articleElements[i];
          const titleElement = article.querySelector(selectors.title);
          const summaryElement = article.querySelector(selectors.summary);
          const linkElement = article.querySelector(selectors.link);
          const timeElement = article.querySelector(selectors.time);

          if (titleElement && linkElement) {
            results.push({
              title: titleElement.textContent?.trim() || "",
              summary: summaryElement?.textContent?.trim() || "",
              url: linkElement.href || "",
              timestamp: timeElement?.textContent?.trim() || new Date().toISOString()
            });
          }
        }

        return results;
      }, source.selectors);

      for (const article of rawArticles) {
        if (article.title && article.url) {
          const enhancedArticle = await this.enhanceArticleData({
            ...article,
            source: source.name
          });
          
          if (enhancedArticle.relevanceScore > 0.2) {
            articles.push(enhancedArticle);
          }
        }
      }
    } catch (error) {
      console.error(`Error scraping ${source.name}:`, error);
    } finally {
      await page.close();
    }

    return articles;
  }

  private categorizeArticle(text: string): string | null {
    const lowerText = text.toLowerCase();
    let maxScore = 0;
    let bestCategory = null;
    
    for (const [category, keywords] of Object.entries(this.keywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          score++;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    }
    
    return maxScore > 0 ? bestCategory : null;
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

  // 新增：獲取追蹤股票相關新聞
  async getNewsForWatchlist(symbols: string[], limit: number = 50) {
    const allNews = await storage.getNewsArticles(limit * 2); // 獲取更多新聞進行篩選
    
    return allNews.filter(article => {
      const text = (article.title + " " + article.summary).toLowerCase();
      return symbols.some(symbol => 
        text.includes(symbol.toLowerCase()) || 
        text.includes(symbol.replace(/^(TPE:|NASDAQ:|NYSE:)/, '').toLowerCase())
      );
    }).slice(0, limit);
  }

  // 新增：獲取市場信心指標
  async getMarketSentiment(): Promise<{ positive: number; negative: number; neutral: number }> {
    const recentNews = await storage.getNewsArticles(100);
    let positive = 0, negative = 0, neutral = 0;

    for (const article of recentNews) {
      const sentiment = this.analyzeSentiment((article.title + " " + article.summary).toLowerCase());
      if (sentiment === "positive") positive++;
      else if (sentiment === "negative") negative++;
      else neutral++;
    }

    const total = positive + negative + neutral;
    return {
      positive: total > 0 ? Math.round((positive / total) * 100) : 0,
      negative: total > 0 ? Math.round((negative / total) * 100) : 0,
      neutral: total > 0 ? Math.round((neutral / total) * 100) : 0
    };
  }
}

export const newsService = new NewsService();
