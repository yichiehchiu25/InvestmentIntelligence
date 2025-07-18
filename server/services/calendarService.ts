import { storage } from "../storage";
import type { InsertCalendarEvent } from "@shared/schema";

export class CalendarService {
  async initializeCalendarEvents(): Promise<void> {
    const events: InsertCalendarEvent[] = [
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
      },
      {
        title: "Apple發表會",
        description: "新產品發表會，預期影響科技股表現",
        date: "2024-12-25",
        time: "02:00 (台灣標準時間)",
        category: "產品發表",
        importance: "medium",
        source: "Apple Inc."
      },
      {
        title: "台灣央行理監事會議",
        description: "第4季利率政策決策會議",
        date: "2024-12-19",
        time: "14:30 (台灣標準時間)",
        category: "央行會議",
        importance: "high",
        source: "中央銀行"
      },
      {
        title: "美國就業數據發布",
        description: "11月非農就業人口變化",
        date: "2024-12-22",
        time: "21:30 (台灣標準時間)",
        category: "經濟數據",
        importance: "high",
        source: "美國勞工部"
      },
      {
        title: "Google Gemini發表會",
        description: "AI技術更新與產品發布",
        date: "2024-12-28",
        time: "01:00 (台灣標準時間)",
        category: "產品發表",
        importance: "medium",
        source: "Google"
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
