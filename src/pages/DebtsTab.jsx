import React from 'react';
import { Icon } from '../components/Icon'; // 多了 ../components/
import { safeNum, getLocalToday } from '../utils';

export const DebtsTab = ({
    stats,
    transactions,
    getRemainingDebt,
    setSettleTargetTx,
    setSettleDate,
    setModal,
    handleVoidAdvance
}) => {
    return (
        <div className="animate-in space-y-4">
            <h2 className="text-xl font-bold px-1 text-stone-800">代墊與待收</h2>
            <div className="bg-teal-600 rounded-xl p-6 text-white shadow-md">
                <p className="text-xs opacity-80 font-bold uppercase tracking-widest mb-1">待收總額</p>
                <h2 className="text-4xl font-black tabular-nums">${safeNum(stats.debt)}</h2>
            </div>
            <div className="space-y-3">
                {transactions.filter(t => t.type === 'advance' && getRemainingDebt(t.id) > 1).map(tx => (
                    <div key={tx.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-teal-500 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded text-xs font-bold">對象: {tx.debtor}</span>
                                <span className="text-xs text-stone-400 tabular-nums">{tx.date}</span>
                            </div>
                            <p className="font-bold text-lg text-stone-800 tabular-nums">${safeNum(getRemainingDebt(tx.id))}</p>
                            <p className="text-xs text-stone-500">{tx.note || '無備註'}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={() => { 
                                    setSettleTargetTx({ ...tx, amount: getRemainingDebt(tx.id) }); 
                                    setSettleDate(getLocalToday()); 
                                    setModal('settle'); 
                                }} 
                                className="bg-stone-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow hover:bg-stone-900 transition-colors"
                            >
                                收款
                            </button>
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation();
                                    handleVoidAdvance(tx); 
                                }} 
                                className="bg-stone-50 text-stone-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-500 transition-colors border border-stone-200"
                            >
                                作廢
                            </button>
                        </div>
                    </div>
                ))}
                {transactions.filter(t => t.type === 'advance' && getRemainingDebt(t.id) > 1).length === 0 && (
                    <div className="text-center py-10 text-stone-400 text-sm">無待收項目</div>
                )}
            </div>
        </div>
    );
};