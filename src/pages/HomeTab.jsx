import React from 'react';
import { Icon } from '../components/Icon';
import { safeNum, getDayOfWeek } from '../utils';
import { getBaseAmt } from '../hooks/useLedgerStats';
import { OFFSET_ACCOUNT_ID } from '../constants';

export const HomeTab = ({
    currentLedgerMonth, changeMonthStep,
    homeFilter, setHomeFilter,
    transactions, currentBook, accounts, exchangeRates,
    stats, monthlyBudget, groupedTransactions,
    openTxModal, deleteData, getCategoryIcon, handleUndoRepayment
}) => {
    return (
        <div className="animate-in space-y-6">
            {/* 月份切換 */}
            <div className="flex items-center justify-between bg-white rounded-xl p-2 shadow-sm border border-stone-200">
                <button onClick={()=>changeMonthStep(-1)} className="p-2 hover:bg-stone-50 rounded-lg text-stone-400"><Icon name="chevron-left"/></button>
                <div className="text-center font-bold text-stone-800 text-lg">{currentLedgerMonth.replace('-','年 ')}月</div>
                <button onClick={()=>changeMonthStep(1)} className="p-2 hover:bg-stone-50 rounded-lg text-stone-400"><Icon name="chevron-right"/></button>
            </div>
            
            {/* 漸層總覽卡片 */}
            {(() => {
                if (homeFilter === 'all' || homeFilter === 'inout') {
                    const [y, m] = currentLedgerMonth.split('-').map(Number);
                    const lmDate = new Date(y, m - 2, 1);
                    const lmStr = `${lmDate.getFullYear()}-${String(lmDate.getMonth() + 1).padStart(2, '0')}`;
                    
                    let lastMonthInc = 0;
                    transactions.forEach(t => {
                        if ((t.bookId || 'main') === currentBook.id && String(t.date).startsWith(lmStr) && t.type === 'income') {
                            lastMonthInc += getBaseAmt(t, accounts, exchangeRates);
                        }
                    });

                    const baseQuota = lastMonthInc > 0 ? lastMonthInc : monthlyBudget;
                    const realRemaining = baseQuota - stats.exp;
                    const isWarning = realRemaining < 0;
                    const insightText = isWarning ? `透支 $${safeNum(Math.abs(realRemaining))} (已超上月總收入)` : `安全餘額 $${safeNum(realRemaining)}`;
                    
                    return (
                        <div className="rounded-xl p-6 text-white shadow-lg relative overflow-hidden bg-gradient-to-br from-orange-400 to-rose-600 transition-all duration-300">
                            <p className="text-white/80 text-xs mb-1">本月帳面結餘</p>
                            <h2 className="text-4xl font-black tabular-nums">${safeNum(stats.inc - stats.exp)}</h2>
                            <div className="flex gap-4 mt-6">
                                <div className="flex-1 p-3 bg-white/20 rounded-lg backdrop-blur-sm"><p className="text-xs text-white/80">收入</p><p className="font-bold text-white">+${safeNum(stats.inc)}</p></div>
                                <div className="flex-1 p-3 bg-white/20 rounded-lg backdrop-blur-sm"><p className="text-xs text-white/80">支出</p><p className="font-bold text-white">-${safeNum(stats.exp)}</p></div>
                            </div>
                            <div className="mt-4 bg-white p-2 rounded-lg text-xs flex items-center gap-2 font-bold text-stone-700 shadow-sm">
                                <Icon name={isWarning ? "alert-triangle" : "thumbs-up"} size={14} className={isWarning ? "text-rose-500" : "text-emerald-500"}/> 
                                {insightText}
                            </div>
                        </div>
                    );
                } else if (homeFilter === 'invest') {
                    let investIn = 0; let investOut = 0;
                    groupedTransactions.forEach(([_, txs]) => {
                        txs.forEach(tx => {
                            const baseAmt = getBaseAmt(tx, accounts, exchangeRates);
                            if (tx.type === 'expense') investIn += baseAmt;
                            else if (tx.type === 'income') investOut += baseAmt;
                            else if (tx.type === 'transfer') {
                                const fromAcc = accounts.find(a => a.id === tx.accountId);
                                const toAcc = accounts.find(a => a.id === tx.toAccountId);
                                const fromIsInv = fromAcc && fromAcc.type === 'invest';
                                const toIsInv = toAcc && toAcc.type === 'invest';
                                if (toIsInv && !fromIsInv) investIn += baseAmt; 
                                if (fromIsInv && !toIsInv) investOut += baseAmt; 
                            }
                        });
                    });
                    return (
                        <div className="rounded-xl p-6 text-white shadow-lg relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 transition-all duration-300">
                            <p className="text-white/80 text-xs mb-1">本月淨投入</p>
                            <h2 className="text-4xl font-black tabular-nums">${safeNum(investIn - investOut)}</h2>
                            <div className="flex gap-4 mt-6">
                                <div className="flex-1 p-3 bg-white/20 rounded-lg backdrop-blur-sm"><p className="text-xs text-white/80">轉入 / 買進</p><p className="font-bold text-white">+${safeNum(investIn)}</p></div>
                                <div className="flex-1 p-3 bg-white/20 rounded-lg backdrop-blur-sm"><p className="text-xs text-white/80">轉出 / 收益</p><p className="font-bold text-white">-${safeNum(investOut)}</p></div>
                            </div>
                        </div>
                    );
                } else if (homeFilter === 'transfer') {
                    let transferTotal = 0; let count = 0;
                    groupedTransactions.forEach(([_, txs]) => {
                        txs.forEach(tx => { transferTotal += getBaseAmt(tx, accounts, exchangeRates); count++; });
                    });
                    return (
                        <div className="rounded-xl p-6 text-white shadow-lg relative overflow-hidden bg-gradient-to-br from-slate-400 to-slate-600 transition-all duration-300">
                            <p className="text-white/80 text-xs mb-1">本月轉帳總額</p>
                            <h2 className="text-4xl font-black tabular-nums">${safeNum(transferTotal)}</h2>
                            <div className="mt-6 flex justify-between items-center text-sm bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                                <span className="font-bold text-white">共 {count} 筆純轉帳紀錄</span>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}
            
            {/* 篩選按鈕 */}
            <div className="flex bg-stone-200/60 p-1 rounded-xl mb-4">
                <button onClick={() => setHomeFilter('all')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${homeFilter === 'all' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>全部</button>
                <button onClick={() => setHomeFilter('inout')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${homeFilter === 'inout' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>收支</button>
                <button onClick={() => setHomeFilter('invest')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${homeFilter === 'invest' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>投資</button>
                <button onClick={() => setHomeFilter('transfer')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${homeFilter === 'transfer' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>轉帳</button>
            </div>
            
            {/* 每日交易列表 */}
            <div className="space-y-4">
                {groupedTransactions.length === 0 ? (
                    <div className="text-center py-16 text-stone-400 text-sm border-2 border-dashed border-stone-200 rounded-xl bg-white">本月尚無紀錄</div> 
                ) : (
                    <React.Fragment>
                        {groupedTransactions.map(([date, txs]) => {
                            let dailyExp = 0; let dailyInc = 0;
                            txs.forEach(t => {
                                const amt = getBaseAmt(t, accounts, exchangeRates);
                                if (t.type === 'expense') dailyExp += amt;
                                if (t.type === 'income') dailyInc += amt;
                            });
                            return (
                                <div key={date} className="animate-in slide-in-from-bottom mb-6">
                                    <div className="flex justify-between items-end mb-2 px-2">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-black text-stone-800 tabular-nums">{date.replace(/-/g, '/')}</span>
                                            <span className="text-sm font-bold text-stone-400">{getDayOfWeek(date)}</span>
                                        </div>
                                        <div className="text-xs font-bold flex gap-3">
                                            {dailyInc > 0 && <span className="text-emerald-500">收入: {safeNum(dailyInc)}</span>}
                                            {dailyExp > 0 && <span className="text-stone-500">支出: {safeNum(dailyExp)}</span>}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                        {txs.map((tx, idx) => {
                                            const acc = accounts.find(a => a.id === tx.accountId);
                                            let accName = acc ? acc.name : (tx.accountId === OFFSET_ACCOUNT_ID ? '抵扣' : '未知');
                                            if (tx.type === 'transfer' && tx.toAccountId) {
                                                const toAcc = accounts.find(a => a.id === tx.toAccountId);
                                                accName += ` ➝ ${toAcc ? toAcc.name : '未知'}`;
                                            }
                                            
                                            let amountColor = "text-stone-800"; let sign = ""; let iconBg = "bg-stone-100 text-stone-500";
                                            if (tx.type === 'income' || tx.type === 'repayment') { amountColor = "text-emerald-500"; sign = "+"; iconBg = "bg-emerald-50 text-emerald-500"; } 
                                            else if (tx.type === 'expense') { amountColor = "text-stone-800"; sign = ""; iconBg = "bg-stone-100 text-stone-600"; } 
                                            else if (tx.type === 'advance') { amountColor = "text-indigo-500"; sign = ""; iconBg = "bg-indigo-50 text-indigo-500"; } 
                                            else if (tx.type === 'transfer') { amountColor = "text-stone-400"; sign = ""; iconBg = "bg-slate-50 text-slate-400"; }

                                            const isForeign = acc && acc.currency !== 'TWD';
                                            const baseAmt = getBaseAmt(tx, accounts, exchangeRates);

                                            return (
                                                <div key={tx.id} onClick={() => openTxModal(tx.type, tx)} className={`p-4 flex justify-between items-center cursor-pointer hover:bg-stone-50 transition-colors ${idx !== txs.length - 1 ? 'border-b border-stone-100' : ''}`}>
                                                    <div className="flex items-center gap-4 overflow-hidden">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                                                            <Icon name={getCategoryIcon(tx.category, tx.type)} size={22}/>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <p className="font-bold text-lg text-stone-800 truncate">
                                                                    {tx.type === 'advance' ? `代墊: ${tx.debtor}` : (tx.category || '未分類')}
                                                                    {tx.subCategory && <span className="text-sm font-bold text-stone-400 ml-1.5">({tx.subCategory})</span>}
                                                                </p>
                                                                {tx.type === 'advance' && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-bold shrink-0">代墊</span>}
                                                                {tx.type === 'repayment' && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-bold shrink-0">收回代墊</span>}
                                                                {tx.type === 'transfer' && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold shrink-0">轉帳</span>}
                                                            </div>
                                                            <p className="text-sm text-stone-500 truncate flex items-center gap-1.5">
                                                                <span className="font-medium text-stone-400">{accName}</span>
                                                                {tx.note && <span className="text-stone-300">|</span>}
                                                                <span>{tx.note}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0 ml-3 flex flex-col items-end justify-center">
                                                        <div className="text-right">
                                                            <p className={`text-xl font-black tabular-nums ${amountColor}`}>
                                                                {sign}{safeNum(isForeign ? baseAmt : tx.amount)}
                                                            </p>
                                                            {isForeign && <p className="text-[11px] text-stone-400 mt-0.5 font-bold">({acc.currency} {safeNum(tx.amount)})</p>}
                                                        </div>
                                                        
                                                        <div className="mt-1.5 flex items-center justify-end">
                                                            {tx.type === 'repayment' ? (
                                                                <button onClick={(e)=>{e.stopPropagation(); handleUndoRepayment(tx);}} className="text-stone-300 hover:text-blue-500 p-1 transition-colors" title="還原此筆還款">
                                                                    <Icon name="rotate-ccw" size={15}/>
                                                                </button>
                                                            ) : (
                                                                <button onClick={(e)=>{e.stopPropagation(); if(confirm('確定要刪除這筆交易嗎？')) deleteData('transactions', tx.id);}} className="text-stone-300 hover:text-rose-500 p-1 transition-colors">
                                                                    <Icon name="trash-2" size={15}/>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </React.Fragment>
                )}
            </div>
        </div>
    );
};