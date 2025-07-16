import puppeteer from 'puppeteer';

export interface TaiwanStockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: string;
  high: number;
  low: number;
  open: number;
  lastTradeTime: string;
  isOpen: boolean;
  lastUpdated: Date;
}

export interface TaiwanMarketStatus {
  isOpen: boolean;
  nextOpenTime?: string;
  timezone: string;
}

class TaiwanStockService {
  private browser: puppeteer.Browser | null = null;
  private readonly sources = {
    yahoo: "https://tw.finance.yahoo.com/quote/",
    cnyes: "https://www.cnyes.com/twstock/",
    goodinfo: "https://goodinfo.tw/tw/StockInfo/StockDetail.asp?STOCK_ID="
  };

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // 檢查台灣股市開盤狀態
  getTaiwanMarketStatus(): TaiwanMarketStatus {
    const now = new Date();
    const taiwanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const hour = taiwanTime.getHours();
    const minute = taiwanTime.getMinutes();
    const day = taiwanTime.getDay(); // 0 = Sunday, 6 = Saturday
    
    // 平日 9:00-13:30 開盤
    const isWeekday = day >= 1 && day <= 5;
    const isMarketHours = (hour === 9 && minute >= 0) || 
                         (hour >= 10 && hour <= 12) || 
                         (hour === 13 && minute <= 30);
    
    const isOpen = isWeekday && isMarketHours;
    
    return {
      isOpen,
      timezone: "Asia/Taipei",
      nextOpenTime: isOpen ? undefined : this.getNextOpenTime()
    };
  }

  private getNextOpenTime(): string {
    const now = new Date();
    const taiwanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const nextOpen = new Date(taiwanTime);
    
    // 如果是週末，設定到下週一
    if (taiwanTime.getDay() === 0) { // Sunday
      nextOpen.setDate(taiwanTime.getDate() + 1);
    } else if (taiwanTime.getDay() === 6) { // Saturday
      nextOpen.setDate(taiwanTime.getDate() + 2);
    } else {
      // 平日但非開盤時間，設定到明天或今天9點
      const hour = taiwanTime.getHours();
      if (hour >= 14) { // 下午2點後，設定到明天
        nextOpen.setDate(taiwanTime.getDate() + 1);
      }
    }
    
    nextOpen.setHours(9, 0, 0, 0);
    return nextOpen.toISOString();
  }

  // 從Yahoo Finance抓取台股數據（主要來源）
  async fetchFromYahoo(stockId: string): Promise<TaiwanStockData | null> {
    try {
      await this.initialize();
      if (!this.browser) throw new Error('Browser not initialized');

      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const url = `${this.sources.yahoo}${stockId}.TW`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // 等待價格數據載入
      await page.waitForSelector('[data-testid="qsp-price"]', { timeout: 10000 });
      
      const data = await page.evaluate(() => {
        const priceElement = document.querySelector('[data-testid="qsp-price"]');
        const changeElement = document.querySelector('[data-testid="qsp-price-change"]');
        const nameElement = document.querySelector('h1');
        const volumeElement = document.querySelector('[data-testid="VOLUME-value"]');
        const rangeElement = document.querySelector('[data-testid="DAYS_RANGE-value"]');
        const openElement = document.querySelector('[data-testid="OPEN-value"]');
        
        // 獲取價格
        const priceText = priceElement?.textContent?.replace(/,/g, '') || '0';
        const price = parseFloat(priceText);
        
        // 獲取變化
        const changeText = changeElement?.textContent || '+0.00 (+0.00%)';
        const changeMatch = changeText.match(/([-+]?\d+\.?\d*)\s*\(([-+]?\d+\.?\d*)%\)/);
        const change = changeMatch ? parseFloat(changeMatch[1]) : 0;
        const changePercent = changeMatch ? parseFloat(changeMatch[2]) : 0;
        
        // 獲取成交量
        const volumeText = volumeElement?.textContent?.replace(/,/g, '') || '0';
        const volume = parseInt(volumeText) || 0;
        
        // 獲取當日區間
        const rangeText = rangeElement?.textContent || '0 - 0';
        const rangeParts = rangeText.split(' - ');
        const low = parseFloat(rangeParts[0]?.replace(/,/g, '') || '0');
        const high = parseFloat(rangeParts[1]?.replace(/,/g, '') || '0');
        
        // 獲取開盤價
        const openText = openElement?.textContent?.replace(/,/g, '') || '0';
        const open = parseFloat(openText);
        
        return {
          price,
          change,
          changePercent,
          volume,
          high,
          low,
          open,
          name: nameElement?.textContent?.trim() || ''
        };
      });
      
      await page.close();
      
      if (data.price === 0) {
        throw new Error('Invalid price data');
      }
      
      const marketStatus = this.getTaiwanMarketStatus();
      
      return {
        symbol: stockId,
        name: data.name,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        volume: data.volume,
        high: data.high,
        low: data.low,
        open: data.open,
        lastTradeTime: new Date().toISOString(),
        isOpen: marketStatus.isOpen,
        lastUpdated: new Date()
      };
      
    } catch (error) {
      console.error(`Error fetching Yahoo data for ${stockId}:`, error);
      return null;
    }
  }

