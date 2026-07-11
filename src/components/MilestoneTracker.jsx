import React, { useState, useMemo } from 'react';
import { Icon } from './Icon'; 

export const MilestoneTracker = ({ currentTotalAssets }) => {
    // 💡 控制是否展開 (預設為 false，即折疊狀態，只顯示正在努力中的那桶金)
    const [isExpanded, setIsExpanded] = useState(false);

    // 1. 這裡保留您確切的達成日期設定
    const MANUAL_MILESTONES = {
        1: '2022-10-01',
        2: '2024-05-01',
        3: '2025-08-01',
        4: '2026-04-01',
    };

    const milestones = useMemo(() => {
        if (!currentTotalAssets) return [];

        const bucketSize = 1000000;
        const currentLevel = Math.floor(currentTotalAssets / bucketSize);
        const nextLevel = currentLevel + 1;
        const result = [];

        // 2. 處理已經達成的里程碑
        for (let i = currentLevel; i >= 1; i--) {
            const dateStr = MANUAL_MILESTONES[i];
            const prevDateStr = MANUAL_MILESTONES[i - 1];
            const prevPrevDateStr = MANUAL_MILESTONES[i - 2];

            let daysTaken = null;
            let speedDiff = null;

            // 計算花費天數
            if (dateStr && prevDateStr) {
                daysTaken = Math.floor((new Date(dateStr) - new Date(prevDateStr)) / 86400000);
            }
            
            // 計算變快/變慢
            if (daysTaken !== null && prevDateStr && prevPrevDateStr) {
                const prevDaysTaken = Math.floor((new Date(prevDateStr) - new Date(prevPrevDateStr)) / 86400000);
                speedDiff = daysTaken - prevDaysTaken;
            }

            result.push({
                level: i,
                status: 'achieved',
                date: dateStr || '已達成',
                title: `第 ${i} 桶金`,
                target: i * bucketSize,
                daysTaken,
                speedDiff
            });
        }

        // 3. 處理「正在努力中」的下一個里程碑
        const remaining = (nextLevel * bucketSize) - currentTotalAssets;
        result.unshift({
            level: nextLevel,
            status: 'in_progress',
            remaining: remaining,
            title: `第 ${nextLevel} 桶金`,
            target: nextLevel * bucketSize
        });

        return result;
    }, [currentTotalAssets]);

    if (milestones.length === 0) return null;

    // 💡 決定畫面顯示：折疊時只顯示 [0] (也就是進行中的那一筆)，展開時顯示全部
    const displayMilestones = isExpanded ? milestones : [milestones[0]];
    const safeNum = (num) => Number(num).toLocaleString('en-US', { maximumFractionDigits: 0 });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden mb-6">
            {/* 標題區塊：點擊即可展開/折疊 */}
            <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors border-b border-stone-50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="font-bold text-stone-700 flex items-center gap-2 text-sm">
                    <Icon name="trending-up" size={16} className="text-rose-500" /> 
                    百萬里程碑追蹤
                </h3>
                <button className="text-stone-400 flex items-center gap-1 text-xs font-bold hover:text-stone-600 transition-colors">
                    {isExpanded ? '收起紀錄' : '展開過去紀錄'}
                    <Icon name={isExpanded ? "chevron-up" : "chevron-down"} size={16} />
                </button>
            </div>

            {/* 內容區塊 */}
            <div className="p-4 space-y-3">
                {displayMilestones.map((m) => (
                    <div key={m.level} className={`p-4 rounded-xl border ${m.status === 'in_progress' ? 'border-dashed border-rose-200 bg-rose-50/30' : 'border-stone-100 bg-stone-50/50'}`}>
                        {m.status === 'in_progress' ? (
                            // 🚀 正在進行中的樣式
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-stone-800">
                                        {m.title} <span className="text-xs text-stone-400 font-normal">({safeNum(m.target / 10000)}萬)</span>
                                    </div>
                                    <div className="text-xs text-stone-400 mt-1">正在努力中...</div>
                                </div>
                                <div className="text-sm font-bold text-stone-700 flex items-center gap-1">
                                    <Icon name="hourglass" size={14} className="text-amber-500" /> 
                                    剩餘 ${safeNum(m.remaining)}
                                </div>
                            </div>
                        ) : (
                            // 🏆 已經達成的樣式
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-stone-800">
                                        {m.title} <span className="text-xs text-stone-400 font-normal">({safeNum(m.target / 10000)}萬)</span>
                                    </div>
                                    <div className="text-xs text-stone-400 mt-1">{m.date}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-stone-700">
                                        {m.daysTaken === null ? '※ 初始累積' : `${m.daysTaken} 天`}
                                    </div>
                                    {m.speedDiff !== null && (
                                        <div className={`text-[10px] flex items-center justify-end gap-0.5 mt-0.5 ${m.speedDiff <= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                                            <Icon name={m.speedDiff <= 0 ? "trending-down" : "trending-up"} size={10} />
                                            {m.speedDiff <= 0 ? `變快 ${Math.abs(m.speedDiff)} 天` : `變慢 ${m.speedDiff} 天`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};