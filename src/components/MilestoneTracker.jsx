import React, { useState, useMemo } from 'react';
import { Icon } from './Icon';

export const MilestoneTracker = ({ currentTotalAssets }) => {
    // 摺疊狀態控制
    const [isExpanded, setIsExpanded] = useState(false);

    // 1. 在這裡填寫您確切的日期
    const MANUAL_MILESTONES = {
        1: '2022-10-01', 
        2: '2024-05-01', 
        3: '2025-08-01', 
        4: '2026-04-01', 
    };

    const milestones = useMemo(() => {
        if (!currentTotalAssets) return [];

        const maxLevel = Math.floor(currentTotalAssets / 1000000);
        const achieved = [];

        // 放入進行中的進度
        achieved.push({
            level: maxLevel + 1,
            amount: (maxLevel + 1) * 1000000,
            date: '進行中'
        });

        // 讀取設定好的歷史日期
        for (let i = maxLevel; i >= 1; i--) {
            achieved.push({
                level: i,
                amount: i * 1000000,
                date: MANUAL_MILESTONES[i] || '日期未設定'
            });
        }

        // 計算天數差距
        achieved.sort((a, b) => a.level - b.level);
        for (let i = 0; i < achieved.length; i++) {
            if (i === 0) {
                achieved[i].daysText = '🏁 起點';
            } else if (achieved[i].date !== '進行中' && achieved[i-1].date !== '進行中') {
                const diffDays = Math.ceil((new Date(achieved[i].date) - new Date(achieved[i-1].date)) / (1000 * 60 * 60 * 24));
                achieved[i].days = diffDays;
                achieved[i].daysText = `${diffDays} 天`;
                
                if (i > 1 && achieved[i-1].days) {
                    achieved[i].speedup = achieved[i-1].days - diffDays;
                }
            } else if (achieved[i].date === '進行中') {
                achieved[i].daysText = `⏳ 差額 $${Math.round(achieved[i].amount - currentTotalAssets).toLocaleString()}`;
            }
        }
        return achieved.reverse();
    }, [currentTotalAssets]);

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-200 mt-4">
            {/* 標題與折疊按鈕 */}
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full"
            >
                <div className="flex items-center gap-2">
                    <Icon name="trending-up" className="text-rose-500" />
                    <h3 className="font-bold text-stone-800">百萬里程碑追蹤</h3>
                </div>
                <Icon name={isExpanded ? "chevron-up" : "chevron-down"} size={20} className="text-stone-400" />
            </button>
            
            {/* 折疊區域 */}
            {isExpanded && (
                <div className="space-y-3 mt-4 animate-in slide-in-from-top-2">
                    {milestones.map((m) => (
                        <div key={m.level} className={`flex items-center justify-between p-3 rounded-lg ${m.date === '進行中' ? 'bg-stone-50 border-2 border-dashed border-stone-200' : 'bg-stone-50'}`}>
                            <div>
                                <div className="font-bold text-stone-800 text-sm">第 {m.level} 桶金</div>
                                <div className="text-xs text-stone-500">{m.date}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-stone-700">{m.daysText}</div>
                                {m.speedup !== undefined && (
                                    <div className={`text-[10px] font-bold ${m.speedup > 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                                        {m.speedup > 0 ? `🚀 縮短 ${m.speedup} 天` : `📉 變慢 ${Math.abs(m.speedup)} 天`}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};