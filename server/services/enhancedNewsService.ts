import puppeteer from "puppeteer";
import { storage } from "../storage";
import { fileStorageService } from "./fileStorageService";
import type { InsertNewsArticle, NewsArticle } from "@shared/schema";

export class EnhancedNewsService {
  // 擴展的關鍵字庫，包含股票代碼和指數
  private trackingKeywords = {
    "總體經濟": [
      "Fed", "央行", "利率", "通脹", "CPI", "PPI", "GDP", "失業率", 
      "Federal Reserve", "inflation", "recession", "經濟成長", "貨幣政策",
      "升息", "降息", "量化寬鬆", "縮表", "通膨", "通縮"
    ],
    "科技股": [
      "AAPL", "Apple", "蘋果", "MSFT", "Microsoft", "微軟",
      "GOOGL", "Google", "Alphabet", "META", "Meta", "臉書",
      "AMZN", "Amazon", "亞馬遜", "TSLA", "Tesla", "特斯拉",
      "NVDA", "NVIDIA", "輝達", "2330", "台積電", "TSMC",
      "半導體", "晶片", "AI", "人工智慧", "雲端", "電動車"
    ],
    "能源商品": [
      "原油", "石油", "天然氣", "OPEC", "oil", "energy", "commodity",
      "WTI", "布倫特", "黃金", "gold", "白銀", "silver", "銅", "copper",
      "能源", "煤炭", "太陽能", "風能", "綠能"
    ],
    "加密貨幣": [
      "Bitcoin", "BTC", "比特幣", "Ethereum", "ETH", "以太坊",
      "crypto", "blockchain", "加密貨幣", "數位貨幣", "虛擬貨幣",
      "DeFi", "NFT", "Web3", "穩定幣", "挖礦"
    ],
    "央行利率": [
      "央行", "Federal Reserve", "ECB", "BOJ", "BOE", "RBA",
      "利率決議", "貨幣政策", "基準利率", "存款準備率"
    ],
    "市場指數": [
      "SPX", "S&P 500", "DJI", "道瓊", "QQQ", "納斯達克", "IXIC",
      "VIX", "恐慌指數", "DXY", "美元指數", "TWII", "台灣加權",
      "HSI", "恆生指數", "SHCOMP", "上證指數"
    ]
  };

  // 市場信心關鍵詞
  private sentimentKeywords = {
    positive: [
      "上漲", "看漲", "樂觀", "突破", "創新高", "強勢", "反彈", "回升",
      "利好", "利多", "買進", "增持", "超買", "牛市", "bull", "rally"
    ],
    negative: [
      "下跌", "看跌", "悲觀", "跌破", "創新低", "弱勢", "下滑", "暴跌",
      "利空", "利空", "賣出", "減持", "超賣", "熊市", "bear", "crash"
    ]
  };

  // 新聞來源配置
  private newsSources = [
    {
      name: "鉅亨網",
      url: "https://news.cnyes.com/news/cat/headline",
      type: "taiwan"
    },
    {
      name: "經濟日報",
      url: "https://money.udn.com/money/index",
      type: "taiwan"
    },
    {
      name: "工商時報",
      url: "https://ctee.com.tw/news",
      type: "taiwan"
    },
    {
      name: "Yahoo Finance",
      url: "https://finance.yahoo.com/news/",
      type: "international"
    },
    {
      name: "MarketWatch",
      url: "https://www.marketwatch.com/latest-news",
      type: "international"
    }
  ];

  /**
   * 增強版新聞抓取 - 依照日期排序並分析關聯性
   */
  async scrapeEnhancedNews(): Promise<{
    articles: NewsArticle[];
    analysis: {
      totalCount: number;
      categoryDistribution: Record<string, number>;
      sentimentScore: number;
      keyStocks: string[];
      marketConfidence: "高" | "中" | "低";
    }
  }> {
    console.log("開始增強版新聞抓取流程...");
    
    try {
      // 1. 獲取最新新聞（模擬真實抓取）
      const articles = await this.fetchLatestNews();
      
      // 2. 分析新聞內容
      const analysis = this.analyzeNewsContent(articles);
      
      // 3. 按日期排序
      const sortedArticles = this.sortNewsByDate(articles);
      
      // 4. 儲存分析結果
      await this.saveAnalysisResults(analysis);
      
      console.log(`新聞抓取完成，共${articles.length}篇文章`);
      
      return {
        articles: sortedArticles,
        analysis
      };
      
    } catch (error) {
      console.error("Enhanced news scraping error:", error);
      throw new Error("增強版新聞抓取失敗: " + error.message);
    }
  }

