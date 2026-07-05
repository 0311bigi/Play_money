import React from 'react';
import { Icon } from '../components/Icon';
import { safeNum, getLocalToday } from '../utils';

export const SettingsTab = ({
    monthlyBudget,
    retirement,
    setModal,
    setRetireForm,
    setRecForm,
    handleExport,
    handleImportClick,
    handleImportFile,
    fileInputRef,
    isImporting
}) => {
    // 處理避免 undefined 的預設值
    const safeBudget = monthlyBudget ? parseFloat(monthlyBudget) : 0;
    const safeRetireAge = (retirement && retirement.retireAge) ? retirement.retireAge : 60;
    const safeRetireExpense = (retirement && retirement.monthlyExpense) ? parseFloat(retirement.monthlyExpense) : 30000;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-stone-800">設定</h2>
            
            <button onClick={()=>setModal('budget')} className="w-full bg-white p-4 rounded-xl shadow-sm border border-stone-100 text-left font-bold flex justify-between items-center text-stone-700">
                <div>月預算設定 <span className="text-xs text-stone-400 font-normal block">目前: ${safeNum(safeBudget)}</span></div>
                <Icon name="chevron-right" className="text-stone-300"/>
            </button>
            
            <button onClick={()=>{setRetireForm(retirement || { currentAge:30, retireAge:60, monthlyExpense:30000, inflation:2 }); setModal('retire')}} className="w-full bg-white p-4 rounded-xl shadow-sm border border-stone-100 text-left font-bold flex justify-between items-center text-stone-700">
                <div>退休計畫 <span className="text-xs text-stone-400 font-normal block">{safeRetireAge}歲退休 / 月花費${safeNum(safeRetireExpense)}</span></div>
                <Icon name="chevron-right" className="text-stone-300"/>
            </button>
            
            <button onClick={()=>{setRecForm({name:'', type:'expense', amount:'', frequency:'monthly', month:1, day:1, accountId:'', toAccountId:'', category:'', subCategory:'', startDate: getLocalToday(), endDate:''}); setModal('recurring');}} className="w-full bg-white p-4 rounded-xl shadow-sm border border-stone-100 text-left font-bold flex justify-between items-center text-stone-700">
                固定收支管理 <Icon name="chevron-right" className="text-stone-300"/>
            </button>
            
            <button onClick={()=>setModal('cat')} className="w-full bg-white p-4 rounded-xl shadow-sm border border-stone-100 text-left font-bold flex justify-between items-center text-stone-700">
                類別管理 <Icon name="chevron-right" className="text-stone-300"/>
            </button>
            
            <button onClick={()=>setModal('rate')} className="w-full bg-white p-4 rounded-xl shadow-sm border border-stone-100 text-left font-bold flex justify-between items-center text-stone-700">
                匯率設定 <Icon name="chevron-right" className="text-stone-300"/>
            </button>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={handleExport} className="bg-emerald-50 text-emerald-600 p-4 rounded-xl font-bold text-center border border-emerald-100 flex items-center justify-center gap-2">
                    <Icon name="download" size={18}/> 匯出 Excel
                </button>
                <button onClick={handleImportClick} className="bg-blue-50 text-blue-600 p-4 rounded-xl font-bold text-center border border-blue-100 flex items-center justify-center gap-2">
                    <Icon name="upload" size={18}/> 匯入 Excel
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImportFile} className="hidden" accept=".xlsx, .xls, .csv" />
            </div>
            
            <button onClick={()=>{localStorage.removeItem('my_ledger_firebase_config');window.location.reload()}} className="w-full bg-red-50 text-red-600 p-4 rounded-xl font-bold mt-8 text-center border border-red-100">
                重設 App 連線
            </button>
            
            {isImporting && <div className="text-center text-sm text-stone-400 mt-2">正在匯入資料，請稍候...</div>}
        </div>
    );
};