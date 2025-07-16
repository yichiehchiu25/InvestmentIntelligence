import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Minus, Star, Search, TrendingUp, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WatchlistStock {
  symbol: string;
  displayName: string;
  market: "taiwan" | "us";
  addedAt: Date;
}

interface StockWatchlistManagerProps {
  onStockSelect?: (symbol: string) => void;
  currentMarket: "taiwan" | "us";
}

export function StockWatchlistManager({ onStockSelect, currentMarket }: StockWatchlistManagerProps) {
  const { toast } = useToast();
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchSymbol, setSearchSymbol] = useState("");
  const [searchName, setSearchName] = useState("");

  // 預設的熱門股票選項
  const popularStocks = {
    taiwan: [
      { symbol: "TPE:2330", name: "台積電" },
      { symbol: "TPE:2454", name: "聯發科" },
      { symbol: "TPE:2317", name: "鴻海" },
      { symbol: "TPE:2603", name: "長榮" },
      { symbol: "TPE:3008", name: "大立光" },
      { symbol: "TPE:2002", name: "中鋼" },
      { symbol: "TPE:1301", name: "台塑" },
      { symbol: "TPE:2881", name: "富邦金" },
      { symbol: "TPE:2886", name: "兆豐金" },
      { symbol: "TPE:2412", name: "中華電" }
    ],
    us: [
      { symbol: "NASDAQ:AAPL", name: "Apple Inc." },
      { symbol: "NASDAQ:MSFT", name: "Microsoft" },
      { symbol: "NASDAQ:GOOGL", name: "Alphabet" },
      { symbol: "NASDAQ:TSLA", name: "Tesla" },
      { symbol: "NASDAQ:AMZN", name: "Amazon" },
      { symbol: "NASDAQ:META", name: "Meta" },
      { symbol: "NASDAQ:NVDA", name: "NVIDIA" },
      { symbol: "NYSE:JPM", name: "JPMorgan Chase" },
      { symbol: "NYSE:V", name: "Visa" },
      { symbol: "NYSE:JNJ", name: "Johnson & Johnson" }
    ]
  };

  // 從 localStorage 載入追蹤清單
  useEffect(() => {
    const savedWatchlist = localStorage.getItem(`watchlist_${currentMarket}`);
    if (savedWatchlist) {
      try {
        const parsed = JSON.parse(savedWatchlist);
        setWatchlist(parsed.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        })));
      } catch (error) {
        console.error("Error loading watchlist:", error);
      }
    } else {
      // 初始化預設追蹤清單
      const defaultStocks = popularStocks[currentMarket].slice(0, 3).map(stock => ({
        symbol: stock.symbol,
        displayName: stock.name,
        market: currentMarket,
        addedAt: new Date()
      }));
      setWatchlist(defaultStocks);
    }
  }, [currentMarket]);

  // 儲存追蹤清單到 localStorage
  useEffect(() => {
    localStorage.setItem(`watchlist_${currentMarket}`, JSON.stringify(watchlist));
  }, [watchlist, currentMarket]);

  const addToWatchlist = (symbol: string, displayName: string) => {
    const isAlreadyAdded = watchlist.some(stock => stock.symbol === symbol);
    
    if (isAlreadyAdded) {
      toast({
        title: "股票已在追蹤清單中",
        description: `${displayName} 已經在您的追蹤清單中`,
        variant: "destructive",
      });
      return;
    }

    const newStock: WatchlistStock = {
      symbol,
      displayName,
      market: currentMarket,
      addedAt: new Date()
    };

    setWatchlist(prev => [...prev, newStock]);
    
    toast({
      title: "新增成功",
      description: `${displayName} 已加入追蹤清單`,
    });

    setIsAddDialogOpen(false);
    setSearchSymbol("");
    setSearchName("");
  };

  const removeFromWatchlist = (symbol: string) => {
    const stock = watchlist.find(s => s.symbol === symbol);
    setWatchlist(prev => prev.filter(stock => stock.symbol !== symbol));
    
    toast({
      title: "移除成功",
      description: `${stock?.displayName} 已從追蹤清單移除`,
    });
  };

  const addCustomStock = () => {
    if (!searchSymbol.trim() || !searchName.trim()) {
      toast({
        title: "請填寫完整資訊",
        description: "請輸入股票代號和名稱",
        variant: "destructive",
      });
      return;
    }

    const prefix = currentMarket === "taiwan" ? "TPE:" : "NASDAQ:";
    const fullSymbol = searchSymbol.includes(":") ? searchSymbol : `${prefix}${searchSymbol}`;
    
    addToWatchlist(fullSymbol, searchName);
  };

  const handleStockClick = (symbol: string) => {
    if (onStockSelect) {
      onStockSelect(symbol);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            我的追蹤清單 ({currentMarket === "taiwan" ? "台股" : "美股"})
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                新增追蹤
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>新增股票到追蹤清單</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* 自定義輸入 */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    自定義股票
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="stock-symbol">股票代號</Label>
                      <Input
                        id="stock-symbol"
                        placeholder={currentMarket === "taiwan" ? "例如: 2330" : "例如: AAPL"}
                        value={searchSymbol}
                        onChange={(e) => setSearchSymbol(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock-name">股票名稱</Label>
                      <Input
                        id="stock-name"
                        placeholder={currentMarket === "taiwan" ? "例如: 台積電" : "例如: Apple Inc."}
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={addCustomStock}
                      className="w-full"
                      disabled={!searchSymbol.trim() || !searchName.trim()}
                    >
                      新增到追蹤清單
                    </Button>
                  </div>
                </div>

                {/* 熱門股票快速新增 */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    熱門股票
                  </h4>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {popularStocks[currentMarket].map((stock) => {
                      const isAlreadyAdded = watchlist.some(w => w.symbol === stock.symbol);
                      return (
                        <Button
                          key={stock.symbol}
                          variant={isAlreadyAdded ? "secondary" : "outline"}
                          className="justify-between h-auto p-3"
                          onClick={() => addToWatchlist(stock.symbol, stock.name)}
                          disabled={isAlreadyAdded}
                        >
                          <div className="text-left">
                            <div className="font-medium">{stock.name}</div>
                            <div className="text-sm text-muted-foreground">{stock.symbol}</div>
                          </div>
                          {isAlreadyAdded ? (
                            <Badge variant="secondary">已追蹤</Badge>
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          {watchlist.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>還沒有追蹤任何股票</p>
              <p className="text-sm">點擊上方「新增追蹤」開始建立您的清單</p>
            </div>
          ) : (
            watchlist.map((stock) => (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleStockClick(stock.symbol)}
              >
                <div className="flex-1">
                  <div className="font-medium">{stock.displayName}</div>
                  <div className="text-sm text-muted-foreground">
                    {stock.symbol} • 追蹤於 {stock.addedAt.toLocaleDateString("zh-TW")}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWatchlist(stock.symbol);
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}