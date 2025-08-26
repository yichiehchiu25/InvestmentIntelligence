import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CalendarPlus, ChevronLeft, ChevronRight, Building, University, TrendingUp, BarChart3, DollarSign, Clock } from "lucide-react";
import type { CalendarEvent } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface EarningsEvent {
  symbol: string;
  companyName: string;
  earningsTime: "before-market" | "after-market" | "during-market";
  date: string;
  expectedEPS?: string;
  revenue?: string;
  marketCap?: string;
}

interface EconomicEvent {
  title: string;
  date: string;
  time: string;
  importance: "high" | "medium" | "low";
  country: string;
  previous?: string;
  forecast?: string;
  actual?: string;
}

export function FinancialCalendar() {
  const { data: events, isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar-events/upcoming"],
  });

  // 從API獲取真實財報數據
  const { data: earnings, isLoading: earningsLoading } = useQuery<EarningsEvent[]>({
    queryKey: ["/api/earnings/upcoming"],
    staleTime: 30 * 60 * 1000, // 30分鐘快取
  });

  // 從API獲取經濟事件數據
  const { data: economicEvents, isLoading: economicLoading } = useQuery<EconomicEvent[]>({
    queryKey: ["/api/economic-events/upcoming"],
    staleTime: 60 * 60 * 1000, // 1小時快取
  });

  const getEarningsTimeColor = (earningsTime: string) => {
    switch (earningsTime) {
      case "before-market":
        return "bg-blue-100 text-blue-800";
      case "after-market":
        return "bg-purple-100 text-purple-800";
      case "during-market":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEarningsTimeText = (earningsTime: string) => {
    switch (earningsTime) {
      case "before-market":
        return "盤前";
      case "after-market":
        return "盤後";
      case "during-market":
        return "盤中";
      default:
        return "未定";
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getImportanceText = (importance: string) => {
    switch (importance) {
      case "high":
        return "高";
      case "medium":
        return "中";
      case "low":
        return "低";
      default:
        return "-";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.getMonth() + 1,
      day: date.getDate(),
      weekday: date.toLocaleDateString("zh-TW", { weekday: "short" })
    };
  };

  if (isLoading || earningsLoading || economicLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">財經日曆</h2>
          <p className="text-sm text-gray-600 mt-1">本週重要財報公布與經濟數據</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">本週</span>
          <Button variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="earnings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="earnings" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            企業財報
          </TabsTrigger>
          <TabsTrigger value="economic" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            經濟數據
          </TabsTrigger>
          <TabsTrigger value="fed" className="flex items-center gap-2">
            <University className="h-4 w-4" />
            央行會議
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                本週企業財報發布
              </CardTitle>
            </CardHeader>
                         <CardContent>
               <div className="space-y-4">
                 {(earnings || []).map((earning, index) => {
                  const dateInfo = formatDate(earning.date);
                  return (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-sm text-gray-500">{dateInfo.weekday}</div>
                          <div className="text-lg font-bold">{dateInfo.month}/{dateInfo.day}</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-bold text-lg">{earning.symbol}</span>
                            <Badge className={getEarningsTimeColor(earning.earningsTime)}>
                              {getEarningsTimeText(earning.earningsTime)}
                            </Badge>
                          </div>
                          <div className="text-gray-600">{earning.companyName}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            市值: {earning.marketCap}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">預期EPS</div>
                          <div className="font-semibold">{earning.expectedEPS}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="economic" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                重要經濟數據發布
              </CardTitle>
            </CardHeader>
                         <CardContent>
               <div className="space-y-4">
                 {(economicEvents || []).map((event, index) => {
                  const dateInfo = formatDate(event.date);
                  return (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-sm text-gray-500">{dateInfo.weekday}</div>
                          <div className="text-lg font-bold">{dateInfo.month}/{dateInfo.day}</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold">{event.title}</span>
                            <Badge className={getImportanceColor(event.importance)}>
                              重要度: {getImportanceText(event.importance)}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.time}
                            </span>
                            <span>{event.country}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-right text-sm">
                          {event.previous && (
                            <div>
                              <div className="text-gray-500">前值</div>
                              <div className="font-medium">{event.previous}</div>
                            </div>
                          )}
                          {event.forecast && (
                            <div>
                              <div className="text-gray-500">預期</div>
                              <div className="font-medium">{event.forecast}</div>
                            </div>
                          )}
                          {event.actual && (
                            <div>
                              <div className="text-gray-500">實際</div>
                              <div className="font-bold text-green-600">{event.actual}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <University className="h-5 w-5 text-red-600" />
                央行會議與貨幣政策
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-200">
                  <div className="flex items-center space-x-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-sm text-gray-500">週三</div>
                      <div className="text-lg font-bold">1/29</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-red-800 mb-1">聯邦公開市場委員會 (FOMC)</div>
                      <div className="text-red-700">利率決議 & 政策聲明</div>
                      <div className="text-sm text-red-600 mt-1">
                        預期維持利率 5.25% - 5.50%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-red-600">台北時間</div>
                      <div className="font-bold text-red-800">02:00</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-center space-x-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-sm text-gray-500">週四</div>
                      <div className="text-lg font-bold">1/30</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-blue-800 mb-1">Powell 記者會</div>
                      <div className="text-blue-700">聯準會主席談話</div>
                      <div className="text-sm text-blue-600 mt-1">
                        經濟展望與政策說明
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-600">台北時間</div>
                      <div className="font-bold text-blue-800">02:30</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
