import { Bell, Settings, User, ChartLine } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <ChartLine className="text-2xl text-primary" />
              <h1 className="text-xl font-semibold text-gray-900">投資研究平台</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#dashboard" className="text-primary font-medium border-b-2 border-primary pb-1">總覽</a>
              <a href="#calendar" className="text-gray-600 hover:text-primary transition-colors">財經日曆</a>
              <a href="#news" className="text-gray-600 hover:text-primary transition-colors">新聞分析</a>
              <a href="#portfolio" className="text-gray-400 cursor-not-allowed">投資組合 (即將推出)</a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-primary">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-primary">
              <Settings className="h-5 w-5" />
            </Button>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="text-white text-sm" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
