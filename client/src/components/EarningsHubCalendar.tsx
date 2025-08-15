import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Building, 
  University, 
  TrendingUp,
  Clock,
  Star,
  BarChart3
} from "lucide-react";
import { useState, useMemo } from "react";
import type { CalendarEvent } from "@shared/schema";

interface EarningsCompany {
  symbol: string;
  name: string;
  time: "before_open" | "after_close";
  logo?: string;
}

export function EarningsHubCalendar() {
  const [currentWeek, setCurrentWeek] = useState(0); // 0 = current week, 1 = next week
  const [viewMode, setViewMode] = useState<"popular" | "all">("popular");

  const { data: events, isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar-events/upcoming"],
  });

  // Generate dates for the current week
  const weekDates = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (currentWeek * 7)); // Start from Monday
    
    const dates = [];
    for (let i = 0; i < 5; i++) { // Monday to Friday
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentWeek]);

  // Sample earnings data (this should come from API in real implementation)
  const earningsData: Record<string, EarningsCompany[]> = {
    "2025-01-13": [
      { symbol: "MNDY", name: "Monday.com", time: "before_open" },
      { symbol: "AMC", name: "AMC Entertainment", time: "before_open" },
      { symbol: "B", name: "Barnes & Noble", time: "before_open" },
    ],
    "2025-01-14": [
      { symbol: "CRCL", name: "Circle Internet", time: "before_open" },
      { symbol: "ONON", name: "On Holding", time: "before_open" },
      { symbol: "SE", name: "Sea Limited", time: "before_open" },
      { symbol: "ONDS", name: "Ondas Holdings", time: "after_close" },
      { symbol: "PONY", name: "Pony AI", time: "after_close" },
      { symbol: "BITF", name: "Bitfarms", time: "after_close" },
    ],
    "2025-01-15": [
      { symbol: "CLBE", name: "Core Laboratories", time: "before_open" },
      { symbol: "EAT", name: "Brinker International", time: "before_open" },
      { symbol: "CSCO", name: "Cisco Systems", time: "after_close" },
      { symbol: "DLO", name: "DLocal", time: "after_close" },
      { symbol: "COHR", name: "Coherent", time: "after_close" },
    ],
    "2025-01-16": [
      { symbol: "JD", name: "JD.com", time: "before_open" },
      { symbol: "DE", name: "Deere & Company", time: "before_open" },
      { symbol: "NU", name: "Nu Holdings", time: "after_close" },
      { symbol: "AMAT", name: "Applied Materials", time: "after_close" },
      { symbol: "QUBT", name: "Quantum Computing", time: "after_close" },
    ],
    "2025-01-17": [
      { symbol: "NANO", name: "Nanobiotix", time: "after_close" },
      { symbol: "NNE", name: "Nano Nuclear Energy", time: "after_close" },
      { symbol: "RCAT", name: "Red Cat Holdings", time: "after_close" },
      { symbol: "KULR", name: "KULR Technology", time: "after_close" },
    ]
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "法說會":
      case "earnings":
        return <Building className="h-4 w-4 text-blue-600" />;
      case "央行會議":
        return <University className="h-4 w-4 text-red-600" />;
      case "經濟數據":
        return <BarChart3 className="h-4 w-4 text-purple-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', { 
      month: 'numeric',
      day: 'numeric'
    });
  };

  const getDayName = (date: Date) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getDay()];
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events?.filter(event => event.date === dateStr) || [];
  };

  const getEarningsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return earningsData[dateStr] || [];
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">財報週曆</h2>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {currentWeek === 0 ? "本週" : "下週"}
            </Badge>
            <span className="text-sm text-gray-500">
              {weekDates[0]?.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })} - {weekDates[4]?.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === "popular" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("popular")}
              className="rounded-r-none"
            >
              <Star className="h-4 w-4 mr-1" />
              Popular
            </Button>
            <Button
              variant={viewMode === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("all")}
              className="rounded-l-none border-l"
            >
              All
            </Button>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
              disabled={currentWeek === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentWeek(currentWeek + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-5 gap-4">
        {weekDates.map((date, index) => {
          const dayName = getDayName(date);
          const dateStr = formatDate(date);
          const earnings = getEarningsForDate(date);
          const economicEvents = getEventsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div key={index} className="space-y-4">
              {/* Date Header */}
              <div className="text-center">
                <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                  {dayName}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {dateStr}
                </div>
              </div>

              {/* Earnings Before Market Open */}
              {earnings.filter(e => e.time === "before_open").length > 0 && (
                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-600">Before Open</span>
                  </div>
                  <div className="space-y-2">
                    {earnings.filter(e => e.time === "before_open").map((company, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold">
                          {company.symbol.slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{company.symbol}</div>
                          <div className="text-xs text-gray-500 truncate">{company.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Economic Events */}
              {economicEvents.length > 0 && (
                <Card className="p-3">
                  <div className="space-y-2">
                    {economicEvents.map((event, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(event.category)}
                          <span className="text-xs font-medium">{event.title}</span>
                        </div>
                        <Badge size="sm" className={getImportanceColor(event.importance)}>
                          {event.importance}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Earnings After Market Close */}
              {earnings.filter(e => e.time === "after_close").length > 0 && (
                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-600">After Close</span>
                  </div>
                  <div className="space-y-2">
                    {earnings.filter(e => e.time === "after_close").map((company, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold">
                          {company.symbol.slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{company.symbol}</div>
                          <div className="text-xs text-gray-500 truncate">{company.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* No Events */}
              {earnings.length === 0 && economicEvents.length === 0 && (
                <Card className="p-3 text-center">
                  <div className="text-xs text-gray-500">No Earnings</div>
                </Card>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span>盤前財報</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>盤後財報</span>
        </div>
        <div className="flex items-center gap-2">
          <University className="h-3 w-3 text-red-600" />
          <span>央行會議</span>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3 w-3 text-purple-600" />
          <span>經濟數據</span>
        </div>
      </div>
    </div>
  );
}