import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TradingViewSymbolSearchProps {
  isOpen: boolean;
  onClose: () => void;
  market: "taiwan" | "us";
  onSymbolAdd?: (symbol: string, displayName: string) => void;
}

interface WatchlistStock {
  symbol: string;
  displayName: string;
  price?: number;
  change?: number;
  changePercent?: number;
}

export function TradingViewSymbolSearch({ 
  isOpen, 
  onClose, 
  market,
  onSymbolAdd 
}: TradingViewSymbolSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [selectedSymbol, setSelectedSymbol] = useState<{symbol: string, description: string} | null>(null);

  // Load the symbol search widget
  useEffect(() => {
    if (isOpen && containerRef.current) {
      // Clear previous content
      containerRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-search.js';
      script.async = true;
      
      const config = {
        "width": "100%",
        "height": "400",
        "defaultCategory": market === "taiwan" ? "taiwan" : "america",
        "showPopupButton": false,
        "locale": "zh_TW",
        "largeChartUrl": ""
      };
      
      script.innerHTML = JSON.stringify(config);
      containerRef.current.appendChild(script);

      // Listen for symbol selection (TradingView widget communication)
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.name === 'symbol-search') {
          const symbol = event.data.data;
          if (symbol && symbol.symbol && symbol.description) {
            setSelectedSymbol({
              symbol: symbol.symbol,
              description: symbol.description
            });
          }
        }
      };

      window.addEventListener('message', handleMessage);
      
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [isOpen, market]);

  const handleAddToWatchlist = () => {
    if (!selectedSymbol) {
      toast({
        title: "請選擇股票",
        description: "請先從搜尋結果中選擇一個股票",
        variant: "destructive",
      });
      return;
    }

    // Load current watchlist
    const savedWatchlist = localStorage.getItem(`watchlist_${market}`);
    let currentWatchlist: WatchlistStock[] = [];
    
    if (savedWatchlist) {
      try {
        currentWatchlist = JSON.parse(savedWatchlist);
      } catch (error) {
        console.error("Error loading watchlist:", error);
      }
    }

    // Check if symbol already exists
    const isAlreadyAdded = currentWatchlist.some(stock => stock.symbol === selectedSymbol.symbol);
    
    if (isAlreadyAdded) {
      toast({
        title: "股票已存在",
        description: `${selectedSymbol.description} 已在關注清單中`,
        variant: "destructive",
      });
      return;
    }

    // Add new stock
    const newStock: WatchlistStock = {
      symbol: selectedSymbol.symbol,
      displayName: selectedSymbol.description,
    };

    const updatedWatchlist = [...currentWatchlist, newStock];
    localStorage.setItem(`watchlist_${market}`, JSON.stringify(updatedWatchlist));

    toast({
      title: "股票已添加",
      description: `${selectedSymbol.description} 已加入${market === "taiwan" ? "台股" : "美股"}關注清單`,
    });

    // Callback to parent component
    if (onSymbolAdd) {
      onSymbolAdd(selectedSymbol.symbol, selectedSymbol.description);
    }

    // Reset and close
    setSelectedSymbol(null);
    onClose();

    // Trigger page refresh to update watchlist widget
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            搜尋{market === "taiwan" ? "台股" : "美股"}標的
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* TradingView Symbol Search Widget */}
          <div 
            ref={containerRef} 
            className="w-full h-[400px] border rounded-lg"
          />
          
          {/* Selected Symbol Display */}
          {selectedSymbol && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">已選擇:</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{selectedSymbol.symbol}</p>
                  <p className="text-sm text-gray-600">{selectedSymbol.description}</p>
                </div>
                <Button 
                  onClick={handleAddToWatchlist}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  加入關注清單
                </Button>
              </div>
            </div>
          )}

          {/* Manual Input Section */}
          <div className="p-4 bg-gray-50 border rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              提示: 請在上方搜尋視窗中點選股票，然後點擊"加入關注清單"按鈕
            </p>
            <p className="text-xs text-gray-500">
              支援格式範例: {market === "taiwan" ? "TPE:2330 (台積電)" : "NASDAQ:AAPL (Apple Inc)"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}