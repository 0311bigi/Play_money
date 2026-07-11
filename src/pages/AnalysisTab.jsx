import React from 'react';
import { Icon } from '../components/Icon';
import { safeNum } from '../utils';
import { getBaseAmt } from '../hooks/useLedgerStats'; // 引入計算基礎幣別的工具

export const AnalysisTab = ({
    currentLedgerMonth, setCurrentLedgerMonth, changeMonthStep,
    analysisMode, setAnalysisMode,
    analysisType, setAnalysisType,
    analysisData, trendData,
    expandedCategory, setExpandedCategory,
    expandedSubCategory, setExpandedSubCategory,
    openTxModal, accounts, exchangeRates
}) => {
    return (
        <div className="animate-in space-y-4">
            <h2 className="text-xl font-bold text-stone-800 px-1">收支分析</h2>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100 space-y-3">
                <div className="flex justify-between items-center bg-stone-50 rounded-lg p-1">
                    <button onClick={()=>changeMonthStep(analysisMode === 'year' ? -12 : -1)} className="p-2 text-stone-400"><Icon name="chevron-left"/></button>
                    <div className="relative">
                        <span className="font-bold text-stone-700">{analysisMode === 'year' ? `${currentLedgerMonth.split('-')[0]}年` : `${currentLedgerMonth.replace('-','年 ')}月`}</span>
                        <input type="month" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" value={currentLedgerMonth} onChange={e=>setCurrentLedgerMonth(e.target.value)} />
                    </div>
                    <button onClick={()=>changeMonthStep(analysisMode === 'year' ? 12 : 1)} className="p-2 text-stone-400"><Icon name="chevron-right"/></button>
                </div>
                <div className="flex bg-stone-100 p-1 rounded-lg">
                    <button onClick={()=>setAnalysisType('expense')} className={`flex-1 py-2 text-sm font-bold rounded-md ${analysisType==='expense'?'bg-white text-rose-500 shadow':'text-stone-400'}`}>支出</button>
                    <button onClick={()=>setAnalysisType('income')} className={`flex-1 py-2 text-sm font-bold rounded-md ${analysisType==='income'?'bg-white text-emerald-500 shadow':'text-stone-400'}`}>收入</button>
                </div>
                <div className="flex bg-stone-100 p-1 rounded-lg">
                    <button onClick={()=>setAnalysisMode('month')} className={`flex-1 py-2 text-sm font-bold rounded-md ${analysisMode==='month'?'bg-white text-stone-800 shadow':'text-stone-400'}`}>月報表</button>
                    <button onClick={()=>setAnalysisMode('year')} className={`flex-1 py-2 text-sm font-bold rounded-md ${analysisMode==='year'?'bg-white text-stone-800 shadow':'text-stone-400'}`}>年報表</button>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 flex flex-col items-center">
                    <div className="relative h-48 w-48 mb-4">
                        <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                            {(() => {
                                if (analysisData.chart.length === 1 && analysisData.chart[0].value > 0) { return <circle cx="50" cy="50" r="40" fill={analysisData.chart[0].color} />; }
                                let cumulative = 0;
                                return analysisData.chart.map((d, i) => {
                                    const startA = cumulative * Math.PI * 2; cumulative += d.percent / 100; const endA = cumulative * Math.PI * 2;
                                    const x1 = 50 + 40 * Math.cos(startA), y1 = 50 + 40 * Math.sin(startA), x2 = 50 + 40 * Math.cos(endA), y2 = 50 + 40 * Math.sin(endA);
                                    const largeArc = d.percent > 50 ? 1 : 0;
                                    return <path key={i} d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={d.color} stroke="#fff" strokeWidth="1" onClick={() => { setExpandedCategory(expandedCategory === d.name ? null : d.name); setExpandedSubCategory(null); }} style={{cursor: 'pointer'}} />;
                                });
                            })()}
                            {analysisData.total === 0 && <circle cx="50" cy="50" r="40" fill="#f5f5f4" />}
                            <circle cx="50" cy="50" r="28" fill="white" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center"><p className="text-xs text-stone-400 font-bold uppercase">總額</p><p className="text-sm font-black tabular-nums text-stone-800">${safeNum(analysisData.total)}</p></div>
                    </div>
                    <div className="w-full space-y-3">
                        <div className="flex justify-between text-xs text-stone-500 px-2 font-bold uppercase tracking-wider"><span>類別</span><span>金額 / 比例</span></div>
                        {analysisData.chart.map((d, index) => (
                            <div key={d.name} className="space-y-1">
                                <div className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${expandedCategory === d.name ? 'bg-stone-100' : 'bg-white hover:bg-stone-50 border border-stone-100'}`} onClick={() => { setExpandedCategory(expandedCategory === d.name ? null : d.name); setExpandedSubCategory(null); }}>
                                    <div className="font-black text-stone-400 w-4 text-center">{index + 1}</div>
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor: d.color}}></div>
                                    <div className="flex-1 font-bold text-stone-700">{d.name}</div>
                                    <div className="text-right"><div className={`font-bold tabular-nums ${analysisType==='income'?'text-emerald-600':'text-rose-600'}`}>{safeNum(d.value)}</div><div className="text-xs text-stone-400 font-bold">{Math.round(d.percent)}%</div></div>
                                </div>
                                {expandedCategory === d.name && (
                                    <div className="pl-4 pr-2 mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                        {d.subs.map((sub, sIdx) => {
                                            const subTxs = d.txs.filter(t => (t.subCategory || '無子類別') === sub.name);
                                            const isSubExpanded = expandedSubCategory === sub.name;
                                            return (
                                                <div key={sub.name} className="bg-stone-50 rounded-xl border border-stone-100 overflow-hidden shadow-sm transition-all">
                                                    <div onClick={(e) => { e.stopPropagation(); setExpandedSubCategory(isSubExpanded ? null : sub.name); }} className={`flex justify-between items-center p-3 cursor-pointer transition-colors ${isSubExpanded ? 'bg-stone-200/50' : 'bg-stone-100/80 hover:bg-stone-200/50'}`}>
                                                        <span className="text-stone-700 font-bold text-sm flex items-center gap-2">
                                                            <Icon name={isSubExpanded ? "chevron-down" : "chevron-right"} size={16} className="text-stone-400" />
                                                            <span className="text-[10px] bg-white border border-stone-200 px-1.5 py-0.5 rounded text-stone-500 font-normal tabular-nums">{index + 1}-{sIdx + 1}</span>
                                                            {sub.name}
                                                        </span>
                                                        <span className="text-stone-800 tabular-nums text-sm font-bold">${safeNum(sub.value)} <span className="text-xs text-stone-400 font-normal">({Math.round(sub.percent)}%)</span></span>
                                                    </div>
                                                    {isSubExpanded && (
                                                        <div className="bg-white border-t border-stone-100 animate-in slide-in-from-top-1 duration-200">
                                                            {subTxs.length > 0 ? (
                                                                <React.Fragment>
                                                                    {subTxs.map((t) => {
                                                                        const acc = accounts.find(a => a.id === t.accountId);
                                                                        const isForeign = acc && acc.currency !== 'TWD';
                                                                        return (
                                                                            <div key={t.id} onClick={(e) => { e.stopPropagation(); openTxModal(t.type, t); }} className="flex justify-between items-center py-3 px-4 border-b border-stone-50 last:border-0 hover:bg-stone-50 cursor-pointer group transition-colors">
                                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                                    <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded tabular-nums group-hover:bg-white group-hover:shadow-sm transition-all">{t.date.slice(5)}</span>
                                                                                    <span className="text-xs text-stone-600 truncate">{t.note || <span className="text-stone-300 italic">無備註</span>}</span>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <div className="tabular-nums font-bold text-xs text-stone-500 group-hover:text-stone-800">
                                                                                        ${safeNum(getBaseAmt(t, accounts, exchangeRates))}
                                                                                    </div>
                                                                                    {isForeign && <div className="text-[9px] text-stone-400 mt-0.5">({acc.currency} {t.amount})</div>}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </React.Fragment>
                                                            ) : (
                                                                <div className="text-center py-4 text-[10px] text-stone-300 italic">無近期明細</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                        {analysisData.total === 0 && <p className="text-center text-stone-400 text-xs py-4">無紀錄</p>}
                    </div>
                </div>
                
                <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-100 mt-4">
                    <h3 className="font-bold text-stone-700 mb-6 text-sm flex items-center gap-2">
                        <Icon name="bar-chart-2" size={16} className="text-stone-400"/> 近 6 個月收支趨勢
                    </h3>
                    <div className="h-40 flex items-end gap-3 justify-between px-1">
                        {(() => {
                            const maxVal = Math.max(...trendData.map(x => Math.max(x.income, x.expense))) || 1;
                            return trendData.map((d, i) => {
                                const hInc = Math.max(2, (d.income / maxVal) * 100);
                                const hExp = Math.max(2, (d.expense / maxVal) * 100);
                                return (
                                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group relative">
                                        <div className="absolute bottom-full mb-2 bg-stone-800 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-10 shadow-xl">
                                            <p className="text-emerald-300">收: ${safeNum(d.income)}</p>
                                            <p className="text-rose-300">支: ${safeNum(d.expense)}</p>
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 border-4 border-transparent border-t-stone-800"></div>
                                        </div>
                                        <div className="w-full flex items-end justify-center gap-1 h-32">
                                            <div style={{height:`${hInc}%`}} className="w-1.5 sm:w-3 bg-emerald-400 rounded-t-sm opacity-60 group-hover:opacity-100 transition-opacity relative"></div>
                                            <div style={{height:`${hExp}%`}} className="w-1.5 sm:w-3 bg-rose-400 rounded-t-sm opacity-60 group-hover:opacity-100 transition-opacity relative"></div>
                                        </div>
                                        <span className={`text-[10px] font-bold ${i===5 ? 'text-stone-800' : 'text-stone-300'}`}>{d.label}</span>
                                    </div>
                                )
                            });
                        })()}
                    </div>
                    <div className="flex justify-center gap-4 mt-4 text-[10px] text-stone-400">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-400 rounded-full"></div>收入</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-400 rounded-full"></div>支出</div>
                    </div>
                </div>
            </div>
        </div>
    );
};