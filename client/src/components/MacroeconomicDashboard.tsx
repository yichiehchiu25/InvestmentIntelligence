import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ChartBar, Percent, Landmark, Coins, TrendingUp, TrendingDown } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EconomicIndicator } from "@shared/schema";

export function MacroeconomicDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: indicators, isLoading } = useQuery<EconomicIndicator[]>({
    queryKey: ["/api/economic-indicators"],
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/economic-indicators/refresh"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/economic-indicators"] });
      toast({
        title: "數據更新成功",
        description: "經濟指標已更新至最新數據",
      });
    },
    onError: () => {
      toast({
        title: "更新失敗",
        description: "無法更新經濟指標，請稍後再試",
        variant: "destructive",
      });
    },
  });

  const getIcon = (category: string) => {
    switch (category) {
      case "inflation":
        return <ChartBar className="text-primary" />;
      case "interest_rate":
        return <Percent className="text-primary" />;
      case "currency":
        return <Landmark className="text-primary" />;
      case "commodity":
        return <Coins className="text-primary" />;
      default:
        return <ChartBar className="text-primary" />;
    }
  };

  const getChangeIcon = (change: string) => {
    if (change?.includes("+") || change?.includes("↑")) {
      return <TrendingUp className="h-4 w-4 text-success" />;
    } else if (change?.includes("-") || change?.includes("↓")) {
      return <TrendingDown className="h-4 w-4 text-error" />;
    }
    return null;
  };

  const getChangeColor = (change: string) => {
    if (change?.includes("+") || change?.includes("↑")) {
      return "text-success";
    } else if (change?.includes("-") || change?.includes("↓")) {
      return "text-error";
    }
    return "text-gray-500";
  };

  if (isLoading) {
    return (
      <section id="dashboard" className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">宏觀經濟指標</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <CardContent className="p-0">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="dashboard" className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">宏觀經濟指標</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <RefreshCw className="h-4 w-4" />
            <span>最後更新: {new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}</span>
          </div>
          <Button 
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="bg-primary hover:bg-blue-700"
          >
            {refreshMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            更新數據
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {indicators?.map((indicator) => (
          <Card key={indicator.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">{indicator.name}</h3>
                {getIcon(indicator.category)}
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-semibold text-gray-900">{indicator.value}</span>
                {indicator.change && (
                  <span className={`text-sm flex items-center ${getChangeColor(indicator.change)}`}>
                    {getChangeIcon(indicator.change)}
                    <span className="ml-1">{indicator.change}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{indicator.period}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder for charts - would need chart library integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">美元指數走勢</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">圖表將在此顯示</p>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">主要商品期貨</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">圖表將在此顯示</p>
          </div>
        </Card>
      </div>
    </section>
  );
}
