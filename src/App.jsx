import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icon } from './components/Icon';
import { DEFAULT_CATS, ACCOUNT_TYPES, CURRENCIES, DEFAULT_RATES, CATEGORY_COLORS, FALLBACK_COLORS, AVAILABLE_ICONS, OFFSET_ACCOUNT_ID } from './constants';
import { BudgetModal } from './components/BudgetModal';
import { AccountModal } from './components/AccountModal';
import { TransactionModal } from './components/TransactionModal';
import { TransactionList } from './components/TransactionList';
import { RecurringModal } from './components/RecurringModal';
import { CategoryListModal, CategoryEditModal } from './components/CategoryModals';
import { RetireModal } from './components/RetireModal';
import { ExchangeRateModal } from './components/ExchangeRateModal';
import { MarketValueModal } from './components/MarketValueModal';
import { SettleModal } from './components/SettleModal';
import { NavBtn, Header } from './components/Layout';
import { useLedgerStats, getBaseAmt } from './hooks/useLedgerStats';
import { DebtsTab } from './pages/DebtsTab';
import { SettingsTab } from './pages/SettingsTab';
import { AnalysisTab } from './pages/AnalysisTab';
import { AssetsTab } from './pages/AssetsTab';
import { HomeTab } from './pages/HomeTab';
import { getLocalToday, getLocalMonth, addMonths, getDayOfWeek, safeNum } from './utils';


