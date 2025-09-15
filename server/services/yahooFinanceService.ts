import fetch from 'node-fetch';

export interface YahooFinanceData {
  symbol: string;
  name: string;
  shortName?: string;
  longName?: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  averageDailyVolume3Month?: number;
  marketCap?: string;
  lastUpdated: Date;
}

export interface TaiwanMarketData {
  taiwanIndex: YahooFinanceData;
  taiwanFutures: YahooFinanceData;
  popularStocks: YahooFinanceData[];
}

interface YahooApiResponse {
  quoteSummary?: {
    result?: Array<{
      price?: {
        symbol?: string;
        shortName?: string;
        longName?: string;
        regularMarketPrice?: { raw: number };
        regularMarketChange?: { raw: number };
        regularMarketChangePercent?: { raw: number };
        regularMarketVolume?: { raw: number };
        averageDailyVolume3Month?: { raw: number };
        marketCap?: { raw: number };
      };
    }>;
  };
}

class YahooFinanceService {
  private baseUrl = 'https://query1.finance.yahoo.com/v10/finance';

  async getQuote(symbol: string): Promise<YahooFinanceData | null> {
    try {
      const url = `${this.baseUrl}/quoteSummary/${symbol}?modules=price`;
      console.log(`Fetching Yahoo Finance data for ${symbol}...`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      if (!response.ok) {
        console.error(`Yahoo Finance API error for ${symbol}: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json() as YahooApiResponse;
      
      if (!data.quoteSummary?.result?.[0]?.price) {
        console.error(`No price data found for ${symbol}`);
        return null;
      }

      const price = data.quoteSummary.result[0].price;
      
      return {
        symbol: price.symbol || symbol,
        name: price.shortName || price.longName || '',
        shortName: price.shortName,
        longName: price.longName,
        price: price.regularMarketPrice?.raw || 0,
        change: price.regularMarketChange?.raw || 0,
        changePercent: price.regularMarketChangePercent?.raw || 0,
        volume: price.regularMarketVolume?.raw,
        averageDailyVolume3Month: price.averageDailyVolume3Month?.raw,
        marketCap: price.marketCap?.raw?.toString(),
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      return null;
    }
  }

  async getBatchQuotes(symbols: string[]): Promise<YahooFinanceData[]> {
    const quotes: YahooFinanceData[] = [];
    
    // 避免API限制，每次處理5個股票代號
    for (let i = 0; i < symbols.length; i += 5) {
      const batch = symbols.slice(i, i + 5);
      const batchPromises = batch.map(symbol => this.getQuote(symbol));
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(quote => {
        if (quote) {
          quotes.push(quote);
        }
      });
      
      // 添加延遲避免過度請求
      if (i + 5 < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return quotes;
  }

  async fetchYahooFinanceData(symbol: string): Promise<YahooFinanceData | null> {
    // 使用新的 API 方法替代 Puppeteer
    return this.getQuote(symbol);
  }

  async fetchTaiwanMarketData(): Promise<TaiwanMarketData | null> {
    try {
      const taiwanStocks = this.getTaiwanTop10Stocks();
      const [taiwanIndex, taiwanFutures, ...stocks] = await Promise.all([
        this.getQuote('^TWII'), // Taiwan Weighted Index
        this.getQuote('TXO'), // Taiwan Index Options (alternative to TXF)
        ...taiwanStocks.map(stock => this.getQuote(stock.symbol)),
      ]);
      
      if (!taiwanIndex) {
        throw new Error('Failed to fetch Taiwan market index data');
      }
      
      return {
        taiwanIndex,
        taiwanFutures: taiwanFutures || taiwanIndex, // Fallback to index if futures unavailable
        popularStocks: stocks.filter(Boolean) as YahooFinanceData[]
      };
      
    } catch (error) {
      console.error('Error fetching Taiwan market data:', error);
      return null;
    }
  }

  async fetchMultipleSymbols(symbols: string[]): Promise<YahooFinanceData[]> {
    try {
      return this.getBatchQuotes(symbols);
    } catch (error) {
      console.error('Error fetching multiple symbols:', error);
      return [];
    }
  }

  // 台股前10大權值股列表
  getTaiwanTop10Stocks() {
    return [
      { symbol: '2330.TW', name: '台積電', nameEn: 'TSMC' },
      { symbol: '2317.TW', name: '鴻海', nameEn: 'Foxconn' },
      { symbol: '2454.TW', name: '聯發科', nameEn: 'MediaTek' },
      { symbol: '2308.TW', name: '台達電', nameEn: 'Delta Electronics' },
      { symbol: '2881.TW', name: '富邦金', nameEn: 'Fubon Financial' },
      { symbol: '2382.TW', name: '廣達', nameEn: 'Quanta Computer' },
      { symbol: '2412.TW', name: '中華電', nameEn: 'Chunghwa Telecom' },
      { symbol: '2882.TW', name: '國泰金', nameEn: 'Cathay Financial' },
      { symbol: '2891.TW', name: '中信金', nameEn: 'CTBC Financial' },
      { symbol: '3711.TW', name: '日月光投控', nameEn: 'ASE Group' },
    ];
  }

  // 美股投組列表 (根據用戶附圖)
  getUsStockPortfolio() {
    return [
      { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 3.31 },
      { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', weight: 21.59 },
      { symbol: 'UNH', name: 'UnitedHealth Group Inc', weight: 9.02 },
      { symbol: 'TSLA', name: 'Tesla Inc', weight: 9.41 },
      { symbol: 'SOFI', name: 'SoFi Technologies Inc', weight: 2.12 },
      { symbol: 'PYPL', name: 'PayPal Holdings Inc', weight: 1.37 },
      { symbol: 'OSCR', name: 'Oscar Health Inc', weight: 1.98 },
      { symbol: 'ORCL', name: 'Oracle Corporation', weight: 9.43 },
      { symbol: 'OKLO', name: 'Oklo Inc', weight: 2.45 },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', weight: 2.71 },
      { symbol: 'MRVL', name: 'Marvell Technology Inc', weight: 0.68 },
      { symbol: 'META', name: 'Meta Platforms Inc', weight: 7.66 },
      { symbol: 'GOOGL', name: 'Alphabet Inc Class A', weight: 6.14 },
      { symbol: 'ASML', name: 'ASML Holding NV', weight: 8.21 },
      { symbol: 'AMZN', name: 'Amazon.com Inc', weight: 3.52 },
      { symbol: 'AMD', name: 'Advanced Micro Devices Inc', weight: 3.18 },
      { symbol: 'AAPL', name: 'Apple Inc', weight: 4.69 },
      { symbol: 'PLTR', name: 'Palantir Technologies Inc', weight: 2.52 },
    ];
  }

  // Get popular Taiwan stocks symbols
  getPopularTaiwanStocks(): string[] {
    return this.getTaiwanTop10Stocks().map(stock => stock.symbol);
  }

  // Get Taiwan index and futures symbols
  getTaiwanIndices(): string[] {
    return [
      '^TWII', // Taiwan Weighted Index 加權指數
      'TXO',   // Taiwan Index Options 台指選擇權
      '^TWOII', // Taiwan OTC Index 櫃買指數
    ];
  }

  // Format data for display
  formatPriceData(data: YahooFinanceData): {
    displayPrice: string;
    displayChange: string;
    isPositive: boolean;
  } {
    const isPositive = data.change >= 0;
    const changeSign = isPositive ? '+' : '';
    
    return {
      displayPrice: data.price.toLocaleString('zh-TW', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      displayChange: `${changeSign}${data.change.toFixed(2)} (${changeSign}${data.changePercent.toFixed(2)}%)`,
      isPositive
    };
  }
}

export const yahooFinanceService = new YahooFinanceService();