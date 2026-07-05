import React from 'react';
import { Icon } from './Icon';
import { getDayOfWeek, safeNum } from '../utils';

export const TransactionList = ({
    accountDetailData,
    isReconcileMode,
    openTxModal,
    toggleReconcile,
    getCategoryIcon,
    handleReorder,
    deleteData
}) => {
    return (
        <div className="space-y-2">
            <h3 className="text-xs font-bold text-stone-400 uppercase ml-1 mt-4">交易明細 (含餘額)</h3>
            {(!accountDetailData || accountDetailData.displayList.length === 0) ? (
                <div className="text-center py-10 text-stone-400 text-sm">本月無交易</div>
            ) : (
                <React.Fragment>
                    {accountDetailData.groupedList.map(group => (
                        <div key={group.date} className="mb-4">
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <span className="text-xs font-bold text-stone-500 bg-stone-200 px-2 py-1 rounded-md tabular-nums">{group.date}</span>
                                <span className="text-xs font-bold text-stone-400">{getDayOfWeek(group.date)}</span>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                                {group.txs.map((tx, idx) => (
                                    <div key={tx.id} onClick={() => openTxModal(tx.type, tx)} className={`p-3 flex justify-between items-center cursor-pointer hover:bg-stone-50 group ${idx !== group.txs.length - 1 ? 'border-b border-stone-100' : ''}`}>
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {isReconcileMode && (
                                                <div onClick={(e) => toggleReconcile(tx.id, tx.isReconciled, e)} className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer hover:scale-110 active:scale-95 ${tx.isReconciled ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-stone-300 text-transparent hover:border-emerald-400'}`}>
                                                    <Icon name="check" size={14}/>
                                                </div>
                                            )}
                                            <div className={`p-2 rounded-lg shrink-0 relative ${tx.displayType==='income' || tx.type==='repayment' ?'bg-emerald-100 text-emerald-600': tx.displayType==='expense'?'bg-rose-100 text-rose-600':'bg-stone-100 text-stone-600'}`}>
                                                <Icon name={getCategoryIcon(tx.category, tx.type)} size={18}/>
                                                {!isReconcileMode && tx.isReconciled && (
                                                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                                                        <Icon name="check" size={8} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-stone-800 truncate">
                                                    {tx.type === 'advance' ? `代墊: ${tx.debtor}` : (tx.category || '未分類')}
                                                    {tx.subCategory && <span className="text-xs text-stone-400 ml-1 font-normal">({tx.subCategory})</span>}
                                                </p>
                                                <p className="text-xs text-stone-500 truncate mt-0.5">{tx.note}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className={`font-bold tabular-nums ${tx.change > 0 ? 'text-emerald-600' : 'text-stone-800'}`}>{tx.change > 0 ? '+' : ''}{safeNum(tx.change)}</p>
                                                <p className="text-[10px] text-stone-400 font-bold mt-0.5 tabular-nums">餘額: ${safeNum(tx.balanceSnapshot)}</p>
                                            </div>

                                            <div className="flex flex-col gap-1 pl-2 border-l border-stone-100">
                                                {group.txs.length > 1 && (
                                                    <div className="flex flex-col">
                                                        <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleReorder(tx, -1); }} disabled={idx === 0} className={`p-0.5 rounded ${idx === 0 ? 'text-stone-200' : 'text-stone-400 hover:text-blue-500 hover:bg-blue-50'}`}>
                                                            <Icon name="chevron-up" size={14}/>
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleReorder(tx, 1); }} disabled={idx === group.txs.length - 1} className={`p-0.5 rounded ${idx === group.txs.length - 1 ? 'text-stone-200' : 'text-stone-400 hover:text-blue-500 hover:bg-blue-50'}`}>
                                                            <Icon name="chevron-down" size={14}/>
                                                        </button>
                                                    </div>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); if(window.confirm('確定要刪除這筆交易嗎？\n(將直接影響餘額計算)')) deleteData('transactions', tx.id); }} className="p-1 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded">
                                                    <Icon name="trash-2" size={14}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </React.Fragment>
            )}
        </div>
    );
};