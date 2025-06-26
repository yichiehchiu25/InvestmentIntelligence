import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

export class FileStorageService {
  private baseStoragePath = path.join(process.cwd(), 'storage');
  private summariesPath = path.join(this.baseStoragePath, 'summaries');
  private rawDataPath = path.join(this.baseStoragePath, 'raw');

  constructor() {
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist(): void {
    const directories = [
      this.baseStoragePath,
      this.summariesPath,
      this.rawDataPath
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    });
  }

  // Save daily markdown summary by date and category
  async saveDailySummary(date: string, category: string, content: string, metadata?: any): Promise<string> {
    const dateFolder = path.join(this.summariesPath, date);
    
    if (!fs.existsSync(dateFolder)) {
      fs.mkdirSync(dateFolder, { recursive: true });
    }

    const filename = `${category.replace(/\s+/g, '_')}.md`;
    const filepath = path.join(dateFolder, filename);
    
    const markdownContent = this.formatMarkdownSummary(date, category, content, metadata);
    
    fs.writeFileSync(filepath, markdownContent, 'utf8');
    console.log(`Saved daily summary: ${filepath}`);
    
    return filepath;
  }

  // Save raw news data as JSON
  async saveRawNewsData(date: string, source: string, data: any): Promise<string> {
    const dateFolder = path.join(this.rawDataPath, date);
    
    if (!fs.existsSync(dateFolder)) {
      fs.mkdirSync(dateFolder, { recursive: true });
    }

    const filename = `${source.replace(/\s+/g, '_')}_${Date.now()}.json`;
    const filepath = path.join(dateFolder, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Saved raw news data: ${filepath}`);
    
    return filepath;
  }

  // Format markdown content for daily summary
  private formatMarkdownSummary(date: string, category: string, content: string, metadata?: any): string {
    const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
    
    let markdown = `# ${category} - 每日投資分析摘要\n\n`;
    markdown += `**日期**: ${date}\n`;
    markdown += `**生成時間**: ${timestamp} (台灣標準時間)\n`;
    markdown += `**分類**: ${category}\n\n`;
    
    if (metadata?.newsCount) {
      markdown += `**分析新聞數量**: ${metadata.newsCount}則\n`;
    }
    
    if (metadata?.keywords && metadata.keywords.length > 0) {
      markdown += `**關鍵字**: ${metadata.keywords.join(', ')}\n`;
    }
    
    if (metadata?.sentiment) {
      markdown += `**市場情緒**: ${metadata.sentiment}\n`;
    }
    
    markdown += `\n---\n\n`;
    markdown += `## 市場分析\n\n`;
    markdown += `${content}\n\n`;
    markdown += `---\n\n`;
    markdown += `*此分析由AI生成，僅供投資研究參考，不構成投資建議*\n`;
    markdown += `*資料來源: Reuters, Bloomberg, Google News*\n`;
    markdown += `*分析模型: OpenAI GPT-4*\n`;
    
    return markdown;
  }

  // Read daily summary for Streamlit compatibility
  async readDailySummary(date: string, category: string): Promise<string | null> {
    const filename = `${category.replace(/\s+/g, '_')}.md`;
    const filepath = path.join(this.summariesPath, date, filename);
    
    if (fs.existsSync(filepath)) {
      return fs.readFileSync(filepath, 'utf8');
    }
    
    return null;
  }

  // Get all available summary dates
  async getAvailableDates(): Promise<string[]> {
    if (!fs.existsSync(this.summariesPath)) {
      return [];
    }
    
    return fs.readdirSync(this.summariesPath)
      .filter(item => {
        const itemPath = path.join(this.summariesPath, item);
        return fs.statSync(itemPath).isDirectory();
      })
      .sort()
      .reverse(); // Most recent first
  }

  // Get summaries for a specific date
  async getSummariesForDate(date: string): Promise<Array<{ category: string, filepath: string, content: string }>> {
    const dateFolder = path.join(this.summariesPath, date);
    
    if (!fs.existsSync(dateFolder)) {
      return [];
    }
    
    const files = fs.readdirSync(dateFolder).filter(file => file.endsWith('.md'));
    const summaries = [];
    
    for (const file of files) {
      const filepath = path.join(dateFolder, file);
      const content = fs.readFileSync(filepath, 'utf8');
      const category = file.replace('_', ' ').replace('.md', '');
      
      summaries.push({
        category,
        filepath,
        content
      });
    }
    
    return summaries;
  }

  // Create index file for Streamlit access
  async createStreamlitIndex(): Promise<void> {
    const indexPath = path.join(this.baseStoragePath, 'index.json');
    const dates = await this.getAvailableDates();
    
    const index = {
      lastUpdated: new Date().toISOString(),
      availableDates: dates,
      totalSummaries: 0,
      categories: ['總體經濟', '科技股', '能源商品', '加密貨幣'],
      storageStructure: {
        summaries: 'storage/summaries/YYYY-MM-DD/category.md',
        raw: 'storage/raw/YYYY-MM-DD/source_timestamp.json'
      }
    };
    
    // Count total summaries
    for (const date of dates) {
      const summaries = await this.getSummariesForDate(date);
      index.totalSummaries += summaries.length;
    }
    
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
    console.log(`Created Streamlit index: ${indexPath}`);
  }

  // Cleanup old files (optional)
  async cleanupOldFiles(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const dates = await this.getAvailableDates();
    
    for (const date of dates) {
      const fileDate = new Date(date);
      if (fileDate < cutoffDate) {
        const dateFolder = path.join(this.summariesPath, date);
        fs.rmSync(dateFolder, { recursive: true, force: true });
        console.log(`Cleaned up old summaries for date: ${date}`);
      }
    }
  }

  // Export for external tools (like Streamlit)
  async exportForStreamlit(outputPath?: string): Promise<string> {
    const exportPath = outputPath || path.join(this.baseStoragePath, 'streamlit_export.json');
    const dates = await this.getAvailableDates();
    
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalDates: dates.length,
        dataPath: this.summariesPath
      },
      summaries: [] as Array<{
        date: string;
        summaries: Array<{
          category: string;
          filepath: string;
          preview: string;
        }>;
      }>
    };
    
    for (const date of dates) {
      const summaries = await this.getSummariesForDate(date);
      exportData.summaries.push({
        date,
        summaries: summaries.map(s => ({
          category: s.category,
          filepath: s.filepath,
          preview: s.content.substring(0, 200) + '...'
        }))
      });
    }
    
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf8');
    console.log(`Exported data for Streamlit: ${exportPath}`);
    
    return exportPath;
  }
}

export const fileStorageService = new FileStorageService();