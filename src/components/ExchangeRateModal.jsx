import React from 'react';
import { Icon } from './Icon';
import { CURRENCIES } from '../constants';

export const ExchangeRateModal = ({ exchangeRates, setExchangeRates, setModal, handleRatesSubmit }) => {
    const handleFetchRates = async (e) => {
        const btn = e.currentTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="animate-pulse">抓取中...</span>';
        btn.disabled = true;
        try {
            const res = await fetch('https://script.google.com/macros/s/AKfycbxLhIsN_32Zelwr34NZm7VRg8gumusDji2R5qpzZ-MvP-n55QSzItQdiM016d6z8SI/exec');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            const newRates = { ...exchangeRates };
            CURRENCIES.forEach(c => { if (data[c]) newRates[c] = data[c]; });
            setExchangeRates(newRates);
            alert("✅ 成功從台灣銀行更新即時匯率！");
        } catch (err) {
            alert("❌ 匯率更新失敗");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm p-6 rounded-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl text-stone-800">匯率設定</h3>
                    <button onClick={handleFetchRates} className="text-xs bg-stone-100 text-stone-600 font-bold px-3 py-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors">
                        <Icon name="refresh-cw" size={12} className="inline mr-1"/>台銀即時匯率
                    </button>
                </div>
                <div className="space-y-2">
                    {CURRENCIES.filter(c => c !== 'TWD').map(c => (
                        <div key={c} className="flex justify-between items-center">
                            <span className="font-bold w-12 text-stone-600">{c}</span>
                            <input type="number" step="0.01" className="border p-2 rounded w-32 text-right tabular-nums bg-stone-50" value={exchangeRates[c] || ''} onChange={e => setExchangeRates({...exchangeRates, [c]: parseFloat(e.target.value)})}/>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-6">
                    <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-500 font-bold">取消</button>
                    <button onClick={handleRatesSubmit} className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-bold shadow-lg">儲存設定</button>
                </div>
            </div>
        </div>
    );
};