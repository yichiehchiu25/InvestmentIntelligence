import { Bell, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function AppHeader() {
  const [activeMarket, setActiveMarket] = useState<"taiwan" | "us">("taiwan");

  const handleMarketSwitch = (market: "taiwan" | "us") => {
    setActiveMarket(market);
    // Emit event for other components to listen to market changes
    window.dispatchEvent(new CustomEvent('marketSwitch', { detail: market }));
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Platform Name</h1>
          </div>

          {/* Market Switching Buttons */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <Button
                variant={activeMarket === "taiwan" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleMarketSwitch("taiwan")}
                className={`px-4 py-2 rounded-md transition-all ${
                  activeMarket === "taiwan" 
                    ? "bg-blue-500 text-white shadow-sm" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-white"
                }`}
              >
                台股
              </Button>
              <Button
                variant={activeMarket === "us" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleMarketSwitch("us")}
                className={`px-4 py-2 rounded-md transition-all ${
                  activeMarket === "us" 
                    ? "bg-blue-500 text-white shadow-sm" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-white"
                }`}
              >
                美股
              </Button>
            </div>
            
            {/* Header Buttons */}
            <div className="flex items-center space-x-2">
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
      </div>
    </header>
  );
}
