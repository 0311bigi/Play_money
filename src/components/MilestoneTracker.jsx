import React, { useMemo } from 'react';
import { Icon } from './Icon';

export const MilestoneTracker = ({ transactions, currentTotalAssets }) => {
    const milestones = useMemo(() => {
        if (!transactions || transactions.length === 0 || !currentTotalAssets) return [];

        // 1. 計算目前的百萬等級 (例如 478萬 -> 4)
        const maxMilestone = Math.floor(currentTotalAssets / 1000000);
        if (maxMilestone < 1) return [];

        // 2. 將每天的「淨現金流」分組加總 (收入 - 支出)
        const dailyNetFlow = {};
        transactions.forEach(tx => {
            if (!tx.date || tx.type === 'transfer' || tx.type === 'repayment') return; 
            
            const date = tx.date;
            if (!dailyNetFlow[date]) dailyNetFlow[date] = 0;
            
            let amt = parseFloat(tx.amount) || 0;
            // 處理外幣，如果有匯率就乘上匯率，沒有就當作 1
            if (tx.currency && tx.currency !== 'TWD') {
                amt = amt * (tx.exchangeRate || 1); 
            }

            if (tx.type === 'income') dailyNetFlow[date] += amt;
            else if (tx.type === 'expense') dailyNetFlow[date] -= amt;
        });

        // 3. 將日期由新到舊排序 (準備時光倒流)
        const sortedDates = Object.keys(dailyNetFlow).sort((a, b) => b.localeCompare(a));

        // 4. 開始時光倒流回推
        let runningAssets = currentTotalAssets;
        let currentTarget = maxMilestone * 1000000;
        const achieved = [];

        // 放入「下一個百萬」的進行中目標
        achieved.push({
            level: maxMilestone + 1,
            amount: (maxMilestone + 1) * 1000000,
            date: '進行中',
            days: null
        });

        for (let date of sortedDates) {
            // 如果倒推後的資產小於當前追蹤的百萬目標，代表在這一天我們「跨越」了該目標
            while (runningAssets >= currentTarget && currentTarget >= 1000000) {
                 achieved.push({
                     level: currentTarget / 1000000,
                     amount: currentTarget,
                     date: date,
                     days: 0 // 稍後計算
                 });
                 currentTarget -= 1000000;
            }
            // 倒推算法：把今天的淨現金流「減回去」
            runningAssets -= dailyNetFlow[date];
        }

        // 5. 計算每個里程碑之間花費的天數
        achieved.sort((a, b) => a.level - b.level); // 由小到大排序來算天數

        for (let i = 0; i < achieved.length; i++) {
            if (i === 0) {
                achieved[i].daysText = '🏁 初始累積';
            } else if (achieved[i].date !== '進行中' && achieved[i-1].date !== '進行中') {
                const d1 = new Date(achieved[i-1].date);
                const d2 = new Date(achieved[i].date);
                const diffTime = Math.abs(d2 - d1);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                achieved[i].days = diffDays;
                achieved[i].daysText = `${diffDays} 天`;
                
                // 計算是否加速 (比上一個百萬縮短了幾天)
                if (i > 1 && typeof achieved[i-1].days === 'number') {
                    const speedup = achieved[i-1].days - diffDays;
                    achieved[i].speedup = speedup;
                }
            } else if (achieved[i].date === '進行中') {
                const remaining = achieved[i].amount - currentTotalAssets;
                achieved[i].daysText = `⏳ 剩餘 $${Math.round(remaining).toLocaleString()}`;
            }
        }

        return achieved.reverse(); // 畫面顯示由大到小 (最新的在上面)
    }, [transactions, currentTotalAssets]);

    if (milestones.length === 0) return null;

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-200 mt-4">
            <div className="flex items-center gap-2 mb-4">
                <Icon name="trending-up" className="text-rose-500" />
                <h3 className="font-bold text-stone-800">百萬里程碑追蹤</h3>
            </div>
            
            <div className="space-y-3">
                {milestones.map((m, idx) => (
                    <div key={m.level} className={`flex items-center justify-between p-3 rounded-lg ${m.date === '進行中' ? 'bg-stone-50 border-2 border-dashed border-stone-200' : 'bg-stone-50'}`}>
                        <div>
                            <div className="font-bold text-stone-800 text-sm">
                                第 {m.level} 桶金 <span className="text-xs font-normal text-stone-500 ml-1">({m.amount / 10000}萬)</span>
                            </div>
                            <div className="text-xs text-stone-500 mt-0.5">
                                {m.date === '進行中' ? '正在努力中...' : m.date}
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <div className="text-sm font-bold text-stone-700">
                                {m.daysText}
                            </div>
                            {m.speedup !== undefined && (
                                <div className={`text-[10px] font-bold mt-0.5 ${m.speedup > 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                                    {m.speedup > 0 ? `🚀 縮短 ${m.speedup} 天` : `📉 變慢 ${Math.abs(m.speedup)} 天`}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};