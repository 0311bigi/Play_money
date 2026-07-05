import React from 'react';

export const RetireModal = ({
    retireForm, setRetireForm,
    saveData, setModal
}) => {
    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm p-6 rounded-2xl">
                <h3 className="font-bold text-xl mb-4 text-stone-800">退休計畫</h3>
                <div className="mb-3"><label className="text-xs text-stone-500 font-bold ml-1 mb-1 block">目前年齡</label><input type="number" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg tabular-nums" value={retireForm.currentAge} onChange={e=>setRetireForm({...retireForm, currentAge:e.target.value})}/></div>
                <div className="mb-3"><label className="text-xs text-stone-500 font-bold ml-1 mb-1 block">預計退休年齡</label><input type="number" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg tabular-nums" value={retireForm.retireAge} onChange={e=>setRetireForm({...retireForm, retireAge:e.target.value})}/></div>
                <div className="mb-5"><label className="text-xs text-stone-500 font-bold ml-1 mb-1 block">退休後預估月花費</label><input type="number" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg tabular-nums" value={retireForm.monthlyExpense} onChange={e=>setRetireForm({...retireForm, monthlyExpense:e.target.value})}/></div>
                <button onClick={()=>{saveData('settings', retireForm, 'retirement'); setModal(null);}} className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold shadow-lg">儲存</button>
                <button onClick={()=>setModal(null)} className="w-full mt-2 text-stone-400 py-2">取消</button>
            </div>
        </div>
    );
};