  // 從鉅亨網抓取數據（備用來源）
  async fetchFromCnyes(stockId: string): Promise<TaiwanStockData | null> {
    try {
      await this.initialize();
      if (!this.browser) throw new Error('Browser not initialized');

      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const url = `${this.sources.cnyes}${stockId}`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      await page.waitForSelector('.price', { timeout: 10000 });
      
      const data = await page.evaluate(() => {
        const priceElement = document.querySelector('.price');
        const changeElement = document.querySelector('.change');
        const nameElement = document.querySelector('.name');
        const volumeElement = document.querySelector('[data-key="成交量"]');
        
        const price = parseFloat(priceElement?.textContent?.replace(/,/g, '') || '0');
        const changeText = changeElement?.textContent || '+0.00';
        const change = parseFloat(changeText.replace(/[+,]/g, ''));
        const changePercent = price > 0 ? (change / (price - change)) * 100 : 0;
        
        return {
          price,
          change,
          changePercent,
          volume: parseInt(volumeElement?.textContent?.replace(/,/g, '') || '0'),
          name: nameElement?.textContent?.trim() || ''
        };
      });
      
      await page.close();
      
      if (data.price === 0) {
        throw new Error('Invalid price data');
      }
      
      const marketStatus = this.getTaiwanMarketStatus();
      
      return {
        symbol: stockId,
        name: data.name,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        volume: data.volume,
        high: data.price, // 簡化數據
        low: data.price,
        open: data.price - data.change,
        lastTradeTime: new Date().toISOString(),
        isOpen: marketStatus.isOpen,
        lastUpdated: new Date()
      };
      
    } catch (error) {
      console.error(`Error fetching Cnyes data for ${stockId}:`, error);
      return null;
    }
  }

  // 主要方法：自動選擇最佳數據源
  async getStockData(stockId: string): Promise<TaiwanStockData | null> {
    // 先嘗試Yahoo Finance
    let data = await this.fetchFromYahoo(stockId);
    
    // 如果失敗，嘗試鉅亨網
    if (!data) {
      console.log(`Yahoo failed for ${stockId}, trying Cnyes...`);
      data = await this.fetchFromCnyes(stockId);
    }
    
    // 如果還是失敗，返回模擬數據（僅用於演示）
    if (!data) {
      console.log(`All sources failed for ${stockId}, using mock data`);
      return this.getMockStockData(stockId);
    }
    
    return data;
  }

  // 批量獲取股票數據
  async getMultipleStocks(stockIds: string[]): Promise<TaiwanStockData[]> {
    const results = await Promise.allSettled(
      stockIds.map(id => this.getStockData(id))
    );
    
    return results
      .map(result => result.status === 'fulfilled' ? result.value : null)
      .filter(Boolean) as TaiwanStockData[];
  }

  // 獲取熱門台股清單
  getPopularTaiwanStocks(): string[] {
    return [
      '2330', // 台積電
      '2454', // 聯發科
      '2317', // 鴻海
      '2603', // 長榮
      '3008', // 大立光
      '2002', // 中鋼
      '1301', // 台塑
      '2881', // 富邦金
      '2886', // 兆豐金
      '2412', // 中華電信
      '1303', // 南亞
      '2308', // 台達電
      '2382', // 廣達
      '3711', // 日月光投控
      '6505'  // 台塑化
    ];
  }

  // 模擬數據（用於開發和測試）
  private getMockStockData(stockId: string): TaiwanStockData {
    const stockNames: { [key: string]: string } = {
      '2330': '台灣積體電路製造股份有限公司',
      '2454': '聯發科技股份有限公司',
      '2317': '鴻海精密工業股份有限公司',
      '2603': '長榮海運股份有限公司',
      '3008': '大立光電股份有限公司'
    };
    
    const basePrice = Math.random() * 500 + 100;
    const change = (Math.random() - 0.5) * 20;
    const changePercent = (change / basePrice) * 100;
    
    return {
      symbol: stockId,
      name: stockNames[stockId] || `股票${stockId}`,
      price: parseFloat((basePrice + change).toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000),
      high: parseFloat((basePrice + Math.abs(change) * 1.5).toFixed(2)),
      low: parseFloat((basePrice - Math.abs(change) * 1.5).toFixed(2)),
      open: parseFloat(basePrice.toFixed(2)),
      lastTradeTime: new Date().toISOString(),
      isOpen: this.getTaiwanMarketStatus().isOpen,
      lastUpdated: new Date()
    };
  }

  // 格式化股價顯示
  formatStockData(data: TaiwanStockData): {
    displayPrice: string;
    displayChange: string;
    displayVolume: string;
    isPositive: boolean;
    marketStatus: string;
  } {
    const isPositive = data.change >= 0;
    const changeSign = isPositive ? '+' : '';
    
    return {
      displayPrice: `NT$ ${data.price.toLocaleString('zh-TW', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`,
      displayChange: `${changeSign}${data.change.toFixed(2)} (${changeSign}${data.changePercent.toFixed(2)}%)`,
      displayVolume: data.volume.toLocaleString('zh-TW'),
      isPositive,
      marketStatus: data.isOpen ? '盤中' : '盤後'
    };
  }
}

export const taiwanStockService = new TaiwanStockService();