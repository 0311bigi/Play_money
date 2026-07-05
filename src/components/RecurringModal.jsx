import React from 'react';
import { Icon } from './Icon';
import { getLocalToday } from '../utils';

export const RecurringModal = ({
    recForm, setRecForm,
    accounts, categories, recurring,
    setModal, handleRecurringSave, deleteData
}) => {
    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 overflow-y-auto min-h-0">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl text-stone-800">
                            {recForm.id ? '編輯固定項目' : '新增固定收支與轉帳'}
                        </h3>
                        {recForm.id && (
                            <button 
                                onClick={()=>setRecForm({ name:'', type:'expense', amount:'', frequency:'monthly', month:1, day:1, accountId:'', toAccountId:'', category:'', subCategory:'', startDate: getLocalToday(), endDate:'' })}
                                className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded hover:bg-stone-200"
                            >
                                取消編輯
                            </button>
                        )}
                    </div>
                    
                    <div className="space-y-3 mb-6 border-b border-stone-100 pb-6">
                        <input className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200" placeholder="名稱 (例如: 定期定額 0050)" value={recForm.name} onChange={e=>setRecForm({...recForm, name:e.target.value})}/>
                        
                        <div className="flex gap-2">
                            <select className="w-20 p-2 bg-stone-50 rounded-lg border border-stone-200 font-bold text-stone-700 text-sm" value={recForm.type} onChange={e=>setRecForm({...recForm, type:e.target.value, category:'', subCategory:''})}>
                                <option value="expense">支出</option>
                                <option value="income">收入</option>
                                <option value="transfer">轉帳</option>
                            </select>

                            <div className="flex-1 flex items-center bg-stone-50 rounded-lg border border-stone-200 px-2 gap-1">
                                <select className="bg-transparent font-bold text-stone-600 outline-none text-sm mr-1" value={recForm.frequency} onChange={e=>setRecForm({...recForm, frequency:e.target.value})}>
                                    <option value="monthly">每月</option>
                                    <option value="yearly">每年</option>
                                </select>

                                {recForm.frequency === 'yearly' && (
                                    <React.Fragment>
                                        <input type="number" min="1" max="12" className="w-8 bg-transparent font-bold outline-none tabular-nums text-center border-b border-stone-300 focus:border-rose-500" value={recForm.month} onChange={e=>setRecForm({...recForm, month:parseInt(e.target.value)})}/>
                                        <span className="text-stone-400 text-xs">月</span>
                                    </React.Fragment>
                                )}

                                <input type="number" min="1" max="31" className="flex-1 bg-transparent font-bold outline-none tabular-nums text-center" value={recForm.day} onChange={e=>setRecForm({...recForm, day:parseInt(e.target.value)})}/>
                                <span className="text-stone-500 text-sm">日</span>
                            </div>
                        </div>

                        <input type="number" step="0.01" className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200 tabular-nums font-bold text-lg" placeholder="金額" value={recForm.amount} onChange={e=>setRecForm({...recForm, amount:e.target.value})}/>
                        
                        {recForm.type !== 'transfer' && (
                            <div className="space-y-2">
                                <div>
                                    <label className="text-xs font-bold text-stone-500 ml-1 mb-1 block">類別</label>
                                    <select className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200 text-stone-700 font-bold" value={recForm.category} onChange={e=>setRecForm({...recForm, category:e.target.value, subCategory:''})}>
                                        <option value="">選擇類別 (預設: 固定收支)</option>
                                        {(categories[recForm.type] || []).map(c => (
                                            <option key={c.name} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {(() => {
                                    const selectedCat = (categories[recForm.type] || []).find(c => c.name === recForm.category);
                                    if (selectedCat && selectedCat.subs && selectedCat.subs.length > 0) {
                                        return (
                                            <div>
                                                <label className="text-xs font-bold text-stone-500 ml-1 mb-1 block">子類別</label>
                                                <select className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200 text-stone-700" value={recForm.subCategory} onChange={e=>setRecForm({...recForm, subCategory:e.target.value})}>
                                                    <option value="">無子類別</option>
                                                    {selectedCat.subs.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        )}

                        {recForm.type === 'transfer' ? (
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-stone-500 ml-1 mb-1 block">轉出</label>
                                    <select className="w-full p-2 bg-stone-50 rounded-lg border border-stone-200 text-sm" value={recForm.accountId} onChange={e=>setRecForm({...recForm, accountId:e.target.value})}>
                                        <option value="">選擇帳戶</option>
                                        {accounts.filter(a => !a.isArchived).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center pt-5 text-stone-300"><Icon name="arrow-right" size={16}/></div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-stone-500 ml-1 mb-1 block">轉入</label>
                                    <select className="w-full p-2 bg-stone-50 rounded-lg border border-stone-200 text-sm" value={recForm.toAccountId} onChange={e=>setRecForm({...recForm, toAccountId:e.target.value})}>
                                        <option value="">選擇帳戶</option>
                                        {accounts.filter(a => !a.isArchived).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs font-bold text-stone-500 ml-1 mb-1 block">{recForm.type === 'expense' ? '扣款帳戶' : '入帳帳戶'}</label>
                                <select className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200 text-stone-700" value={recForm.accountId} onChange={e=>setRecForm({...recForm, accountId:e.target.value})}>
                                    <option value="">選擇帳戶 (預設: 第一個帳戶)</option>
                                    {accounts.filter(a => !a.isArchived).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                            <p className="text-xs font-bold text-stone-400 mb-2">有效期間 (選填)</p>
                            <div className="flex gap-2">
                                <input type="date" className="flex-1 p-2 bg-white rounded border border-stone-200 text-sm font-bold text-stone-700" value={recForm.startDate || ''} onChange={e=>setRecForm({...recForm, startDate:e.target.value})} />
                                <span className="self-center text-stone-300">~</span>
                                <input type="date" className="flex-1 p-2 bg-white rounded border border-stone-200 text-sm font-bold text-stone-700" value={recForm.endDate || ''} onChange={e=>setRecForm({...recForm, endDate:e.target.value})} />
                            </div>
                        </div>

                        <button onClick={handleRecurringSave} className={`w-full text-white py-3 rounded-xl font-bold shadow-lg transition-colors ${recForm.id ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-200' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'}`}>
                            {recForm.id ? '更新設定' : '新增固定項目'}
                        </button>
                    </div>

                    <div>
                        <h4 className="font-bold text-stone-600 mb-3 text-sm">已設定項目 ({recurring.length})</h4>
                        <div className="space-y-2">
                            {recurring.length === 0 ? <p className="text-center text-xs text-stone-400 py-4">目前沒有設定</p> : 
                            recurring.map(r => (
                                <div 
                                    key={r.id} 
                                    onClick={() => setRecForm({ ...r, startDate: r.startDate || '', endDate: r.endDate || '' })}
                                    className={`p-3 rounded-xl border flex justify-between items-center group cursor-pointer transition-all ${recForm.id === r.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-stone-50 border-stone-100 hover:bg-white hover:shadow-md'}`}
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${r.type==='expense'?'bg-rose-100 text-rose-500':r.type==='income'?'bg-emerald-100 text-emerald-500':'bg-slate-200 text-slate-600'}`}>
                                                {r.type==='expense'?'支出':r.type==='income'?'收入':'轉帳'}
                                            </span>
                                            <span className="font-bold text-stone-700 text-sm">
                                                {r.name} 
                                                {r.category && <span className="text-xs text-stone-400 font-normal ml-1">({r.category}{r.subCategory ? `-${r.subCategory}` : ''})</span>}
                                            </span>
                                        </div>
                                        <div className="text-xs text-stone-400">
                                            {r.frequency === 'yearly' ? (
                                                <span className="font-bold text-stone-600 bg-stone-200/50 px-1 rounded mr-1">每年 {r.month} 月 {r.day} 日</span>
                                            ) : (
                                                <span className="font-bold text-stone-600">每月 {r.day} 日</span>
                                            )}
                                            • ${Number(r.amount).toLocaleString()}
                                            {r.endDate && <span className="ml-1 text-[10px] bg-stone-200 px-1 rounded">至 {r.endDate}</span>}
                                        </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); if(confirm('確定要刪除這個固定設定嗎？')) deleteData('recurring', r.id); }} className="p-2 text-stone-300 hover:text-red-500 transition-colors">
                                        <Icon name="trash-2" size={16}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-stone-100">
                    <button onClick={()=>setModal(null)} className="w-full py-3 text-stone-400 font-bold hover:text-stone-600">關閉</button>
                </div>
            </div>
        </div>
    );
};