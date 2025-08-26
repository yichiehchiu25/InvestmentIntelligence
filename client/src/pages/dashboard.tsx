import { AppHeader } from "@/components/AppHeader";
import { FinancialCalendar } from "@/components/FinancialCalendar";
import { NewsAggregationPanel } from "@/components/NewsAggregationPanel";
import { StockWatchlistManager } from "@/components/StockWatchlistManager";
import { NewsKeywordManager } from "@/components/NewsKeywordManager";
import { 
  MarketOverviewWidget, 
  AdvancedChartWidget, 
  WatchlistWidget,
  SidebarMarketDataWidget,
  EconomicCalendarWidget,
  TradingViewSymbolSearch
} from "@/components/TradingViewWidgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Calendar, ChartBar, Settings, Star } from "lucide-react";

export default function Dashboard() {
  const [activeMarket, setActiveMarket] = useState<"taiwan" | "us">("taiwan");
  const [selectedStock, setSelectedStock] = useState("NASDAQ:AAPL");
  const [showSettings, setShowSettings] = useState(false);

  // Listen for market switch events from header
  useEffect(() => {
    const handleMarketSwitch = (event: CustomEvent) => {
      setActiveMarket(event.detail);
      // Update selected stock based on market
      if (event.detail === "taiwan") {
        setSelectedStock("TPE:2330"); // 台積電
      } else {
        setSelectedStock("NASDAQ:AAPL"); // Apple
      }
    };

    window.addEventListener('marketSwitch', handleMarketSwitch as EventListener);
    return () => {
      window.removeEventListener('marketSwitch', handleMarketSwitch as EventListener);
    };
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <AppHeader />
      
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Left Side - Main Content (3/4 width) */}
          <div className="xl:col-span-3 space-y-6">
            
            {/* Top Chart Section */}
            <Card className="h-[600px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-2xl font-bold">
                    {activeMarket === "taiwan" ? "台股市場總覽" : "美股市場總覽"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    即時股價走勢與技術分析圖表
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={activeMarket === "taiwan" ? "default" : "secondary"}>
                    {activeMarket === "taiwan" ? "台灣市場" : "美國市場"}
                  </Badge>
                  <div className="flex items-center space-x-1 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600">即時</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[520px]">
                <AdvancedChartWidget 
                  symbol={selectedStock} 
                  height="520" 
                  market={activeMarket}
                />
              </CardContent>
            </Card>

            {/* Market Overview Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBar className="h-5 w-5" />
                  市場概覽
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <MarketOverviewWidget height="400" market={activeMarket} />
              </CardContent>
            </Card>

            {/* News and Watchlist Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* News Board / Market Summary (Left - Green section) */}
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800">新聞摘要 / 市場總結</CardTitle>
                  <p className="text-green-600 text-sm">AI整理的今日重點新聞與市場動態</p>
                </CardHeader>
                <CardContent>
                  <NewsAggregationPanel />
                </CardContent>
              </Card>

              {/* Stocks Watchlist (Right - Blue section) */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800">
                    關注股票清單 ({activeMarket === "taiwan" ? "台股" : "美股"})
                  </CardTitle>
                  <p className="text-blue-600 text-sm">從TradingView監控清單顯示</p>
                </CardHeader>
                <CardContent className="p-0">
                  <WatchlistWidget height="400" market={activeMarket} />
                </CardContent>
              </Card>
            </div>

            {/* Financial Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  財經日曆
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <FinancialCalendar />
                  </div>
                  <div>
                    <EconomicCalendarWidget height="300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Macro Economic Data (1/4 width) */}
          <div className="xl:col-span-1 space-y-4">
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">宏觀經濟數據</CardTitle>
                <p className="text-sm text-muted-foreground">
                  即時經濟指標與重要數據
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Market Data Widgets */}
                <SidebarMarketDataWidget market={activeMarket} />
                
                {/* Key Economic Indicators */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">重要指標</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">CPI 年增率</p>
                        <p className="text-xs text-gray-500">消費者物價指數</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">3.2%</p>
                        <div className="flex items-center text-xs text-green-600">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +0.1%
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">
                          {activeMarket === "taiwan" ? "央行利率" : "聯準會利率"}
                        </p>
                        <p className="text-xs text-gray-500">基準利率</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {activeMarket === "taiwan" ? "1.875%" : "5.25%"}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <span>持平</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">黃金價格</p>
                        <p className="text-xs text-gray-500">每盎司美元</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">$2,031</p>
                        <div className="flex items-center text-xs text-red-600">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          -0.8%
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">美元指數</p>
                        <p className="text-xs text-gray-500">DXY</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">104.25</p>
                        <div className="flex items-center text-xs text-green-600">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +0.3%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-medium text-sm text-gray-700">快速操作</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <ChartBar className="w-4 h-4 mr-2" />
                      數據分析
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      設定提醒
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      管理設定
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                系統設定與管理
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                管理您的股票追蹤清單和新聞關鍵字設定
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="watchlist" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="watchlist" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    追蹤清單管理
                  </TabsTrigger>
                  <TabsTrigger value="keywords" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    新聞關鍵字管理
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="watchlist" className="mt-6">
                  <StockWatchlistManager 
                    currentMarket={activeMarket}
                    onStockSelect={setSelectedStock}
                  />
                </TabsContent>
                <TabsContent value="keywords" className="mt-6">
                  <NewsKeywordManager />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Bottom Section - Detailed Stock Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>個股詳細資訊</CardTitle>
            <p className="text-sm text-muted-foreground">
              點擊上方監控清單中的股票查看詳細圖表
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* This section will be populated with individual stock charts */}
            {(activeMarket === "taiwan" ? 
              [
                { symbol: "TPE:2330", name: "台積電", price: "NT$598", change: "+1.2%" },
                { symbol: "TPE:2454", name: "聯發科", price: "NT$742", change: "-0.8%" },
                { symbol: "TPE:2317", name: "鴻海", price: "NT$106", change: "+2.1%" }
              ] : 
              [
                { symbol: "NASDAQ:AAPL", name: "Apple Inc.", price: "$175.43", change: "+0.9%" },
                { symbol: "NASDAQ:MSFT", name: "Microsoft", price: "$378.85", change: "+1.2%" },
                { symbol: "NASDAQ:GOOGL", name: "Alphabet", price: "$138.21", change: "-0.3%" }
              ]
            ).map((stock, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedStock(stock.symbol)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{stock.name}</h4>
                    <Badge variant={stock.change.startsWith('+') ? 'default' : 'destructive'}>
                      {stock.change}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold">{stock.price}</p>
                  <p className="text-sm text-gray-500">{stock.symbol}</p>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
