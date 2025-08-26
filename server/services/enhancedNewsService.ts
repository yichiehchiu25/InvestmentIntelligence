import puppeteer from "puppeteer";
import fetch from 'node-fetch';
import { storage } from "../storage";
import { fileStorageService } from "./fileStorageService";
import type { InsertNewsArticle } from "@shared/schema";

export class EnhancedNewsService {
  private browser: any = null;

  // 新聞來源配置 - 包含更多國際知名財經媒體
  private newsSources = [
    // 美國主要財經媒體
    {
      name: "Yahoo Finance",
      url: "https://finance.yahoo.com/news/",
      type: "scraping",
      selectors: {
        articles: '[data-test-locator="mega"], .js-stream-content li, .stream-item',
        title: 'h3 a, .title a, .Fw(700)',
        summary: '.summary, .content, p',
        link: 'h3 a, .title a, .Fw(700)',
        time: '.time, time, .C(\\#959595)'
      },
      baseUrl: "https://finance.yahoo.com"
    },
    {
      name: "MarketWatch",
      url: "https://www.marketwatch.com/latest-news",
      type: "scraping", 
      selectors: {
        articles: '.element--article, .article__content',
        title: '.link, .headline a',
        summary: '.summary, .article__summary',
        link: '.link, .headline a',
        time: '.timestamp, .article__timestamp'
      },
      baseUrl: "https://www.marketwatch.com"
    },
    {
      name: "Bloomberg",
      url: "https://www.bloomberg.com/markets",
      type: "scraping",
      selectors: {
        articles: '[data-component="StoryBlock"], .story-package-module__story',
        title: '[data-component="headline"], .headline__link',
        summary: '[data-component="summary"], .summary',
        link: '[data-component="headline"], .headline__link',
        time: '.timestamp, [data-component="timestamp"]'
      },
      baseUrl: "https://www.bloomberg.com"
    },
    {
      name: "Reuters",
      url: "https://www.reuters.com/business/",
      type: "scraping",
      selectors: {
        articles: '[data-testid="MediaStoryCard"], .story-card',
        title: '[data-testid="Heading"], .media-story-card__headline__eqhp9',
        summary: '[data-testid="Body"], .media-story-card__body__eqhp9',
        link: 'a[data-testid="Heading"], .media-story-card__headline__eqhp9 a',
        time: '.timestamp, [data-testid="timestamp"]'
      },
      baseUrl: "https://www.reuters.com"
    },
    {
      name: "CNN Business",
      url: "https://edition.cnn.com/business",
      type: "scraping",
      selectors: {
        articles: '.container__item, .cd__content',
        title: '.container__headline-text, .cd__headline-text',
        summary: '.container__description, .cd__description',
        link: '.container__link, .cd__headline-text a',
        time: '.timestamp, .cd__timestamp'
      },
      baseUrl: "https://edition.cnn.com"
    },
    {
      name: "BBC Business",
      url: "https://www.bbc.com/news/business",
      type: "scraping",
      selectors: {
        articles: '.gs-c-promo, .media-list__item',
        title: '.gs-c-promo-heading__title, .media__title',
        summary: '.gs-c-promo-summary, .media__summary',
        link: '.gs-c-promo-heading__title, .media__title a',
        time: '.gs-u-vh, .date'
      },
      baseUrl: "https://www.bbc.com"
    },
    // 台灣本地財經媒體
    {
      name: "鉅亨網",
      url: "https://news.cnyes.com/news/cat/headline",
      type: "scraping",
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
      type: "scraping",
      selectors: {
        articles: '.story-list__item, .list-item',
        title: '.story-list__text a, .title a',
        summary: '.story-list__summary, .summary',
        link: '.story-list__text a, .title a',
        time: '.story-list__time, .time'
      },
      baseUrl: "https://money.udn.com"
    },
    {
      name: "工商時報",
      url: "https://ctee.com.tw/news/stock",
      type: "scraping",
      selectors: {
        articles: '.row .col-md-4, .article-list .article-item',
        title: '.title a, h3 a',
        summary: '.summary, .excerpt',
        link: '.title a, h3 a',
        time: '.date, .time'
      },
      baseUrl: "https://ctee.com.tw"
    }
  ];

