import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Worm, Bot, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function ConfigurationPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [crawlerConfig, setCrawlerConfig] = useState({
    keywords: "Fed, 央行, 利率, 通膨, 台積電",
    sources: {
      reuters: true,
      bloomberg: true,
      economicDaily: true
    },
    frequency: "每4小時"
  });

  const [aiConfig, setAiConfig] = useState({
    provider: "OpenAI GPT-4",
    connected: true
  });

  const { data: aiConnectionStatus, isLoading: connectionLoading } = useQuery({
    queryKey: ["/api/ai/test-connection"],
  });

  const { data: schedulerStatus } = useQuery({
    queryKey: ["/api/scheduler/status"],
  });

  const saveConfigMutation = useMutation({
    mutationFn: (config: any) => apiRequest("POST", "/api/config", config),
    onSuccess: () => {
      toast({
        title: "設定已儲存",
        description: "系統配置更新成功",
      });
    },
    onError: () => {
      toast({
        title: "儲存失敗",
        description: "無法儲存配置，請稍後再試",
        variant: "destructive",
      });
    },
  });

  const testAiConnectionMutation = useMutation({
    mutationFn: () => apiRequest("GET", "/api/ai/test-connection"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/test-connection"] });
      toast({
        title: "連接測試成功",
        description: "AI服務連接正常",
      });
    },
    onError: () => {
      toast({
        title: "連接測試失敗",
        description: "AI服務連接異常",
        variant: "destructive",
      });
    },
  });

  const triggerNewsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/scheduler/trigger-news"),
    onSuccess: () => {
      toast({
        title: "新聞抓取已啟動",
        description: "正在抓取最新新聞資訊",
      });
    }
  });

  const handleSaveConfig = () => {
    const config = {
      key: "system_config",
      value: JSON.stringify({ crawler: crawlerConfig, ai: aiConfig })
    };
    saveConfigMutation.mutate(config);
  };

  return (
    <section className="mb-12">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">系統設定與整合</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Crawler Configuration */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Worm className="mr-2 text-primary" />
                爬蟲設定
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="keywords" className="text-sm font-medium text-gray-700 mb-2 block">
                    關鍵字設定
                  </Label>
                  <Input
                    id="keywords"
                    placeholder="Fed, 央行, 利率, 通膨..."
                    value={crawlerConfig.keywords}
                    onChange={(e) => setCrawlerConfig({
                      ...crawlerConfig,
                      keywords: e.target.value
                    })}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">新聞來源</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="reuters"
                        checked={crawlerConfig.sources.reuters}
                        onCheckedChange={(checked) => setCrawlerConfig({
                          ...crawlerConfig,
                          sources: { ...crawlerConfig.sources, reuters: !!checked }
                        })}
                      />
                      <Label htmlFor="reuters" className="text-sm">Reuters</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="bloomberg"
                        checked={crawlerConfig.sources.bloomberg}
                        onCheckedChange={(checked) => setCrawlerConfig({
                          ...crawlerConfig,
                          sources: { ...crawlerConfig.sources, bloomberg: !!checked }
                        })}
                      />
                      <Label htmlFor="bloomberg" className="text-sm">Bloomberg</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="economicDaily"
                        checked={crawlerConfig.sources.economicDaily}
                        onCheckedChange={(checked) => setCrawlerConfig({
                          ...crawlerConfig,
                          sources: { ...crawlerConfig.sources, economicDaily: !!checked }
                        })}
                      />
                      <Label htmlFor="economicDaily" className="text-sm">經濟日報</Label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="frequency" className="text-sm font-medium text-gray-700 mb-2 block">
                    執行頻率
                  </Label>
                  <Select 
                    value={crawlerConfig.frequency} 
                    onValueChange={(value) => setCrawlerConfig({
                      ...crawlerConfig,
                      frequency: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="每小時">每小時</SelectItem>
                      <SelectItem value="每4小時">每4小時</SelectItem>
                      <SelectItem value="每日">每日</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => triggerNewsMutation.mutate()}
                  disabled={triggerNewsMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  立即執行新聞抓取
                </Button>
              </div>
            </div>

            {/* AI Integration */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Bot className="mr-2 text-primary" />
                AI整合設定
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="aiProvider" className="text-sm font-medium text-gray-700 mb-2 block">
                    AI服務提供商
                  </Label>
                  <Select 
                    value={aiConfig.provider}
                    onValueChange={(value) => setAiConfig({
                      ...aiConfig,
                      provider: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OpenAI GPT-4">OpenAI GPT-4</SelectItem>
                      <SelectItem value="Claude">Claude</SelectItem>
                      <SelectItem value="Google Gemini">Google Gemini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">連接狀態</Label>
                  {connectionLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        aiConnectionStatus?.connected ? 'bg-success' : 'bg-error'
                      }`} />
                      <span className={`text-sm font-medium ${
                        aiConnectionStatus?.connected ? 'text-success' : 'text-error'
                      }`}>
                        {aiConnectionStatus?.connected ? '已連接' : '連接失敗'}
                      </span>
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={() => testAiConnectionMutation.mutate()}
                  disabled={testAiConnectionMutation.isPending}
                  className="w-full bg-primary hover:bg-blue-700"
                >
                  {testAiConnectionMutation.isPending ? "測試中..." : "重新連接 AI 服務"}
                </Button>
                
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-sm text-yellow-800">
                    <p><strong>資料儲存說明:</strong></p>
                    <p className="mt-1">
                      新聞資料將儲存在本地檔案系統，每日摘要存放於 storage/summaries/ 目錄下。建議定期備份重要分析報告。
                    </p>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <p>系統版本: v1.0.0 | 最後更新: {new Date().toLocaleDateString("zh-TW")}</p>
              </div>
              <Button 
                onClick={handleSaveConfig}
                disabled={saveConfigMutation.isPending}
                className="bg-success hover:bg-green-700"
              >
                {saveConfigMutation.isPending ? "儲存中..." : "儲存設定"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
