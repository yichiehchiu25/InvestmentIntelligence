import { AppHeader } from "@/components/AppHeader";
import { MacroeconomicDashboard } from "@/components/MacroeconomicDashboard";
import { FinancialCalendar } from "@/components/FinancialCalendar";
import { NewsAggregationPanel } from "@/components/NewsAggregationPanel";
import { ConfigurationPanel } from "@/components/ConfigurationPanel";

export default function Dashboard() {
  return (
    <div className="bg-neutral min-h-screen">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MacroeconomicDashboard />
        <FinancialCalendar />
        <NewsAggregationPanel />
        <ConfigurationPanel />
        
        {/* Future Features Placeholder */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-pie text-2xl text-gray-400"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">投資組合整合</h3>
              <p className="text-gray-600 mb-4">
                即將推出帳戶串接功能，可追蹤投資損益並根據新聞分析提供個人化投資建議。
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <span><i className="fas fa-check mr-1"></i>帳戶串接</span>
                <span><i className="fas fa-check mr-1"></i>損益追蹤</span>
                <span><i className="fas fa-check mr-1"></i>AI投資建議</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">平台功能</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#dashboard" className="hover:text-primary transition-colors">宏觀經濟指標</a></li>
                <li><a href="#calendar" className="hover:text-primary transition-colors">財經日曆</a></li>
                <li><a href="#news" className="hover:text-primary transition-colors">新聞分析</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">AI摘要報告</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">技術支援</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary transition-colors">API文件</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">使用說明</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">問題回報</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">系統狀態</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">資料來源</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>經濟數據: Fed, ECB, 台灣央行</li>
                <li>新聞來源: Reuters, Bloomberg</li>
                <li>AI分析: OpenAI GPT-4</li>
                <li>時區: 台灣標準時間 (TST)</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-500">
            <p>&copy; 2024 投資研究平台. 僅供研究參考，不構成投資建議。</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
