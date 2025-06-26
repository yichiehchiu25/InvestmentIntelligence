import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Bot, Newspaper, Clock, ExternalLink, Brain } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { NewsArticle, AiSummary } from "@shared/schema";

export function NewsAggregationPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("總體經濟");

  const { data: news, isLoading: newsLoading } = useQuery<NewsArticle[]>({
    queryKey: ["/api/news", { limit: 20 }],
  });

  const { data: aiSummary, isLoading: summaryLoading } = useQuery<AiSummary>({
    queryKey: ["/api/ai-summaries/today"],
  });

  const updateNewsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/news/scrape"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
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

  const generateAiSummaryMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai-summaries/generate", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-summaries/today"] });
      toast({
        title: "AI分析完成",
        description: "今日市場分析摘要已生成",
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

  const categories = ["總體經濟", "科技股", "能源商品", "加密貨幣"];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "總體經濟":
        return "bg-primary bg-opacity-10 text-primary";
      case "科技股":
        return "bg-green-100 text-green-800";
      case "能源商品":
        return "bg-yellow-100 text-yellow-800";
      case "加密貨幣":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredNews = news?.filter(article => 
    activeCategory === "總體經濟" ? true : article.category === activeCategory
  ) || [];

  if (newsLoading && summaryLoading) {
    return (
      <section id="news" className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">新聞分析 & AI摘要</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="flex-grow">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section id="news" className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">新聞分析 & AI摘要</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Bot className="h-4 w-4" />
            <span>AI分析狀態: 已連接</span>
          </div>
          <Button 
            onClick={() => updateNewsMutation.mutate()}
            disabled={updateNewsMutation.isPending}
            className="bg-accent hover:bg-orange-600"
          >
            {updateNewsMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            更新分析
          </Button>
        </div>
      </div>

      {/* News Categories Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="text-sm">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* AI Summary Card */}
      <Card className="bg-gradient-to-r from-primary to-blue-600 text-white mb-8">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Brain className="h-6 w-6" />
              </div>
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-semibold mb-2">今日市場AI分析摘要</h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-4">
                {aiSummary?.content || "今日AI分析摘要正在生成中，請稍後查看。"}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-blue-100">
                  <span>
                    <Newspaper className="h-4 w-4 mr-1 inline" />
                    分析新聞: {aiSummary?.newsCount || 0}則
                  </span>
                  <span>
                    <Clock className="h-4 w-4 mr-1 inline" />
                    更新時間: {new Date().toLocaleTimeString("zh-TW", { 
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Taipei"
                    })}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:text-blue-200 hover:bg-white/10"
                  onClick={() => generateAiSummaryMutation.mutate()}
                  disabled={generateAiSummaryMutation.isPending}
                >
                  {generateAiSummaryMutation.isPending ? "生成中..." : "更新分析"}
                  <ExternalLink className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredNews.slice(0, 8).map((article) => (
          <Card key={article.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <Badge className={getCategoryColor(article.category)}>
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
                  className="text-primary hover:text-blue-700"
                  onClick={() => window.open(article.url, '_blank')}
                >
                  閱讀原文 <ExternalLink className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      <div className="text-center mt-8">
        <Button variant="outline" className="px-6 py-3">
          載入更多新聞
        </Button>
      </div>
    </section>
  );
}
