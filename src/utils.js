// 取得本地今天的日期字串 (YYYY-MM-DD)
export const getLocalToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

// 取得本地本月的日期字串 (YYYY-MM)
export const getLocalMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };

// 日期月份加減計算
export const addMonths = (dStr, m) => { const [y,M,d]=dStr.split('-').map(Number); const nd=new Date(y,M-1+m,1); if(m>0) return `${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,'0')}-01`; const maxD=new Date(nd.getFullYear(),nd.getMonth()+1,0).getDate(); return `${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,'0')}-${String(Math.min(d,maxD)).padStart(2,'0')}`; };

// 取得星期幾
export const getDayOfWeek = (dateStr) => { const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']; return days[new Date(dateStr).getDay()]; };

// 安全的數字格式化 (加入千分位逗號)
export const safeNum = (val) => { if (val === null || val === undefined) return "0"; const num = parseFloat(val); if (isNaN(num)) return "0"; return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); };