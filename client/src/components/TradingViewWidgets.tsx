import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface TradingViewWidgetProps {
  symbol?: string;
  width?: string;
  height?: string;
  interval?: string;
  theme?: "light" | "dark";
  market?: "taiwan" | "us";
}

interface TradingViewSearchProps {
  onSymbolSelect?: (symbol: string, name: string) => void;
  market?: "taiwan" | "us";
  theme?: "light" | "dark";
}

// TradingView Symbol Search Widget
export function TradingViewSymbolSearch({ onSymbolSelect, market = "us", theme = "light" }: TradingViewSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-search.js';
      script.async = true;
      
      const config = {
        "width": "100%",
        "height": "400",
        "defaultCategory": market === "taiwan" ? "taiwan" : "stock",
        "showPopupButton": false,
        "locale": "zh_TW",
        "largeChartUrl": "",
        "isTransparent": false,
        "colorTheme": theme
      };

      script.innerHTML = JSON.stringify(config);
      containerRef.current.appendChild(script);

      // Listen for symbol selection events from TradingView widget
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.name === 'tv-symbol-selected' && onSymbolSelect) {
          const { symbol, displayName } = event.data;
          onSymbolSelect(symbol, displayName);
        }
      };

      window.addEventListener('message', handleMessage);
      
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [market, theme, onSymbolSelect]);

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}

// Market Overview Widget
export function MarketOverviewWidget({ height = "400", theme = "light", market = "us" }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear any existing content
      containerRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
      script.async = true;
      
      const config = {
        "colorTheme": theme,
        "dateRange": "12M",
        "showChart": true,
        "locale": "zh_TW",
        "width": "100%",
        "height": height,
        "largeChartUrl": "",
        "isTransparent": false,
        "showSymbolLogo": true,
        "showFloatingTooltip": false,
        "plotLineColorGrowing": "rgba(41, 98, 255, 1)",
        "plotLineColorFalling": "rgba(41, 98, 255, 1)",
        "gridLineColor": "rgba(240, 243, 250, 0)",
        "scaleFontColor": "rgba(106, 109, 120, 1)",
        "belowLineFillColorGrowing": "rgba(41, 98, 255, 0.12)",
        "belowLineFillColorFalling": "rgba(41, 98, 255, 0.12)",
        "belowLineFillColorGrowingBottom": "rgba(41, 98, 255, 0)",
        "belowLineFillColorFallingBottom": "rgba(41, 98, 255, 0)",
        "symbolActiveColor": "rgba(41, 98, 255, 0.12)",
        "tabs": market === "taiwan" ? [
          {
            "title": "台灣指數",
            "symbols": [
              {
                "s": "TVC:TWII",
                "d": "台灣加權指數"
              },
              {
                "s": "TVC:TX1!",
                "d": "台指期"
              }
            ],
            "originalTitle": "Taiwan Indices"
          },
          {
            "title": "亞洲市場",
            "symbols": [
              {
                "s": "TVC:NI225",
                "d": "日經225"
              },
              {
                "s": "TVC:HSI",
                "d": "恆生指數"
              },
              {
                "s": "TVC:SHCOMP",
                "d": "上證指數"
              }
            ],
            "originalTitle": "Asian Markets"
          }
        ] : [
          {
            "title": "美國指數",
            "symbols": [
              {
                "s": "FOREXCOM:SPXUSD",
                "d": "S&P 500"
              },
              {
                "s": "FOREXCOM:NSXUSD",
                "d": "US 100"
              },
              {
                "s": "FOREXCOM:DJI",
                "d": "Dow 30"
              },
              {
                "s": "NASDAQ:IXIC",
                "d": "Nasdaq"
              }
            ],
            "originalTitle": "US Indices"
          },
          {
            "title": "期貨",
            "symbols": [
              {
                "s": "CME_MINI:ES1!",
                "d": "S&P 500"
              },
              {
                "s": "CME:6E1!",
                "d": "Euro"
              },
              {
                "s": "COMEX:GC1!",
                "d": "Gold"
              },
              {
                "s": "NYMEX:CL1!",
                "d": "Crude Oil"
              }
            ],
            "originalTitle": "Futures"
          }
        ]
      };

      script.innerHTML = JSON.stringify(config);
      containerRef.current.appendChild(script);
    }
  }, [market, height, theme]);

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}

// Advanced Chart Widget
export function AdvancedChartWidget({ 
  symbol = "NASDAQ:AAPL", 
  width = "100%", 
  height = "600",
  theme = "light" 
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.async = true;
      
      const config = {
        "autosize": true,
        "symbol": symbol,
        "interval": "D",
        "timezone": "Asia/Taipei",
        "theme": theme,
        "style": "1",
        "locale": "zh_TW",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "calendar": false,
        "support_host": "https://www.tradingview.com"
      };

      script.innerHTML = JSON.stringify(config);
      containerRef.current.appendChild(script);
    }
  }, [symbol, theme]);

  return (
    <div className="tradingview-widget-container" ref={containerRef} style={{ height, width }}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}

