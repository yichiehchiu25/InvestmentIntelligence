import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Bot, Newspaper, Clock, ExternalLink, Brain, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { NewsArticle, AiSummary } from "@shared/schema";

interface MarketSummary {
  title: string;
  content: string;
  impact: "high" | "medium" | "low";
  sentiment: "positive" | "negative" | "neutral";
  keyPoints: string[];
  relatedStocks: string[];
}

export function NewsAggregationPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("AI摘要");
  const [expandedSummary, setExpandedSummary] = useState<number | null>(null);

  const { data: news, isLoading: newsLoading } = useQuery<NewsArticle[]>({
    queryKey: ["/api/news", { limit: 20 }],
  });

  const { data: top5Summaries, isLoading: top5Loading } = useQuery<MarketSummary[]>({
    queryKey: ["/api/ai-summaries/top5-market"],
  });

  const { data: marketSentiment, isLoading: sentimentLoading } = useQuery<{positive: number, negative: number, neutral: number}>({
    queryKey: ["/api/news/sentiment"],
  });

  const generateTop5Mutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai-summaries/generate-top5", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-summaries/top5-market"] });
      toast({
        title: "AI分析完成",
        description: "5大市場摘要已更新",
      });
    },
    onError: () => {
      toast({
        title: "分析失敗",
        description: "AI分析服務暫時無法使用",
        variant: "destructive",
      });
    },
  });

  const updateNewsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/news/enhanced-scrape"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news/sentiment"] });
      toast({
        title: "新聞更新成功",
        description: "最新新聞已抓取完成",
      });
    },
    onError: () => {
      toast({
        title: "更新失敗",
        description: "無法更新新聞，請稍後再試",
        variant: "destructive",
      });
    },
  });

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-red-100 border-red-300 text-red-800";
      case "medium": return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "low": return "bg-green-100 border-green-300 text-green-800";
      default: return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "negative": return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "text-green-600 bg-green-50";
      case "negative": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const categories = ["AI摘要", "總體經濟", "科技股", "能源商品", "加密貨幣"];

  const filteredNews = news?.filter(article => 
    activeCategory === "AI摘要" ? true : article.category === activeCategory
  ) || [];

  if (newsLoading && top5Loading) {
    return (
      <section id="news" className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">市場洞察 & 新聞分析</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start space-x-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-grow">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section id="news" className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">市場洞察</h2>
          <p className="text-sm text-gray-600 mt-1">AI驅動的財經新聞分析與市場摘要</p>
        </div>
        <div className="flex items-center space-x-4">
          {!sentimentLoading && marketSentiment && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-500">市場情緒:</span>
              <div className="flex space-x-1">
                <Badge variant="outline" className="text-green-600">
                  樂觀 {marketSentiment.positive}%
                </Badge>
                <Badge variant="outline" className="text-red-600">
                  謹慎 {marketSentiment.negative}%
                </Badge>
                <Badge variant="outline" className="text-gray-600">
                  中性 {marketSentiment.neutral}%
                </Badge>
              </div>
            </div>
          )}
          <Button 
            onClick={() => generateTop5Mutation.mutate()}
            disabled={generateTop5Mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {generateTop5Mutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            更新分析
          </Button>
          <Button 
            onClick={() => updateNewsMutation.mutate()}
            disabled={updateNewsMutation.isPending}
            variant="outline"
          >
            {updateNewsMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            更新新聞
          </Button>
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="text-sm">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="AI摘要" className="space-y-6">
          {/* 5大市場分析 - Perplexity風格 */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6" />
                今日5大市場重點分析
              </CardTitle>
              <p className="text-blue-100 text-sm">
                AI財經分析師為您解讀市場動態與投資機會
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {top5Loading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {top5Summaries?.map((summary, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{summary.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getImpactColor(summary.impact)}>
                                影響: {summary.impact === "high" ? "高" : summary.impact === "medium" ? "中" : "低"}
                              </Badge>
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getSentimentColor(summary.sentiment)}`}>
                                {getSentimentIcon(summary.sentiment)}
                                <span className="text-xs font-medium">
                                  {summary.sentiment === "positive" ? "看漲" : summary.sentiment === "negative" ? "看跌" : "中性"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedSummary(expandedSummary === index ? null : index)}
                        >
                          {expandedSummary === index ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed mb-3">
                        {summary.content}
                      </p>

                      {expandedSummary === index && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                          {summary.keyPoints.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">重點摘要:</h4>
                              <ul className="space-y-1">
                                {summary.keyPoints.map((point, pointIndex) => (
                                  <li key={pointIndex} className="flex items-start gap-2 text-sm text-gray-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {summary.relatedStocks.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">相關標的:</h4>
                              <div className="flex flex-wrap gap-2">
                                {summary.relatedStocks.map((stock, stockIndex) => (
                                  <Badge key={stockIndex} variant="secondary" className="text-xs">
                                    {stock}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 最新新聞動態 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-gray-600" />
                最新新聞動態
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredNews.slice(0, 6).map((article) => (
                  <div key={article.id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 line-clamp-2 leading-snug">
                          {article.title}
                        </h4>
                        <Badge variant="outline" className="ml-2 flex-shrink-0">
                          {article.category}
                        </Badge>
                      </div>
                      {article.summary && (
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500 gap-3">
                          <span>{article.source}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(article.timestamp).toLocaleString("zh-TW", {
                              month: "numeric",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-800 h-auto p-1"
                          onClick={() => window.open(article.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 其他分類的新聞 */}
        {categories.slice(1).map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredNews.slice(0, 8).map((article) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className="bg-blue-100 text-blue-800">
                        {article.category}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(article.timestamp).toLocaleString("zh-TW", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Taipei"
                        })}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {article.title}
                    </h4>
                    {article.summary && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                          <Newspaper className="h-3 w-3" />
                        </div>
                        <span>{article.source}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => window.open(article.url, '_blank')}
                      >
                        閱讀原文 <ExternalLink className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
