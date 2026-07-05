import React, { useMemo } from 'react';
import { Icon } from '../components/Icon';
import { safeNum, getLocalToday, getLocalMonth } from '../utils';
import { ACCOUNT_TYPES } from '../constants';

export const AssetsTab = ({
    stats, retireProgress, retirementInsight, retirement, recurring,
    accounts, exchangeRates, transactions, trendData, analysisData,
    setEditTarget, setAccForm, setModal, setViewingAccount, setAccountDetailMonth, currentLedgerMonth,
    dragItem, dragOverItem, handleSort, openAccModalCorrect, deleteData,
    setHoldingForm, setNewMarketValue, showArchived, setShowArchived
}) => {
    // === 內部邏輯處理區 ===
    const getRate = (accId) => { const acc = accounts.find(a => a.id === accId); return acc ? (exchangeRates[acc.currency] || 1) : 1; };
    const today = new Date(); const currentMonth = today.getMonth() + 1; 

    const thisMonthRemainingFixedCost = recurring.reduce((sum, r) => {
        if ((r.type !== 'expense' && r.type !== 'transfer') || (r.endDate && r.endDate < getLocalToday())) return sum;
        if (r.lastCreatedMonth === getLocalMonth()) return sum; 
        if (r.frequency === 'yearly' && parseInt(r.month) !== currentMonth) return sum;
        const rate = getRate(r.accountId);
        return sum + (parseFloat(r.amount) * rate);
    }, 0);

    const calculateBilledDebt = (acc) => {
        const currentTotalDebt = Math.max(0, -(stats.bals[acc.id] || 0));
        const cDay = parseInt(acc.closingDay || 27);
        const todayObj = new Date();
        let lastClosingDate;
        if (todayObj.getDate() > cDay) {
            lastClosingDate = new Date(todayObj.getFullYear(), todayObj.getMonth(), cDay);
        } else {
            lastClosingDate = new Date(todayObj.getFullYear(), todayObj.getMonth() - 1, cDay);
        }
        const lastClosingDateStr = `${lastClosingDate.getFullYear()}-${String(lastClosingDate.getMonth()+1).padStart(2,'0')}-${String(lastClosingDate.getDate()).padStart(2,'0')}`;
        let unbilledNewDebt = 0;
        transactions.forEach(t => {
            if (t.date > lastClosingDateStr && t.accountId === acc.id) {
                if (t.type === 'expense' || t.type === 'advance' || t.type === 'transfer') {
                    unbilledNewDebt += parseFloat(t.amount) || 0;
                }
            }
        });
        return Math.max(0, currentTotalDebt - unbilledNewDebt);
    };

    const getBankBal = (keyword, exclude = null) => accounts.filter(a => a.type === 'bank' && a.name.includes(keyword) && (!exclude || !a.name.includes(exclude)) && !a.isArchived).reduce((s, a) => s + (stats.bals[a.id] || 0) * getRate(a.id), 0);
    const getCardBilledDebt = (keyword) => accounts.filter(a => a.type === 'credit' && a.name.includes(keyword) && !a.isArchived).reduce((s, a) => s + calculateBilledDebt(a) * getRate(a.id), 0);
    const getOtherCardBilledDebt = () => accounts.filter(a => a.type === 'credit' && !a.name.includes('台新') && !a.name.includes('匯豐') && !a.name.includes('大戶') && !a.isArchived).reduce((s, a) => s + calculateBilledDebt(a) * getRate(a.id), 0);

    const tsBank = getBankBal('台新'); const tsDebt = getCardBilledDebt('台新');
    const hsbcBank = getBankBal('匯豐'); const hsbcDebt = getCardBilledDebt('匯豐');
    const dawhoBank = getBankBal('大戶'); const dawhoDebt = getCardBilledDebt('大戶');
    const spBank = getBankBal('永豐', '大戶'); const otherDebt = getOtherCardBilledDebt(); 

    const cardWarnings = [];
    if (tsDebt > 0 && tsBank < tsDebt) cardWarnings.push(`台新缺 $${safeNum(tsDebt - tsBank)}`);
    if (hsbcDebt > 0 && hsbcBank < hsbcDebt) cardWarnings.push(`匯豐缺 $${safeNum(hsbcDebt - hsbcBank)}`);
    if (dawhoDebt > 0 && dawhoBank < dawhoDebt) cardWarnings.push(`大戶缺 $${safeNum(dawhoDebt - dawhoBank)}`);
    if (otherDebt > 0 && spBank < otherDebt) cardWarnings.push(`永豐缺 $${safeNum(otherDebt - spBank)}`);

    const mainPower = dawhoBank + spBank; 
    const lastMonthIncome = trendData[4] ? trendData[4].income : 0;
    const estimatedCurrentIncome = Math.max(stats.inc, lastMonthIncome);
    const isTemporarilyNegative = stats.inc < stats.exp && stats.exp <= estimatedCurrentIncome;
    const isTrulyOverdrawn = stats.exp > estimatedCurrentIncome;

    const liquidAssets = accounts
        .filter(a => (a.type === 'cash' || a.type === 'bank' || a.type === 'electronic') && !a.isArchived)
        .reduce((sum, a) => {
            const rawBal = stats.bals[a.id] || 0;
            const rate = exchangeRates[a.currency] || 1;
            return sum + (rawBal * rate);
        }, 0);

    let aiMessage = ""; let aiIcon = "bot"; let aiColor = "bg-sky-50 text-sky-600 border-sky-100";

    if (thisMonthRemainingFixedCost > 0 && mainPower < thisMonthRemainingFixedCost) {
        aiMessage = `🛑 生存紅線警告：永豐與大戶餘額 ($${safeNum(mainPower)}) 已不夠支付本月剩餘的固定帳單 ($${safeNum(thisMonthRemainingFixedCost)})！在月底薪水入帳前，請絕對停止非必要花費！`;
        aiIcon = "alert-octagon"; aiColor = "bg-rose-50 text-rose-600 border-rose-200 ring-1 ring-rose-200";
    } else if (cardWarnings.length > 0) {
        aiMessage = `⚠️ 卡費轉帳提醒：以下專戶餘額不足以扣繳「本期卡費」，請記得於繳款日前安排轉帳 👉 ${cardWarnings.join('、')}。`;
        aiIcon = "bell-ring"; aiColor = "bg-orange-50 text-orange-600 border-orange-200";
    } else if (isTrulyOverdrawn) {
        aiMessage = `📉 本月花費 ($${safeNum(stats.exp)}) 已超出「上月總收入」水準！建議立刻檢視「${analysisData.chart[0]?.name || '最大'}」類別，控制後續支出。`;
        aiIcon = "alert-triangle"; aiColor = "bg-rose-50 text-rose-600 border-rose-200";
    } else if (isTemporarilyNegative) {
        aiMessage = `目前帳面暫時透支 $${safeNum(stats.exp - stats.inc)}，但以您平時的薪資水準來看，資金仍在安全範圍，請安心生活。`;
        aiIcon = "coffee"; aiColor = "bg-blue-50 text-blue-600 border-blue-200";
    } else {
        aiMessage = `✅ 財務狀態極佳！各專戶餘額充足，本期卡費防護網正常運作中。保持目前的儲蓄節奏，離退休目標會越來越近！`;
        aiIcon = "check-circle"; aiColor = "bg-emerald-50 text-emerald-600 border-emerald-200";
    }

    // === 百萬里程碑 (時光倒流運算核心) ===
    const milestones = useMemo(() => {
        if (!transactions || transactions.length === 0 || !stats.totalAsset) return [];

        const maxMilestone = Math.floor(stats.totalAsset / 1000000);
        if (maxMilestone < 1) return [];

        const dailyNetFlow = {};
        transactions.forEach(tx => {
            if (!tx.date || tx.type === 'transfer' || tx.type === 'repayment') return; 
            
            const date = tx.date;
            if (!dailyNetFlow[date]) dailyNetFlow[date] = 0;
            
            let amt = parseFloat(tx.amount) || 0;
            if (tx.currency && tx.currency !== 'TWD') {
                amt = amt * (tx.exchangeRate || 1); 
            }

            if (tx.type === 'income') dailyNetFlow[date] += amt;
            else if (tx.type === 'expense') dailyNetFlow[date] -= amt;
        });

        const sortedDates = Object.keys(dailyNetFlow).sort((a, b) => b.localeCompare(a));
        let runningAssets = stats.totalAsset;
        let currentTarget = maxMilestone * 1000000;
        const achieved = [];

        achieved.push({
            level: maxMilestone + 1,
            amount: (maxMilestone + 1) * 1000000,
            date: '進行中',
            days: null
        });

        for (let date of sortedDates) {
            while (runningAssets >= currentTarget && currentTarget >= 1000000) {
                 achieved.push({
                     level: currentTarget / 1000000,
                     amount: currentTarget,
                     date: date,
                     days: 0 
                 });
                 currentTarget -= 1000000;
            }
            runningAssets -= dailyNetFlow[date];
        }

        achieved.sort((a, b) => a.level - b.level); 

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
                
                if (i > 1 && typeof achieved[i-1].days === 'number') {
                    const speedup = achieved[i-1].days - diffDays;
                    achieved[i].speedup = speedup;
                }
            } else if (achieved[i].date === '進行中') {
                const remaining = achieved[i].amount - stats.totalAsset;
                achieved[i].daysText = `⏳ 剩餘 $${Math.round(remaining).toLocaleString()}`;
            }
        }

        return achieved.reverse(); 
    }, [transactions, stats.totalAsset]);

    const activeAccounts = accounts.filter(a => !a.isArchived);
    const archivedAccounts = accounts.filter(a => a.isArchived);
    
    return (
        <div className="animate-in space-y-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <p className="text-sm text-stone-500 font-bold">總資產 (TWD)</p>
                    <h2 className="text-3xl font-black text-stone-800 tabular-nums">${safeNum(stats.totalAsset)}</h2>
                </div>
                <button onClick={()=>{setEditTarget(null); setAccForm({name:'', type:'cash', currency:'TWD', initialBalance:'', includeInTotal: true}); setModal('acc')}}>
                    <Icon name="plus-circle" className="text-rose-500" size={32}/>
                </button>
            </div>
            
            <div className="bg-stone-800 rounded-xl p-5 text-white shadow-lg">
                <div className="flex justify-between mb-2">
                    <span className="text-xs text-stone-400">FIRE 進度</span>
                    <span className="font-bold">{retireProgress.pct.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-stone-700 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-gradient-to-r from-yellow-400 to-rose-500" style={{width:`${Math.min(100, retireProgress.pct)}%`}}></div>
                </div>
                <p className="text-xs text-stone-400 flex justify-between">
                    <span>目標 ${safeNum(Math.round(retireProgress.target/10000))} 萬</span>
                    <span>剩 {retireProgress.years} 年</span>
                </p>
                <div className={`mt-3 p-2 rounded-lg bg-white/10 text-xs flex items-start gap-2 ${retirementInsight.color}`}>
                    <Icon name={retirementInsight.icon} size={14} className="mt-0.5"/>
                    <span>{retirementInsight.text}</span>
                </div>
            </div>

            {/* 🚀 百萬里程碑面板 */}
            {milestones.length > 0 && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-200">
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
            )}
            
            <div className={`p-4 rounded-xl border shadow-sm flex gap-3 transition-colors ${aiColor}`}>
                <div className="shrink-0 mt-1"><Icon name={aiIcon} size={24} /></div>
                <div>
                    <h4 className="font-bold text-sm mb-1 flex items-center gap-2">AI 專屬財務管家 <span className="text-[10px] bg-white/60 px-1.5 rounded uppercase tracking-wider border border-black/5">客製化</span></h4>
                    <p className="text-xs leading-relaxed opacity-90">{aiMessage}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold opacity-80">
                        <span className="bg-white/60 px-2 py-1 rounded">流動資產: ${safeNum(liquidAssets)}</span>
                        <span className="bg-white/60 px-2 py-1 rounded">大戶+永豐活水: ${safeNum(mainPower)}</span>
                        <span className="bg-white/60 px-2 py-1 rounded">本月剩餘固定扣款: ${safeNum(thisMonthRemainingFixedCost)}</span>
                    </div>
                </div>
            </div>
            
            <div className="grid gap-3">
                {activeAccounts.map((acc) => {
                    const index = accounts.findIndex(a => a.id === acc.id);
                    const bal = stats.bals[acc.id] || 0;
                    const isDebt = (acc.type === 'credit' || acc.type === 'payable');
                    return (
                        <div key={acc.id} onClick={() => { setViewingAccount(acc); setAccountDetailMonth(currentLedgerMonth); }} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 relative cursor-pointer hover:shadow-md transition-shadow" draggable onDragStart={() => (dragItem.current = index)} onDragEnter={() => (dragOverItem.current = index)} onDragEnd={handleSort} onDragOver={(e) => e.preventDefault()}>
                            <div className="absolute top-1/2 right-4 -translate-y-1/2 text-stone-300 pointer-events-none"><Icon name="chevron-right" size={20} /></div>
                            <div className="absolute top-3 right-3 flex gap-2" onClick={e => e.stopPropagation()}>
                                <button onClick={()=>{setEditTarget(acc); openAccModalCorrect(acc);}} className="text-stone-400 hover:text-rose-500 p-1"><Icon name="edit-2" size={16}/></button>
                                <button onClick={()=>{if(confirm('⚠️ 警告：確定要刪除此帳戶嗎？\n\n建議改用「停用」功能，以免歷史交易資料失去關聯。')) deleteData('accounts', acc.id)}} className="text-stone-400 hover:text-rose-600 p-1"><Icon name="trash-2" size={16}/></button>                                        
                            </div>
                            <div className="flex gap-3 items-center mb-2">
                                <div className="text-stone-300 cursor-move" onClick={e => e.stopPropagation()}><Icon name="grip-vertical" size={16}/></div>
                                <div className={`p-2 rounded-lg ${ACCOUNT_TYPES[acc.type]?.color || 'bg-stone-100 text-stone-600'}`}><Icon name={ACCOUNT_TYPES[acc.type]?.iconName || 'wallet'} size={18}/></div>
                                <div>
                                    <h3 className="font-bold text-stone-700 flex items-center gap-2">
                                        {acc.name}
                                        {isDebt && <span className="text-[10px] bg-rose-50 text-rose-500 border border-rose-100 px-1.5 py-0.5 rounded font-bold">負債</span>}
                                    </h3>
                                    {acc.includeInTotal === false && <span className="text-[10px] bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded mt-0.5 inline-block">不計入</span>}
                                </div>
                            </div>
                            
                            <p className={`text-2xl font-black tabular-nums ml-7 ${isDebt && bal < 0 ? 'text-rose-600' : 'text-stone-800'}`}>
                                {isDebt && bal < 0 ? '-' : ''}${safeNum(Math.abs(bal))} <span className="text-xs text-stone-400 font-normal">{acc.currency}</span>
                            </p>
                            
                            {acc.currency!=='TWD' && <p className="text-xs text-stone-400 font-bold tabular-nums ml-7">≈ TWD ${safeNum(Math.round((stats.bals[acc.id]||0) * (exchangeRates[acc.currency]||1)))}</p>}
                            {acc.type === 'invest' && (
                                <div className="mt-2 pt-2 border-t flex justify-between items-center text-xs ml-7 mr-6" onClick={e => e.stopPropagation()}>
                                    <span className="text-stone-400 flex items-center gap-1 font-bold">
                                        市值: ${safeNum(acc.marketValue || stats.bals[acc.id])}
                                        {acc.marketValue && acc.marketValue !== stats.bals[acc.id] && (
                                            <span className={acc.marketValue > stats.bals[acc.id] ? 'text-emerald-500' : 'text-rose-500'}>
                                                ({acc.marketValue > stats.bals[acc.id] ? '+' : ''}{safeNum(acc.marketValue - stats.bals[acc.id])})
                                            </span>
                                        )}
                                    </span>
                                    <button onClick={(e)=>{ e.stopPropagation(); setEditTarget(acc); setHoldingForm(acc.holdings || []); setNewMarketValue(acc.marketValue || ''); setModal('market'); }} className="text-rose-500 font-bold bg-rose-50 px-2 py-1 rounded hover:bg-rose-100 transition-colors">調整市值</button>
                                </div>
                            )}
                        </div> 
                    );
                })}
            </div> 
            
            {archivedAccounts.length > 0 && (
                <div className="mt-6">
                    <button onClick={() => setShowArchived(!showArchived)} className="flex items-center gap-2 text-stone-500 font-bold text-sm w-full justify-between p-3 bg-stone-200/50 hover:bg-stone-200 rounded-xl transition-colors">
                        <span>停用帳戶 ({archivedAccounts.length})</span>
                        <Icon name={showArchived ? "chevron-up" : "chevron-down"} size={16} />
                    </button>
                    {showArchived && (
                        <div className="grid gap-3 mt-3 opacity-60">
                            {archivedAccounts.map((acc) => {
                                const bal = stats.bals[acc.id] || 0;
                                const isDebt = (acc.type === 'credit' || acc.type === 'payable');
                                return (
                                    <div key={acc.id} onClick={() => { setViewingAccount(acc); setAccountDetailMonth(currentLedgerMonth); }} className="bg-stone-100 p-4 rounded-xl border border-stone-200 relative cursor-pointer">
                                        <div className="absolute top-1/2 right-4 -translate-y-1/2 text-stone-300 pointer-events-none"><Icon name="chevron-right" size={20} /></div>
                                        <div className="absolute top-3 right-3 flex gap-2" onClick={e => e.stopPropagation()}>
                                            <button onClick={()=>{setEditTarget(acc); openAccModalCorrect(acc);}} className="text-stone-400 hover:text-stone-600 p-1"><Icon name="edit-2" size={16}/></button>
                                        </div>
                                        <div className="flex gap-3 items-center mb-2">
                                            <div className="w-4"></div>
                                            <div className={`p-2 rounded-lg ${ACCOUNT_TYPES[acc.type]?.color || 'bg-stone-200 text-stone-500'} grayscale`}><Icon name={ACCOUNT_TYPES[acc.type]?.iconName || 'wallet'} size={18}/></div>
                                            <div>
                                                <h3 className="font-bold text-stone-500 line-through decoration-stone-300 flex items-center gap-2">
                                                    {acc.name}
                                                </h3>
                                            </div>
                                        </div>
                                        <p className={`text-2xl font-black tabular-nums ml-10 ${isDebt && bal < 0 ? 'text-stone-600' : 'text-stone-500'}`}>
                                            {isDebt && bal < 0 ? '-' : ''}${safeNum(Math.abs(bal))} <span className="text-xs text-stone-400 font-normal">{acc.currency}</span>
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};