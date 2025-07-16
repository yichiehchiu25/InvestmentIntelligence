import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Settings, Search, Tag, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NewsKeyword {
  id: string;
  keyword: string;
  category: string;
  isActive: boolean;
  addedAt: Date;
}

interface NewsKeywordManagerProps {
  onKeywordsUpdate?: (keywords: NewsKeyword[]) => void;
}

export function NewsKeywordManager({ onKeywordsUpdate }: NewsKeywordManagerProps) {
  const { toast } = useToast();
  const [keywords, setKeywords] = useState<NewsKeyword[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("總體經濟");
  const [activeCategory, setActiveCategory] = useState<string>("總體經濟");

  const categories = ["總體經濟", "科技股", "能源商品", "加密貨幣"];

  // 預設關鍵字
  const defaultKeywords = {
    "總體經濟": [
      "Fed", "央行", "利率", "通脹", "CPI", "GDP", "失業率", 
      "Federal Reserve", "inflation", "recession", "經濟成長", 
      "貨幣政策", "財政政策", "消費者信心"
    ],
    "科技股": [
      "Apple", "Microsoft", "Google", "Meta", "Amazon", "Tesla", 
      "NVIDIA", "台積電", "TSMC", "半導體", "AI", "人工智慧",
      "ChatGPT", "晶片", "電動車", "自動駕駛"
    ],
    "能源商品": [
      "原油", "石油", "天然氣", "OPEC", "oil", "energy", 
      "commodity", "gold", "黃金", "白銀", "銅", "鋰",
      "綠能", "太陽能", "風力發電"
    ],
    "加密貨幣": [
      "Bitcoin", "Ethereum", "crypto", "blockchain", "比特幣", 
      "以太坊", "加密貨幣", "數位貨幣", "NFT", "DeFi",
      "Web3", "元宇宙", "虛擬貨幣"
    ]
  };

  // 初始化關鍵字
  useEffect(() => {
    const savedKeywords = localStorage.getItem('newsKeywords');
    if (savedKeywords) {
      try {
        const parsed = JSON.parse(savedKeywords);
        setKeywords(parsed.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        })));
      } catch (error) {
        console.error("Error loading keywords:", error);
        initializeDefaultKeywords();
      }
    } else {
      initializeDefaultKeywords();
    }
  }, []);

  const initializeDefaultKeywords = () => {
    const initialKeywords: NewsKeyword[] = [];
    
    Object.entries(defaultKeywords).forEach(([category, keywordList]) => {
      keywordList.forEach((keyword, index) => {
        initialKeywords.push({
          id: `${category}-${index}`,
          keyword,
          category,
          isActive: true,
          addedAt: new Date()
        });
      });
    });
    
    setKeywords(initialKeywords);
  };

  // 儲存關鍵字到 localStorage
  useEffect(() => {
    localStorage.setItem('newsKeywords', JSON.stringify(keywords));
    if (onKeywordsUpdate) {
      onKeywordsUpdate(keywords);
    }
  }, [keywords, onKeywordsUpdate]);

  const addKeyword = () => {
    if (!newKeyword.trim()) {
      toast({
        title: "請輸入關鍵字",
        description: "關鍵字不能為空",
        variant: "destructive",
      });
      return;
    }

    const exists = keywords.some(k => 
      k.keyword.toLowerCase() === newKeyword.toLowerCase() && 
      k.category === selectedCategory
    );

    if (exists) {
      toast({
        title: "關鍵字已存在",
        description: `"${newKeyword}" 已在 ${selectedCategory} 分類中`,
        variant: "destructive",
      });
      return;
    }

    const newKeywordObj: NewsKeyword = {
      id: `custom-${Date.now()}`,
      keyword: newKeyword.trim(),
      category: selectedCategory,
      isActive: true,
      addedAt: new Date()
    };

    setKeywords(prev => [...prev, newKeywordObj]);
    setNewKeyword("");
    
    toast({
      title: "新增成功",
      description: `關鍵字 "${newKeyword}" 已加入 ${selectedCategory}`,
    });
  };

  const removeKeyword = (id: string) => {
    const keyword = keywords.find(k => k.id === id);
    setKeywords(prev => prev.filter(k => k.id !== id));
    
    toast({
      title: "移除成功",
      description: `關鍵字 "${keyword?.keyword}" 已移除`,
    });
  };

  const toggleKeyword = (id: string) => {
    setKeywords(prev => prev.map(k => 
      k.id === id ? { ...k, isActive: !k.isActive } : k
    ));
  };

  const getKeywordsByCategory = (category: string) => {
    return keywords.filter(k => k.category === category);
  };

  const resetToDefaults = () => {
    initializeDefaultKeywords();
    toast({
      title: "重置完成",
      description: "已恢復預設關鍵字設定",
    });
  };

  const exportKeywords = () => {
    const dataStr = JSON.stringify(keywords, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `news-keywords-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "匯出成功",
      description: "關鍵字設定已下載",
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "總體經濟":
        return "bg-blue-100 text-blue-800";
      case "科技股":
        return "bg-green-100 text-green-800";
      case "能源商品":
        return "bg-yellow-100 text-yellow-800";
      case "加密貨幣":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-500" />
            新聞關鍵字管理
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportKeywords}>
              <Save className="h-4 w-4 mr-2" />
              匯出設定
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  新增關鍵字
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新增新聞關鍵字</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category">選擇分類</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="keyword">關鍵字</Label>
                    <div className="flex gap-2">
                      <Input
                        id="keyword"
                        placeholder="輸入新聞關鍵字..."
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                      />
                      <Button onClick={addKeyword} disabled={!newKeyword.trim()}>
                        新增
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>提示：關鍵字將用於搜尋相關新聞，建議使用:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>公司名稱 (如: 台積電, Apple)</li>
                      <li>經濟指標 (如: CPI, GDP, 利率)</li>
                      <li>商品名稱 (如: 原油, 黃金, 比特幣)</li>
                      <li>中英文皆可，建議同時添加</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="text-sm">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(category)}>
                    {category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {getKeywordsByCategory(category).filter(k => k.isActive).length} 個啟用 / 
                    {getKeywordsByCategory(category).length} 個總計
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={resetToDefaults}>
                  重置預設
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {getKeywordsByCategory(category).map((keyword) => (
                  <div
                    key={keyword.id}
                    className={`flex items-center justify-between p-2 border rounded-lg ${
                      keyword.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <span 
                      className={`text-sm cursor-pointer ${
                        keyword.isActive ? 'text-gray-900' : 'text-gray-500 line-through'
                      }`}
                      onClick={() => toggleKeyword(keyword.id)}
                      title={keyword.isActive ? "點擊停用" : "點擊啟用"}
                    >
                      {keyword.keyword}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeKeyword(keyword.id)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {getKeywordsByCategory(category).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>此分類還沒有關鍵字</p>
                  <p className="text-sm">點擊上方「新增關鍵字」開始添加</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">使用說明</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 點擊關鍵字可以啟用/停用</li>
            <li>• 只有啟用的關鍵字會用於新聞搜尋</li>
            <li>• 建議每個分類保持 10-15 個啟用關鍵字</li>
            <li>• 可以匯出設定備份或分享給其他人</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}