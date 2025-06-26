import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, CalendarPlus, ChevronLeft, ChevronRight, Building, University } from "lucide-react";
import type { CalendarEvent } from "@shared/schema";

export function FinancialCalendar() {
  const { data: events, isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar-events/upcoming"],
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "法說會":
        return <Building className="text-primary" />;
      case "央行會議":
        return <University className="text-red-600" />;
      case "產品發表":
        return <Building className="text-green-600" />;
      case "經濟數據":
        return <Calendar className="text-blue-600" />;
      default:
        return <Calendar className="text-primary" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "法說會":
        return "bg-blue-100 text-blue-800";
      case "央行會議":
        return "bg-red-100 text-red-800";
      case "產品發表":
        return "bg-green-100 text-green-800";
      case "經濟數據":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <section id="calendar" className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">財經日曆</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="divide-y divide-gray-200">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-4">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-grow">
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-32 mb-1" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section id="calendar" className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">財經日曆</h2>
        <div className="flex items-center space-x-2">
          <Button className="bg-primary hover:bg-blue-700">
            <CalendarPlus className="h-4 w-4 mr-2" />
            訂閱提醒
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {new Date().toLocaleDateString("zh-TW", { 
                  year: "numeric", 
                  month: "long",
                  timeZone: "Asia/Taipei"
                })}
              </h3>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">今天</Button>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {events?.map((event) => (
              <div key={event.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                      {getCategoryIcon(event.category)}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={getCategoryColor(event.category)}>
                          {event.category}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(event.date).toLocaleDateString("zh-TW", { 
                            month: "numeric", 
                            day: "numeric",
                            timeZone: "Asia/Taipei"
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{event.time}</p>
                    {event.description && (
                      <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
