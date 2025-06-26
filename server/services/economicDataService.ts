import { storage } from "../storage";
import type { InsertEconomicIndicator } from "@shared/schema";

export class EconomicDataService {
  private apiKey = process.env.ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_KEY || "";

  async fetchEconomicData(): Promise<void> {
    try {
      await Promise.all([
        this.fetchCPIData(),
        this.fetchLaborMarketData(),
        this.fetchInterestRates(),
        this.fetchSafeHavenCurrencies(),
        this.fetchCommodityFutures(),
        this.fetchCentralBankRates()
      ]);
    } catch (error) {
      console.error("Error fetching economic data:", error);
      throw new Error("無法獲取經濟數據");
    }
  }

  private async fetchCPIData(): Promise<void> {
    try {
      // Alpha Vantage CPI API call
      const response = await fetch(
        `https://www.alphavantage.co/query?function=CPI&interval=monthly&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error("CPI data fetch failed");
      }

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const latestCPI = data.data[0];
        const previousCPI = data.data[1];
        
        const change = previousCPI ? 
          ((parseFloat(latestCPI.value) - parseFloat(previousCPI.value)) / parseFloat(previousCPI.value) * 100).toFixed(1) + "%" :
          "N/A";

        const indicator: InsertEconomicIndicator = {
          name: "美國 CPI (年增率)",
          value: latestCPI.value + "%",
          change: change,
          period: latestCPI.date,
          source: "Alpha Vantage",
          category: "inflation"
        };

        await storage.createEconomicIndicator(indicator);
      }
    } catch (error) {
      console.error("CPI fetch error:", error);
    }
  }

  private async fetchLaborMarketData(): Promise<void> {
    try {
      // US Unemployment Rate
      const response = await fetch(
        `https://www.alphavantage.co/query?function=UNEMPLOYMENT&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error("Labor market data fetch failed");
      }

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const latestData = data.data[0];
        const previousData = data.data[1];
        
        const change = previousData ? 
          ((parseFloat(latestData.value) - parseFloat(previousData.value))).toFixed(1) + "%" :
          "N/A";

        const indicator: InsertEconomicIndicator = {
          name: "美國失業率",
          value: latestData.value + "%",
          change: change,
          period: latestData.date,
          source: "Alpha Vantage",
          category: "labor_market"
        };

        await storage.createEconomicIndicator(indicator);
      }
    } catch (error) {
      console.error("Labor market data fetch error:", error);
    }
  }

  private async fetchInterestRates(): Promise<void> {
    try {
      // Federal Funds Rate
      const response = await fetch(
        `https://www.alphavantage.co/query?function=FEDERAL_FUNDS_RATE&interval=monthly&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error("Interest rate data fetch failed");
      }

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const latestRate = data.data[0];
        
        const indicator: InsertEconomicIndicator = {
          name: "聯邦基金利率",
          value: latestRate.value + "%",
          change: "持平",
          period: latestRate.date,
          source: "Alpha Vantage",
          category: "interest_rate"
        };

        await storage.createEconomicIndicator(indicator);
      }

      // Taiwan Central Bank Rate (static data as example)
      const taiwanRate: InsertEconomicIndicator = {
        name: "台灣央行利率",
        value: "1.875%",
        change: "持平",
        period: new Date().toISOString().split('T')[0],
        source: "中央銀行",
        category: "interest_rate"
      };

      await storage.createEconomicIndicator(taiwanRate);
    } catch (error) {
      console.error("Interest rate fetch error:", error);
    }
  }

  private async fetchSafeHavenCurrencies(): Promise<void> {
    try {
      // USD/JPY (Japanese Yen as safe haven)
      const jpyResponse = await fetch(
        `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=USD&to_symbol=JPY&apikey=${this.apiKey}`
      );
      
      if (jpyResponse.ok) {
        const jpyData = await jpyResponse.json();
        const timeSeries = jpyData["Time Series FX (Daily)"];
        
        if (timeSeries) {
          const dates = Object.keys(timeSeries).sort().reverse();
          const latestRate = parseFloat(timeSeries[dates[0]]["4. close"]);
          const previousRate = parseFloat(timeSeries[dates[1]]["4. close"]);
          
          const change = ((latestRate - previousRate) / previousRate * 100).toFixed(2);
          
          const jpyIndicator: InsertEconomicIndicator = {
            name: "美元/日圓匯率",
            value: latestRate.toFixed(2),
            change: change + "%",
            period: dates[0],
            source: "Alpha Vantage",
            category: "safe_haven_currency"
          };

          await storage.createEconomicIndicator(jpyIndicator);
        }
      }

      // USD/CHF (Swiss Franc as safe haven)
      const chfResponse = await fetch(
        `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=USD&to_symbol=CHF&apikey=${this.apiKey}`
      );
      
      if (chfResponse.ok) {
        const chfData = await chfResponse.json();
        const timeSeries = chfData["Time Series FX (Daily)"];
        
        if (timeSeries) {
          const dates = Object.keys(timeSeries).sort().reverse();
          const latestRate = parseFloat(timeSeries[dates[0]]["4. close"]);
          const previousRate = parseFloat(timeSeries[dates[1]]["4. close"]);
          
          const change = ((latestRate - previousRate) / previousRate * 100).toFixed(2);
          
          const chfIndicator: InsertEconomicIndicator = {
            name: "美元/瑞士法郎匯率",
            value: latestRate.toFixed(2),
            change: change + "%",
            period: dates[0],
            source: "Alpha Vantage",
            category: "safe_haven_currency"
          };

          await storage.createEconomicIndicator(chfIndicator);
        }
      }
    } catch (error) {
      console.error("Safe haven currency fetch error:", error);
    }
  }

  private async fetchCommodityFutures(): Promise<void> {
    try {
      // Gold futures
      const goldResponse = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=GLD&apikey=${this.apiKey}`
      );
      
      if (goldResponse.ok) {
        const goldData = await goldResponse.json();
        const timeSeries = goldData["Time Series (Daily)"];
        
        if (timeSeries) {
          const dates = Object.keys(timeSeries).sort().reverse();
          const latestDate = dates[0];
          const previousDate = dates[1];
          
          const latestPrice = parseFloat(timeSeries[latestDate]["4. close"]);
          const previousPrice = parseFloat(timeSeries[previousDate]["4. close"]);
          const change = ((latestPrice - previousPrice) / previousPrice * 100).toFixed(1);
          
          const goldIndicator: InsertEconomicIndicator = {
            name: "黃金期貨價格 (美元/盎司)",
            value: "$" + (latestPrice * 10).toFixed(0),
            change: change + "%",
            period: "即時價格",
            source: "Alpha Vantage",
            category: "commodity_futures"
          };

          await storage.createEconomicIndicator(goldIndicator);
        }
      }

      // WTI Crude Oil futures
      const oilResponse = await fetch(
        `https://www.alphavantage.co/query?function=WTI&interval=monthly&apikey=${this.apiKey}`
      );
      
      if (oilResponse.ok) {
        const oilData = await oilResponse.json();
        
        if (oilData.data && oilData.data.length > 0) {
          const latestOil = oilData.data[0];
          const previousOil = oilData.data[1];
          
          const change = previousOil ? 
            ((parseFloat(latestOil.value) - parseFloat(previousOil.value)) / parseFloat(previousOil.value) * 100).toFixed(1) + "%" :
            "N/A";

          const oilIndicator: InsertEconomicIndicator = {
            name: "WTI原油期貨價格",
            value: "$" + latestOil.value,
            change: change,
            period: latestOil.date,
            source: "Alpha Vantage",
            category: "commodity_futures"
          };

          await storage.createEconomicIndicator(oilIndicator);
        }
      }

      // Agricultural commodities (Corn futures as example)
      const cornResponse = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=CORN&apikey=${this.apiKey}`
      );
      
      if (cornResponse.ok) {
        const cornData = await cornResponse.json();
        const timeSeries = cornData["Time Series (Daily)"];
        
        if (timeSeries) {
          const dates = Object.keys(timeSeries).sort().reverse();
          const latestDate = dates[0];
          const previousDate = dates[1];
          
          const latestPrice = parseFloat(timeSeries[latestDate]["4. close"]);
          const previousPrice = parseFloat(timeSeries[previousDate]["4. close"]);
          const change = ((latestPrice - previousPrice) / previousPrice * 100).toFixed(1);
          
          const cornIndicator: InsertEconomicIndicator = {
            name: "玉米期貨價格",
            value: "$" + latestPrice.toFixed(2),
            change: change + "%",
            period: latestDate,
            source: "Alpha Vantage",
            category: "agricultural_futures"
          };

          await storage.createEconomicIndicator(cornIndicator);
        }
      }
    } catch (error) {
      console.error("Commodity futures fetch error:", error);
    }
  }

  private async fetchCentralBankRates(): Promise<void> {
    try {
      // European Central Bank Rate (static data as example)
      const ecbRate: InsertEconomicIndicator = {
        name: "歐洲央行利率",
        value: "4.50%",
        change: "持平",
        period: new Date().toISOString().split('T')[0],
        source: "歐洲央行",
        category: "central_bank_rate"
      };

      await storage.createEconomicIndicator(ecbRate);

      // Bank of Japan Rate
      const bojRate: InsertEconomicIndicator = {
        name: "日本央行利率",
        value: "-0.10%",
        change: "持平",
        period: new Date().toISOString().split('T')[0],
        source: "日本銀行",
        category: "central_bank_rate"
      };

      await storage.createEconomicIndicator(bojRate);
      
    } catch (error) {
      console.error("Central bank rates fetch error:", error);
    }
  }

  async getEconomicIndicators() {
    return await storage.getEconomicIndicators();
  }
}

export const economicDataService = new EconomicDataService();