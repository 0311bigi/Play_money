import React from 'react';
import { Icon } from './Icon';
import { safeNum } from '../utils';

export const MarketValueModal = ({ 
    editTarget, holdingForm, setHoldingForm, newMarketValue, setNewMarketValue, 
    exchangeRates, handleUpdateMarketValue, setModal 
}) => {
    if (!editTarget) return null;
    const currentSum = holdingForm.length > 0 ? holdingForm.reduce((s, h) => s + (parseFloat(h.price)||0), 0) : (parseFloat(newMarketValue) || 0);
    const rate = exchangeRates[editTarget.currency] || 1;

    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md p-6 rounded-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                <h3 className="font-bold text-xl mb-1 text-stone-800">更新市值</h3>
                <p className="text-sm text-stone-500 mb-4">{editTarget.name} ({editTarget.currency})</p>

                <div className="mb-6 bg-stone-50 p-4 rounded-xl text-center border border-stone-100">
                    <p className="text-xs text-stone-400 font-bold mb-1">當前總市值 ({editTarget.currency})</p>
                    <div className="text-3xl font-black text-stone-800 tabular-nums mb-1">${safeNum(currentSum)}</div>
                    {editTarget.currency !== 'TWD' && <div className="text-sm font-bold text-rose-500 tabular-nums">≈ TWD ${safeNum(Math.round(currentSum * rate))}</div>}
                </div>

                <div className="flex-1 overflow-y-auto mb-4">
                    <div className="space-y-3">
                        {holdingForm.map((h, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input placeholder="代號" className="w-[30%] p-1.5 border rounded-lg text-sm font-bold uppercase" value={h.symbol} onChange={e => { const n=[...holdingForm]; n[idx].symbol=e.target.value; setHoldingForm(n); }}/>
                                <input type="number" placeholder="股數" className="w-[25%] p-1.5 border rounded-lg text-sm" value={h.qty} onChange={e => { const n=[...holdingForm]; n[idx].qty=e.target.value; setHoldingForm(n); }}/>
                                <input type="number" placeholder="市值" className="flex-1 p-1.5 border rounded-lg text-sm font-bold" value={h.price} onChange={e => { const n=[...holdingForm]; n[idx].price=e.target.value; setHoldingForm(n); }}/>
                                <button onClick={() => setHoldingForm(holdingForm.filter((_, i) => i !== idx))} className="text-stone-300 hover:text-red-500"><Icon name="x" size={18}/></button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button onClick={() => setHoldingForm([...holdingForm, { symbol: '', qty: '', price: '' }])} className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-2 rounded-lg hover:bg-stone-200 flex items-center gap-1"><Icon name="plus" size={14}/> 新增持倉</button>
                    </div>
                </div>

                {holdingForm.length === 0 && (
                    <div className="mb-4"><label className="text-xs text-stone-400 font-bold mb-1 block">或直接輸入總市價：</label><input type="number" className="w-full p-3 bg-stone-50 rounded-xl font-bold border" value={newMarketValue} onChange={e => setNewMarketValue(e.target.value)}/></div>
                )}

                <div className="flex gap-3 pt-2 border-t border-stone-100">
                    <button onClick={()=>setModal(null)} className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-500 font-bold">取消</button>
                    <button onClick={handleUpdateMarketValue} className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-bold shadow-lg">更新</button>
                </div>
            </div>
        </div>
    );
};