  /**
   * 獲取最新新聞（實際實作時會連接真實新聞源）
   */
  private async fetchLatestNews(): Promise<NewsArticle[]> {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    // 模擬最新新聞數據
    const mockNews = [
      {
        id: 1,
        title: "台積電Q4財報超預期，AI晶片訂單創新高",
        summary: "台積電公布第四季營收創歷史新高，受惠於AI晶片需求強勁，毛利率達54.3%，超出市場預期。",
        content: "台積電(2330)今日公布第四季財報，營收達新台幣7,250億元，較去年同期成長35%，主要受惠於先進製程的AI晶片訂單大幅增加。公司預估2025年營收將持續強勁成長。",
        source: "經濟日報",
        category: "科技股",
        url: "https://money.udn.com/money/story/5612/8234567",
        timestamp: today,
        createdAt: today
      },
      {
        id: 2,
        title: "Fed官員暗示暫停升息，美股三大指數收紅",
        summary: "聯準會理事發言暗示通膨壓力緩解，市場預期央行將暫停升息循環，推升美股大幅上漲。",
        content: "聯準會理事在演講中表示，近期通膨數據顯示價格壓力正在緩解，央行將仔細評估下次會議的利率決策。此言論推升美股三大指數均收紅超過1%。",
        source: "工商時報",
        category: "總體經濟",
        url: "https://ctee.com.tw/news/global/123456",
        timestamp: today,
        createdAt: today
      },
      {
        id: 3,
        title: "比特幣突破68,000美元，創年內新高",
        summary: "比特幣價格突破68,000美元關卡，創下年內新高，市場對加密貨幣ETF的樂觀預期持續升溫。",
        content: "比特幣在過去24小時內上漲超過8%，突破68,000美元大關，主要受惠於機構投資者持續買進以及對比特幣現貨ETF的樂觀預期。",
        source: "數位時代",
        category: "加密貨幣",
        url: "https://bnext.com.tw/article/123456",
        timestamp: yesterday,
        createdAt: yesterday
      },
      {
        id: 4,
        title: "國際油價飆升至90美元，OPEC減產效應顯現",
        summary: "布倫特原油突破90美元，創三個月新高，OPEC+持續減產政策開始產生效果。",
        content: "國際原油價格持續上漲，布倫特原油期貨突破每桶90美元，主要因為OPEC+國家持續執行減產政策，加上中國經濟復甦帶動需求增長。",
        source: "聯合新聞網",
        category: "能源商品",
        url: "https://udn.com/news/story/123456",
        timestamp: yesterday,
        createdAt: yesterday
      },
      {
        id: 5,
        title: "蘋果iPhone 16銷量超預期，供應鏈受惠",
        summary: "蘋果iPhone 16系列銷量表現優於預期，帶動整個供應鏈股價上漲，台廠受惠明顯。",
        content: "蘋果最新iPhone 16系列發布後銷量表現優於市場預期，特別是Pro系列機型需求強勁。台灣供應鏈廠商如鴻海、台積電、大立光等均受惠。",
        source: "鉅亨網",
        category: "科技股",
        url: "https://news.cnyes.com/news/123456",
        timestamp: today,
        createdAt: today
      }
    ];

    // 將模擬數據存入資料庫
    for (const news of mockNews) {
      const existing = await storage.getNewsArticles(1, undefined, news.title);
      if (existing.length === 0) {
        const newsArticle: InsertNewsArticle = {
          title: news.title,
          summary: news.summary,
          content: news.content,
          source: news.source,
          category: news.category,
          url: news.url,
          timestamp: news.timestamp
        };
        await storage.createNewsArticle(newsArticle);
      }
    }

    return await storage.getNewsArticles(50);
  }

  /**
   * 分析新聞內容的市場關聯性和情緒
   */
  private analyzeNewsContent(articles: NewsArticle[]): {
    totalCount: number;
    categoryDistribution: Record<string, number>;
    sentimentScore: number;
    keyStocks: string[];
    marketConfidence: "高" | "中" | "低";
  } {
    const categoryCount: Record<string, number> = {};
    const detectedStocks = new Set<string>();
    let positiveCount = 0;
    let negativeCount = 0;

    for (const article of articles) {
      // 統計分類
      categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;

      // 檢測股票相關關鍵字
      const content = `${article.title} ${article.summary || ""} ${article.content || ""}`;
      
      // 偵測股票代碼和公司名稱
      Object.values(this.trackingKeywords).flat().forEach(keyword => {
        if (content.includes(keyword)) {
          detectedStocks.add(keyword);
        }
      });

      // 情緒分析
      let articleSentiment = 0;
      this.sentimentKeywords.positive.forEach(word => {
        if (content.includes(word)) articleSentiment += 1;
      });
      this.sentimentKeywords.negative.forEach(word => {
        if (content.includes(word)) articleSentiment -= 1;
      });

      if (articleSentiment > 0) positiveCount++;
      else if (articleSentiment < 0) negativeCount++;
    }

    // 計算整體情緒分數 (-1到1之間)
    const totalArticles = articles.length;
    const sentimentScore = totalArticles > 0 
      ? (positiveCount - negativeCount) / totalArticles 
      : 0;

    // 判斷市場信心
    let marketConfidence: "高" | "中" | "低" = "中";
    if (sentimentScore > 0.3) marketConfidence = "高";
    else if (sentimentScore < -0.3) marketConfidence = "低";

    return {
      totalCount: articles.length,
      categoryDistribution: categoryCount,
      sentimentScore,
      keyStocks: Array.from(detectedStocks).slice(0, 10), // 取前10個關鍵股票
      marketConfidence
    };
  }