  // API 新聞來源
  private apiSources = [
    {
      name: "NewsAPI",
      url: "https://newsapi.org/v2/everything",
      apiKey: process.env.NEWS_API_KEY || '',
      params: {
        q: 'stock market OR finance OR economy OR trading',
        language: 'en',
        sortBy: 'publishedAt',
        domains: 'reuters.com,bloomberg.com,marketwatch.com,yahoo.com'
      }
    },
    {
      name: "Alpha Vantage News",
      url: "https://www.alphavantage.co/query",
      apiKey: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
      params: {
        function: 'NEWS_SENTIMENT',
        topics: 'financial_markets,earnings,ipo,mergers_and_acquisitions',
        sort: 'LATEST'
      }
    }
  ];

  // 增強的關鍵字庫
  private keywords = {
    "總體經濟": [
      "Fed", "央行", "利率", "通脹", "CPI", "PPI", "GDP", "失業率", "Federal Reserve", 
      "inflation", "recession", "聯準會", "通膨", "經濟成長", "升息", "降息", "貨幣政策",
      "美國經濟", "中國經濟", "歐洲經濟", "日本經濟", "台灣經濟", "DXY", "美元指數",
      "QE", "量化寬鬆", "economic growth", "interest rates", "monetary policy"
    ],
    "科技股": [
      "Apple", "AAPL", "Microsoft", "MSFT", "Google", "GOOGL", "GOOG", "Meta", "META", 
      "Amazon", "AMZN", "Tesla", "TSLA", "NVIDIA", "NVDA", "台積電", "TSMC", "2330",
      "半導體", "AI", "人工智慧", "晶片", "iPhone", "AWS", "云端", "電動車", "自駕車",
      "semiconductor", "artificial intelligence", "cloud computing", "electric vehicle"
    ],
    "能源商品": [
      "原油", "石油", "天然氣", "OPEC", "oil", "energy", "commodity", "gold", "黃金",
      "WTI", "布倫特", "Brent", "煤炭", "銅", "鐵礦砂", "鋰", "稀土", "供應鏈",
      "crude oil", "natural gas", "precious metals", "copper", "lithium"
    ],
    "加密貨幣": [
      "Bitcoin", "BTC", "Ethereum", "ETH", "crypto", "blockchain", "比特幣", "以太坊", 
      "加密貨幣", "數位貨幣", "虛擬貨幣", "Dogecoin", "DOGE", "Solana", "SOL", "NFT",
      "cryptocurrency", "digital currency", "DeFi", "Web3"
    ],
    "金融股": [
      "銀行", "JPMorgan", "JPM", "Wells Fargo", "WFC", "Bank of America", "BAC",
      "Goldman Sachs", "GS", "富邦金", "2881", "國泰金", "2882", "中信金", "2891",
      "banking", "financial services", "credit", "loans", "mortgage"
    ]
  };

  async scrapeAllNews(): Promise<{ success: number; failed: number; articles: any[] }> {
    console.log("開始全面新聞抓取流程...");
    
    let allArticles: any[] = [];
    let successCount = 0;
    let failedCount = 0;

    await this.initializeBrowser();

    try {
      // 1. 抓取API新聞源
      const apiArticles = await this.scrapeApiSources();
      allArticles.push(...apiArticles);
      successCount += apiArticles.length;
      console.log(`API源抓取完成: ${apiArticles.length} 篇文章`);

      // 2. 抓取網頁新聞源
      for (const source of this.newsSources) {
        try {
          console.log(`正在抓取 ${source.name}...`);
          const articles = await this.scrapeWebSource(source);
          const enhancedArticles = articles.map(article => this.enhanceArticle(article, source.name));
          allArticles.push(...enhancedArticles);
          successCount += articles.length;
          console.log(`${source.name}: 成功抓取 ${articles.length} 篇文章`);
          
          // 添加延遲避免被封鎖
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`抓取 ${source.name} 失敗:`, error.message);
          failedCount++;
        }
      }

      // 3. 抓取Google新聞
      const googleArticles = await this.scrapeGoogleNews();
      allArticles.push(...googleArticles);
      successCount += googleArticles.length;

      // 4. 去重和排序
      allArticles = this.deduplicateArticles(allArticles);
      allArticles.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // 5. 儲存到資料庫
      for (const article of allArticles) {
        try {
          await this.saveArticle(article);
        } catch (error) {
          console.error("儲存文章失敗:", error.message);
        }
      }

      console.log(`新聞抓取完成: 成功 ${successCount} 篇，失敗 ${failedCount} 個來源，去重後 ${allArticles.length} 篇`);
      
      return { success: successCount, failed: failedCount, articles: allArticles };

    } catch (error) {
      console.error("新聞抓取過程出錯:", error);
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }

