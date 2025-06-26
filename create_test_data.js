// 創建測試數據的腳本
import fs from 'fs';
import path from 'path';

const today = new Date().toISOString().split('T')[0];
const rawPath = path.join('storage', 'raw', today);
const summariesPath = path.join('storage', 'summaries', today);

// 確保目錄存在
fs.mkdirSync(rawPath, { recursive: true });
fs.mkdirSync(summariesPath, { recursive: true });

// 創建新聞原始數據
const newsData = [
  {
    title: "台灣央行維持利率1.875%不變，密切關注通膨動向",
    summary: "中央銀行今日召開理監事會議，決議維持政策利率於1.875%。央行總裁表示將持續觀察國際通膨趨勢。",
    category: "總體經濟",
    source: "中央社",
    timestamp: new Date().toISOString()
  },
  {
    title: "台積電第二季營收創新高，AI晶片需求強勁",
    summary: "台積電公布第二季營收達新台幣6,081億元，較去年同期成長40%，主要受惠於AI晶片訂單大幅增加。",
    category: "科技股",
    source: "經濟日報",
    timestamp: new Date().toISOString()
  },
  {
    title: "Fed暗示年底前可能再降息一次，美股收盤走高",
    summary: "聯準會官員發言暗示通膨降溫，市場預期年底前可能再降息一次，推升美股三大指數收紅。",
    category: "總體經濟",
    source: "工商時報",
    timestamp: new Date().toISOString()
  }
];

// 儲存原始新聞數據
newsData.forEach((news, index) => {
  const filename = `${news.source}_${Date.now() + index}.json`;
  const filepath = path.join(rawPath, filename);
  fs.writeFileSync(filepath, JSON.stringify(news, null, 2), 'utf8');
  console.log(`已創建: ${filepath}`);
});

// 創建摘要檔案
const summaries = {
  "總體經濟": `# 總體經濟市場分析 - ${today}

## 主要動態
- 台灣央行維持政策利率於1.875%，顯示貨幣政策穩健態度
- Fed官員發言暗示通膨降溫，市場預期年底前可能再降息
- 各國央行政策分化，對全球資金流向產生影響

## 重點指標
- 台灣央行利率: 1.875% (維持不變)
- 歐洲央行利率: 4.50% (持平)
- 日本央行利率: -0.10% (持平)

## 市場展望
央行政策的穩健性為台灣金融市場提供了良好的基礎，但仍需密切關注國際通膨趨勢的變化。`,

  "科技股": `# 科技股市場分析 - ${today}

## 重點表現
- 台積電第二季營收創新高，達新台幣6,081億元
- AI晶片需求持續強勁，推動半導體產業成長
- 科技股整體表現優於大盤

## 產業趨勢
- AI應用需求持續擴大
- 半導體製程技術持續精進
- 供應鏈管理日趨重要

## 投資建議
科技股受惠於AI浪潮，但需注意估值水位及市場波動風險。`
};

// 儲存摘要檔案
Object.entries(summaries).forEach(([category, content]) => {
  const filename = `${category}.md`;
  const filepath = path.join(summariesPath, filename);
  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`已創建摘要: ${filepath}`);
});

console.log('\n=== 檔案儲存路徑總覽 ===');
console.log(`原始數據路徑: storage/raw/${today}/`);
console.log(`摘要檔案路徑: storage/summaries/${today}/`);
console.log('\n檔案結構:');
console.log('storage/');
console.log(`├── raw/${today}/`);
console.log('│   ├── 中央社_*.json');
console.log('│   ├── 經濟日報_*.json');
console.log('│   └── 工商時報_*.json');
console.log(`├── summaries/${today}/`);
console.log('│   ├── 總體經濟.md');
console.log('│   └── 科技股.md');