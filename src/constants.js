// src/constants.js

export const DEFAULT_CATS = { 
    expense: [
        { name: '伙食', icon: 'utensils', subs: [] },
        { name: '交通', icon: 'bus', subs: [] },
        { name: '日常用品', icon: 'shopping-bag', subs: [] },
        { name: '運動', icon: 'dumbbell', subs: [] },
        { name: '居家電子費', icon: 'home', subs: [] },
        { name: '老媽月費', icon: 'tag', subs: [] },
        { name: '美美的', icon: 'tag', subs: [] },
        { name: '投資', icon: 'trending-up', subs: [] },
        { name: '醫療保健', icon: 'heart', subs: [] },
        { name: '國外旅遊', icon: 'plane', subs: [] },
        { name: '娛樂', icon: 'film', subs: [] },
        { name: '其他', icon: 'more-horizontal', subs: [] }
    ], 
    income: [
        { name: '薪資', icon: 'wallet', subs: [] },
        { name: '獎金', icon: 'gift', subs: [] },
        { name: '投資', icon: 'trending-up', subs: [] }
    ] 
};
    
export const ACCOUNT_TYPES = { 
    'cash': { label: '現金', iconName: 'coins', color: 'text-emerald-600 bg-emerald-50' },
    'bank': { label: '銀行', iconName: 'landmark', color: 'text-blue-600 bg-blue-50' },
    'credit': { label: '信用卡', iconName: 'credit-card', color: 'text-purple-600 bg-purple-50' },
    'electronic': { label: '電子貨幣', iconName: 'smartphone-nfc', color: 'text-sky-600 bg-sky-50' },
    'invest': { label: '投資理財', iconName: 'trending-up', color: 'text-rose-600 bg-rose-50' },
    'payable': { label: '應付帳款', iconName: 'file-minus', color: 'text-orange-600 bg-orange-50' },
    'receivable': { label: '應收帳款', iconName: 'file-plus', color: 'text-teal-600 bg-teal-50' },
    'other': { label: '其它', iconName: 'wallet', color: 'text-stone-600 bg-stone-100' }
};

export const CURRENCIES = ['TWD','USD','JPY','EUR','CNY','HKD','KRW','AUD','CAD','GBP','SGD','CHF'];

export const DEFAULT_RATES = {'TWD':1,'USD':32.5,'JPY':0.22,'EUR':35.0,'CNY':4.5,'HKD':4.1,'KRW':0.024,'AUD':21.5,'CAD':24.0,'GBP':41.0,'SGD':24.2,'CHF':36.5};
    
export const CATEGORY_COLORS = { '飲食': '#0ea5e9', '交通': '#22c55e', '購物': '#eab308', '娛樂': '#a855f7', '居住': '#f97316', '醫療': '#ef4444', '教育': '#6366f1', '薪資': '#10b981', '獎金': '#f59e0b', '投資': '#f43f5e', '轉帳': '#64748b', '代墊': '#8b5cf6', '還款': '#14b8a6', '自動繳款': '#94a3b8', '運動': '#84cc16' };

export const FALLBACK_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const AVAILABLE_ICONS = ['utensils', 'coffee', 'beer', 'shopping-cart', 'shopping-bag', 'gift', 'bus', 'car', 'plane', 'bed', 'map', 'home', 'zap', 'wifi', 'phone', 'hammer', 'film', 'gamepad-2', 'music', 'camera', 'ticket', 'stethoscope', 'pill', 'heart', 'graduation-cap', 'book', 'briefcase', 'smile', 'frown', 'star', 'tag', 'dumbbell', 'more-horizontal'];
    
export const OFFSET_ACCOUNT_ID = 'virtual-offset-account';