// Enhanced Watchlist Widget with Custom Symbols Support
export function WatchlistWidget({ height = "400", theme = "light", market = "us" }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [customWatchlist, setCustomWatchlist] = useState<any[]>([]);

  // Load custom watchlist from localStorage
  useEffect(() => {
    const savedWatchlist = localStorage.getItem(`watchlist_${market}`);
    if (savedWatchlist) {
      try {
        const parsed = JSON.parse(savedWatchlist);
        setCustomWatchlist(parsed);
      } catch (error) {
        console.error("Error loading custom watchlist:", error);
      }
    }
  }, [market]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
      script.async = true;
      
      // Build symbols groups based on custom watchlist or defaults
      let symbolsGroups;
      
      if (customWatchlist.length > 0) {
        // Use custom watchlist
        const customSymbols = customWatchlist.map(stock => ({
          name: stock.symbol,
          displayName: stock.displayName
        }));
        
        symbolsGroups = [
          {
            name: market === "taiwan" ? "我的台股追蹤" : "我的美股追蹤",
            originalName: "My Custom Watchlist",
            symbols: customSymbols
          }
        ];
        
        // Add indices as second group
        if (market === "taiwan") {
          symbolsGroups.unshift({
            name: "台股指數",
            originalName: "Taiwan Indices",
            symbols: [
              {
                name: "TVC:TWII",
                displayName: "台灣加權指數"
              },
              {
                name: "TVC:TX1!",
                displayName: "台指期"
              }
            ]
          });
        } else {
          symbolsGroups.unshift({
            name: "美股指數",
            originalName: "US Indices",
            symbols: [
              {
                name: "FOREXCOM:SPXUSD",
                displayName: "S&P 500"
              },
              {
                name: "FOREXCOM:NSXUSD",
                displayName: "US 100"
              },
              {
                name: "FOREXCOM:DJI",
                displayName: "Dow 30"
              }
            ]
          });
        }
      } else {
        // Use default symbols
        symbolsGroups = market === "taiwan" ? [
          {
            "name": "台股指數",
            "originalName": "Taiwan Indices",
            "symbols": [
              {
                "name": "TVC:TWII",
                "displayName": "台灣加權指數"
              },
              {
                "name": "TVC:TX1!",
                "displayName": "台指期"
              }
            ]
          },
          {
            "name": "熱門台股",
            "originalName": "Popular Taiwan Stocks",
            "symbols": [
              {
                "name": "TPE:2330",
                "displayName": "台積電"
              },
              {
                "name": "TPE:2454",
                "displayName": "聯發科"
              },
              {
                "name": "TPE:2317",
                "displayName": "鴻海"
              }
            ]
          }
        ] : [
          {
            "name": "美股指數",
            "originalName": "US Indices",
            "symbols": [
              {
                "name": "FOREXCOM:SPXUSD",
                "displayName": "S&P 500"
              },
              {
                "name": "FOREXCOM:NSXUSD",
                "displayName": "US 100"
              },
              {
                "name": "FOREXCOM:DJI",
                "displayName": "Dow 30"
              }
            ]
          },
          {
            "name": "熱門美股",
            "originalName": "Popular US Stocks",
            "symbols": [
              {
                "name": "NASDAQ:AAPL",
                "displayName": "Apple"
              },
              {
                "name": "NASDAQ:GOOGL",
                "displayName": "Alphabet"
              },
              {
                "name": "NASDAQ:MSFT",
                "displayName": "Microsoft"
              },
              {
                "name": "NASDAQ:TSLA",
                "displayName": "Tesla"
              }
            ]
          }
        ];
      }
      
      const config = {
        "width": "100%",
        "height": height,
        "symbolsGroups": symbolsGroups,
        "showSymbolLogo": true,
        "colorTheme": theme,
        "isTransparent": false,
        "locale": "zh_TW"
      };

      script.innerHTML = JSON.stringify(config);
      containerRef.current.appendChild(script);
    }
  }, [market, height, theme, customWatchlist]);

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}

// Economic Calendar Widget
export function EconomicCalendarWidget({ height = "400", theme = "light" }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
      script.async = true;
      
      const config = {
        "colorTheme": theme,
        "isTransparent": false,
        "width": "100%",
        "height": height,
        "locale": "zh_TW",
        "importanceFilter": "-1,0,1",
        "countryFilter": "us,cn,jp,kr,tw,eu"
      };

      script.innerHTML = JSON.stringify(config);
      containerRef.current.appendChild(script);
    }
  }, [height, theme]);

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}

// Market Data Widget for Sidebar
export function SidebarMarketDataWidget({ market = "us" }: { market?: "taiwan" | "us" }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
      script.async = true;
      
      const symbols = market === "taiwan" ? 
        ["TVC:TWII", "TVC:TX1!", "TVC:USDTWD"] :
        ["FOREXCOM:SPXUSD", "FOREXCOM:NSXUSD", "TVC:DXY", "TVC:GOLD"];

      // Create multiple widgets for different symbols
      symbols.forEach((symbol, index) => {
        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'tradingview-widget-container mb-4';
        
        const widgetScript = document.createElement('script');
        widgetScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
        widgetScript.async = true;
        
        const config = {
          "symbol": symbol,
          "width": "100%",
          "height": "220",
          "locale": "zh_TW",
          "dateRange": "12M",
          "colorTheme": "light",
          "isTransparent": false,
          "autosize": false,
          "largeChartUrl": ""
        };

        widgetScript.innerHTML = JSON.stringify(config);
        widgetDiv.appendChild(widgetScript);
        
        if (containerRef.current) {
          containerRef.current.appendChild(widgetDiv);
        }
      });
    }
  }, [market]);

  return (
    <div ref={containerRef} className="space-y-4">
    </div>
  );
}