import React from 'react';
import { Icon } from './Icon';
import { AVAILABLE_ICONS } from '../constants'; // 確保您有這個常數

export const CategoryListModal = ({
    categories, editingCategoryType, setEditingCategoryType,
    setEditingCategory, setModal, newCatForm, setNewCatForm, handleAddCategory
}) => {
    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm p-6 rounded-2xl max-h-[80vh] overflow-y-auto">
                <h3 className="font-bold text-xl mb-4 text-stone-800">類別管理</h3>
                <div className="flex gap-2 mb-4">
                    <button onClick={()=>setEditingCategoryType('expense')} className={`flex-1 py-2 rounded ${editingCategoryType==='expense'?'bg-rose-500 text-white':'bg-stone-100 text-stone-500'}`}>支出</button>
                    <button onClick={()=>setEditingCategoryType('income')} className={`flex-1 py-2 rounded ${editingCategoryType==='income'?'bg-rose-500 text-white':'bg-stone-100 text-stone-500'}`}>收入</button>
                </div>
                <div className="space-y-2">
                    {categories[editingCategoryType].map(c=>(
                        <div key={c.name} className="flex justify-between p-3 bg-stone-50 rounded-lg cursor-pointer hover:bg-stone-100" onClick={()=>{setEditingCategory(c); setModal('editCat')}}>
                            <span><Icon name={c.icon} size={14} className="inline mr-2"/>{c.name}</span>
                            <span className="text-xs text-stone-400">{c.subs.length} 子類別 &gt;</span>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t flex gap-2">
                    <input id="newCatName" placeholder="新類別名稱" className="flex-1 p-2 border rounded" value={newCatForm.name} onChange={e=>setNewCatForm({...newCatForm, name:e.target.value, type:editingCategoryType})}/>
                    <button onClick={handleAddCategory} className="bg-blue-600 text-white px-4 rounded">新增</button>
                </div>
                <button onClick={()=>setModal(null)} className="w-full mt-4 text-stone-400">關閉</button>
            </div>
        </div>
    );
};

export const CategoryEditModal = ({
    editingCategory, handleEditMainCategoryName, handleEditMainCategoryIcon,
    handleDeleteSubCategory, handleAddSubCategory, handleDeleteCategory,
    handleSaveCategoryChanges, setModal
}) => {
    if (!editingCategory) return null;
    
    return (
        <div className="fixed inset-0 z-[210] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm p-6 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                    <Icon name={editingCategory.icon} size={24} className="text-rose-500"/>
                    <input className="font-bold text-xl bg-transparent border-b border-stone-300 focus:border-rose-500 outline-none w-full py-1" value={editingCategory.name} onChange={(e) => handleEditMainCategoryName(e.target.value)}/>
                </div>
                <div className="mb-4 h-24 overflow-y-auto grid grid-cols-6 gap-2 p-2 bg-stone-50 rounded border border-stone-100">
                    {AVAILABLE_ICONS.map(icon => (
                        <button key={icon} onClick={() => handleEditMainCategoryIcon(icon)} className={`p-2 rounded hover:bg-stone-200 transition-colors ${editingCategory.icon === icon ? 'bg-rose-100 text-rose-500' : 'text-stone-400'}`}>
                            <Icon name={icon} size={18}/>
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto">
                    {editingCategory.subs.map(s => (
                        <span key={s} className="bg-stone-100 px-3 py-1 rounded-full text-sm flex items-center gap-1 text-stone-600 border border-stone-200">
                            {s} 
                            <button onClick={() => handleDeleteSubCategory(editingCategory.name, s)} className="text-stone-400 hover:text-red-500 w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-50"><Icon name="x" size={12}/></button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2 mb-6">
                    <input id="newSubCat" className="flex-1 border border-stone-200 p-2 rounded-lg text-sm outline-none focus:border-rose-500 transition-colors" placeholder="新增子類別" />
                    <button onClick={() => { const input = document.getElementById('newSubCat'); handleAddSubCategory(editingCategory.name, input.value); input.value = ''; input.focus(); }} className="bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-rose-600 active:scale-95 transition-all">新增</button>
                </div>
                <div className="pt-4 border-t border-stone-100 flex flex-col gap-3">
                    <button onClick={() => { handleDeleteCategory(editingCategory.name); setModal('cat'); }} className="w-full text-red-400 text-xs py-2 hover:bg-red-50 rounded-lg flex items-center justify-center gap-1 transition-colors"><Icon name="trash-2" size={14} /> 刪除此主類別</button>
                    <div className="flex gap-3">
                        <button onClick={() => setModal('cat')} className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-500 font-bold hover:bg-stone-200 transition-colors">取消</button>
                        <button onClick={handleSaveCategoryChanges} className="flex-1 py-3 rounded-xl bg-stone-800 text-white font-bold shadow-lg hover:bg-stone-900 transition-transform active:scale-95">確定儲存</button>
                    </div>
                </div>
            </div>
        </div>
    );
};