function App() {
    const [sdkReady, setSdkReady] = useState(false);
    const [needConfig, setNeedConfig] = useState(false);
    const [configInput, setConfigInput] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('home');
    const [homeFilter, setHomeFilter] = useState('all');
    
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState(DEFAULT_CATS);
    const [recurring, setRecurring] = useState([]);
    const [retirement, setRetirement] = useState({ currentAge:30, retireAge:60, monthlyExpense:30000, inflation:2 });
    const [exchangeRates, setExchangeRates] = useState(DEFAULT_RATES);
    const [monthlyBudget, setMonthlyBudget] = useState(30000);
    const [books, setBooks] = useState([]);
    const [currentBook, setCurrentBook] = useState({ id:'main', name:'日常帳本', currency:'TWD' });

    const [currentLedgerMonth, setCurrentLedgerMonth] = useState(getLocalMonth());
    const [analysisMode, setAnalysisMode] = useState('month'); 
    const [analysisType, setAnalysisType] = useState('expense');
    const [expandedCategory, setExpandedCategory] = useState(null); 
    const [expandedSubCategory, setExpandedSubCategory] = useState(null);
    
    const [modal, setModal] = useState(null); 
    const [editTarget, setEditTarget] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null); 
    
    const [txForm, setTxForm] = useState({ type:'expense', amount:'', toAmount:'', category:'', subCategory:'', accountId:'', toAccountId:'', debtor:'', date:getLocalToday(), note:'', currency:'TWD' });
    const [editingTx, setEditingTx] = useState(null);
    const [accForm, setAccForm] = useState({ name:'', type:'cash', currency:'TWD', initialBalance:'', includeInTotal: true, isArchived: false });
    const [showArchived, setShowArchived] = useState(false); 
    const [recForm, setRecForm] = useState({ name:'', type:'expense', amount:'', frequency:'monthly', month:1, day:1, accountId:'', toAccountId:'', category:'', subCategory:'', startDate: getLocalToday(), endDate:'' });
    const [retireForm, setRetireForm] = useState({});
    const [newCatForm, setNewCatForm] = useState({ name: '', type: 'expense', icon: 'tag' });
    
    const [isAdvanceSplit, setIsAdvanceSplit] = useState(false);
    const [splitData, setSplitData] = useState({ advances:[{debtor:'',amount:''}], principalAmount:'', sourceAccountId:'' });
    const [installment, setInstallment] = useState({ enabled:false, periods:3 });
    const [settleToAccount, setSettleToAccount] = useState('');
    const [settleDate, setSettleDate] = useState(getLocalToday());
    const [newMarketValue, setNewMarketValue] = useState('');
    const [holdingForm, setHoldingForm] = useState([]);
    const [editingCategoryType, setEditingCategoryType] = useState('expense');
    const [editingCategory, setEditingCategory] = useState(null);
    const [settleTargetTx, setSettleTargetTx] = useState(null);
    const [isOffset, setIsOffset] = useState(false);
    const [offsetTargetId, setOffsetTargetId] = useState('');
    const [viewingAccount, setViewingAccount] = useState(null);
    const [accountDetailMonth, setAccountDetailMonth] = useState(getLocalMonth());
    const [isReconcileMode, setIsReconcileMode] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const fileInputRef = useRef(null);
    const fbRef = useRef(null);
    const authRef = useRef(null);
    const dbRef = useRef(null);
    const appId = 'my-cloud-ledger-pro';
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const toggleReconcile = async (txId, currentStatus, e) => {
        e.stopPropagation();
        try {
            const userRef = fbRef.current.doc(dbRef.current, 'artifacts', appId, 'users', user.uid);
            await fbRef.current.updateDoc(fbRef.current.doc(userRef, 'transactions', txId), { isReconciled: !currentStatus });
        } catch (err) {
            console.error(err);
            alert('更新對帳狀態失敗');
        }
    };

    const finishReconcile = async () => {
        try {
            const userRef = fbRef.current.doc(dbRef.current, 'artifacts', appId, 'users', user.uid);
            const todayStr = getLocalToday(); 
            await fbRef.current.updateDoc(fbRef.current.doc(userRef, 'accounts', viewingAccount.id), { lastReconciledDate: todayStr });
            setViewingAccount(prev => ({ ...prev, lastReconciledDate: todayStr }));
            setIsReconcileMode(false);
            alert('✅ 對帳完成！已更新最後對帳日。');
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const init = () => {
            if (window.isFirebaseSDKReady) {
                try {
                    let cfg = window.EMBEDDED_CONFIG;
                    if (!cfg) {
                        cfg = window.__firebase_config ? JSON.parse(window.__firebase_config) : JSON.parse(localStorage.getItem('my_ledger_firebase_config'));
                    }

                    if (cfg) {
                        const app = window.FirebaseSDK.initializeApp(cfg);
                        fbRef.current = window.FirebaseSDK;
                        authRef.current = window.FirebaseSDK.getAuth(app);
                        try {
                            const db = window.FirebaseSDK.initializeFirestore(app, {
                                localCache: window.FirebaseSDK.persistentLocalCache({
                                    tabManager: window.FirebaseSDK.persistentMultipleTabManager()
                                })
                            });
                            dbRef.current = db;
                        } catch (err) {
                            dbRef.current = window.FirebaseSDK.getFirestore(app);
                            console.log('離線快取啟動失敗:', err.message);
                        }
                        setSdkReady(true);
                    } else { setNeedConfig(true); setLoading(false); }
                } catch (e) { setNeedConfig(true); setLoading(false); }
            } else setTimeout(init, 100);
        };
        init();
    }, []);

    const handleSaveConfig = () => {
        try {
            let v = configInput.trim().replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/,\s*\}/g, '}').replace(/,\s*\]/g, ']');
            if(v.includes("const")) v = v.substring(v.indexOf('{'), v.lastIndexOf('}')+1);
            const c = JSON.parse(v);
            if(!c.apiKey) throw new Error("缺少 apiKey");
            localStorage.setItem('my_ledger_firebase_config', JSON.stringify(c));
            window.location.reload();
        } catch(e) { setError({ title:"設定無效", message:e.message }); }
    };

    useEffect(() => {
        const timer = setTimeout(() => { 
            if (loading && !needConfig) { 
                setLoading(false); 
                setError({ title: "連線逾時", message: "系統連線過久，請檢查網路狀態。" }); 
            } 
        }, 15000); 
        return () => clearTimeout(timer);
    }, [loading, needConfig]);

    useEffect(() => {
        if (!sdkReady) return;
        const unsubAuth = fbRef.current.onAuthStateChanged(authRef.current, async (u) => {
            if (u) setUser(u);
            else {
                try { await fbRef.current.signInAnonymously(authRef.current); }
                catch (e) { setError({ title:"登入失敗", message: "請開啟匿名登入或檢查網域授權" }); setLoading(false); }
            }
        });
        return () => unsubAuth();
    }, [sdkReady]);

    const handleGoogleLogin = async () => { 
        try { await fbRef.current.signInWithPopup(authRef.current, new fbRef.current.GoogleAuthProvider()); } 
        catch(e) { setError({title:"登入錯誤", message:e.message}); } 
    };

    useEffect(() => {
        if (!user || !sdkReady) return;
        const userRef = fbRef.current.doc(dbRef.current, 'artifacts', appId, 'users', user.uid);
        
        const checkAutoPay = async (accs) => {
            const m = getLocalMonth();
            const cards = accs.filter(a => a.type==='credit' && a.autoPayment && a.autoPaymentAccount);
            if (cards.length === 0) return;
            const batch = fbRef.current.writeBatch(dbRef.current);
            let hasUpd = false;
            cards.forEach(c => {
                if (c.lastAutoPaymentMonth !== m && new Date().getDate() >= parseInt(c.paymentDueDay||15)) {
                    batch.set(fbRef.current.doc(fbRef.current.collection(userRef, 'transactions')), {
                        type: 'transfer', amount: 0, category: '自動繳款', accountId: c.autoPaymentAccount, toAccountId: c.id, date: getLocalToday(), bookId: 'main', note: `[系統] 卡費 (${c.name})`, createdAt: new Date().toISOString()
                    });
                    batch.update(fbRef.current.doc(userRef, 'accounts', c.id), { lastAutoPaymentMonth: m });
                    hasUpd = true;
                }
            });
            if (hasUpd) await batch.commit();
        };

        const checkRecurring = async (recs) => {
            const m = getLocalMonth();
            const todayStr = getLocalToday();
            const todayDateObj = new Date();
            const currentDay = todayDateObj.getDate();
            const currentMonth = todayDateObj.getMonth() + 1;
            
            const batch = fbRef.current.writeBatch(dbRef.current);
            let hasUpd = false;
            
            recs.forEach(r => {
                if (r.startDate && todayStr < r.startDate) return;
                if (r.endDate && todayStr > r.endDate) return;

                let shouldRun = false;
                const freq = r.frequency || 'monthly'; 

                if (freq === 'monthly') {
                    if (currentDay >= r.day) shouldRun = true;
                } else if (freq === 'yearly') {
                    if (currentMonth === parseInt(r.month) && currentDay >= r.day) shouldRun = true;
                }

                if (shouldRun && r.lastCreatedMonth !== m) {
                    const newTx = {
                        type: r.type,
                        amount: r.amount,
                        accountId: r.accountId || (accounts[0] ? accounts[0].id : ''), 
                        toAccountId: r.toAccountId || '', 
                        category: r.type === 'transfer' ? '轉帳' : (r.category || '固定收支'),
                        subCategory: r.subCategory || '',
                        date: getLocalToday(),
                        note: `[固定] ${r.name}`,
                        bookId: 'main',
                        createdAt: new Date().toISOString()
                    };
                    
                    batch.set(fbRef.current.doc(fbRef.current.collection(userRef, 'transactions')), newTx);
                    batch.update(fbRef.current.doc(userRef, 'recurring', r.id), { lastCreatedMonth: m });
                    hasUpd = true;
                }
            });
            if(hasUpd) await batch.commit();
        };

        const unsubs = [
            fbRef.current.onSnapshot(fbRef.current.collection(userRef, 'transactions'), s => {
                const docs = s.docs.map(d => ({ ...d.data(), id: d.id }));
                docs.sort((a, b) => {
                    const dateA = String(a.date || '');
                    const dateB = String(b.date || '');
                    if (dateA !== dateB) return dateB.localeCompare(dateA);
                    const timeA = String(a.createdAt || '');
                    const timeB = String(b.createdAt || '');
                    return timeB.localeCompare(timeA);
                });
                setTransactions(docs);
            }),
            fbRef.current.onSnapshot(fbRef.current.collection(userRef, 'accounts'), s => { 
                const a = s.docs.map(d=>({id:d.id,...d.data()})).sort((a, b) => (a.order || 0) - (b.order || 0)); 
                setAccounts(a); 
                checkAutoPay(a); 
            }),
            fbRef.current.onSnapshot(fbRef.current.doc(userRef, 'settings', 'config'), d => { 
                if(d.exists()) { 
                    const data = d.data();
                    if (data.categories) setCategories(data.categories); 
                    if (data.budget) setMonthlyBudget(data.budget); 
                } else fbRef.current.setDoc(fbRef.current.doc(userRef, 'settings', 'config'), { categories: DEFAULT_CATS }, {merge: true}); 
            }),
            fbRef.current.onSnapshot(fbRef.current.doc(userRef, 'settings', 'rates'), d => { 
                if(d.exists()) setExchangeRates(d.data()); 
                else fbRef.current.setDoc(fbRef.current.doc(userRef, 'settings', 'rates'), DEFAULT_RATES, {merge: true}); 
            }),
            fbRef.current.onSnapshot(fbRef.current.doc(userRef, 'settings', 'retirement'), d => { 
                if(d.exists()) setRetirement(d.data()); 
                else fbRef.current.setDoc(fbRef.current.doc(userRef, 'settings', 'retirement'), retirement, {merge: true}); 
            }),
            fbRef.current.onSnapshot(fbRef.current.collection(userRef, 'recurring'), s => {
                const r = s.docs.map(d=>({id:d.id,...d.data()}));
                setRecurring(r);
                checkRecurring(r);
            }),
            fbRef.current.onSnapshot(fbRef.current.collection(userRef, 'books'), s => {
                setBooks([{id:'main',name:'日常帳本',currency:'TWD'},...s.docs.map(d=>({id:d.id,...d.data()}))]);
            })
        ];
        setLoading(false);
        return () => unsubs.forEach(u => u());
    }, [user, sdkReady]);
    
    const autoFetchRates = async () => {
        try {
            const res = await fetch('https://script.google.com/macros/s/AKfycbxWOtO6F00m_OAu0zc1hzQn4F2BieA1ZXAF7Bv_8i5L5KfeN9kV07C_6JFH9DuJ_M4/exec');
            const data = await res.json();
            if (!data.error) {
                const newRates = { ...exchangeRates };
                let hasUpdate = false;
                CURRENCIES.forEach(c => {
                    if (data[c] && data[c] !== newRates[c]) {
                        newRates[c] = data[c];
                        hasUpdate = true;
                    }
                });
                if (hasUpdate && user) {
                    setExchangeRates(newRates);
                    fbRef.current.setDoc(fbRef.current.doc(dbRef.current, 'artifacts', appId, 'users', user.uid, 'settings', 'rates'), newRates, {merge: true});
                }
            }
        } catch(e) { console.log("自動更新匯率失敗", e); }
    };

    useEffect(() => {
        if (user && sdkReady) autoFetchRates();
    }, [user, sdkReady]); 
        
    const saveData = async (col, data, id=null) => {
        const ref = fbRef.current.doc(dbRef.current, 'artifacts', appId, 'users', user.uid);
        if (id) await fbRef.current.updateDoc(fbRef.current.doc(ref, col, id), data);
        else await fbRef.current.addDoc(fbRef.current.collection(ref, col), { ...data, createdAt: new Date().toISOString() });
    };

    const deleteData = async (col, id) => { 
        await fbRef.current.deleteDoc(fbRef.current.doc(dbRef.current, 'artifacts', appId, 'users', user.uid, col, id)); 
    };

    const getCategoryIcon = (catName, type) => {
        if(type === 'transfer') return 'arrow-right-left';
        if(type === 'advance') return 'hand-coins';
        if(type === 'repayment') return 'check-circle';
        if(type === 'transfer_in') return 'arrow-left-right'; 
        if(type === 'transfer_out') return 'arrow-right-left';
        if (!categories[type] && type!=='expense' && type!=='income') return 'tag';
        if (!categories[type]) return 'tag';
        const cat = categories[type].find(c => c.name === catName);
        return cat ? cat.icon : 'tag';
    };
    
    const getRemainingDebt = (txId) => {
        const adv = stats.advanceMap[txId];
        return adv ? adv.remaining : 0;
    };

    const handleSettle = async () => {
        if (!settleTargetTx) return;
        const batch = fbRef.current.writeBatch(dbRef.current);
        const userRef = fbRef.current.doc(dbRef.current, 'artifacts', appId, 'users', user.uid);
        const repayAmount = parseFloat(settleTargetTx.amount); 

        batch.set(fbRef.current.doc(fbRef.current.collection(userRef, 'transactions')), {
            type: 'repayment', amount: repayAmount, category: '還款', accountId: settleToAccount || accounts[0]?.id,
            relatedTxId: settleTargetTx.id, bookId: currentBook.id, date: settleDate,
            note: `收回代墊: ${settleTargetTx.debtor}`, createdAt: new Date().toISOString()
        });

        if (Math.abs(getRemainingDebt(settleTargetTx.id) - repayAmount) < 1) {
            batch.update(fbRef.current.doc(userRef, 'transactions', settleTargetTx.id), { isSettled: true });
        }
        await batch.commit();
        setModal(null);
        setSettleTargetTx(null);
    };
    
    const handleUndoRepayment = async (tx) => {
        if (!confirm(`確定要作廢這筆還款紀錄嗎？`)) return;
        try {
            const userRef = fbRef.current.doc(dbRef.current, 'artifacts', appId, 'users', user.uid);
            await fbRef.current.deleteDoc(fbRef.current.doc(userRef, 'transactions', tx.id));
            if (tx.relatedTxId) {
                const relatedRef = fbRef.current.doc(userRef, 'transactions', tx.relatedTxId);
                const snap = await fbRef.current.getDoc(relatedRef);
                if (snap.exists()) await fbRef.current.updateDoc(relatedRef, { isSettled: false });
            }
            alert("已作廢刪除！");
        } catch (e) { alert("操作失敗"); }
    };
    
    const handleVoidAdvance = async (tx) => {
        if (!confirm(`確定要作廢這筆對「${tx.debtor}」的待收嗎？`)) return;
        try {
            const userRef = fbRef.current.doc(dbRef.current, 'artifacts', appId, 'users', user.uid);
            await fbRef.current.deleteDoc(fbRef.current.doc(userRef, 'transactions', tx.id));
            alert('作廢成功！');
        } catch (e) { alert('作廢失敗'); }
    };
    
    const handleReorder = async (tx, direction) => {
        try {
            if (!accountDetailData || !accountDetailData.displayList) return;
            const list = accountDetailData.displayList;
            const idx = list.findIndex(t => t.id === tx.id);
            if (idx === -1) return;

            const targetIdx = idx + direction;
            if (targetIdx < 0 || targetIdx >= list.length) return;

            const targetTx = list[targetIdx];
            if (targetTx.date !== tx.date) { alert("只能調整同一天內的順序"); return; }

            let txTime = tx.createdAt || new Date(tx.date + 'T12:00:00.000Z').toISOString();
            let targetTime = targetTx.createdAt || new Date(targetTx.date + 'T12:00:00.000Z').toISOString();

            if (txTime === targetTime) {
                const baseTime = new Date(txTime).getTime();
                txTime = new Date(baseTime + (direction === -1 ? 1000 : -1000)).toISOString();
            } else {
                const temp = txTime; txTime = targetTime; targetTime = temp;
            }

            const batch = fbRef.current.writeBatch(dbRef.current);
            const userRef = fbRef.current.doc(dbRef.current, 'artifacts', appId, 'users', user.uid);
            batch.update(fbRef.current.doc(userRef, 'transactions', tx.id), { createdAt: txTime });
            batch.update(fbRef.current.doc(userRef, 'transactions', targetTx.id), { createdAt: targetTime });
            await batch.commit();
        } catch(e) { alert("排序發生錯誤"); }
    };
    
    // 🧠 呼叫獨立出去的大腦，拿回所有計算與統計結果
    const {
        stats, retireProgress, retirementInsight, homeInsight,
        analysisData, groupedTransactions, trendData, accountDetailData
    } = useLedgerStats({
        transactions, accounts, exchangeRates,
        currentBook, currentLedgerMonth,
        monthlyBudget, retirement,
        homeFilter, analysisMode, analysisType, categories,
        viewingAccount, accountDetailMonth
    });

    const handleTxSave = async () => { 
        let finalAmtStr = String(txForm.amount || '');
        try {
            const cleanStr = finalAmtStr.replace(/[+\-*/.]+$/, ''); 
            if (/[+\-*/]/.test(cleanStr)) {
                const result = new Function('return ' + cleanStr)();
                if (Number.isFinite(result)) finalAmtStr = result;
            }
        } catch(e) {}
        
        const amt = parseFloat(finalAmtStr);
        if (!amt) { alert('請輸入金額或完成計算'); return; }
        if (txForm.type === 'transfer') {
            if (!txForm.accountId || !txForm.toAccountId) { alert('請選擇轉出與轉入帳戶'); return; }
        } else {
            if (!txForm.accountId && !isOffset) { alert('請選擇帳戶'); return; }
        }

        let finalCategory = txForm.category;
        if (!finalCategory && txForm.type !== 'transfer') {
            if (categories[txForm.type] && categories[txForm.type].length > 0) finalCategory = categories[txForm.type][0].name;
            else finalCategory = '未分類';
        } else if (txForm.type === 'transfer') finalCategory = '轉帳';
        
        const createdAt = (editingTx && editingTx.createdAt) ? editingTx.createdAt : new Date().toISOString();
        const selectedAcc = accounts.find(a => a.id === txForm.accountId);
        const currentRate = (selectedAcc && selectedAcc.currency !== 'TWD') ? (exchangeRates[selectedAcc.currency] || 1) : 1;

        const base = { 
            ...txForm, bookId: currentBook.id, amount: amt, category: finalCategory, 
            createdAt, exchangeRate: currentRate
        };
		// 🛡️ ✅ 在這裡補上這段殺毒防呆邏輯！
        if (base.type !== 'transfer') {
            delete base.toAccountId;
            delete base.toAmount;
        }

        Object.keys(base).forEach(key => { if (base[key] === undefined) delete base[key]; });
        delete base.balanceSnapshot; delete base.change; delete base.displayType; delete base.id; 

        try {
            if (editingTx) {
                if (txForm.type === 'expense' && isAdvanceSplit) {
                    let advTotal = 0; const promises = [];
                    const cleanBase = { ...base }; delete cleanBase.id;
                    splitData.advances.forEach(a => {
                        if (a.debtor && a.amount) {
                            promises.push(saveData('transactions', { ...cleanBase, type:'advance', amount: parseFloat(a.amount), debtor: a.debtor, isSettled: false, note: `代墊: ${txForm.note}`, createdAt: new Date().toISOString() }));
                            advTotal += parseFloat(a.amount);
                        }
                    });
                    promises.push(saveData('transactions', { ...cleanBase, amount: amt - advTotal }, editingTx.id));
                    await Promise.all(promises);
                } else {
                    const cleanBase = { ...base }; delete cleanBase.id;
                    await saveData('transactions', cleanBase, editingTx.id);
                }
                setModal(null); setEditingTx(null); return;
            }

            if (isOffset && offsetTargetId) {
                await saveData('transactions', { ...base, accountId: OFFSET_ACCOUNT_ID, note: `抵扣: ${txForm.note}` }); 
                await saveData('transactions', { type: 'repayment', amount: amt, accountId: OFFSET_ACCOUNT_ID, relatedTxId: offsetTargetId, date: txForm.date, bookId: currentBook.id, note: `抵扣支出 (${finalCategory})`, createdAt: new Date().toISOString() }); 
                setModal(null); return;
            }

            if (txForm.type === 'expense' && installment.enabled) {
                const p = parseInt(installment.periods);
                const per = Math.round(amt / p);
                const promises = []; 
                for (let i = 0; i < p; i++) {
                    promises.push(saveData('transactions', { ...base, amount: (i===0?amt-(per*p)+per:per), date: addMonths(txForm.date, i), note: `${txForm.note} (${i+1}/${p})`, createdAt: new Date().toISOString() }));
                }
                await Promise.all(promises); 
            } else if (txForm.type === 'expense' && isAdvanceSplit) {
                let advTotal = 0; const promises = []; 
                splitData.advances.forEach(a => {
                    if (a.debtor && a.amount) {
                        promises.push(saveData('transactions', { ...base, type:'advance', amount: parseFloat(a.amount), debtor: a.debtor, isSettled: false, note: `代墊: ${txForm.note}`, createdAt: new Date().toISOString() }));
                        advTotal += parseFloat(a.amount);
                    }
                });
                if (amt - advTotal > 0) promises.push(saveData('transactions', { ...base, amount: amt - advTotal, createdAt: new Date().toISOString() }));
                await Promise.all(promises); 
            } else if (txForm.type === 'income' && isAdvanceSplit) {
                const principal = parseFloat(splitData.principalAmount) || 0;
                const gain = amt - principal;
                const promises = [];
                if (principal > 0) promises.push(saveData('transactions', { ...base, type: 'transfer', amount: principal, category: '轉帳', accountId: splitData.sourceAccountId, toAccountId: txForm.accountId, note: `投資本金`, createdAt: new Date().toISOString() }));
                if (gain !== 0) promises.push(saveData('transactions', { ...base, type: 'income', amount: gain, category: txForm.category || '投資', note: `投資獲利`, createdAt: new Date().toISOString() }));
                
                if (splitData.sourceAccountId && splitData.sellSymbol && parseFloat(splitData.sellQty) > 0) {
                    const srcAcc = accounts.find(a => a.id === splitData.sourceAccountId);
                    if (srcAcc && srcAcc.holdings) {
                        const sellQty = parseFloat(splitData.sellQty);
                        let updatedMarketValue = 0;
                        const updatedHoldings = srcAcc.holdings.map(h => {
                            if (h.symbol === splitData.sellSymbol) {
                                const newQty = Math.max(0, (parseFloat(h.qty) || 1) - sellQty);
                                const newPrice = newQty > 0 ? ((parseFloat(h.price) || 0) * (newQty / (parseFloat(h.qty) || 1))).toFixed(2) : 0;
                                updatedMarketValue += parseFloat(newPrice);
                                return { ...h, qty: newQty.toString(), price: newPrice.toString() };
                            }
                            updatedMarketValue += (parseFloat(h.price) || 0);
                            return h;
                        });
                        promises.push(fbRef.current.updateDoc(fbRef.current.doc(dbRef.current, 'artifacts', appId, 'users', user.uid, 'accounts', srcAcc.id), {
                            holdings: updatedHoldings, marketValue: updatedMarketValue
                        }));
                    }
                }
                await Promise.all(promises);
            } else {
                await saveData('transactions', base);
            }
            setModal(null);
        } catch (e) { alert("儲存失敗"); }
    };

    const handleRecurringSave = async () => {
        if(!recForm.name || !recForm.amount) { alert("請輸入名稱與金額"); return; }
        const userRef = fbRef.current.doc(dbRef.current, 'artifacts', appId, 'users', user.uid);
        const { id, ...data } = recForm;
        if (recForm.id) await fbRef.current.updateDoc(fbRef.current.doc(userRef, 'recurring', recForm.id), data);
        else await fbRef.current.addDoc(fbRef.current.collection(userRef, 'recurring'), { ...data, createdAt: new Date().toISOString() });
        setRecForm({ name:'', type:'expense', amount:'', frequency:'monthly', month:1, day:1, accountId:'', toAccountId:'', category:'', subCategory:'', startDate: getLocalToday(), endDate:'' });
    };
    
    const handleAddSubCategory = (mainCat, sub) => {
        if (!sub) return;
        const newCats = { ...categories };
        const catIndex = newCats[editingCategoryType].findIndex(c => c.name === mainCat);
        if (catIndex > -1) {
            const targetCat = { ...newCats[editingCategoryType][catIndex] };
            if (!targetCat.subs.includes(sub)) {
                targetCat.subs = [...targetCat.subs, sub]; 
                newCats[editingCategoryType][catIndex] = targetCat;
                setCategories(newCats);
                setEditingCategory(targetCat); 
            }
        }
    };

    const handleDeleteSubCategory = (mainCat, sub) => {
        const newCats = { ...categories };
        const catIndex = newCats[editingCategoryType].findIndex(c => c.name === mainCat);
        if (catIndex > -1) {
            const targetCat = { ...newCats[editingCategoryType][catIndex] };
            targetCat.subs = targetCat.subs.filter(s => s !== sub);
            newCats[editingCategoryType][catIndex] = targetCat;
            setCategories(newCats);
            setEditingCategory(targetCat); 
        }
    };

    const handleSaveCategoryChanges = async () => {
        await saveData('settings', { categories: categories }, 'config');
        setModal(null); 
    };

    const handleVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return alert("您的瀏覽器不支援語音輸入 (請使用 Chrome 或 Safari)");
        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-TW'; recognition.interimResults = false; recognition.maxAlternatives = 1;
        recognition.start();
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            let processedText = transcript.replace(/一/g, '1').replace(/二/g, '2').replace(/三/g, '3').replace(/四/g, '4').replace(/五/g, '5').replace(/六/g, '6').replace(/七/g, '7').replace(/八/g, '8').replace(/九/g, '9').replace(/十/g, '10').replace(/百/g, '00');
            const amountMatch = processedText.match(/[\d\.]+/); 
            const amount = amountMatch ? amountMatch[0] : '';
            let note = transcript.replace(amountMatch ? amountMatch[0] : '', '').replace(/元|塊/g, '').trim();
            let matchedCategory = txForm.category; let matchedSubCategory = '';
            const keywordMap = { '飲食': ['吃', '飯', '麵', '餐', '喝', '飲料', '全聯', '7-11', '便當'], '交通': ['車', '油', '捷運', '高鐵', '悠 ময়卡', '加油'], '購物': ['買', '蝦皮', '衣服', '鞋', '衛生紙'], '娛樂': ['電影', '遊戲', '玩', 'Netflix'], '居住': ['電費', '水費', '房租', '瓦斯'] };
            if (categories[txForm.type]) {
                for (const cat of categories[txForm.type]) {
                    if (note.includes(cat.name) || (keywordMap[cat.name] && keywordMap[cat.name].some(k => note.includes(k)))) { matchedCategory = cat.name; break; }
                    if (cat.subs) { const sub = cat.subs.find(s => note.includes(s)); if (sub) { matchedCategory = cat.name; matchedSubCategory = sub; break; } }
                }
            }
            setTxForm(prev => ({ ...prev, amount: amount || prev.amount, category: matchedCategory, subCategory: matchedSubCategory, note: note || prev.note }));
        };
    };

    const handleAccSubmit = async (e) => { 
        e.preventDefault(); if (!accForm.name) return; 
        const userRef = fbRef.current.doc(dbRef.current, 'artifacts', appId, 'users', user.uid); 
        const accountData = { ...accForm, order: editTarget ? editTarget.order : accounts.length }; 
        if (editTarget) await fbRef.current.updateDoc(fbRef.current.doc(userRef, 'accounts', editTarget.id), accountData); 
        else await fbRef.current.addDoc(fbRef.current.collection(userRef, 'accounts'), { ...accountData, createdAt: new Date().toISOString() }); 
        setModal(null); 
    };

    const handleSort = async () => { 
        if (dragItem.current === null || dragOverItem.current === null) return; 
        const _accounts = [...accounts]; 
        const draggedItemContent = _accounts[dragItem.current]; 
        _accounts.splice(dragItem.current, 1); 
        _accounts.splice(dragOverItem.current, 0, draggedItemContent); 
        dragItem.current = null; dragOverItem.current = null; setAccounts(_accounts); 
        const batch = fbRef.current.writeBatch(dbRef.current); 
        const userRef = fbRef.current.doc(dbRef.current, 'artifacts', appId, 'users', user.uid); 
        _accounts.forEach((acc, index) => batch.update(fbRef.current.doc(userRef, 'accounts', acc.id), { order: index })); 
        await batch.commit(); 
    };
    
    const handleUpdateMarketValue = async () => { 
        if (!editTarget) return; 
        let finalMarketValue = parseFloat(newMarketValue) || 0;
        if (holdingForm.length > 0) finalMarketValue = holdingForm.reduce((sum, h) => sum + (parseFloat(h.price)||0), 0);
        await fbRef.current.updateDoc(fbRef.current.doc(dbRef.current, 'artifacts', appId, 'users', user.uid, 'accounts', editTarget.id), { marketValue: finalMarketValue, holdings: holdingForm, customRate: null }); 
        setModal(null); 
    };

    const handleBudgetSubmit = (val) => { setMonthlyBudget(val); saveData('settings', { budget: parseFloat(val) }, 'config'); };
    const handleAddCategory = () => { if(!newCatForm.name) return; const newCats = {...categories}; newCats[newCatForm.type].push({ name: newCatForm.name, icon: newCatForm.icon, subs: [] }); setCategories(newCats); saveData('settings', {categories: newCats}, 'config'); };
    const handleDeleteCategory = (catName) => { const newCats = {...categories}; newCats[editingCategoryType] = newCats[editingCategoryType].filter(c => c.name !== catName); setCategories(newCats); saveData('settings', {categories: newCats}, 'config'); };
    const handleRatesSubmit = () => { saveData('settings', exchangeRates, 'rates'); setModal(null); };
    const updateAdvanceRow = (index, field, value) => { const newAdvances = [...splitData.advances]; newAdvances[index][field] = value; setSplitData({...splitData, advances: newAdvances}); };
    const addAdvanceRow = () => { setSplitData({...splitData, advances: [...splitData.advances, { debtor: '', amount: '' }]}); };
    const removeAdvanceRow = (index) => { if (splitData.advances.length <= 1) return; const newAdvances = splitData.advances.filter((_, i) => i !== index); setSplitData({...splitData, advances: newAdvances}); };
    const handleRetireSubmit = (e) => { e.preventDefault(); saveData('settings', retireForm, 'retirement'); setModal(null); };

    const openTxModal = (type = 'expense', existingTx = null) => {
        // ...上面的程式碼不變...
        if (existingTx) { 
            // ...編輯模式的程式碼不變...
        } else { 
            setEditingTx(null); 
            setTxForm({ 
                type, 
                category: categories[type]?.[0]?.name || '', 
                subCategory: '', 
                accountId: viewingAccount?.id || accounts[0]?.id || '', 
                toAccountId: '', // ✨ 確保目的帳戶被清空
                toAmount: '',    // ✨ 確保轉帳金額被清空
                amount: '', 
                note: '', 
                date: getLocalToday(),
                currency: 'TWD',
                debtor: ''
            }); 
            
            setIsAdvanceSplit(false); setIsOffset(false); setSplitData({ advances:[{debtor:'',amount:''}], principalAmount:'', sourceAccountId:'' }); 
        } 
        setModal('tx');
    };
    
    const changeMonthStep = (step) => { const [y, m] = currentLedgerMonth.split('-').map(Number); const date = new Date(y, m - 1 + step, 1); setCurrentLedgerMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`); };
    const changeDetailMonthStep = (step) => { const [y, m] = accountDetailMonth.split('-').map(Number); const date = new Date(y, m - 1 + step, 1); setAccountDetailMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`); };
    const handleEditMainCategoryName = async (newName) => { if (!newName || !editingCategory) return; const newCats = { ...categories }; const catIdx = newCats[editingCategoryType].findIndex(c => c.name === editingCategory.name); if (catIdx > -1) { newCats[editingCategoryType][catIdx].name = newName; setCategories(newCats); setEditingCategory(newCats[editingCategoryType][catIdx]); } };
    const handleEditMainCategoryIcon = async (newIcon) => { if (!editingCategory) return; const newCats = { ...categories }; const catIdx = newCats[editingCategoryType].findIndex(c => c.name === editingCategory.name); if (catIdx > -1) { newCats[editingCategoryType][catIdx].icon = newIcon; setCategories(newCats); setEditingCategory(newCats[editingCategoryType][catIdx]); } }; 
    const openAccModalCorrect = (acc = null) => { if (acc) { setEditTarget(acc); setAccForm({ name: acc.name, type: acc.type, currency: acc.currency || 'TWD', initialBalance: acc.initialBalance || '', includeInTotal: acc.includeInTotal !== false, isArchived: acc.isArchived || false, closingDay: acc.closingDay || '27', paymentDueDay: acc.paymentDueDay || '15', autoPaymentAccount: acc.autoPaymentAccount || '', holidayAdjustment: acc.holidayAdjustment || 'defer', autoPayment: acc.autoPayment || false }); } else { setEditTarget(null); setAccForm({ name: '', type: 'cash', currency: 'TWD', initialBalance: '', includeInTotal: true, isArchived: false, closingDay: '27', paymentDueDay: '15', autoPaymentAccount: '', holidayAdjustment: 'defer', autoPayment: false }); } setModal('acc'); };       
    
    const handleExport = () => {
        if (transactions.length === 0) return alert("目前沒有交易紀錄可匯出");
        const currentYear = new Date().getFullYear().toString();
        const exportYear = window.prompt("請輸入要匯出的年份 (例如: 2024)\n若要匯出「全部紀錄」，請清空輸入框並按確定：", currentYear);
        if (exportYear === null) return;
        const filteredTransactions = exportYear.trim() !== "" ? transactions.filter(t => String(t.date).startsWith(exportYear.trim())) : transactions;
        if (filteredTransactions.length === 0) return alert(`找不到 ${exportYear} 年的交易紀錄`);

        const data = filteredTransactions.map(t => {
            const acc = accounts.find(a => a.id === t.accountId);
            const toAcc = t.toAccountId ? accounts.find(a => a.id === t.toAccountId) : null;
            let typeName = '支出';
            if (t.type === 'income') typeName = '收入';
            else if (t.type === 'transfer') typeName = '轉帳';
            else if (t.type === 'advance') typeName = '代墊';
            else if (t.type === 'repayment') typeName = '還款';

            return {
                '日期': t.date, '類型': typeName, '金額': parseFloat(t.amount), '主類別': t.category, '子類別': t.subCategory || '',
                '帳戶': acc ? acc.name : '未知', '轉入帳戶': toAcc ? toAcc.name : '', '轉入金額': t.toAmount || '',
                '備註': t.note || '', '代墊對象': t.debtor || ''
            };
        });

        const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = [{wch: 12}, {wch: 6}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 15}, {wch: 15}, {wch: 10}, {wch: 20}, {wch: 10}];
        XLSX.utils.book_append_sheet(wb, ws, "交易紀錄");
        XLSX.writeFile(wb, `雲端帳本_${exportYear.trim() !== "" ? `${exportYear}年` : '全部'}_${getLocalToday()}.xlsx`);
    }; 

    const handleImportClick = () => { if (fileInputRef.current) fileInputRef.current.click(); };
    const handleImportFile = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result; const wb = XLSX.read(bstr, { type: 'binary' });
                const wsName = wb.SheetNames.includes("交易紀錄") ? "交易紀錄" : wb.SheetNames[0];
                const jsonData = XLSX.utils.sheet_to_json(wb.Sheets[wsName], { raw: false });
                if (!jsonData || jsonData.length === 0) { alert("檔案內容為空"); setIsImporting(false); return; }

                const batch = fbRef.current.writeBatch(dbRef.current);
                const userRef = fbRef.current.doc(dbRef.current, 'artifacts', appId, 'users', user.uid);
                const txCol = fbRef.current.collection(userRef, 'transactions');
                let importCount = 0; const normalize = (str) => String(str || '').replace(/\s+/g, '').toLowerCase();

                jsonData.forEach(row => {
                    let rawDate = row['日期']; let date = ''; if (!rawDate) return; 
                    if (typeof rawDate === 'number') {
                        const excelDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
                        date = `${excelDate.getFullYear()}-${String(excelDate.getMonth() + 1).padStart(2, '0')}-${String(excelDate.getDate()).padStart(2, '0')}`;
                    } else {
                        try { let d = new Date(rawDate); if (isNaN(d.getTime())) d = new Date(); date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; } catch (e) { return; }
                    }
                    const amount = parseFloat(row['金額']); const toAmount = parseFloat(row['轉入金額']) || ''; 
                    const category = row['主類別'] || '未分類'; const subCategory = row['子類別'] || ''; const note = row['備註'] || '';
                    if (!date || isNaN(amount)) return;

                    let type = 'expense';
                    if (row['類型'] === '收入') type = 'income'; else if (row['類型'] === '轉帳') type = 'transfer'; else if (row['類型'] === '代墊') type = 'advance'; else if (row['類型'] === '還款') type = 'repayment';
                    
                    const acc = accounts.find(a => normalize(a.name) === normalize(String(row['帳戶'] || '')));
                    const accountId = acc ? acc.id : (accounts[0]?.id || ''); 
                    let toAccountId = '';
                    if (type === 'transfer' && row['轉入帳戶']) {
                        const toAcc = accounts.find(a => normalize(a.name) === normalize(String(row['轉入帳戶'] || '')));
                        if (toAcc) toAccountId = toAcc.id;
                    }
                    batch.set(fbRef.current.doc(txCol), { date, amount, toAmount, type, category, subCategory, accountId, toAccountId, note: note + (acc ? '' : ' (匯入:未知帳戶)'), debtor: row['代墊對象'] || '', createdAt: new Date().toISOString() });
                    importCount++;
                });
                await batch.commit(); alert(`成功匯入 ${importCount} 筆交易！`);
            } catch (err) { alert("匯入失敗"); } finally { setIsImporting(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
        };
        reader.readAsBinaryString(file);
    };

    if (needConfig) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
                <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-xl">
                    <div className="flex justify-center mb-6 text-stone-800"><Icon name="settings" size={48}/></div>
                    <h2 className="text-xl font-bold text-center mb-4">輸入 Firebase 設定</h2>
                    <textarea className="w-full h-48 p-4 bg-stone-50 rounded-xl text-xs font-mono mb-4 border" placeholder='{ "apiKey": "..." }' value={configInput} onChange={e=>setConfigInput(e.target.value)}/>
                    <button onClick={handleSaveConfig} className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold">儲存</button>
                </div>
            </div>
        );
    }
    
    if (!sdkReady || loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-stone-50">
                <Icon name="loader-2" className="animate-spin text-stone-500" size={40}/>
            </div>
        );
    }

    const safeBudget = monthlyBudget ? parseFloat(monthlyBudget) : 0;
    const safeRetireAge = (retirement && retirement.retireAge) ? retirement.retireAge : 60;
    const safeRetireExpense = (retirement && retirement.monthlyExpense) ? parseFloat(retirement.monthlyExpense) : 30000;

    return (
        <div className="min-h-screen pb-24 max-w-xl mx-auto bg-stone-50 relative">
            
            {viewingAccount ? (
                <div className="animate-in slide-in-from-right">
                    <header className="sticky top-0 z-20 bg-white border-b border-stone-100 px-6 py-4 flex justify-between items-center shadow-sm">
                        <button onClick={()=>{setViewingAccount(null); setIsReconcileMode(false);}} className="p-2 bg-stone-100 rounded-lg hover:bg-stone-200"><Icon name="arrow-left" className="text-stone-600"/></button>
                        <h1 className="font-bold text-lg text-stone-800">{viewingAccount.name} <span className="text-xs text-stone-400 opacity-75">{viewingAccount.currency}</span></h1>
                        <div className="w-10"></div>
                    </header>
                    
                    <div className="p-4 space-y-4">
                        <div className="flex flex-col bg-white rounded-xl p-2 shadow-sm border border-stone-200">
                            <div className="flex items-center justify-between w-full">
                                <button onClick={()=>changeDetailMonthStep(-1)} className="p-2 hover:bg-stone-50 rounded-lg text-stone-400"><Icon name="chevron-left"/></button>
                                <div className="text-center">
                                    <div className="font-bold text-stone-800 text-lg">{accountDetailMonth.replace('-','年 ')}月</div>
                                    {accountDetailData && accountDetailData.cycleRange && (
                                        <div className="text-[10px] text-stone-400 font-bold bg-stone-100 px-2 py-0.5 rounded-full mt-1">
                                            帳單週期: {accountDetailData.cycleRange}
                                        </div>
                                    )}
                                </div>
                                <button onClick={()=>changeDetailMonthStep(1)} className="p-2 hover:bg-stone-50 rounded-lg text-stone-400"><Icon name="chevron-right"/></button>
                            </div>
                        </div>
                        
                        <div className="bg-stone-800 rounded-xl p-6 text-white shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs text-stone-400 mb-1">當前餘額</p>
                                    <h2 className="text-3xl font-black tabular-nums">${safeNum(accountDetailData && accountDetailData.currentBalance)}</h2>
                                </div>
                                
                                {viewingAccount.type === 'credit' && (
                                    <button
                                        onClick={() => {
                                            const defaultBank = accounts.find(a => a.name.includes('永豐') && !a.isArchived) 
                                                                    || accounts.find(a => a.type === 'bank' && !a.isArchived)
                                                                    || accounts.find(a => a.type === 'cash' && !a.isArchived);
                                            let billAmount = 0;
                                            if (accountDetailData && accountDetailData.displayList && accountDetailData.displayList.length > 0) {
                                                billAmount = Math.abs(accountDetailData.displayList[0].balanceSnapshot);
                                            }
                                            setTxForm({
                                                type: 'transfer', amount: billAmount, accountId: defaultBank ? defaultBank.id : '', toAccountId: viewingAccount.id, 
                                                category: '轉帳', subCategory: '', date: getLocalToday(), note: `信用卡繳款 (${accountDetailMonth})`, bookId: currentBook.id
                                            });
                                            setModal('tx');
                                        }}
                                        className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 border border-white/20"
                                    >
                                        <Icon name="check-circle" size={16} className="text-emerald-400" /> 一鍵繳款
                                    </button>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="bg-white/10 p-2 rounded"><p className="text-stone-400 mb-1">收入</p><p className="font-bold text-emerald-400">+${safeNum(accountDetailData && accountDetailData.stats.mIncome)}</p></div>
                                <div className="bg-white/10 p-2 rounded"><p className="text-stone-400 mb-1">支出</p><p className="font-bold text-rose-400">-${safeNum(accountDetailData && accountDetailData.stats.mExpense)}</p></div>
                                <div className="bg-white/10 p-2 rounded"><p className="text-stone-400 mb-1">轉帳</p><p className={`font-bold ${accountDetailData && accountDetailData.stats.mTrans >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{accountDetailData && accountDetailData.stats.mTrans > 0 ? '+' : ''}{safeNum(accountDetailData && accountDetailData.stats.mTrans)}</p></div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                                <div className="text-xs text-white/60 flex items-center gap-1">
                                    <Icon name="calendar-check" size={14}/> 最後對帳: {viewingAccount.lastReconciledDate || '尚未對帳'}
                                </div>
                                {isReconcileMode ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsReconcileMode(false)} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">取消</button>
                                        <button onClick={finishReconcile} className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"><Icon name="check" size={14}/>完成對帳</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsReconcileMode(true)} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"><Icon name="check-square" size={14}/>開啟對帳</button>
                                )}
                            </div>
                        </div>
                        
                        <TransactionList 
                         accountDetailData={accountDetailData}
                         isReconcileMode={isReconcileMode}
                         openTxModal={openTxModal}
                         toggleReconcile={toggleReconcile}
                         getCategoryIcon={getCategoryIcon}
                         handleReorder={handleReorder}
                         deleteData={deleteData}
                        />
                        <button onClick={() => openTxModal('expense')} className="fixed bottom-8 right-6 bg-rose-500 text-white p-4 rounded-full shadow-xl z-30 transition-transform active:scale-95 border-4 border-stone-50"><Icon name="plus" size={32} /></button>
                    </div>
                </div>
            ) : (
                <React.Fragment>
				<Header currentBook={currentBook} setIsBookSelectOpen={()=>setModal('bookSelect')} user={user} handleGoogleLogin={handleGoogleLogin} />
                    
                    <main className="p-4 space-y-6">
                        {activeTab === 'home' && (
                            <HomeTab
                                currentLedgerMonth={currentLedgerMonth}
                                changeMonthStep={changeMonthStep}
                                homeFilter={homeFilter}
                                setHomeFilter={setHomeFilter}
                                transactions={transactions}
                                currentBook={currentBook}
                                accounts={accounts}
                                exchangeRates={exchangeRates}
                                stats={stats}
                                monthlyBudget={monthlyBudget}
                                groupedTransactions={groupedTransactions}
                                openTxModal={openTxModal}
                                deleteData={deleteData}
                                getCategoryIcon={getCategoryIcon}
                                handleUndoRepayment={handleUndoRepayment}
                            />
                        )}

                        {activeTab === 'assets' && (
                            <AssetsTab
                                stats={stats} retireProgress={retireProgress} retirementInsight={retirementInsight} 
                                retirement={retirement} recurring={recurring} accounts={accounts} exchangeRates={exchangeRates} 
                                transactions={transactions} trendData={trendData} analysisData={analysisData}
                                setEditTarget={setEditTarget} setAccForm={setAccForm} setModal={setModal} 
                                setViewingAccount={setViewingAccount} setAccountDetailMonth={setAccountDetailMonth} 
                                currentLedgerMonth={currentLedgerMonth} dragItem={dragItem} dragOverItem={dragOverItem} 
                                handleSort={handleSort} openAccModalCorrect={openAccModalCorrect} deleteData={deleteData}
                                setHoldingForm={setHoldingForm} setNewMarketValue={setNewMarketValue} 
                                showArchived={showArchived} setShowArchived={setShowArchived}
                            />
                        )}

                        {activeTab === 'settings' && (
                            <SettingsTab 
                                monthlyBudget={monthlyBudget}
                                retirement={retirement}
                                setModal={setModal}
                                setRetireForm={setRetireForm}
                                setRecForm={setRecForm}
                                handleExport={handleExport}
                                handleImportClick={handleImportClick}
                                handleImportFile={handleImportFile}
                                fileInputRef={fileInputRef}
                                isImporting={isImporting}
                            />
                        )}

                        {activeTab === 'analysis' && (
                            <AnalysisTab
                                currentLedgerMonth={currentLedgerMonth} setCurrentLedgerMonth={setCurrentLedgerMonth}
                                changeMonthStep={changeMonthStep} analysisMode={analysisMode} setAnalysisMode={setAnalysisMode}
                                analysisType={analysisType} setAnalysisType={setAnalysisType}
                                analysisData={analysisData} trendData={trendData}
                                expandedCategory={expandedCategory} setExpandedCategory={setExpandedCategory}
                                expandedSubCategory={expandedSubCategory} setExpandedSubCategory={setExpandedSubCategory}
                                openTxModal={openTxModal} accounts={accounts} exchangeRates={exchangeRates}
                            />
                        )}

                            {activeTab === 'debts' && (
                              <DebtsTab 
                                  stats={stats}
                                  transactions={transactions}
                                  getRemainingDebt={getRemainingDebt}
                                  setSettleTargetTx={setSettleTargetTx}
                                  setSettleDate={setSettleDate}
                                  setModal={setModal}
                                  handleVoidAdvance={handleVoidAdvance}
                              />
                            )}
                            
                        </main>
                        
                        <nav className="fixed bottom-0 w-full bg-white border-t border-stone-200 px-6 py-3 flex justify-between z-[100] pb-safe max-w-xl mx-auto left-0 right-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <NavBtn icon={<Icon name="home"/>} label="帳本" active={activeTab==='home'} onClick={()=>setActiveTab('home')}/>
                            <NavBtn icon={<Icon name="pie-chart"/>} label="分析" active={activeTab==='analysis'} onClick={()=>setActiveTab('analysis')}/>
                            <NavBtn icon={<Icon name="credit-card"/>} label="待收" active={activeTab==='debts'} onClick={()=>setActiveTab('debts')}/>
                            <NavBtn icon={<Icon name="landmark"/>} label="帳戶" active={activeTab==='assets'} onClick={()=>setActiveTab('assets')}/>
                            <NavBtn icon={<Icon name="settings"/>} label="設定" active={activeTab==='settings'} onClick={()=>setActiveTab('settings')}/>
                        </nav>
                        
                        {activeTab === 'home' && (
                            <button onClick={()=>openTxModal('expense')} className="fixed bottom-24 right-6 bg-gradient-to-r from-orange-500 to-rose-500 text-white p-4 rounded-full shadow-lg z-[100] transition-transform active:scale-95 border-2 border-white">
                                <Icon name="plus" size={32}/>
                            </button>
                        )}
                </React.Fragment>
            )}

            {modal === 'tx' && (
             <TransactionModal
                 txForm={txForm} setTxForm={setTxForm}
                 categories={categories} accounts={accounts} exchangeRates={exchangeRates} stats={stats}
                 isOffset={isOffset} setIsOffset={setIsOffset} offsetTargetId={offsetTargetId} setOffsetTargetId={setOffsetTargetId}
                 installment={installment} setInstallment={setInstallment}
                 isAdvanceSplit={isAdvanceSplit} setIsAdvanceSplit={setIsAdvanceSplit} splitData={splitData} setSplitData={setSplitData}
                 updateAdvanceRow={updateAdvanceRow} removeAdvanceRow={removeAdvanceRow} addAdvanceRow={addAdvanceRow}
                 handleVoiceInput={handleVoiceInput} handleTxSave={handleTxSave}
                 setModal={setModal} setEditingCategory={setEditingCategory} setEditingCategoryType={setEditingCategoryType}
             />
            )}
            
            {modal === 'acc' && (
             <AccountModal
                 editTarget={editTarget}
                 accForm={accForm}
                 setAccForm={setAccForm}
                 handleAccSubmit={handleAccSubmit}
                 setModal={setModal}
             />
            )}                   
            
            {modal === 'recurring' && (
                <RecurringModal
                    recForm={recForm}
                    setRecForm={setRecForm}
                    accounts={accounts}
                    categories={categories}
                    recurring={recurring}
                    setModal={setModal}
                    handleRecurringSave={handleRecurringSave}
                    deleteData={deleteData}
                />
            )}
            
            {modal === 'bookSelect' && (
                <div className="fixed inset-0 z-[200] bg-black/50 flex items-end justify-center p-4">
                    <div className="bg-white w-full max-w-sm p-6 rounded-t-2xl">
                        <h3 className="font-bold text-xl mb-4 text-stone-800">切換帳本</h3>
                        <button onClick={()=>setModal('addBook')} className="w-full py-3 bg-stone-100 rounded-xl font-bold mb-2 text-stone-600">+ 新增帳本</button>
                        {books.map(b=><button key={b.id} onClick={()=>{setCurrentBook(b);setModal(null)}} className={`w-full py-3 text-left border-b font-bold ${currentBook.id===b.id?'text-rose-500':'text-stone-600'}`}>{b.name}</button>)}
                        <button onClick={()=>setModal(null)} className="w-full py-3 mt-4 text-stone-400">取消</button>
                    </div>
                </div>
            )}
            
            {modal === 'addBook' && (
                <div className="fixed inset-0 z-[210] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm p-6 rounded-2xl">
                        <h3 className="font-bold text-xl mb-4 text-stone-800">新增旅遊帳本</h3>
                        <input className="w-full p-3 bg-stone-50 rounded-lg mb-4 border border-stone-200" placeholder="名稱" id="newBookName"/>
                        <button onClick={()=>{saveData('books', {name: document.getElementById('newBookName').value, currency:'TWD'});setModal(null);}} className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold shadow-lg">建立</button>
                        <button onClick={()=>setModal(null)} className="w-full mt-2 text-stone-400">取消</button>
                    </div>
                </div>
            )}
            
            {modal === 'budget' && (
                <BudgetModal 
                    monthlyBudget={monthlyBudget} 
                    setMonthlyBudget={setMonthlyBudget} 
                    handleBudgetSubmit={handleBudgetSubmit} 
                    setModal={setModal} 
                />
            )}            
            {modal === 'retire' && (
                <RetireModal retireForm={retireForm} setRetireForm={setRetireForm} saveData={saveData} setModal={setModal} />
            )}                    
            
            {modal === 'cat' && (
                <CategoryListModal 
                    categories={categories} editingCategoryType={editingCategoryType} setEditingCategoryType={setEditingCategoryType}
                    setEditingCategory={setEditingCategory} setModal={setModal} newCatForm={newCatForm} 
                    setNewCatForm={setNewCatForm} handleAddCategory={handleAddCategory}
                />
            )}
            
            {modal === 'editCat' && editingCategory && (
                <CategoryEditModal 
                    editingCategory={editingCategory} handleEditMainCategoryName={handleEditMainCategoryName} 
                    handleEditMainCategoryIcon={handleEditMainCategoryIcon} handleDeleteSubCategory={handleDeleteSubCategory} 
                    handleAddSubCategory={handleAddSubCategory} handleDeleteCategory={handleDeleteCategory}
                    handleSaveCategoryChanges={handleSaveCategoryChanges} setModal={setModal}
                />
            )}
            {modal === 'rate' && (
                <ExchangeRateModal exchangeRates={exchangeRates} setExchangeRates={setExchangeRates} setModal={setModal} handleRatesSubmit={handleRatesSubmit} />
            )}

            {modal === 'market' && (
                <MarketValueModal 
                    editTarget={editTarget} holdingForm={holdingForm} setHoldingForm={setHoldingForm} 
                    newMarketValue={newMarketValue} setNewMarketValue={setNewMarketValue} 
                    exchangeRates={exchangeRates} handleUpdateMarketValue={handleUpdateMarketValue} setModal={setModal} 
                />
            )}

            {modal === 'settle' && (
                <SettleModal 
                    settleTargetTx={settleTargetTx} settleDate={settleDate} setSettleDate={setSettleDate} 
                    settleToAccount={settleToAccount} setSettleToAccount={setSettleToAccount} 
                    accounts={accounts} handleSettle={handleSettle} setModal={setModal} 
                />
            )}                       
            
            {/* 這是最後一個 Modal (收回代墊) 的結尾 */}
                
                    </div> 
                );
            } 

export default App;