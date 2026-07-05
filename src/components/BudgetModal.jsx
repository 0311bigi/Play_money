import React from 'react';

export const BudgetModal = ({ monthlyBudget, setMonthlyBudget, handleBudgetSubmit, setModal }) => {
    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm p-6 rounded-2xl">
                <h3 className="font-bold text-xl mb-4 text-stone-800">設定月預算</h3>
                <input 
                    type="number" 
                    className="w-full p-3 bg-stone-50 rounded-lg mb-4 border border-stone-200 tabular-nums" 
                    value={monthlyBudget} 
                    onChange={e => setMonthlyBudget(e.target.value)}
                />
                <button 
                    onClick={() => { handleBudgetSubmit(monthlyBudget); setModal(null); }} 
                    className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold shadow-lg"
                >
                    儲存
                </button>
                <button 
                    onClick={() => setModal(null)} 
                    className="w-full mt-2 text-stone-400"
                >
                    取消
                </button>
            </div>
        </div>
    );
};