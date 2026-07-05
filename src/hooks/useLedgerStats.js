import { useMemo } from 'react';
// 引入常數 (請確認 ../constants 路徑正確，若是同一層請改為 ./constants)
import { CATEGORY_COLORS, FALLBACK_COLORS, OFFSET_ACCOUNT_ID } from '../constants'; 

// 共用工具：計算基礎幣別金額
export const getBaseAmt = (tx, accs, rates) => {
    const amt = parseFloat(tx.amount) || 0;
    const acc = accs.find(a => a.id === tx.accountId);
    if (!acc || !acc.currency || acc.currency === 'TWD') return amt;
    const appliedRate = tx.exchangeRate || rates[acc.currency] || 1;
    return amt * appliedRate;
};

export const useLedgerStats = ({
    transactions, accounts, exchangeRates,
    currentBook, currentLedgerMonth,
    monthlyBudget, retirement,
    homeFilter, analysisMode, analysisType, categories,
    viewingAccount, accountDetailMonth
}) => {

    // 1. 核心資產與餘額計算
    const stats = useMemo(() => {
        const bals = {}; 
        accounts.forEach(a => {
            let init = parseFloat(a.initialBalance) || 0;
            if ((a.type === 'credit' || a.type === 'payable') && init > 0) init = -init;
            bals[a.id] = init;
        });
        const advanceMap = {}; 
        transactions.forEach(t => { if (t.type === 'advance') advanceMap[t.id] = { ...t, repaid: 0, remaining: parseFloat(t.amount) }; });
        transactions.forEach(t => { 
            if (t.type === 'repayment' && t.relatedTxId && advanceMap[t.relatedTxId]) { 
                const repaidAmt = parseFloat(t.amount); 
                advanceMap[t.relatedTxId].repaid += repaidAmt; 
                advanceMap[t.relatedTxId].remaining -= repaidAmt; 
            } 
        });
        let debt = 0;
        Object.values(advanceMap).forEach(a => { if (!a.isSettled && a.remaining > 0.1) debt += a.remaining; });
        
        let totalAsset=0, inc=0, exp=0;
        transactions.forEach(t => {
            const amt = parseFloat(t.amount)||0;
            if (t.accountId !== OFFSET_ACCOUNT_ID && t.toAccountId !== OFFSET_ACCOUNT_ID) { 
                if (t.type==='income'||t.type==='repayment') if(bals[t.accountId]!=null) bals[t.accountId]+=amt;
                if (t.type==='expense'||t.type==='advance') if(bals[t.accountId]!=null) bals[t.accountId]-=amt;
                if (t.type==='transfer') { if(bals[t.accountId]!=null) bals[t.accountId]-=amt; if(bals[t.toAccountId]!=null) bals[t.toAccountId]+=(t.toAmount?parseFloat(t.toAmount):amt); }
            }
            const txDate = String(t.date || '');
            if ((t.bookId||'main') === currentBook.id && txDate.startsWith(currentLedgerMonth)) {
                const baseAmt = getBaseAmt(t, accounts, exchangeRates); 
                if (t.type==='income') inc += baseAmt;
                if (t.type==='expense') exp += baseAmt;
            }
        });
        accounts.forEach(a => { 
            if(a.includeInTotal !== false) { 
                let v = (a.type==='invest' && a.marketValue) ? parseFloat(a.marketValue) : (bals[a.id]||0); 
                if(a.currency!=='TWD') v *= (exchangeRates[a.currency]||1); 
                totalAsset+=v; 
            } 
        });
        return { bals, advanceMap, debt, totalAsset, inc, exp };
    }, [accounts, transactions, currentLedgerMonth, currentBook, exchangeRates]);
    
    // 2. 退休進度計算
    const retireProgress = useMemo(() => {
        const r = retirement || {};
        const age = r.currentAge || 30;
        const rAge = r.retireAge || 60;
        const expense = r.monthlyExpense || 30000;
        const infl = r.inflation || 2;
        const years = Math.max(0, rAge - age);
        const target = expense * Math.pow(1 + (infl/100), years) * 12 * 25;
        const pct = target > 0 ? Math.min(100, (stats.totalAsset / target) * 100) : 0;
        return { target, pct, years };
    }, [retirement, stats.totalAsset]);
    
    // 3. 退休洞察小語
    const retirementInsight = useMemo(() => {
        const savings = stats.inc - stats.exp;
        const target = (retirement && retirement.monthlyExpense) ? parseFloat(retirement.monthlyExpense) : 0;
        if (savings < 0) return { icon: 'alert-triangle', text: `⚠️ 本月透支，資產縮水中！`, color: 'text-rose-400', bg: 'bg-rose-500/20' };
        if (savings < target) return { icon: 'target', text: `🎯 離月存額目標還有差距，加油！`, color: 'text-amber-400', bg: 'bg-amber-500/20' };
        return { icon: 'party-popper', text: `🚀 太棒了！儲蓄力超標！`, color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    }, [stats, retirement, currentLedgerMonth]);
    
    // 4. 首頁預算狀態
    const homeInsight = useMemo(() => {
        const saving = stats.inc - stats.exp;
        if (saving < 0) return { type:'danger', icon:'alert-triangle', text:`透支 $${Math.abs(saving).toLocaleString()}` };
        if (stats.exp > monthlyBudget) return { type:'danger', icon:'alert-triangle', text:`超出預算 $${(stats.exp - monthlyBudget).toLocaleString()}` };
        return { type:'success', icon:'thumbs-up', text:`預算剩餘 $${(monthlyBudget - stats.exp).toLocaleString()}` };
    }, [stats, monthlyBudget]);
    
    // 5. 報表分析資料
    const analysisData = useMemo(() => {
        const bookTxs = transactions.filter(tx => (tx.bookId || 'main') === currentBook.id);
        let filteredTx = [];
        if (analysisMode === 'month') { 
            filteredTx = bookTxs.filter(t => String(t.date || '').substring(0, 7) === currentLedgerMonth); 
        } else if (analysisMode === 'year') { 
            const year = currentLedgerMonth.split('-')[0]; 
            filteredTx = bookTxs.filter(t => String(t.date || '').substring(0, 4) === year); 
        }

        const targetTx = filteredTx.filter(t => t.type === analysisType);
        const total = targetTx.reduce((sum, t) => sum + getBaseAmt(t, accounts, exchangeRates), 0);
        
        const breakdown = {};
        targetTx.forEach(t => {
            const cat = t.category;
            const sub = t.subCategory || '無子類別';
            const baseAmt = getBaseAmt(t, accounts, exchangeRates); 
            if (!breakdown[cat]) breakdown[cat] = { total: 0, subs: {}, txs: [] };
            breakdown[cat].total += baseAmt;
            breakdown[cat].txs.push(t);
            if (!breakdown[cat].subs[sub]) breakdown[cat].subs[sub] = 0;
            breakdown[cat].subs[sub] += baseAmt;
        });

        const chartData = Object.entries(breakdown).map(([name, data], index) => {
            let color = CATEGORY_COLORS[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
            const percent = total ? (data.total / total) * 100 : 0;
            const subList = Object.entries(data.subs)
                .map(([subName, subVal]) => ({ name: subName, value: subVal, percent: (subVal / data.total) * 100 }))
                .sort((a,b) => b.value - a.value);
            return { name, value: data.total, percent, color, subs: subList, txs: data.txs.sort((a, b) => a.date < b.date ? 1 : (a.date > b.date ? -1 : 0)) };
        }).sort((a,b) => b.value - a.value);
        return { total, chart: chartData };
    }, [transactions, analysisMode, currentLedgerMonth, currentBook, analysisType, categories, accounts, exchangeRates]);

    // 6. 首頁分群交易列表
    const groupedTransactions = useMemo(() => {
        const targetTxs = transactions.filter(t => (t.bookId||'main')===currentBook.id && String(t.date || '').startsWith(currentLedgerMonth));
        const filteredTxs = targetTxs.filter(tx => {
            if (homeFilter === 'all') return true;
            const fromAcc = accounts.find(a => a.id === tx.accountId);
            const toAcc = accounts.find(a => a.id === tx.toAccountId);
            if (homeFilter === 'inout') return tx.type === 'expense' || tx.type === 'income';
            if (homeFilter === 'invest') {
                if (tx.type === 'transfer') return (fromAcc && fromAcc.type === 'invest') || (toAcc && toAcc.type === 'invest');
                return (tx.category && tx.category.includes('投資')) || (fromAcc && fromAcc.type === 'invest');
            }
            if (homeFilter === 'transfer') {
                if (tx.type === 'transfer') {
                    const isInvest = (fromAcc && fromAcc.type === 'invest') || (toAcc && toAcc.type === 'invest');
                    return !isInvest;
                }
                return false;
            }
            return false;
        });
        const groups = {};
        filteredTxs.forEach(tx => {
            if (!groups[tx.date]) groups[tx.date] = [];
            groups[tx.date].push(tx);
        });
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    }, [transactions, currentBook, currentLedgerMonth, homeFilter, accounts]);
    
    // 7. 近六個月趨勢
    const trendData = useMemo(() => {
        const today = new Date();
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const mStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            last6Months.push({ month: mStr, income: 0, expense: 0, label: `${d.getMonth()+1}月` });
        }
        transactions.forEach(t => {
            if ((t.bookId||'main') !== currentBook.id) return;
            const m = String(t.date || '').substring(0, 7);
            const match = last6Months.find(d => d.month === m);
            if (match) {
                const baseAmt = getBaseAmt(t, accounts, exchangeRates); 
                if (t.type === 'income') match.income += baseAmt;
                else if (t.type === 'expense') match.expense += baseAmt;
            }
        });
        return last6Months;
    }, [transactions, currentBook, accounts, exchangeRates]);
    
    // 8. 帳戶明細與對帳資料
    const accountDetailData = useMemo(() => {
        if (!viewingAccount) return null;
        const related = transactions.filter(t => t.accountId === viewingAccount.id || t.toAccountId === viewingAccount.id);
        related.sort((a, b) => {
            if (a.date !== b.date) return a.date > b.date ? 1 : -1;
            return (a.createdAt || '') > (b.createdAt || '') ? 1 : -1;
        });

        let balance = parseFloat(viewingAccount.initialBalance) || 0;
        if ((viewingAccount.type === 'credit' || viewingAccount.type === 'payable') && balance > 0) balance = -balance;
        
        const withBalance = related.map(t => {
            const amt = parseFloat(t.amount);
            let change = 0; let type = 'neutral';
            if (t.accountId === viewingAccount.id) {
                if (t.type === 'expense' || t.type === 'advance') { balance -= amt; change = -amt; type = 'expense'; } 
                else if (t.type === 'income' || t.type === 'repayment') { balance += amt; change = amt; type = 'income'; } 
                else if (t.type === 'transfer') { balance -= amt; change = -amt; type = 'transfer_out'; }
            } else if (t.toAccountId === viewingAccount.id && t.type === 'transfer') {
                const inAmt = t.toAmount ? parseFloat(t.toAmount) : amt; balance += inAmt; change = inAmt; type = 'transfer_in';
            }
            return { ...t, balanceSnapshot: balance, change, displayType: type };
        });

        let monthTxs = [];
        let cycleRange = null;

        if (viewingAccount.type === 'credit' && viewingAccount.closingDay) {
            const cDay = parseInt(viewingAccount.closingDay);
            const [y, m] = accountDetailMonth.split('-').map(Number);
            const endDate = new Date(y, m - 1, cDay);
            const startDate = new Date(y, m - 2, cDay + 1);
            const toStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            cycleRange = `${String(startDate.getMonth()+1)}/${startDate.getDate()} ~ ${String(endDate.getMonth()+1)}/${endDate.getDate()}`;
            monthTxs = withBalance.filter(t => t.date >= toStr(startDate) && t.date <= toStr(endDate));
        } else {
            monthTxs = withBalance.filter(t => String(t.date || '').startsWith(accountDetailMonth));
        }

        const displayList = [...monthTxs].sort((a, b) => {
            const dateA = String(a.date || ''); const dateB = String(b.date || '');
            if (dateA !== dateB) return dateB.localeCompare(dateA);
            const timeA = String(a.createdAt || ''); const timeB = String(b.createdAt || '');
            return timeB.localeCompare(timeA);
        });

        let mIncome = 0, mExpense = 0, mTrans = 0;
        monthTxs.forEach(t => {
            if (t.displayType === 'income' || t.displayType === 'repayment') mIncome += t.change;
            else if (t.displayType === 'expense' || t.displayType === 'advance') mExpense += Math.abs(t.change);
            else if (t.displayType === 'transfer_in' || t.displayType === 'transfer_out') mTrans += t.change;
        });

        const groupedList = [];
        displayList.forEach(tx => {
            const lastGroup = groupedList[groupedList.length - 1];
            if (lastGroup && lastGroup.date === tx.date) lastGroup.txs.push(tx);
            else groupedList.push({ date: tx.date, txs: [tx] });
        });
        return { displayList, groupedList, stats: { mIncome, mExpense, mTrans }, currentBalance: balance, cycleRange };
    }, [viewingAccount, transactions, accountDetailMonth]);

    return {
        stats, retireProgress, retirementInsight, homeInsight,
        analysisData, groupedTransactions, trendData, accountDetailData
    };
};