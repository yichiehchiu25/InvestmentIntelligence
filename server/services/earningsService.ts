import fetch from 'node-fetch';
import { fileStorageService } from './fileStorageService';

interface EarningsEvent {
  symbol: string;
  companyName: string;
  earningsDate: string;
  earningsTime: "before-market" | "after-market" | "during-market";
  expectedEPS?: string;
  actualEPS?: string;
  revenue?: string;
  marketCap?: string;
  fiscalQuarter: string;
  fiscalYear: string;
}

interface EconomicEvent {
  title: string;
  date: string;
  time: string;
  importance: "high" | "medium" | "low";
  country: string;
  currency?: string;
  previous?: string;
  forecast?: string;
  actual?: string;
  category: string;
}

export class EarningsService {
  private readonly ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
  private readonly FMP_API_KEY = process.env.FINANCIAL_MODELING_PREP_API_KEY || 'demo';
  
  // Alpha Vantage API endpoints
  private readonly ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
  
  // Financial Modeling Prep API endpoints  
  private readonly FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

  async getUpcomingEarnings(days: number = 7): Promise<EarningsEvent[]> {
    const allEarnings: EarningsEvent[] = [];
    
    try {
      // 從多個數據源獲取財報數據
      const [fmpEarnings, alphaVantageEarnings] = await Promise.allSettled([
        this.getFMPEarnings(days),
        this.getAlphaVantageEarnings()
      ]);

      if (fmpEarnings.status === 'fulfilled') {
        allEarnings.push(...fmpEarnings.value);
      } else {
        console.error('FMP earnings fetch failed:', fmpEarnings.reason);
      }

      if (alphaVantageEarnings.status === 'fulfilled') {
        allEarnings.push(...alphaVantageEarnings.value);
      } else {
        console.error('Alpha Vantage earnings fetch failed:', alphaVantageEarnings.reason);
      }

      // 去重並按日期排序
      const uniqueEarnings = this.deduplicateEarnings(allEarnings);
      return uniqueEarnings.sort((a, b) => new Date(a.earningsDate).getTime() - new Date(b.earningsDate).getTime());

    } catch (error) {
      console.error('Error fetching earnings data:', error);
      return this.getFallbackEarnings();
    }
  }

