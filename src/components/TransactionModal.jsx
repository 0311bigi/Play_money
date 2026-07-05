import React from 'react';
import { Icon } from './Icon';
import { safeNum } from '../utils'; // 引入我們的工具箱

export const TransactionModal = ({
    txForm, setTxForm,
    categories, accounts, exchangeRates, stats,
    isOffset, setIsOffset, offsetTargetId, setOffsetTargetId,
    installment, setInstallment,
    isAdvanceSplit, setIsAdvanceSplit, splitData, setSplitData,
    updateAdvanceRow, removeAdvanceRow, addAdvanceRow,
    handleVoiceInput, handleTxSave,
    setModal, setEditingCategory, setEditingCategoryType
}) => {
    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl text-stone-800">記一筆</h3>
                    <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-1 rounded-md font-bold tracking-wider">支援計算機功能</span>
                </div>
                
                <input 
                    type="text" 
                    inputMode="decimal" 
                    className="w-full text-4xl font-black mb-2 outline-none tabular-nums text-stone-800 placeholder-stone-300 bg-transparent" 
                    placeholder="0" 
                    value={txForm.amount} 
                    onChange={e => {
                        let val = e.target.value.replace(/[．。]/g, '.');
                        val = val.replace(/[^0-9+\-*/.]/g, ''); 
                        val = val.replace(/\.{2,}/g, '.');
                        setTxForm({...txForm, amount: val});
                    }} 
                    onBlur={() => {
                        try {
                            const cleanStr = String(txForm.amount || '').replace(/[+\-*/.]+$/, '');
                            if(/[+\-*/]/.test(cleanStr)){
                                const result = new Function('return ' + cleanStr)();
                                if(Number.isFinite(result)) setTxForm({...txForm, amount: parseFloat(result.toFixed(2)).toString()});
                            }
                        } catch(e) {}
                    }}
                    autoFocus 
                />
                
                <div className="flex gap-1.5 mb-4">
                    {['+', '-', '*', '/', '.'].map(op => (
                        <button 
                            key={op}
                            onClick={() => {
                                let newVal = (txForm.amount || '') + op;
                                newVal = newVal.replace(/([+\-*/.])\1+/g, '$1');
                                setTxForm({...txForm, amount: newVal});
                            }}
                            className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 py-1.5 rounded-lg font-black text-lg transition-colors active:scale-95"
                        >
                            {op === '*' ? '×' : op === '/' ? '÷' : op}
                        </button>
                    ))}
                    <button 
                        onClick={() => {
                            try {
                                const cleanStr = String(txForm.amount || '').replace(/[+\-*/.]+$/, '');
                                if(/[+\-*/]/.test(cleanStr)){
                                    const result = new Function('return ' + cleanStr)();
                                    if(Number.isFinite(result)) setTxForm({...txForm, amount: parseFloat(result.toFixed(2)).toString()});
                                }
                            } catch(e) {}
                        }}
                        className="flex-[1.5] bg-emerald-100 hover:bg-emerald-200 text-emerald-600 py-1.5 rounded-lg font-black text-lg transition-colors active:scale-95"
                    >
                        =
                    </button>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <button 
                        onClick={()=>{
                            // ✨ 修改這裡：補上 toAccountId: '', toAmount: '' 徹底清空轉帳殘留
                            setTxForm({...txForm, type:'expense', category: categories['expense']?.[0]?.name || '', toAccountId: '', toAmount: ''});
                        }} 
                        className={`p-3 rounded-lg font-bold transition-colors ${txForm.type==='expense'?'bg-rose-100 text-rose-600':'bg-stone-100 text-stone-500'}`}
                    >
                        支出
                    </button>
                    <button 
                        onClick={()=>{
                            // ✨ 修改這裡：補上 toAccountId: '', toAmount: '' 徹底清空轉帳殘留
                            setTxForm({...txForm, type:'income', category: categories['income']?.[0]?.name || '', toAccountId: '', toAmount: ''});
                        }} 
                        className={`p-3 rounded-lg font-bold transition-colors ${txForm.type==='income'?'bg-emerald-100 text-emerald-600':'bg-stone-100 text-stone-500'}`}
                    >
                        收入
                    </button>
                    <button 
                        onClick={()=>{
                            setTxForm({...txForm, type:'transfer', category: '轉帳'});
                        }} 
                        className={`p-3 rounded-lg font-bold transition-colors ${txForm.type==='transfer'?'bg-slate-200 text-slate-700':'bg-stone-100 text-stone-500'}`}
                    >
                        轉帳
                    </button>
                </div>
                
                <div className="space-y-4">
                    {txForm.type === 'transfer' ? (
                        <div className="flex flex-col gap-2 bg-stone-50 p-4 rounded-xl border border-stone-100">
                            <div className="w-full">
                                <label className="text-xs text-stone-500 font-bold ml-1 mb-1 block">從 轉出</label>
                                <select className="w-full bg-white p-3 rounded-lg font-bold text-stone-800 border border-stone-200 shadow-sm outline-none focus:border-blue-400" value={txForm.accountId} onChange={e=>setTxForm({...txForm, accountId:e.target.value})}>
                                    <option value="">選擇帳戶</option>
                                    {accounts.filter(a => !a.isArchived || a.id === txForm.accountId).map(a=><option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                                </select>
                            </div>                                           
                            <div className="flex justify-center -my-1 z-10 relative">
                                <div className="bg-stone-200 rounded-full p-1 border-2 border-white">
                                    <Icon name="arrow-down" size={16} className="text-stone-500"/>
                                </div>
                            </div>
                            <div className="w-full">
                                <label className="text-xs text-stone-500 font-bold ml-1 mb-1 block">轉入 至</label>
                                <select className="w-full bg-white p-3 rounded-lg font-bold text-stone-800 border border-stone-200 shadow-sm outline-none focus:border-blue-400" value={txForm.toAccountId} onChange={e=>setTxForm({...txForm, toAccountId:e.target.value})}>
                                    <option value="">選擇帳戶</option>
                                    {accounts.filter(a => !a.isArchived || a.id === txForm.toAccountId).map(a=><option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                                </select>
                            </div>                                           
                            {(() => {
                                const sourceAcc = accounts.find(a => a.id === txForm.accountId);
                                const targetAcc = accounts.find(a => a.id === txForm.toAccountId);
                                const isDiffCurrency = sourceAcc && targetAcc && sourceAcc.currency !== targetAcc.currency;
                                if (isDiffCurrency) { 
                                    const rate = (parseFloat(txForm.amount) && parseFloat(txForm.toAmount)) ? (parseFloat(txForm.amount) / parseFloat(txForm.toAmount)).toFixed(2) : '-'; 
                                    return (
                                        <div className="w-full pt-3 mt-1 border-t border-dashed border-stone-300">
                                            <div className="flex justify-between items-center mb-1 px-1">
                                                <span className="text-xs font-bold text-blue-600">實際入帳金額 ({targetAcc.currency})</span>
                                                <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">匯率 ≈ {rate}</span>
                                            </div>
                                            <input type="number" step="0.01" className="w-full p-3 bg-blue-50 rounded-lg font-bold text-blue-700 border border-blue-200 tabular-nums text-xl outline-none focus:ring-2 focus:ring-blue-200" placeholder="例如: 1000" value={txForm.toAmount || ''} onChange={e=>setTxForm({...txForm, toAmount:e.target.value})} />
                                        </div>
                                    ); 
                                } 
                                return null;
                            })()}
                        </div>
                    ) : (
                        <React.Fragment>
                            <div className="space-y-3">
                                {(() => {
                                    const displayType = txForm.type === 'advance' ? 'expense' : txForm.type;
                                    const catList = categories[displayType] || [];
                                    
                                    if (catList.length === 0) return null;
                                    
                                    return (
                                        <React.Fragment>
                                            <div className="flex gap-2 items-center">
                                                <div 
                                                 className="flex-1 flex flex-wrap gap-2 pb-1" 
                                                 style={{ scrollSnapType: 'x mandatory' }}
                                                 onWheel={(e) => {
                                                     e.currentTarget.scrollLeft += e.deltaY;
                                                 }}
                                                >
                                                    {catList.map(c => (
                                                        <button 
                                                            key={c.name} 
                                                            onClick={() => setTxForm({ ...txForm, category: c.name, subCategory: '' })} 
                                                            className={`whitespace-nowrap px-4 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 ${
                                                                txForm.category === c.name 
                                                                ? 'bg-stone-800 text-white shadow-stone-300' 
                                                                : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-50'
                                                            }`}
                                                            style={{ scrollSnapAlign: 'start' }}
                                                        >
                                                            <Icon name={c.icon} size={16} />
                                                            {c.name}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="pl-1 border-l border-stone-200">
                                                    <button 
                                                        onClick={()=>{setEditingCategoryType(displayType); setModal('cat');}} 
                                                        className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-600 flex items-center justify-center transition-colors shrink-0"
                                                        title="管理類別"
                                                    >
                                                        <Icon name="settings" size={20}/>
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {(() => {
                                                const currentCat = catList.find(c => c.name === txForm.category);
                                                
                                                if (currentCat && currentCat.subs && currentCat.subs.length > 0) {
                                                    return (
                                                        <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                            {currentCat.subs.map(s => (
                                                                <button 
                                                                    key={s} 
                                                                    onClick={() => setTxForm({ ...txForm, subCategory: s })} 
                                                                    className={`p-3 rounded-xl text-sm font-bold border transition-all active:scale-95 shadow-sm truncate ${
                                                                        txForm.subCategory === s 
                                                                        ? 'bg-rose-50 text-rose-600 border-rose-200 ring-2 ring-rose-100' 
                                                                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                                                                    }`}
                                                                >
                                                                    {s}
                                                                </button>
                                                            ))}
                                                            <button 
                                                                onClick={()=>{setEditingCategory(currentCat); setEditingCategoryType(displayType); setModal('editCat');}}
                                                                className="p-3 rounded-xl text-sm font-bold border border-dashed border-stone-300 text-stone-400 hover:bg-stone-50 flex items-center justify-center gap-1"
                                                            >
                                                                <Icon name="plus" size={14}/>
                                                            </button>
                                                        </div>
                                                    );
                                                }
                                                
                                                if (currentCat) {
                                                    return (
                                                        <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 border-dashed flex justify-between items-center animate-in fade-in">
                                                            <span className="text-xs text-stone-400 pl-1">此類別尚無子項目</span>
                                                            <button 
                                                                onClick={()=>{setEditingCategory(currentCat); setEditingCategoryType(displayType); setModal('editCat');}}
                                                                className="text-xs bg-white border border-stone-200 px-3 py-1.5 rounded-lg font-bold text-stone-500 shadow-sm hover:text-rose-500"
                                                            >
                                                                + 新增子項目
                                                            </button>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </React.Fragment>
                                    );
                                })()}
                            </div>
                             {!isOffset ? (
                                <div className="w-full">
                                    <select className="w-full bg-stone-50 p-3 rounded-lg font-bold text-stone-700" value={txForm.accountId} onChange={e=>setTxForm({...txForm, accountId:e.target.value})}>
                                        <option value="">選擇帳戶</option>
                                        {accounts.filter(a => !a.isArchived || a.id === txForm.accountId).map(a=><option key={a.id} value={a.id}>{a.name} {a.currency !== 'TWD' ? `(${a.currency})` : ''}</option>)}
                                    </select>
                                    
                                    {(() => {
                                        const acc = accounts.find(a => a.id === txForm.accountId);
                                        if (acc && acc.currency !== 'TWD') {
                                            const rate = exchangeRates[acc.currency] || 1;
                                            const inputAmt = parseFloat(txForm.amount) || 0;
                                            return (
                                                <div className="flex justify-between items-center text-xs mt-1.5 px-1">
                                                    <span className="text-stone-400 font-bold">目前匯率: 1 {acc.currency} = {rate} TWD</span>
                                                    {inputAmt > 0 && <span className="text-rose-500 font-bold tabular-nums">≈ NT$ {Math.round(inputAmt * rate).toLocaleString()}</span>}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            ) : (
                                <select className="w-full bg-rose-50 border-rose-200 p-3 rounded-lg font-bold text-rose-700" value={offsetTargetId} onChange={e=>setOffsetTargetId(e.target.value)}>
                                    <option value="">選擇待收對象...</option>
                                    {Object.values(stats.advanceMap).filter(a => !a.isSettled && a.remaining > 0.1).map(adv => (<option key={adv.id} value={adv.id}>{adv.debtor} (剩餘 ${adv.remaining})</option>))}
                                </select>
                            )}
                        </React.Fragment>
                    )}
                    <div className="flex items-center gap-2">
                        <input type="date" className="bg-stone-50 p-3 rounded-lg flex-1 font-bold text-stone-700" value={txForm.date} onChange={e=>setTxForm({...txForm, date:e.target.value})} />
                        <div className="flex-[2] flex gap-1"><input className="bg-stone-50 p-3 rounded-lg w-full font-bold text-stone-700" placeholder="備註" value={txForm.note} onChange={e=>setTxForm({...txForm, note:e.target.value})} /><button onClick={handleVoiceInput} className="bg-stone-100 p-3 rounded-lg text-stone-500 hover:text-rose-500 hover:bg-rose-50 transition-colors"><Icon name="mic" size={20} /></button></div>
                    </div>
                    {txForm.type === 'expense' && (<div className="space-y-2 pt-2 border-t border-stone-100"><label className="flex items-center justify-between p-2"><span className="text-sm font-bold text-stone-500">使用待收抵扣 (互抵)</span><input type="checkbox" checked={isOffset} onChange={e=>{ setIsOffset(e.target.checked); if(e.target.checked) { setIsAdvanceSplit(false); setInstallment({...installment, enabled: false}); } }} /></label>{!isOffset && (<React.Fragment><label className="flex items-center justify-between p-2"><span className="text-sm font-bold text-stone-500">分期付款</span><input type="checkbox" checked={installment.enabled} onChange={e=>setInstallment({...installment, enabled:e.target.checked})} /></label>{installment.enabled && <select className="w-full bg-white border p-2 rounded" value={installment.periods} onChange={e=>setInstallment({...installment, periods:e.target.value})}><option value="3">3 期</option><option value="6">6 期</option><option value="12">12 期</option></select>}<label className="flex items-center justify-between p-2"><span className="text-sm font-bold text-stone-500">代墊款 (多人)</span><input type="checkbox" checked={isAdvanceSplit} onChange={e=>setIsAdvanceSplit(e.target.checked)} /></label>{isAdvanceSplit && (<div className="p-2 bg-stone-50 rounded space-y-2">{splitData.advances.map((adv, idx) => (<div key={idx} className="flex gap-2"><input placeholder="對象" className="border p-2 rounded w-1/2 text-sm" value={adv.debtor} onChange={e=>updateAdvanceRow(idx, 'debtor', e.target.value)} /><input type="number" placeholder="金額" className="border p-2 rounded w-1/3 text-sm tabular-nums" value={adv.amount} onChange={e=>updateAdvanceRow(idx, 'amount', e.target.value)} />{splitData.advances.length > 1 && <button onClick={()=>removeAdvanceRow(idx)} className="text-red-500"><Icon name="x" size={16}/></button>}</div>))}<button onClick={addAdvanceRow} className="text-xs text-rose-600 font-bold flex items-center gap-1 p-1">+ 新增對象</button><div className="text-xs text-stone-400 text-right mt-1 tabular-nums border-t border-stone-200 pt-1">總代墊: ${splitData.advances.reduce((s,a)=>s+(parseFloat(a.amount)||0),0)} / 自付: ${Math.max(0, (parseFloat(txForm.amount)||0) - splitData.advances.reduce((s,a)=>s+(parseFloat(a.amount)||0),0))}</div></div>)}</React.Fragment>)}</div>)}
                    {txForm.type === 'income' && (
                        <div className="space-y-2 pt-2 border-t border-stone-100">
                            <label className="flex items-center justify-between p-2 cursor-pointer">
                                <span className="text-sm font-bold text-stone-500 flex items-center gap-1">
                                    <Icon name="pie-chart" size={16} /> 投資贖回 (本金/獲利自動拆分)
                                </span>
                                <input type="checkbox" checked={isAdvanceSplit} onChange={e => setIsAdvanceSplit(e.target.checked)} />
                            </label>
                            
                            {isAdvanceSplit && (
                                <div className="p-4 bg-stone-50 rounded-xl space-y-3 border border-stone-200 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 mb-1 block">本金從哪個投資帳戶轉出？</label>
                                        <select className="w-full p-3 bg-white rounded-lg border border-stone-200 text-sm font-bold text-stone-700 outline-none focus:border-emerald-400" value={splitData.sourceAccountId || ''} onChange={e => setSplitData({...splitData, sourceAccountId: e.target.value})}>
                                            <option value="">選擇投資帳戶...</option>
                                            {accounts.filter(a => a.type === 'invest' && !a.isArchived).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 mb-1 block">其中多少是本金？</label>
                                        <input type="number" placeholder="輸入本金金額" className="w-full p-3 bg-white rounded-lg border border-stone-200 text-sm font-bold text-stone-700 tabular-nums outline-none focus:border-emerald-400" value={splitData.principalAmount || ''} onChange={e => setSplitData({...splitData, principalAmount: e.target.value})} />
                                    </div>
                                    <div className="text-xs font-bold text-stone-500 text-right pt-1">
                                        系統自動計算獲利: <span className="text-emerald-500 text-base tabular-nums">+${safeNum((parseFloat(txForm.amount)||0) - (parseFloat(splitData.principalAmount)||0))}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex gap-2 mt-6">
                    <button onClick={()=>setModal(null)} className="flex-1 bg-stone-100 py-3 rounded-xl font-bold text-stone-500">取消</button>
                    <button onClick={handleTxSave} className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-rose-200">儲存</button>
                </div>
            </div>
        </div>
    );
};