import { storage } from "../storage";
import type { InsertCalendarEvent } from "@shared/schema";

export class CalendarService {
  async initializeCalendarEvents(): Promise<void> {
    const events: InsertCalendarEvent[] = [
      // This week's events (January 13-17, 2025)
      {
        title: "美國CPI數據發布",
        description: "12月消費者物價指數(YoY: 2.9%預期)",
        date: "2025-01-15",
        time: "21:30 (台灣標準時間)",
        category: "經濟數據",
        importance: "high",
        source: "美國勞工統計局"
      },
      {
        title: "美國PPI數據發布", 
        description: "12月生產者物價指數",
        date: "2025-01-14",
        time: "21:30 (台灣標準時間)",
        category: "經濟數據",
        importance: "medium",
        source: "美國勞工統計局"
      },
      {
        title: "Fed會議紀要發布",
        description: "12月FOMC會議詳細紀要",
        date: "2025-01-14",
        time: "03:00 (台灣標準時間)",
        category: "央行會議",
        importance: "high",
        source: "Federal Reserve"
      },
      {
        title: "美國零售銷售數據",
        description: "12月零售銷售月增率",
        date: "2025-01-16",
        time: "21:30 (台灣標準時間)",
        category: "經濟數據",
        importance: "high",
        source: "美國商務部"
      },
      {
        title: "歐洲央行利率決議",
        description: "ECB利率政策會議",
        date: "2025-01-16",
        time: "20:15 (台灣標準時間)",
        category: "央行會議",
        importance: "high",
        source: "European Central Bank"
      },
      // Legacy events for backward compatibility
      {
        title: "台積電法說會",
        description: "Q4財報發布與未來展望說明",
        date: "2024-12-20",
        time: "14:00 - 16:00 (台灣標準時間)",
        category: "法說會",
        importance: "high",
        source: "台積電"
      },
      {
        title: "Fed利率決策會議",
        description: "聯準會公布利率決策與政策聲明",
        date: "2024-12-21",
        time: "03:00 (台灣標準時間)",
        category: "央行會議",
        importance: "high",
        source: "Federal Reserve"
      }
    ];

    for (const event of events) {
      await storage.createCalendarEvent(event);
    }
  }

  async getCalendarEvents() {
    return await storage.getCalendarEvents();
  }

  async getEventsByDate(date: string) {
    return await storage.getCalendarEventsByDate(date);
  }

  async addCalendarEvent(event: InsertCalendarEvent) {
    return await storage.createCalendarEvent(event);
  }

  // Convert UTC to Taiwan Standard Time
  convertToTST(utcDate: Date): Date {
    return new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
  }

  // Get upcoming events for the next 7 days
  async getUpcomingEvents(days: number = 7) {
    const allEvents = await storage.getCalendarEvents();
    const today = new Date();
    const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= futureDate;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}

export const calendarService = new CalendarService();
