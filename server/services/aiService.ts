import OpenAI from "openai";
import { storage } from "../storage";
import { fileStorageService } from "./fileStorageService";
import type { NewsArticle, InsertAiSummary } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

interface MarketSummary {
  title: string;
  content: string;
  impact: "high" | "medium" | "low";
  sentiment: "positive" | "negative" | "neutral";
  keyPoints: string[];
  relatedStocks: string[];
}

export class AIService {
  private financialAnalystPrompt = `
你是一位資深財經分析師，擁有15年以上的全球金融市場經驗。你的專長包括：
- 宏觀經濟分析與央行政策解讀
- 股票市場技術與基本面分析  
- 商品期貨與加密貨幣市場
- 地緣政治對金融市場的影響
- 風險管理與投資組合策略

你的分析風格：專業、客觀、基於數據，並能將複雜的市場信息轉化為易懂的投資洞察。
你必須提供可操作的投資建議，並明確指出風險因素。
`;

  async generateTop5MarketSummaries(date?: string): Promise<MarketSummary[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      // 獲取當日最相關的新聞
      const allNews = await storage.getNewsArticles(100);
      const todayNews = allNews.filter(article => {
        const articleDate = new Date(article.timestamp).toISOString().split('T')[0];
        return articleDate === targetDate;
      });

      if (todayNews.length === 0) {
        console.log("No news found for date:", targetDate);
        return this.generateFallbackSummaries();
      }

      // 按類別分組新聞
      const newsByCategory = this.groupNewsByCategory(todayNews);
      
      // 生成5大市場摘要
      const summaries: MarketSummary[] = [];
      const categories = ["總體經濟", "科技股", "能源商品", "加密貨幣", "金融股"];
      
      for (let i = 0; i < Math.min(5, categories.length); i++) {
        const category = categories[i];
        const categoryNews = newsByCategory[category] || [];
        
        if (categoryNews.length > 0) {
          const summary = await this.generateCategorySummary(category, categoryNews);
          summaries.push(summary);
        }
      }

      // 如果不足5個摘要，補充通用市場分析
      while (summaries.length < 5) {
        const additionalSummary = await this.generateAdditionalMarketInsight(summaries.length + 1, todayNews);
        summaries.push(additionalSummary);
      }

      // 儲存到資料庫
      await this.saveMarketSummaries(targetDate, summaries);

      return summaries;

    } catch (error) {
      console.error("Error generating top 5 market summaries:", error);
      return this.generateFallbackSummaries();
    }
  }

  private async generateCategorySummary(category: string, news: NewsArticle[]): Promise<MarketSummary> {
    const newsContent = news.slice(0, 5).map(article => 
      `標題: ${article.title}\n摘要: ${article.summary || ""}\n來源: ${article.source}`
    ).join("\n\n");

    const prompt = `
作為資深財經分析師，請分析以下${category}相關新聞，生成一份專業市場摘要：

${newsContent}

請以JSON格式回應，包含以下欄位：
{
  "title": "摘要標題（15字以內）",
  "content": "詳細分析內容（150-200字）",
  "impact": "high/medium/low（對市場影響程度）",
  "sentiment": "positive/negative/neutral",
  "keyPoints": ["重點1", "重點2", "重點3"],
  "relatedStocks": ["相關股票代號1", "相關股票代號2"]
}

重點要求：
1. 內容必須基於提供的新聞
2. 分析要專業且具可操作性
3. 明確指出投資機會與風險
4. 提及具體的股票代號（如果新聞中有）
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: this.financialAnalystPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 800
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        title: result.title || `${category}市場動態`,
        content: result.content || "暫無詳細分析",
        impact: result.impact || "medium",
        sentiment: result.sentiment || "neutral",
        keyPoints: result.keyPoints || [],
        relatedStocks: result.relatedStocks || []
      };

    } catch (error) {
      console.error(`Error generating summary for ${category}:`, error);
      return this.generateFallbackCategorySummary(category);
    }
  }

  private async generateAdditionalMarketInsight(index: number, allNews: NewsArticle[]): Promise<MarketSummary> {
    const insights = [
      "全球經濟展望",
      "市場風險評估", 
      "投資機會分析",
      "技術面觀察",
      "資金流向分析"
    ];

    const insightTitle = insights[index - 1] || "市場綜合分析";
    
    const newsContent = allNews.slice(0, 10).map(article => 
      `${article.title} - ${article.category}`
    ).join("\n");

    const prompt = `
基於今日新聞標題和市場動態，從「${insightTitle}」角度進行專業分析：

今日新聞概覽：
${newsContent}

請以JSON格式提供分析：
{
  "title": "${insightTitle}",
  "content": "150-200字的深度分析",
  "impact": "high/medium/low",
  "sentiment": "positive/negative/neutral", 
  "keyPoints": ["重點分析1", "重點分析2", "重點分析3"],
  "relatedStocks": ["建議關注股票"]
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: this.financialAnalystPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 600
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        title: result.title || insightTitle,
        content: result.content || "市場持續觀察中，建議保持謹慎樂觀態度。",
        impact: result.impact || "medium",
        sentiment: result.sentiment || "neutral",
        keyPoints: result.keyPoints || [],
        relatedStocks: result.relatedStocks || []
      };

    } catch (error) {
      console.error("Error generating additional insight:", error);
      return this.generateFallbackInsight(insightTitle);
    }
  }

  private groupNewsByCategory(news: NewsArticle[]): { [key: string]: NewsArticle[] } {
    const grouped: { [key: string]: NewsArticle[] } = {};
    
    news.forEach(article => {
      const category = article.category || "其他";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(article);
    });

    return grouped;
  }

  private async saveMarketSummaries(date: string, summaries: MarketSummary[]): Promise<void> {
    try {
      // 將5大摘要合併為一個完整的分析報告
      const fullReport = this.combineTop5Summaries(summaries);
      
      const aiSummary: InsertAiSummary = {
        date,
        category: "5大市場分析",
        content: fullReport,
        newsCount: summaries.length,
        keywords: this.extractKeywordsFromSummaries(summaries),
        sentiment: this.calculateOverallSentiment(summaries)
      };

      await storage.createAiSummary(aiSummary);
      
      // 同時儲存到檔案系統
      await fileStorageService.saveDailySummary(
        date,
        "top5_market_analysis",
        JSON.stringify(summaries, null, 2),
        {
          summaryCount: summaries.length,
          categories: summaries.map(s => s.title),
          overallSentiment: this.calculateOverallSentiment(summaries)
        }
      );

    } catch (error) {
      console.error("Error saving market summaries:", error);
    }
  }

  private combineTop5Summaries(summaries: MarketSummary[]): string {
    let report = "📊 今日5大市場重點分析\n\n";
    
    summaries.forEach((summary, index) => {
      const impactIcon = summary.impact === "high" ? "🔴" : summary.impact === "medium" ? "🟡" : "🟢";
      const sentimentIcon = summary.sentiment === "positive" ? "📈" : summary.sentiment === "negative" ? "📉" : "➡️";
      
      report += `${index + 1}. ${impactIcon} ${sentimentIcon} ${summary.title}\n`;
      report += `${summary.content}\n`;
      
      if (summary.keyPoints.length > 0) {
        report += `重點：${summary.keyPoints.slice(0, 2).join("、")}\n`;
      }
      
      if (summary.relatedStocks.length > 0) {
        report += `關注標的：${summary.relatedStocks.slice(0, 3).join("、")}\n`;
      }
      
      report += "\n";
    });

    return report;
  }

  private extractKeywordsFromSummaries(summaries: MarketSummary[]): string[] {
    const allKeywords = summaries.flatMap(s => [...s.keyPoints, ...s.relatedStocks]);
    return [...new Set(allKeywords)].slice(0, 10);
  }

  private calculateOverallSentiment(summaries: MarketSummary[]): string {
    const sentiments = summaries.map(s => s.sentiment);
    const positiveCount = sentiments.filter(s => s === "positive").length;
    const negativeCount = sentiments.filter(s => s === "negative").length;
    
    if (positiveCount > negativeCount) return "positive";
    if (negativeCount > positiveCount) return "negative";
    return "neutral";
  }

  private generateFallbackSummaries(): MarketSummary[] {
    return [
      {
        title: "美股市場觀察",
        content: "美股三大指數呈現震盪格局，投資人關注聯準會政策動向。科技股表現分歧，建議關注業績良好的龍頭股。",
        impact: "medium",
        sentiment: "neutral",
        keyPoints: ["聯準會政策", "科技股分歧", "業績關注"],
        relatedStocks: ["AAPL", "MSFT", "GOOGL"]
      },
      {
        title: "台股動態追蹤", 
        content: "台股受外資動向影響，半導體類股仍為市場焦點。建議投資人密切關注國際情勢對出口導向產業的影響。",
        impact: "medium",
        sentiment: "neutral", 
        keyPoints: ["外資動向", "半導體焦點", "出口影響"],
        relatedStocks: ["2330", "2454", "2317"]
      },
      {
        title: "原物料市場",
        content: "國際油價受地緣政治影響波動，黃金維持避險需求。投資人可考慮適度配置商品資產作為通脹對沖。",
        impact: "medium",
        sentiment: "neutral",
        keyPoints: ["油價波動", "黃金避險", "通脹對沖"], 
        relatedStocks: ["XOM", "CVX", "GLD"]
      },
      {
        title: "加密貨幣趨勢",
        content: "比特幣價格區間整理，市場等待更多機構資金進入。建議謹慎投資，注意風險控制。",
        impact: "low",
        sentiment: "neutral",
        keyPoints: ["區間整理", "機構資金", "風險控制"],
        relatedStocks: ["BTC", "ETH"]
      },
      {
        title: "總體經濟展望",
        content: "全球經濟成長放緩但通膨壓力緩解，央行政策步調趨於謹慎。建議多元化投資組合，平衡風險與收益。",
        impact: "high", 
        sentiment: "neutral",
        keyPoints: ["成長放緩", "通膨緩解", "多元投資"],
        relatedStocks: ["SPY", "VTI", "VXUS"]
      }
    ];
  }

  private generateFallbackCategorySummary(category: string): MarketSummary {
    return {
      title: `${category}市場動態`,
      content: `${category}市場持續發展中，建議投資人保持關注並適度參與。市場波動為常態，建議以長期投資角度進行配置。`,
      impact: "medium",
      sentiment: "neutral", 
      keyPoints: ["持續關注", "適度參與", "長期配置"],
      relatedStocks: []
    };
  }

  private generateFallbackInsight(title: string): MarketSummary {
    return {
      title,
      content: "市場持續演變中，建議投資人保持靈活應變的策略，並密切關注重要經濟數據發布。",
      impact: "medium",
      sentiment: "neutral",
      keyPoints: ["靈活應變", "數據關注", "策略調整"],
      relatedStocks: []
    };
  }

  // 保留原有方法
  async summarizeNews(articles: NewsArticle[], category: string): Promise<string> {
    if (!articles.length) {
      return "今日無相關新聞資訊。";
    }

    const newsContent = articles.map(article => 
      `標題: ${article.title}\n摘要: ${article.summary || ""}\n來源: ${article.source}\n---`
    ).join("\n");

    const prompt = `
請根據以下${category}相關的新聞內容，撰寫一份專業的市場分析摘要：

${newsContent}

請以繁體中文撰寫，包含以下要點：
1. 主要市場趨勢和關鍵事件
2. 對投資市場的潛在影響
3. 值得關注的風險和機會
4. 簡潔的投資建議

摘要應該專業、客觀，約200-300字。
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: this.financialAnalystPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return response.choices[0].message.content || "無法生成摘要。";
    } catch (error) {
      console.error("AI summarization error:", error);
      throw new Error("AI服務暫時無法使用，請稍後再試。");
    }
  }

  async analyzeSentiment(text: string): Promise<{
    sentiment: string;
    confidence: number;
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "你是情感分析專家。分析文本的情感傾向並返回JSON格式：{ \"sentiment\": \"positive/negative/neutral\", \"confidence\": 0.0-1.0 }"
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        sentiment: result.sentiment || "neutral",
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
      };
    } catch (error) {
      console.error("Sentiment analysis error:", error);
      return { sentiment: "neutral", confidence: 0.5 };
    }
  }

  async generateDailySummary(date: string): Promise<void> {
    const categories = ["總體經濟", "科技股", "能源商品", "加密貨幣"];
    
    for (const category of categories) {
      try {
        const articles = await storage.getNewsArticles(50, category);
        const todayArticles = articles.filter(article => {
          const articleDate = new Date(article.timestamp).toISOString().split('T')[0];
          return articleDate === date;
        });

        if (todayArticles.length > 0) {
          const summary = await this.summarizeNews(todayArticles, category);
          const sentiment = await this.analyzeSentiment(summary);

          const aiSummary: InsertAiSummary = {
            date,
            category,
            content: summary,
            newsCount: todayArticles.length,
            keywords: this.extractKeywords(todayArticles),
            sentiment: sentiment.sentiment
          };

          await storage.createAiSummary(aiSummary);
          
          // Save to local file storage for Streamlit access
          await fileStorageService.saveDailySummary(
            date, 
            category, 
            summary, 
            {
              newsCount: todayArticles.length,
              keywords: this.extractKeywords(todayArticles),
              sentiment: sentiment.sentiment
            }
          );
        }
      } catch (error) {
        console.error(`Error generating summary for ${category}:`, error);
      }
    }
  }

  private extractKeywords(articles: NewsArticle[]): string[] {
    const text = articles.map(a => `${a.title} ${a.summary || ""}`).join(" ");
    const keywords = text
      .toLowerCase()
      .match(/\b[\u4e00-\u9fff]+\b|\b[a-zA-Z]{3,}\b/g) || [];
    
    const counts = new Map<string, number>();
    keywords.forEach(word => {
      counts.set(word, (counts.get(word) || 0) + 1);
    });
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 5
      });
      return !!response.choices[0].message.content;
    } catch (error) {
      console.error("AI connection test failed:", error);
      return false;
    }
  }
}

export const aiService = new AIService();
