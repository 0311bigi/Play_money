import React from 'react';

export const SettleModal = ({ settleTargetTx, settleDate, setSettleDate, settleToAccount, setSettleToAccount, accounts, handleSettle, setModal }) => {
    if (!settleTargetTx) return null;
    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                <h3 className="font-bold text-xl mb-2 text-stone-800">收回代墊</h3>
                <p className="text-stone-500 mb-4 font-bold">對象: {settleTargetTx.debtor} / 金額: ${settleTargetTx.amount.toLocaleString()}</p>
                <div className="mb-3">
                    <label className="text-xs font-bold text-stone-500 ml-1 block">收款日期</label>
                    <input type="date" className="w-full p-3 bg-stone-50 border rounded-lg font-bold" value={settleDate} onChange={e=>setSettleDate(e.target.value)} />
                </div>
                <div className="mb-4">
                    <label className="text-xs font-bold text-stone-500 ml-1 block">存入帳戶</label>
                    <select className="w-full p-3 bg-stone-50 border rounded-lg font-bold" value={settleToAccount} onChange={e=>setSettleToAccount(e.target.value)}>
                        <option value="">選擇帳戶...</option>
                        {accounts.filter(a => !a.isArchived).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
                <button onClick={handleSettle} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg">確認收款</button>
                <button onClick={()=>setModal(null)} className="w-full mt-3 py-2 text-stone-400 font-bold">取消</button>
            </div>
        </div>
    );
};