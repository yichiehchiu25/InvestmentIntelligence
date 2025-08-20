import OpenAI from "openai";
import { storage } from "../storage";
import { fileStorageService } from "./fileStorageService";
import type { NewsArticle, InsertAiSummary } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export class EnhancedAIService {
  /**
   * 生成Perplexity風格的專業財經分析師摘要
   */
  async generatePerplexityStyleSummary(articles: NewsArticle[]): Promise<{
    executiveSummary: string;
    keyHeadlines: string[];
    marketAnalysis: {
      sentiment: "樂觀" | "謹慎" | "中性";
      confidence: number;
      keyDrivers: string[];
    };
    sectorsInFocus: {
      sector: string;
      outlook: string;
      impact: "正面" | "負面" | "中性";
    }[];
    riskAssessment: {
      level: "高" | "中" | "低";
      factors: string[];
    };
    investmentImplications: string[];
    sources: {
      name: string;
      credibility: "高" | "中" | "低";
      url: string;
    }[];
  }> {
    if (!articles.length) {
      throw new Error("無足夠新聞數據進行分析");
    }

    try {
      // 準備新聞內容
      const newsContent = this.prepareNewsContent(articles);
      
      // 生成專業分析
      const analysis = await this.generateProfessionalAnalysis(newsContent);
      
      // 提取關鍵資訊
      const keyHeadlines = this.extractTopHeadlines(articles, 5);
      const sectorsInFocus = this.analyzeSectorImpact(articles);
      const sources = this.evaluateSourceCredibility(articles);
      
      return {
        executiveSummary: analysis.executiveSummary,
        keyHeadlines,
        marketAnalysis: analysis.marketAnalysis,
        sectorsInFocus,
        riskAssessment: analysis.riskAssessment,
        investmentImplications: analysis.investmentImplications,
        sources
      };
      
    } catch (error) {
      console.error("Enhanced AI analysis error:", error);
      throw new Error("AI分析服務暫時無法使用");
    }
  }

  /**
   * 準備新聞內容供AI分析
   */
  private prepareNewsContent(articles: NewsArticle[]): string {
    const sortedArticles = articles
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20); // 取最新20篇

    return sortedArticles.map((article, index) => {
      const timeAgo = this.getTimeAgo(new Date(article.timestamp));
      return `
【新聞${index + 1}】
標題: ${article.title}
來源: ${article.source} (${timeAgo})
分類: ${article.category}
摘要: ${article.summary || article.content?.substring(0, 200) + "..."}
影響程度: ${this.assessNewsImpact(article)}
---`;
    }).join("\n");
  }

  /**
   * 生成專業財經分析
   */
  private async generateProfessionalAnalysis(newsContent: string): Promise<{
    executiveSummary: string;
    marketAnalysis: {
      sentiment: "樂觀" | "謹慎" | "中性";
      confidence: number;
      keyDrivers: string[];
    };
    riskAssessment: {
      level: "高" | "中" | "低";
      factors: string[];
    };
    investmentImplications: string[];
  }> {
    const prompt = `
你是一位資深的財經分析師，具有15年以上的市場分析經驗。請根據以下最新財經新聞，撰寫一份專業的市場分析報告，風格類似Perplexity的深度分析。

新聞內容：
${newsContent}

請按照以下格式提供分析，使用繁體中文：

## 執行摘要
（100-150字，概括今日最重要的市場動向和影響）

## 市場情緒分析
情緒：[樂觀/謹慎/中性]
信心指數：[0-100]
主要驅動因素：
- [因素1]
- [因素2]
- [因素3]

## 風險評估
風險等級：[高/中/低]
主要風險因素：
- [風險1]
- [風險2]

## 投資啟示
- [投資建議1]
- [投資建議2]
- [投資建議3]

請確保分析客觀、專業，基於事實進行推論，避免過度樂觀或悲觀的表述。
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `你是頂尖的財經分析師，專長包括：
          1. 總體經濟分析與預測
          2. 股票市場技術與基本面分析  
          3. 央行政策解讀
          4. 地緣政治風險評估
          5. 產業趨勢分析
          
          你的分析風格：
          - 客觀理性，基於數據和事實
          - 語言精準，避免模糊表述
          - 多角度思考，考慮各種可能性
          - 重視風險管理，強調downside protection`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3 // 較低的溫度確保分析更加理性客觀
    });

    const analysisText = response.choices[0].message.content || "";
    
    // 解析AI回應
    return this.parseAIAnalysis(analysisText);
  }

  /**
   * 解析AI分析結果
   */
  private parseAIAnalysis(analysisText: string): {
    executiveSummary: string;
    marketAnalysis: {
      sentiment: "樂觀" | "謹慎" | "中性";
      confidence: number;
      keyDrivers: string[];
    };
    riskAssessment: {
      level: "高" | "中" | "低";
      factors: string[];
    };
    investmentImplications: string[];
  } {
    // 提取執行摘要
    const summaryMatch = analysisText.match(/## 執行摘要\n([\s\S]*?)(?=##|$)/);
    const executiveSummary = summaryMatch ? summaryMatch[1].trim() : "市場分析摘要暫無法生成";

    // 提取市場情緒
    const sentimentMatch = analysisText.match(/情緒：\[?(樂觀|謹慎|中性)\]?/);
    const sentiment = sentimentMatch ? sentimentMatch[1] as "樂觀" | "謹慎" | "中性" : "中性";

    // 提取信心指數
    const confidenceMatch = analysisText.match(/信心指數：\[?(\d+)\]?/);
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;

    // 提取主要驅動因素
    const driversMatch = analysisText.match(/主要驅動因素：\n((?:- .*\n?)*)/);
    const keyDrivers = driversMatch 
      ? driversMatch[1].split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^- /, '').trim())
      : ["市場因素分析中"];

    // 提取風險等級
    const riskLevelMatch = analysisText.match(/風險等級：\[?(高|中|低)\]?/);
    const riskLevel = riskLevelMatch ? riskLevelMatch[1] as "高" | "中" | "低" : "中";

    // 提取風險因素
    const riskFactorsMatch = analysisText.match(/主要風險因素：\n((?:- .*\n?)*)/);
    const riskFactors = riskFactorsMatch
      ? riskFactorsMatch[1].split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^- /, '').trim())
      : ["風險評估進行中"];

    // 提取投資啟示
    const implicationsMatch = analysisText.match(/## 投資啟示\n((?:- .*\n?)*)/);
    const investmentImplications = implicationsMatch
      ? implicationsMatch[1].split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^- /, '').trim())
      : ["投資建議整理中"];

    return {
      executiveSummary,
      marketAnalysis: {
        sentiment,
        confidence,
        keyDrivers
      },
      riskAssessment: {
        level: riskLevel,
        factors: riskFactors
      },
      investmentImplications
    };
  }

  /**
   * 提取頂級新聞標題
   */
  private extractTopHeadlines(articles: NewsArticle[], count: number = 5): string[] {
    // 按時間和重要性排序
    const scoredArticles = articles.map(article => {
      let score = 0;
      const content = `${article.title} ${article.summary || ""}`;
      
      // 時效性加分
      const hoursAgo = (Date.now() - new Date(article.timestamp).getTime()) / (1000 * 60 * 60);
      score += Math.max(0, 24 - hoursAgo);
      
      // 關鍵字重要性加分
      if (content.includes("Fed") || content.includes("央行")) score += 5;
      if (content.includes("台積電") || content.includes("TSMC")) score += 4;
      if (content.includes("AI") || content.includes("人工智慧")) score += 3;
      if (content.includes("升息") || content.includes("降息")) score += 4;
      if (content.includes("財報") || content.includes("營收")) score += 3;

      return { article, score };
    });

    return scoredArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(item => item.article.title);
  }

  /**
   * 分析各行業影響
   */
  private analyzeSectorImpact(articles: NewsArticle[]): {
    sector: string;
    outlook: string;
    impact: "正面" | "負面" | "中性";
  }[] {
    const sectorData = {
      "科技股": { count: 0, positive: 0, negative: 0 },
      "金融股": { count: 0, positive: 0, negative: 0 },
      "能源股": { count: 0, positive: 0, negative: 0 },
      "消費股": { count: 0, positive: 0, negative: 0 }
    };

    articles.forEach(article => {
      const content = `${article.title} ${article.summary || ""}`;
      
      // 分析科技股
      if (content.includes("台積電") || content.includes("AI") || content.includes("半導體")) {
        sectorData["科技股"].count++;
        if (content.includes("上漲") || content.includes("超預期") || content.includes("創新高")) {
          sectorData["科技股"].positive++;
        } else if (content.includes("下跌") || content.includes("利空")) {
          sectorData["科技股"].negative++;
        }
      }

      // 分析能源股
      if (content.includes("原油") || content.includes("石油") || content.includes("OPEC")) {
        sectorData["能源股"].count++;
        if (content.includes("上漲") || content.includes("飆升")) {
          sectorData["能源股"].positive++;
        } else if (content.includes("下跌")) {
          sectorData["能源股"].negative++;
        }
      }
    });

    return Object.entries(sectorData)
      .filter(([_, data]) => data.count > 0)
      .map(([sector, data]) => {
        let impact: "正面" | "負面" | "中性" = "中性";
        let outlook = "持續觀察市場動向";

        if (data.positive > data.negative) {
          impact = "正面";
          outlook = "短期表現可能優於大盤";
        } else if (data.negative > data.positive) {
          impact = "負面";
          outlook = "面臨調整壓力，需謹慎操作";
        }

        return { sector, outlook, impact };
      });
  }

  /**
   * 評估新聞來源可信度
   */
  private evaluateSourceCredibility(articles: NewsArticle[]): {
    name: string;
    credibility: "高" | "中" | "低";
    url: string;
  }[] {
    const sourceCredibility: Record<string, "高" | "中" | "低"> = {
      "經濟日報": "高",
      "工商時報": "高", 
      "中央社": "高",
      "鉅亨網": "中",
      "聯合新聞網": "中",
      "數位時代": "中",
      "Reuters": "高",
      "Bloomberg": "高",
      "Yahoo Finance": "中"
    };

    const sourcesUsed = new Set<string>();
    articles.forEach(article => sourcesUsed.add(article.source));

    return Array.from(sourcesUsed).map(source => ({
      name: source,
      credibility: sourceCredibility[source] || "低",
      url: "#" // 實際實作時應包含真實URL
    }));
  }

  /**
   * 評估新聞影響程度
   */
  private assessNewsImpact(article: NewsArticle): "高" | "中" | "低" {
    const content = `${article.title} ${article.summary || ""}`;
    
    // 高影響關鍵字
    const highImpactKeywords = ["Fed", "央行", "升息", "降息", "財報", "台積電", "AI"];
    // 中影響關鍵字  
    const mediumImpactKeywords = ["股價", "營收", "投資", "市場"];

    if (highImpactKeywords.some(keyword => content.includes(keyword))) {
      return "高";
    } else if (mediumImpactKeywords.some(keyword => content.includes(keyword))) {
      return "中";
    } else {
      return "低";
    }
  }

  /**
   * 計算時間差
   */
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}天前`;
    } else if (diffHours > 0) {
      return `${diffHours}小時前`;
    } else {
      return "剛剛";
    }
  }

  /**
   * 儲存分析結果到資料庫
   */
  async saveProfessionalAnalysis(
    analysis: any,
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<void> {
    const aiSummary: InsertAiSummary = {
      date,
      category: "專業分析",
      content: JSON.stringify(analysis),
      newsCount: analysis.sources?.length || 0,
      keywords: analysis.keyHeadlines || [],
      sentiment: analysis.marketAnalysis?.sentiment || "中性"
    };

    await storage.createAiSummary(aiSummary);
    
    // 同時儲存到檔案系統
    const filePath = `professional-analysis/analysis-${date}.json`;
    await fileStorageService.saveFile(filePath, JSON.stringify(analysis, null, 2));
    
    console.log(`專業分析已儲存: ${date}`);
  }
}

export const enhancedAIService = new EnhancedAIService();