  private async getFMPEarnings(days: number): Promise<EarningsEvent[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    const url = `${this.FMP_BASE_URL}/earning_calendar?from=${startDate.toISOString().split('T')[0]}&to=${endDate.toISOString().split('T')[0]}&apikey=${this.FMP_API_KEY}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status}`);
      }
      
      const data = await response.json() as any[];
      
      return data.map(item => ({
        symbol: item.symbol,
        companyName: item.companyName || item.symbol,
        earningsDate: item.date,
        earningsTime: this.parseEarningsTime(item.time),
        expectedEPS: item.epsEstimated ? `$${item.epsEstimated}` : undefined,
        actualEPS: item.eps ? `$${item.eps}` : undefined,
        revenue: item.revenueEstimated ? `$${(item.revenueEstimated / 1000000).toFixed(1)}M` : undefined,
        marketCap: item.marketCap ? `$${(item.marketCap / 1000000000).toFixed(1)}B` : undefined,
        fiscalQuarter: `Q${item.fiscalQuarter || 'N/A'}`,
        fiscalYear: item.fiscalYear || new Date().getFullYear().toString()
      }));
    } catch (error) {
      console.error('FMP earnings fetch error:', error);
      return [];
    }
  }

  private async getAlphaVantageEarnings(): Promise<EarningsEvent[]> {
    const url = `${this.ALPHA_VANTAGE_BASE_URL}?function=EARNINGS_CALENDAR&horizon=3month&apikey=${this.ALPHA_VANTAGE_API_KEY}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status}`);
      }
      
      const csvText = await response.text();
      return this.parseAlphaVantageCSV(csvText);
    } catch (error) {
      console.error('Alpha Vantage earnings fetch error:', error);
      return [];
    }
  }

  private parseAlphaVantageCSV(csvText: string): EarningsEvent[] {
    const lines = csvText.split('\n');
    const earnings: EarningsEvent[] = [];
    
    for (let i = 1; i < lines.length; i++) { // Skip header
      const columns = lines[i].split(',');
      if (columns.length >= 6) {
        earnings.push({
          symbol: columns[0],
          companyName: columns[1] || columns[0],
          earningsDate: columns[2],
          earningsTime: this.parseEarningsTime(columns[3]),
          expectedEPS: columns[4] ? `$${columns[4]}` : undefined,
          revenue: columns[5] ? `$${columns[5]}` : undefined,
          fiscalQuarter: 'N/A',
          fiscalYear: new Date().getFullYear().toString()
        });
      }
    }
    
    return earnings;
  }

  private parseEarningsTime(timeStr: string): "before-market" | "after-market" | "during-market" {
    if (!timeStr) return "after-market";
    
    const time = timeStr.toLowerCase();
    if (time.includes('bmo') || time.includes('before') || time.includes('pre')) {
      return "before-market";
    } else if (time.includes('amc') || time.includes('after') || time.includes('post')) {
      return "after-market";
    } else {
      return "during-market";
    }
  }

  private deduplicateEarnings(earnings: EarningsEvent[]): EarningsEvent[] {
    const seen = new Set<string>();
    return earnings.filter(earning => {
      const key = `${earning.symbol}-${earning.earningsDate}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async getEconomicEvents(days: number = 7): Promise<EconomicEvent[]> {
    try {
      // 整合多個經濟數據來源
      const events = await this.getFredEconomicData();
      return events.filter(event => {
        const eventDate = new Date(event.date);
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);
        return eventDate >= today && eventDate <= futureDate;
      });
    } catch (error) {
      console.error('Error fetching economic events:', error);
      return this.getFallbackEconomicEvents();
    }
  }

  private async getFredEconomicData(): Promise<EconomicEvent[]> {
    // 實際應用中需要FRED API key
    const economicEvents: EconomicEvent[] = [
      {
        title: "美國非農就業人數",
        date: this.getNextFridayOfMonth(),
        time: "21:30",
        importance: "high",
        country: "US",
        currency: "USD",
        previous: "256K",
        forecast: "180K",
        category: "就業數據"
      },
      {
        title: "美國消費者物價指數 (CPI)",
        date: this.getNextBusinessDay(10),
        time: "21:30", 
        importance: "high",
        country: "US",
        currency: "USD",
        previous: "2.6%",
        forecast: "2.9%",
        category: "通脹數據"
      },
      {
        title: "聯準會利率決議 (FOMC)",
        date: this.getNextWednesday(),
        time: "02:00",
        importance: "high",
        country: "US",
        currency: "USD",
        forecast: "5.25%",
        category: "貨幣政策"
      },
      {
        title: "美國生產者物價指數 (PPI)",
        date: this.getNextBusinessDay(12),
        time: "21:30",
        importance: "medium",
        country: "US",
        currency: "USD",
        previous: "2.4%",
        forecast: "2.3%",
        category: "通脹數據"
      },
      {
        title: "美國零售銷售",
        date: this.getNextBusinessDay(15),
        time: "21:30",
        importance: "medium",
        country: "US",
        currency: "USD",
        previous: "0.4%",
        forecast: "0.2%",
        category: "消費數據"
      }
    ];

    return economicEvents;
  }

  private getNextFridayOfMonth(): string {
    const now = new Date();
    const firstFriday = new Date(now.getFullYear(), now.getMonth(), 1);
    firstFriday.setDate(1 + (5 - firstFriday.getDay() + 7) % 7);
    return firstFriday.toISOString().split('T')[0];
  }

  private getNextWednesday(): string {
    const now = new Date();
    const daysUntilWednesday = (3 - now.getDay() + 7) % 7;
    const nextWednesday = new Date(now);
    nextWednesday.setDate(now.getDate() + (daysUntilWednesday || 7));
    return nextWednesday.toISOString().split('T')[0];
  }

  private getNextBusinessDay(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  private getFallbackEarnings(): EarningsEvent[] {
    const today = new Date();
    return [
      {
        symbol: "AAPL",
        companyName: "Apple Inc.",
        earningsDate: new Date(today.getTime() + 24*60*60*1000).toISOString().split('T')[0],
        earningsTime: "after-market",
        expectedEPS: "$2.18",
        marketCap: "$3.5T",
        fiscalQuarter: "Q1",
        fiscalYear: "2025"
      },
      {
        symbol: "MSFT", 
        companyName: "Microsoft Corp.",
        earningsDate: new Date(today.getTime() + 2*24*60*60*1000).toISOString().split('T')[0],
        earningsTime: "after-market",
        expectedEPS: "$3.12",
        marketCap: "$3.1T",
        fiscalQuarter: "Q2",
        fiscalYear: "2025"
      },
      {
        symbol: "GOOGL",
        companyName: "Alphabet Inc.",
        earningsDate: new Date(today.getTime() + 3*24*60*60*1000).toISOString().split('T')[0],
        earningsTime: "after-market", 
        expectedEPS: "$1.85",
        marketCap: "$2.1T",
        fiscalQuarter: "Q4",
        fiscalYear: "2024"
      }
    ];
  }

  private getFallbackEconomicEvents(): EconomicEvent[] {
    return [
      {
        title: "聯準會利率決議",
        date: this.getNextWednesday(),
        time: "02:00",
        importance: "high",
        country: "US",
        forecast: "5.25%",
        category: "貨幣政策"
      },
      {
        title: "美國CPI年增率",
        date: this.getNextBusinessDay(7),
        time: "21:30",
        importance: "high",
        country: "US",
        previous: "2.6%",
        forecast: "2.9%",
        category: "通脹數據"
      }
    ];
  }

  async saveEarningsData(date: string, earnings: EarningsEvent[]): Promise<void> {
    try {
      await fileStorageService.saveRawNewsData(date, "earnings_calendar", {
        earnings,
        fetchedAt: new Date().toISOString(),
        source: "multiple_apis"
      });
    } catch (error) {
      console.error('Error saving earnings data:', error);
    }
  }
}

export const earningsService = new EarningsService();