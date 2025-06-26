import OpenAI from "openai";
import { storage } from "../storage";
import { fileStorageService } from "./fileStorageService";
import type { NewsArticle, InsertAiSummary } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export class AIService {
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
            content: "你是一位專業的金融分析師，擅長解讀市場新聞並提供投資洞察。"
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
