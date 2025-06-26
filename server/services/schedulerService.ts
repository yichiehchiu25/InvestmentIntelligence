import cron from "node-cron";
import { newsService } from "./newsService";
import { economicDataService } from "./economicDataService";
import { aiService } from "./aiService";
import { storage } from "../storage";

export class SchedulerService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  start(): void {
    this.scheduleNewsCollection();
    this.scheduleEconomicDataUpdate();
    this.scheduleAISummaryGeneration();
    
    console.log("Scheduler service started with the following jobs:");
    console.log("- News collection: Every 4 hours");
    console.log("- Economic data update: Every 6 hours");
    console.log("- AI summary generation: Daily at 18:00 TST");
  }

  private scheduleNewsCollection(): void {
    // Run every 4 hours
    const newsJob = cron.schedule('0 */4 * * *', async () => {
      console.log("Starting scheduled news collection...");
      try {
        await newsService.scrapeNews();
        
        // Also search for specific keywords
        const keywords = ["Fed", "央行", "利率", "台積電", "Apple", "Tesla", "Bitcoin"];
        await newsService.searchGoogleNews(keywords, 10);
        
        console.log("News collection completed successfully");
      } catch (error) {
        console.error("Scheduled news collection failed:", error);
      }
    }, {
      scheduled: false,
      timezone: "Asia/Taipei"
    });

    this.jobs.set("newsCollection", newsJob);
    newsJob.start();
  }

  private scheduleEconomicDataUpdate(): void {
    // Run every 6 hours
    const economicJob = cron.schedule('0 */6 * * *', async () => {
      console.log("Starting scheduled economic data update...");
      try {
        await economicDataService.fetchEconomicData();
        console.log("Economic data update completed successfully");
      } catch (error) {
        console.error("Scheduled economic data update failed:", error);
      }
    }, {
      scheduled: false,
      timezone: "Asia/Taipei"
    });

    this.jobs.set("economicData", economicJob);
    economicJob.start();
  }

  private scheduleAISummaryGeneration(): void {
    // Run daily at 6:00 PM TST
    const aiJob = cron.schedule('0 18 * * *', async () => {
      console.log("Starting scheduled AI summary generation...");
      try {
        const today = new Date().toISOString().split('T')[0];
        await aiService.generateDailySummary(today);
        console.log("AI summary generation completed successfully");
      } catch (error) {
        console.error("Scheduled AI summary generation failed:", error);
      }
    }, {
      scheduled: false,
      timezone: "Asia/Taipei"
    });

    this.jobs.set("aiSummary", aiJob);
    aiJob.start();
  }

  // Manual trigger methods for testing
  async triggerNewsCollection(): Promise<void> {
    console.log("Manually triggering news collection...");
    await newsService.scrapeNews();
  }

  async triggerEconomicDataUpdate(): Promise<void> {
    console.log("Manually triggering economic data update...");
    await economicDataService.fetchEconomicData();
  }

  async triggerAISummaryGeneration(): Promise<void> {
    console.log("Manually triggering AI summary generation...");
    const today = new Date().toISOString().split('T')[0];
    await aiService.generateDailySummary(today);
  }

  stop(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped job: ${name}`);
    });
    this.jobs.clear();
  }

  getJobStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.jobs.forEach((job, name) => {
      status[name] = job.getStatus() === "scheduled";
    });
    return status;
  }
}

export const schedulerService = new SchedulerService();