  private async scrapeApiSources(): Promise<any[]> {
    const articles: any[] = [];

    for (const apiSource of this.apiSources) {
      try {
        if (!apiSource.apiKey) {
          console.log(`跳過 ${apiSource.name}: 缺少API密鑰`);
          continue;
        }

        if (apiSource.name === "NewsAPI") {
          const newsApiArticles = await this.scrapeNewsAPI(apiSource);
          articles.push(...newsApiArticles);
        } else if (apiSource.name === "Alpha Vantage News") {
          const alphaArticles = await this.scrapeAlphaVantageNews(apiSource);
          articles.push(...alphaArticles);
        }
      } catch (error) {
        console.error(`API源 ${apiSource.name} 抓取失敗:`, error);
      }
    }

    return articles;
  }

  private async scrapeNewsAPI(apiSource: any): Promise<any[]> {
    const url = new URL(apiSource.url);
    Object.entries(apiSource.params).forEach(([key, value]) => {
      url.searchParams.append(key, value as string);
    });
    url.searchParams.append('apiKey', apiSource.apiKey);

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      return data.articles?.map((article: any) => ({
        title: article.title,
        summary: article.description,
        content: article.content,
        url: article.url,
        source: article.source.name,
        timestamp: article.publishedAt,
        category: this.categorizeArticle(article.title + " " + article.description),
        relevanceScore: this.calculateRelevanceScore(article.title + " " + article.description),
        sentiment: this.analyzeSentiment(article.title + " " + article.description)
      })) || [];
    } catch (error) {
      console.error('NewsAPI抓取錯誤:', error);
      return [];
    }
  }

  private async scrapeAlphaVantageNews(apiSource: any): Promise<any[]> {
    const url = new URL(apiSource.url);
    Object.entries(apiSource.params).forEach(([key, value]) => {
      url.searchParams.append(key, value as string);
    });
    url.searchParams.append('apikey', apiSource.apiKey);

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Alpha Vantage News error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      return data.feed?.map((article: any) => ({
        title: article.title,
        summary: article.summary,
        content: article.summary,
        url: article.url,
        source: article.source,
        timestamp: article.time_published,
        category: this.categorizeArticle(article.title + " " + article.summary),
        relevanceScore: parseFloat(article.overall_sentiment_score || '0'),
        sentiment: article.overall_sentiment_label?.toLowerCase() || 'neutral'
      })) || [];
    } catch (error) {
      console.error('Alpha Vantage News抓取錯誤:', error);
      return [];
    }
  }

  private async scrapeWebSource(source: any): Promise<any[]> {
    const page = await this.browser.newPage();
    const articles: any[] = [];

    try {
      // 設定用戶代理和請求頭
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8'
      });

      await page.goto(source.url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });

      // 等待內容載入
      await page.waitForTimeout(3000);

      const rawArticles = await page.evaluate((selectors: any, baseUrl: string) => {
        const articleElements = document.querySelectorAll(selectors.articles);
        const results = [];

        for (let i = 0; i < Math.min(articleElements.length, 20); i++) {
          const article = articleElements[i];
          const titleElement = article.querySelector(selectors.title);
          const summaryElement = article.querySelector(selectors.summary);
          const linkElement = article.querySelector(selectors.link);
          const timeElement = article.querySelector(selectors.time);

          if (titleElement && linkElement) {
            let url = linkElement.href || linkElement.getAttribute('href');
            if (url && !url.startsWith('http')) {
              url = baseUrl + (url.startsWith('/') ? url : '/' + url);
            }

            results.push({
              title: titleElement.textContent?.trim() || "",
              summary: summaryElement?.textContent?.trim() || "",
              url: url || "",
              timestamp: timeElement?.textContent?.trim() || timeElement?.getAttribute('datetime') || new Date().toISOString()
            });
          }
        }

        return results;
      }, source.selectors, source.baseUrl);

      articles.push(...rawArticles.filter(article => article.title && article.url));

    } catch (error) {
      console.error(`網頁抓取錯誤 ${source.name}:`, error);
    } finally {
      await page.close();
    }

    return articles;
  }

  private async scrapeGoogleNews(): Promise<any[]> {
    const page = await this.browser.newPage();
    const allArticles: any[] = [];

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      const searchQueries = [
        "台積電 TSMC 股價",
        "聯準會 Fed 利率 決議",
        "美股 股市 財報",
        "比特幣 Bitcoin 價格",
        "原油 油價 OPEC",
        "通膨 CPI PPI 數據",
        "科技股 Apple Microsoft"
      ];

      for (const query of searchQueries) {
        const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
        
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForTimeout(2000);

        const articles = await page.evaluate(() => {
          const articleElements = document.querySelectorAll('article');
          const results = [];

          for (let i = 0; i < Math.min(articleElements.length, 15); i++) {
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

        allArticles.push(...articles);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error("Google News抓取錯誤:", error);
    } finally {
      await page.close();
    }

    return allArticles;
  }

  private enhanceArticle(article: any, sourceName: string): any {
    const text = (article.title + " " + (article.summary || "")).toLowerCase();
    
    return {
      ...article,
      source: sourceName,
      category: this.categorizeArticle(text) || "其他",
      relevanceScore: this.calculateRelevanceScore(text),
      sentiment: this.analyzeSentiment(text),
      detectedStocks: this.detectStockSymbols(article.title + " " + (article.summary || "")),
      enhancedTimestamp: new Date()
    };
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

  private calculateRelevanceScore(text: string): number {
    let score = 0;
    let totalKeywords = 0;

    for (const [category, keywords] of Object.entries(this.keywords)) {
      for (const keyword of keywords) {
        totalKeywords++;
        if (text.includes(keyword.toLowerCase())) {
          score += 1;
          // 重要關鍵字加權
          if (['fed', '央行', '利率', 'tsmc', '台積電', 'bitcoin', 'apple', 'microsoft'].includes(keyword.toLowerCase())) {
            score += 1;
          }
        }
      }
    }

    return totalKeywords > 0 ? score / totalKeywords : 0;
  }

  private analyzeSentiment(text: string): string {
    const positiveWords = ["上漲", "看漲", "樂觀", "買進", "增長", "成長", "突破", "創新高", "強勁", "好轉", "bullish", "gain", "rise", "up", "positive"];
    const negativeWords = ["下跌", "看跌", "悲觀", "賣出", "衰退", "下滑", "跌破", "創新低", "疲軟", "惡化", "bearish", "loss", "fall", "down", "negative"];
    
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return "positive";
    if (negativeCount > positiveCount) return "negative";
    return "neutral";
  }

  private detectStockSymbols(text: string): { us: string[], taiwan: string[], crypto: string[] } {
    const detected = { us: [], taiwan: [], crypto: [] };

    // 美股代號 (1-5個大寫字母)
    const usMatches = text.match(/\b[A-Z]{1,5}\b/g) || [];
    detected.us = [...new Set(usMatches.filter(symbol => 
      symbol.length <= 5 && 
      !['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HOW', 'ITS', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WHO', 'BOY', 'DID', 'GOT', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE'].includes(symbol)
    ))];

    // 台股代號 (4位數字)
    const taiwanMatches = text.match(/\b\d{4}\b/g) || [];
    detected.taiwan = [...new Set(taiwanMatches.filter(symbol => 
      parseInt(symbol) >= 1000 && parseInt(symbol) <= 9999
    ))];

    // 加密貨幣代號
    const cryptoMatches = text.match(/\b(BTC|ETH|ADA|DOT|SOL|DOGE|SHIB|MATIC|BITCOIN|ETHEREUM)\b/gi) || [];
    detected.crypto = [...new Set(cryptoMatches.map(symbol => symbol.toUpperCase()))];

    return detected;
  }

  private deduplicateArticles(articles: any[]): any[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const key = article.title.toLowerCase().replace(/[^\w\s]/g, '').substring(0, 50);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private async saveArticle(article: any): Promise<void> {
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

  private async initializeBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox', 
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
    }
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // 獲取特定追蹤清單的相關新聞
  async getNewsForWatchlist(symbols: string[], limit: number = 50): Promise<any[]> {
    const allNews = await storage.getNewsArticles(limit * 2);
    
    return allNews.filter(article => {
      const text = (article.title + " " + article.summary).toLowerCase();
      return symbols.some(symbol => {
        const cleanSymbol = symbol.replace(/^(TPE:|NASDAQ:|NYSE:)/, '').toLowerCase();
        return text.includes(cleanSymbol) || text.includes(symbol.toLowerCase());
      });
    }).slice(0, limit);
  }

  // 獲取市場情緒統計
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

export const enhancedNewsService = new EnhancedNewsService();