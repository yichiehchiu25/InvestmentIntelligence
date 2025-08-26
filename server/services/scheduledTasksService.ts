import cron from 'node-cron';
import { enhancedNewsService } from './enhancedNewsService';
import { earningsService } from './earningsService';
import { aiService } from './aiService';
import { cacheService } from './cacheService';

export class ScheduledTasksService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.setupScheduledTasks();
  }

  private setupScheduledTasks(): void {
    console.log('Setting up scheduled tasks...');

    // 1. 每30分鐘抓取新聞
    const newsTask = cron.schedule('*/30 * * * *', async () => {
      console.log('Running scheduled news scraping...');
      try {
        const result = await enhancedNewsService.scrapeAllNews();
        console.log(`Scheduled news scraping completed: ${result.success} articles scraped`);
      } catch (error) {
        console.error('Scheduled news scraping failed:', error);
      }
    }, {
      scheduled: false // 不立即啟動
    });
    this.tasks.set('news-scraping', newsTask);

    // 2. 每4小時更新財報數據
    const earningsTask = cron.schedule('0 */4 * * *', async () => {
      console.log('Running scheduled earnings update...');
      try {
        const earnings = await earningsService.getUpcomingEarnings(14); // 兩週的數據
        const today = new Date().toISOString().split('T')[0];
        await earningsService.saveEarningsData(today, earnings);
        
        // 清除相關快取
        cacheService.deleteByPattern('earnings:*');
        cacheService.deleteByPattern('economic:*');
        
        console.log(`Scheduled earnings update completed: ${earnings.length} events`);
      } catch (error) {
        console.error('Scheduled earnings update failed:', error);
      }
    }, {
      scheduled: false
    });
    this.tasks.set('earnings-update', earningsTask);

    // 3. 每2小時生成AI摘要
    const aiSummaryTask = cron.schedule('0 */2 * * *', async () => {
      console.log('Running scheduled AI summary generation...');
      try {
        const today = new Date().toISOString().split('T')[0];
        await aiService.generateTop5MarketSummaries(today);
        
        // 清除AI摘要快取
        cacheService.deleteByPattern('ai:*');
        
        console.log('Scheduled AI summary generation completed');
      } catch (error) {
        console.error('Scheduled AI summary generation failed:', error);
      }
    }, {
      scheduled: false
    });
    this.tasks.set('ai-summary', aiSummaryTask);

    // 4. 每小時清理過期快取
    const cacheCleanupTask = cron.schedule('0 * * * *', () => {
      console.log('Running scheduled cache cleanup...');
      try {
        const stats = cacheService.getStats();
        console.log('Cache stats before cleanup:', stats);
        
        // 執行健康檢查
        const health = cacheService.healthCheck();
        console.log('Cache health check:', health);
        
        // 如果快取項目過多，清理舊數據
        if (stats.keys > 5000) {
          cacheService.deleteByPattern('news:*');
          console.log('Cleaned up old news cache data');
        }
        
        console.log('Scheduled cache cleanup completed');
      } catch (error) {
        console.error('Scheduled cache cleanup failed:', error);
      }
    }, {
      scheduled: false
    });
    this.tasks.set('cache-cleanup', cacheCleanupTask);

    // 5. 每日凌晨1點進行全面資料更新
    const dailyUpdateTask = cron.schedule('0 1 * * *', async () => {
      console.log('Running daily comprehensive update...');
      try {
        // 清空所有快取
        cacheService.flushAll();
        
        // 重新抓取所有新聞
        await enhancedNewsService.scrapeAllNews();
        
        // 更新財報數據
        const earnings = await earningsService.getUpcomingEarnings(30); // 一個月的數據
        const today = new Date().toISOString().split('T')[0];
        await earningsService.saveEarningsData(today, earnings);
        
        // 生成AI摘要
        await aiService.generateTop5MarketSummaries(today);
        
        console.log('Daily comprehensive update completed');
      } catch (error) {
        console.error('Daily comprehensive update failed:', error);
      }
    }, {
      scheduled: false
    });
    this.tasks.set('daily-update', dailyUpdateTask);

    // 6. 市場開盤前更新（台北時間早上8:30，美國市場相關）
    const preMarketTask = cron.schedule('30 8 * * 1-5', async () => {
      console.log('Running pre-market update...');
      try {
        // 更新今日財報
        const earnings = await earningsService.getUpcomingEarnings(1);
        const todayEarnings = earnings.filter(e => 
          new Date(e.earningsDate).toDateString() === new Date().toDateString()
        );
        
        if (todayEarnings.length > 0) {
          console.log(`Today's earnings: ${todayEarnings.length} companies`);
          // 生成今日財報相關的AI分析
          await aiService.generateTop5MarketSummaries();
        }
        
        console.log('Pre-market update completed');
      } catch (error) {
        console.error('Pre-market update failed:', error);
      }
    }, {
      scheduled: false
    });
    this.tasks.set('pre-market', preMarketTask);

    console.log(`Scheduled tasks setup completed. Total tasks: ${this.tasks.size}`);
  }

  // 啟動所有定時任務
  startAllTasks(): void {
    console.log('Starting all scheduled tasks...');
    this.tasks.forEach((task, name) => {
      task.start();
      console.log(`Started task: ${name}`);
    });
  }

  // 停止所有定時任務
  stopAllTasks(): void {
    console.log('Stopping all scheduled tasks...');
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`Stopped task: ${name}`);
    });
  }

  // 啟動特定任務
  startTask(taskName: string): boolean {
    const task = this.tasks.get(taskName);
    if (task) {
      task.start();
      console.log(`Started task: ${taskName}`);
      return true;
    }
    console.error(`Task not found: ${taskName}`);
    return false;
  }

  // 停止特定任務
  stopTask(taskName: string): boolean {
    const task = this.tasks.get(taskName);
    if (task) {
      task.stop();
      console.log(`Stopped task: ${taskName}`);
      return true;
    }
    console.error(`Task not found: ${taskName}`);
    return false;
  }

  // 手動執行特定任務
  async runTaskManually(taskName: string): Promise<boolean> {
    try {
      switch (taskName) {
        case 'news-scraping':
          await enhancedNewsService.scrapeAllNews();
          break;
        case 'earnings-update':
          const earnings = await earningsService.getUpcomingEarnings(14);
          const today = new Date().toISOString().split('T')[0];
          await earningsService.saveEarningsData(today, earnings);
          break;
        case 'ai-summary':
          const date = new Date().toISOString().split('T')[0];
          await aiService.generateTop5MarketSummaries(date);
          break;
        default:
          console.error(`Unknown task: ${taskName}`);
          return false;
      }
      console.log(`Manually executed task: ${taskName}`);
      return true;
    } catch (error) {
      console.error(`Manual task execution failed for ${taskName}:`, error);
      return false;
    }
  }

  // 獲取任務狀態
  getTasksStatus(): { [key: string]: boolean } {
    const status: { [key: string]: boolean } = {};
    this.tasks.forEach((task, name) => {
      status[name] = task.running;
    });
    return status;
  }

  // 獲取下次執行時間
  getNextRunTimes(): { [key: string]: string | null } {
    const nextRuns: { [key: string]: string | null } = {};
    
    // 由於node-cron沒有直接提供下次執行時間的方法，
    // 這裡提供預期的執行時間說明
    nextRuns['news-scraping'] = '每30分鐘執行一次';
    nextRuns['earnings-update'] = '每4小時執行一次';
    nextRuns['ai-summary'] = '每2小時執行一次';
    nextRuns['cache-cleanup'] = '每小時執行一次';
    nextRuns['daily-update'] = '每日凌晨1點執行';
    nextRuns['pre-market'] = '工作日早上8:30執行';
    
    return nextRuns;
  }

  // 健康檢查
  healthCheck(): {
    status: 'healthy' | 'warning' | 'error';
    activeTasks: number;
    totalTasks: number;
    taskStatus: { [key: string]: boolean };
    cacheHealth: any;
  } {
    const taskStatus = this.getTasksStatus();
    const activeTasks = Object.values(taskStatus).filter(Boolean).length;
    const totalTasks = this.tasks.size;
    
    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    
    if (activeTasks < totalTasks * 0.5) {
      status = 'warning';
    }
    
    if (activeTasks === 0) {
      status = 'error';
    }

    return {
      status,
      activeTasks,
      totalTasks,
      taskStatus,
      cacheHealth: cacheService.healthCheck()
    };
  }
}

export const scheduledTasksService = new ScheduledTasksService();