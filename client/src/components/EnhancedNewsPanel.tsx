import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  RefreshCw, 
  Bot, 
  Newspaper, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Target,
  ExternalLink,
  Shield,
  Brain,
  BarChart3,
  Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { NewsArticle } from "@shared/schema";

interface ProfessionalAnalysis {
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
}

export function EnhancedNewsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("analysis");

  // 獲取專業分析
  const { data: professionalAnalysis, isLoading: analysisLoading } = useQuery<ProfessionalAnalysis>({
    queryKey: ["/api/ai-summaries/professional/today"],
  });

  // 獲取新聞列表
  const { data: news, isLoading: newsLoading } = useQuery<NewsArticle[]>({
    queryKey: ["/api/news", { limit: 20 }],
  });

  // 生成新分析
  const generateAnalysisMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai-summaries/professional", { limit: 20 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-summaries/professional/today"] });
      toast({
        title: "專業分析完成",
        description: "最新市場分析已生成",
      });
    },
    onError: () => {
      toast({
        title: "分析失敗",
        description: "專業分析服務暫時無法使用",
        variant: "destructive",
      });
    },
  });

  // 刷新新聞
  const refreshNewsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/news/enhanced-scrape"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({
        title: "新聞更新完成",
        description: "最新新聞已抓取完成",
      });
    },
    onError: () => {
      toast({
        title: "更新失敗",
        description: "新聞抓取服務暫時無法使用",
        variant: "destructive",
      });
    },
  });

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "樂觀":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "謹慎":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "樂觀":
        return "bg-green-100 text-green-800 border-green-200";
      case "謹慎":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "高":
        return "bg-red-500";
      case "中":
        return "bg-yellow-500";
      case "低":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "正面":
        return "text-green-600 bg-green-50";
      case "負面":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getCredibilityBadge = (credibility: string) => {
    const colors = {
      "高": "bg-green-100 text-green-800",
      "中": "bg-yellow-100 text-yellow-800",
      "低": "bg-red-100 text-red-800"
    };
    return colors[credibility as keyof typeof colors] || colors["中"];
  };

  if (analysisLoading && newsLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-xl">AI專業財經分析</CardTitle>
            <Badge variant="outline" className="text-xs">
              Perplexity風格
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshNewsMutation.mutate()}
              disabled={refreshNewsMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshNewsMutation.isPending ? 'animate-spin' : ''}`} />
              更新新聞
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => generateAnalysisMutation.mutate()}
              disabled={generateAnalysisMutation.isPending}
            >
              <Bot className={`h-4 w-4 mr-2 ${generateAnalysisMutation.isPending ? 'animate-pulse' : ''}`} />
              重新分析
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              專業分析
            </TabsTrigger>
            <TabsTrigger value="headlines" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              關鍵新聞
            </TabsTrigger>
            <TabsTrigger value="sources" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              資料來源
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="mt-6 space-y-6">
            {professionalAnalysis ? (
              <>
                {/* 執行摘要 */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    執行摘要
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {professionalAnalysis.executiveSummary}
                  </p>
                </div>

                {/* 市場情緒分析 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getSentimentIcon(professionalAnalysis.marketAnalysis.sentiment)}
                        市場情緒分析
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">市場情緒</span>
                        <Badge className={getSentimentColor(professionalAnalysis.marketAnalysis.sentiment)}>
                          {professionalAnalysis.marketAnalysis.sentiment}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>信心指數</span>
                          <span className="font-medium">{professionalAnalysis.marketAnalysis.confidence}%</span>
                        </div>
                        <Progress 
                          value={professionalAnalysis.marketAnalysis.confidence} 
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">主要驅動因素</h4>
                        <ul className="space-y-1">
                          {professionalAnalysis.marketAnalysis.keyDrivers.map((driver, index) => (
                            <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                              <span className="w-1 h-1 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></span>
                              {driver}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 風險評估 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        風險評估
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">風險等級</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getRiskLevelColor(professionalAnalysis.riskAssessment.level)}`}></div>
                          <span className="text-sm font-medium">{professionalAnalysis.riskAssessment.level}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">主要風險因素</h4>
                        <ul className="space-y-1">
                          {professionalAnalysis.riskAssessment.factors.map((factor, index) => (
                            <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                              <AlertTriangle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 行業焦點 */}
                {professionalAnalysis.sectorsInFocus.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        行業焦點
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {professionalAnalysis.sectorsInFocus.map((sector, index) => (
                          <div key={index} className={`p-3 rounded-lg border ${getImpactColor(sector.impact)}`}>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{sector.sector}</h4>
                              <Badge size="sm" variant="outline">
                                {sector.impact}
                              </Badge>
                            </div>
                            <p className="text-xs opacity-90">{sector.outlook}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 投資啟示 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-600" />
                      投資啟示
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {professionalAnalysis.investmentImplications.map((implication, index) => (
                        <li key={index} className="flex items-start gap-3 p-2 bg-green-50 rounded-md">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700">{implication}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">暫無專業分析數據</p>
                <Button 
                  className="mt-4"
                  onClick={() => generateAnalysisMutation.mutate()}
                  disabled={generateAnalysisMutation.isPending}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  生成分析
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="headlines" className="mt-6">
            {professionalAnalysis?.keyHeadlines ? (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-blue-600" />
                  今日5大關鍵新聞
                </h3>
                {professionalAnalysis.keyHeadlines.map((headline, index) => (
                  <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 leading-tight">{headline}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">來自AI分析篩選</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">暫無關鍵新聞數據</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sources" className="mt-6">
            {professionalAnalysis?.sources ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  資料來源可信度分析
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {professionalAnalysis.sources.map((source, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{source.name}</h4>
                        <Badge className={getCredibilityBadge(source.credibility)}>
                          {source.credibility}可信度
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <ExternalLink className="h-3 w-3" />
                        <span>資料來源驗證</span>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    * 可信度評估基於新聞來源的歷史準確性、編輯品質與業界聲譽
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">暫無資料來源分析</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}