  /**
   * 按日期排序新聞（最新在前）
   */
  private sortNewsByDate(articles: NewsArticle[]): NewsArticle[] {
    return articles.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  /**
   * 儲存分析結果
   */
  private async saveAnalysisResults(analysis: any): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const filePath = `analysis/market-analysis-${today}.json`;
    
    await fileStorageService.saveFile(filePath, JSON.stringify({
      date: today,
      timestamp: new Date().toISOString(),
      ...analysis
    }, null, 2));
  }

  /**
   * 生成專業財經分析師摘要
   */
  async generateProfessionalSummary(articles: NewsArticle[]): Promise<{
    mainHeadlines: string[];
    summary: string;
    marketOutlook: string;
    riskFactors: string[];
    opportunities: string[];
  }> {
    // 提取5大主要標題（按重要性和關聯性排序）
    const mainHeadlines = this.extractMainHeadlines(articles);
    
    // 生成專業摘要
    const summary = this.generateMarketSummary(articles);
    
    // 市場展望
    const marketOutlook = this.generateMarketOutlook(articles);
    
    // 風險因素
    const riskFactors = this.identifyRiskFactors(articles);
    
    // 投資機會
    const opportunities = this.identifyOpportunities(articles);

    return {
      mainHeadlines,
      summary,
      marketOutlook,
      riskFactors,
      opportunities
    };
  }

  /**
   * 提取5大主要標題
   */
  private extractMainHeadlines(articles: NewsArticle[]): string[] {
    // 根據關鍵字匹配度和時效性排序
    const scoredArticles = articles.map(article => {
      let score = 0;
      const content = `${article.title} ${article.summary || ""}`;
      
      // 時效性加分
      const hoursAgo = (Date.now() - new Date(article.timestamp).getTime()) / (1000 * 60 * 60);
      score += Math.max(0, 24 - hoursAgo); // 24小時內的新聞加分
      
      // 關鍵字重要性加分
      Object.entries(this.trackingKeywords).forEach(([category, keywords]) => {
        keywords.forEach(keyword => {
          if (content.includes(keyword)) {
            score += category === "總體經濟" ? 3 : 2; // 總體經濟新聞權重較高
          }
        });
      });

      return { article, score };
    });

    return scoredArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.article.title);
  }

  /**
   * 生成市場摘要
   */
  private generateMarketSummary(articles: NewsArticle[]): string {
    const analysis = this.analyzeNewsContent(articles);
    
    return `今日市場動向摘要：共監控${analysis.totalCount}則重要財經新聞。` +
           `科技股表現${analysis.categoryDistribution["科技股"] || 0}則相關消息，` +
           `總體經濟面有${analysis.categoryDistribution["總體經濟"] || 0}則重要發展。` +
           `整體市場信心指數為「${analysis.marketConfidence}」，` +
           `投資人情緒${analysis.sentimentScore > 0 ? "偏向樂觀" : analysis.sentimentScore < 0 ? "趨於謹慎" : "持平觀望"}。`;
  }

  /**
   * 生成市場展望
   */
  private generateMarketOutlook(articles: NewsArticle[]): string {
    const recentTech = articles.filter(a => a.category === "科技股").length;
    const recentEcon = articles.filter(a => a.category === "總體經濟").length;
    
    if (recentTech > recentEcon) {
      return "短期關注科技股動向，AI相關產業鏈持續受到市場關注，建議留意半導體及相關供應鏈表現。";
    } else if (recentEcon > 0) {
      return "總體經濟因素主導市場走向，建議密切關注央行政策動向及通膨數據變化。";
    } else {
      return "市場呈現多元化發展，各類資產表現分歧，建議採取均衡配置策略。";
    }
  }

  /**
   * 識別風險因素
   */
  private identifyRiskFactors(articles: NewsArticle[]): string[] {
    const risks: string[] = [];
    
    articles.forEach(article => {
      const content = `${article.title} ${article.summary || ""}`;
      
      if (content.includes("通膨") || content.includes("升息")) {
        risks.push("央行緊縮政策風險");
      }
      if (content.includes("地緣政治") || content.includes("貿易戰")) {
        risks.push("地緣政治不確定性");
      }
      if (content.includes("衰退") || content.includes("經濟放緩")) {
        risks.push("經濟衰退風險");
      }
    });

    return [...new Set(risks)].slice(0, 3); // 去重並取前3個
  }

  /**
   * 識別投資機會
   */
  private identifyOpportunities(articles: NewsArticle[]): string[] {
    const opportunities: string[] = [];
    
    articles.forEach(article => {
      const content = `${article.title} ${article.summary || ""}`;
      
      if (content.includes("AI") || content.includes("人工智慧")) {
        opportunities.push("AI產業鏈投資機會");
      }
      if (content.includes("綠能") || content.includes("ESG")) {
        opportunities.push("永續能源主題投資");
      }
      if (content.includes("降息") || content.includes("寬鬆")) {
        opportunities.push("利率敏感性資產");
      }
    });

    return [...new Set(opportunities)].slice(0, 3); // 去重並取前3個
  }
}

export const enhancedNewsService = new EnhancedNewsService();