import puppeteer from 'puppeteer';

export interface YahooFinanceData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: string;
  lastUpdated: Date;
}

export interface TaiwanMarketData {
  taiwanIndex: YahooFinanceData;
  taiwanFutures: YahooFinanceData;
  popularStocks: YahooFinanceData[];
}

class YahooFinanceService {
  private browser: puppeteer.Browser | null = null;

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async fetchYahooFinanceData(symbol: string): Promise<YahooFinanceData | null> {
    try {
      await this.initialize();
      
      if (!this.browser) throw new Error('Browser not initialized');
      
      const page = await this.browser.newPage();
      
      // Set Taiwan locale and timezone
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8'
      });
      
      const url = `https://tw.finance.yahoo.com/quote/${symbol}`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for the page to load
      await page.waitForSelector('[data-symbol]', { timeout: 10000 });
      
      const data = await page.evaluate(() => {
        const priceElement = document.querySelector('[data-testid="qsp-price"]');
        const changeElement = document.querySelector('[data-testid="qsp-price-change"]');
        const nameElement = document.querySelector('h1[data-testid="quote-header"]');
        
        const priceText = priceElement?.textContent?.replace(/,/g, '') || '0';
        const changeText = changeElement?.textContent || '+0.00 (+0.00%)';
        const nameText = nameElement?.textContent || '';
        
        // Parse change and percentage
        const changeMatch = changeText.match(/([-+]?\d+\.?\d*)\s*\(([-+]?\d+\.?\d*)%\)/);
        const change = changeMatch ? parseFloat(changeMatch[1]) : 0;
        const changePercent = changeMatch ? parseFloat(changeMatch[2]) : 0;
        
        return {
          price: parseFloat(priceText),
          change,
          changePercent,
          name: nameText.trim()
        };
      });
      
      await page.close();
      
      return {
        symbol,
        name: data.name,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        lastUpdated: new Date()
      };
      
    } catch (error) {
      console.error(`Error fetching Yahoo Finance data for ${symbol}:`, error);
      return null;
    }
  }

  async fetchTaiwanMarketData(): Promise<TaiwanMarketData | null> {
    try {
      const [taiwanIndex, taiwanFutures, ...stocks] = await Promise.all([
        this.fetchYahooFinanceData('^TWII'), // Taiwan Weighted Index
        this.fetchYahooFinanceData('TXF'), // Taiwan Index Futures
        this.fetchYahooFinanceData('2330.TW'), // TSMC
        this.fetchYahooFinanceData('2454.TW'), // MediaTek
        this.fetchYahooFinanceData('2317.TW'), // Hon Hai
        this.fetchYahooFinanceData('2603.TW'), // Evergreen Marine
        this.fetchYahooFinanceData('3008.TW'), // LARGAN Precision
      ]);
      
      if (!taiwanIndex || !taiwanFutures) {
        throw new Error('Failed to fetch core Taiwan market data');
      }
      
      return {
        taiwanIndex,
        taiwanFutures,
        popularStocks: stocks.filter(Boolean) as YahooFinanceData[]
      };
      
    } catch (error) {
      console.error('Error fetching Taiwan market data:', error);
      return null;
    }
  }

  async fetchMultipleSymbols(symbols: string[]): Promise<YahooFinanceData[]> {
    try {
      const promises = symbols.map(symbol => this.fetchYahooFinanceData(symbol));
      const results = await Promise.all(promises);
      return results.filter(Boolean) as YahooFinanceData[];
    } catch (error) {
      console.error('Error fetching multiple symbols:', error);
      return [];
    }
  }

  // Alternative method using Yahoo Finance API (if available)
  async fetchViaAPI(symbol: string): Promise<YahooFinanceData | null> {
    try {
      // Note: This would require a Yahoo Finance API key or a third-party service
      // For now, we'll use the web scraping method above
      
      // Example using a hypothetical API
      /*
      const response = await fetch(`https://api.yahoo.com/v1/finance/quote?symbol=${symbol}`);
      const data = await response.json();
      
      return {
        symbol,
        name: data.shortName,
        price: data.regularMarketPrice,
        change: data.regularMarketChange,
        changePercent: data.regularMarketChangePercent,
        volume: data.regularMarketVolume,
        marketCap: data.marketCap,
        lastUpdated: new Date()
      };
      */
      
      return null;
    } catch (error) {
      console.error(`Error fetching API data for ${symbol}:`, error);
      return null;
    }
  }

  // Get popular Taiwan stocks symbols
  getPopularTaiwanStocks(): string[] {
    return [
      '2330.TW', // TSMC 台積電
      '2454.TW', // MediaTek 聯發科
      '2317.TW', // Hon Hai 鴻海
      '2603.TW', // Evergreen Marine 長榮海運
      '3008.TW', // LARGAN Precision 大立光
      '2002.TW', // China Steel 中鋼
      '1301.TW', // Formosa Plastics 台塑
      '2881.TW', // Fubon Financial 富邦金
      '2886.TW', // Mega Financial 兆豐金
      '2412.TW', // Chunghwa Telecom 中華電信
    ];
  }

  // Get Taiwan index and futures symbols
  getTaiwanIndices(): string[] {
    return [
      '^TWII', // Taiwan Weighted Index 加權指數
      'TXF',   // Taiwan Index Futures 台指期
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