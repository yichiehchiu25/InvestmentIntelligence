import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { StockWatchlistManager } from "./StockWatchlistManager";
import { NewsKeywordManager } from "./NewsKeywordManager";
import { 
  Settings, 
  Star, 
  TrendingUp, 
  Newspaper, 
  Bell, 
  Download,
  Upload,
  RefreshCw,
  Monitor,
  Database
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConfigurationPanelProps {
  currentMarket: "taiwan" | "us";
  onStockSelect?: (symbol: string) => void;
  onSettingsChange?: (settings: any) => void;
}

export function ConfigurationPanel({ 
  currentMarket, 
  onStockSelect, 
  onSettingsChange 
}: ConfigurationPanelProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    notifications: true,
    soundEnabled: false,
    darkMode: false,
    showVolume: true,
    showMarketCap: true,
    dataSource: 'yahoo', // yahoo, cnyes, goodinfo
    updateFrequency: 'real-time' // real-time, 5min, 15min
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('dashboard-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard-settings', JSON.stringify(settings));
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  }, [settings, onSettingsChange]);

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "設定已更新",
      description: `${getSettingName(key)} 設定已儲存`,
    });
  };

  const getSettingName = (key: string): string => {
    const names: { [key: string]: string } = {
      autoRefresh: "自動更新",
      notifications: "通知提醒",
      soundEnabled: "音效提醒",
      darkMode: "深色模式",
      showVolume: "顯示成交量",
      showMarketCap: "顯示市值"
    };
    return names[key] || key;
  };

  const exportSettings = () => {
    const allSettings = {
      dashboardSettings: settings,
      watchlist: {
        taiwan: JSON.parse(localStorage.getItem('watchlist_taiwan') || '[]'),
        us: JSON.parse(localStorage.getItem('watchlist_us') || '[]')
      },
      newsKeywords: JSON.parse(localStorage.getItem('newsKeywords') || '[]')
    };

    const dataStr = JSON.stringify(allSettings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taiwan-stock-dashboard-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "設定匯出成功",
      description: "所有設定已下載到您的電腦",
    });
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        
        if (importedSettings.dashboardSettings) {
          setSettings(importedSettings.dashboardSettings);
        }
        if (importedSettings.watchlist) {
          localStorage.setItem('watchlist_taiwan', JSON.stringify(importedSettings.watchlist.taiwan || []));
          localStorage.setItem('watchlist_us', JSON.stringify(importedSettings.watchlist.us || []));
        }
        if (importedSettings.newsKeywords) {
          localStorage.setItem('newsKeywords', JSON.stringify(importedSettings.newsKeywords));
        }

        toast({
          title: "設定匯入成功",
          description: "所有設定已恢復，頁面將重新載入",
        });

        // Reload page to apply all settings
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        toast({
          title: "匯入失敗",
          description: "設定檔案格式錯誤，請檢查檔案",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const resetAllSettings = () => {
    if (confirm("確定要重置所有設定嗎？這將清除您的自訂追蹤清單和關鍵字設定。")) {
      localStorage.removeItem('dashboard-settings');
      localStorage.removeItem('watchlist_taiwan');
      localStorage.removeItem('watchlist_us');
      localStorage.removeItem('newsKeywords');
      
      toast({
        title: "設定已重置",
        description: "所有設定已恢復預設值，頁面將重新載入",
      });

      setTimeout(() => window.location.reload(), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                系統設定與管理
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                管理您的台灣股票追蹤系統設定、監控清單和新聞關鍵字
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportSettings}>
                <Download className="h-4 w-4 mr-2" />
                匯出設定
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => document.getElementById('import-settings')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                匯入設定
              </Button>
              <input
                id="import-settings"
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={importSettings}
              />
              <Button variant="destructive" size="sm" onClick={resetAllSettings}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重置設定
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Configuration Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            一般設定
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            追蹤清單
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            新聞關鍵字
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            數據來源
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>一般設定</CardTitle>
              <p className="text-sm text-muted-foreground">
                配置儀表板的基本行為和顯示選項
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 更新設定 */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    資料更新設定
                  </h4>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="auto-refresh">自動更新</Label>
                      <p className="text-xs text-muted-foreground">每30秒自動更新股價</p>
                    </div>
                    <Switch
                      id="auto-refresh"
                      checked={settings.autoRefresh}
                      onCheckedChange={(checked) => updateSetting('autoRefresh', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>更新頻率</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'real-time', label: '即時' },
                        { value: '5min', label: '5分鐘' },
                        { value: '15min', label: '15分鐘' }
                      ].map((option) => (
                        <Button
                          key={option.value}
                          variant={settings.updateFrequency === option.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateSetting('updateFrequency', option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 通知設定 */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    通知設定
                  </h4>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="notifications">通知提醒</Label>
                      <p className="text-xs text-muted-foreground">重要股價變動提醒</p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={settings.notifications}
                      onCheckedChange={(checked) => updateSetting('notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="sound">音效提醒</Label>
                      <p className="text-xs text-muted-foreground">開盤/收盤音效</p>
                    </div>
                    <Switch
                      id="sound"
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
                    />
                  </div>
                </div>

                {/* 顯示設定 */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    顯示設定
                  </h4>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="show-volume">顯示成交量</Label>
                      <p className="text-xs text-muted-foreground">在股票清單中顯示成交量</p>
                    </div>
                    <Switch
                      id="show-volume"
                      checked={settings.showVolume}
                      onCheckedChange={(checked) => updateSetting('showVolume', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="show-market-cap">顯示市值</Label>
                      <p className="text-xs text-muted-foreground">在股票清單中顯示市值</p>
                    </div>
                    <Switch
                      id="show-market-cap"
                      checked={settings.showMarketCap}
                      onCheckedChange={(checked) => updateSetting('showMarketCap', checked)}
                    />
                  </div>
                </div>

                {/* 系統狀態 */}
                <div className="space-y-4">
                  <h4 className="font-medium">系統狀態</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-green-50 border border-green-200 rounded">
                      <span className="text-sm">TradingView 連接</span>
                      <Badge className="bg-green-100 text-green-800">正常</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-50 border border-green-200 rounded">
                      <span className="text-sm">新聞服務</span>
                      <Badge className="bg-green-100 text-green-800">正常</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <span className="text-sm">AI 分析服務</span>
                      <Badge className="bg-yellow-100 text-yellow-800">有限</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Watchlist Management */}
        <TabsContent value="watchlist" className="mt-6">
          <StockWatchlistManager 
            currentMarket={currentMarket}
            onStockSelect={onStockSelect}
          />
        </TabsContent>

        {/* News Keywords Management */}
        <TabsContent value="keywords" className="mt-6">
          <NewsKeywordManager />
        </TabsContent>

        {/* Data Source Settings */}
        <TabsContent value="data" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>數據來源設定</CardTitle>
              <p className="text-sm text-muted-foreground">
                選擇股票數據的主要來源和備用來源
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium">主要數據來源</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    {[
                      { 
                        value: 'yahoo', 
                        label: 'Yahoo Finance', 
                        description: '穩定性高，數據完整',
                        status: '推薦'
                      },
                      { 
                        value: 'cnyes', 
                        label: '鉅亨網', 
                        description: '台股專業，更新迅速',
                        status: '良好'
                      },
                      { 
                        value: 'goodinfo', 
                        label: 'Goodinfo', 
                        description: '詳細財務數據',
                        status: '有限'
                      }
                    ].map((source) => (
                      <Card 
                        key={source.value}
                        className={`cursor-pointer transition-all ${
                          settings.dataSource === source.value 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => updateSetting('dataSource', source.value)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{source.label}</h4>
                            <Badge 
                              variant={source.status === '推薦' ? 'default' : 'secondary'}
                            >
                              {source.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {source.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">數據來源說明</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 系統會自動在數據源之間切換以確保數據可用性</li>
                    <li>• Yahoo Finance 提供最穩定的國際股市數據</li>
                    <li>• 鉅亨網專精於台股，提供詳細的本土市場信息</li>
                    <li>• 所有數據都會進行驗證和格式化處理</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
