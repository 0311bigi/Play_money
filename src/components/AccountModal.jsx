import React from 'react';
import { Icon } from './Icon'; // 引入圖示工具
import { ACCOUNT_TYPES, CURRENCIES } from '../constants'; // 引入帳戶類型與幣別常數

export const AccountModal = ({ editTarget, accForm, setAccForm, handleAccSubmit, setModal }) => {
    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm p-6 rounded-2xl">
                <h3 className="font-bold text-xl mb-4 text-stone-800">{editTarget ? '編輯帳戶' : '新增帳戶'}</h3>
                
                <input className="w-full p-3 bg-stone-50 rounded-lg mb-4 border border-stone-200" placeholder="名稱" value={accForm.name} onChange={e=>setAccForm({...accForm, name:e.target.value})}/>
                
                <select className="w-full p-3 bg-stone-50 rounded-lg mb-4 border border-stone-200" value={accForm.type} onChange={e=>setAccForm({...accForm, type:e.target.value})}>
                    {Object.entries(ACCOUNT_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </select>

                {accForm.type === 'credit' && (
                    <div className="flex items-center gap-2 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <Icon name="calendar-days" size={18} className="text-blue-500"/>
                        <span className="text-sm font-bold text-blue-700 whitespace-nowrap">每月結帳日</span>
                        <input 
                            type="number" min="1" max="31" 
                            className="w-full p-1 bg-white rounded border border-blue-200 text-center font-bold tabular-nums" 
                            value={accForm.closingDay || '27'} 
                            onChange={e=>setAccForm({...accForm, closingDay:e.target.value})}
                        />
                        <span className="text-sm font-bold text-blue-700">日</span>
                    </div>
                )}

                <input type="number" step="0.01" className="w-full p-3 bg-stone-50 rounded-lg mb-4 border border-stone-200 tabular-nums" placeholder="初始餘額 (負債請填負數)" value={accForm.initialBalance} onChange={e=>setAccForm({...accForm, initialBalance:e.target.value})}/>
                
                <div className="flex gap-2 mb-4">
                    <span className="p-3 bg-stone-100 rounded text-sm text-stone-500">幣別</span>
                    <select className="flex-1 p-3 bg-stone-50 rounded border border-stone-200" value={accForm.currency} onChange={e=>setAccForm({...accForm, currency:e.target.value})}>
                        {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <label className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg mb-3 cursor-pointer border border-stone-200">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${accForm.includeInTotal ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-stone-300'}`}>
                        {accForm.includeInTotal && <Icon name="check" size={14} />}
                    </div>
                    <input type="checkbox" className="hidden" checked={accForm.includeInTotal} onChange={e=>setAccForm({...accForm, includeInTotal:e.target.checked})} />
                    <span className="text-sm font-bold text-stone-700">計入總資產</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg mb-6 cursor-pointer border border-stone-200">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${accForm.isArchived ? 'bg-stone-500 border-stone-500 text-white' : 'bg-white border-stone-300'}`}>
                        {accForm.isArchived && <Icon name="check" size={14} />}
                    </div>
                    <input type="checkbox" className="hidden" checked={accForm.isArchived} onChange={e=>setAccForm({...accForm, isArchived:e.target.checked})} />
                    <span className="text-sm font-bold text-stone-700">停用此帳戶 (隱藏於記帳選單)</span>
                </label>

                <button onClick={handleAccSubmit} className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold shadow-lg">儲存</button>
                <button onClick={()=>setModal(null)} className="w-full mt-2 text-stone-400 py-2">取消</button>
            </div>
        </div>
    );
};