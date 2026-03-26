import { create } from 'zustand'
import { dexiePersist } from './dexiePersist'
import { v4 as uuid } from 'uuid'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns'

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Housing',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Health',
  'Education',
  'Subscriptions',
  'Other',
]

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Refund',
  'Other',
]

export const useMoneyStore = create(
  dexiePersist(
    (set, get) => ({
      transactions: [],

      addTransaction: (tx) => {
        const newTx = {
          id: uuid(),
          amount: Math.abs(tx.amount) || 0,
          type: tx.type || 'expense', // 'income' | 'expense'
          category: tx.category || 'Other',
          description: tx.description || '',
          date: tx.date || format(new Date(), 'yyyy-MM-dd'),
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ transactions: [newTx, ...s.transactions] }))
        return newTx.id
      },

      updateTransaction: (id, updates) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTransaction: (id) =>
        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
        })),

      getTransactionsForDate: (dateStr) =>
        get().transactions.filter((t) => t.date === dateStr),

      getMonthSummary: (year, month) => {
        const start = startOfMonth(new Date(year, month))
        const end = endOfMonth(start)
        const txs = get().transactions.filter((t) => {
          const d = new Date(t.date)
          return d >= start && d <= end
        })
        const income = txs
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
        const expenses = txs
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)
        return { income, expenses, net: income - expenses, count: txs.length }
      },

      getCategoryBreakdown: (year, month) => {
        const start = startOfMonth(new Date(year, month))
        const end = endOfMonth(start)
        const txs = get().transactions.filter((t) => {
          const d = new Date(t.date)
          return d >= start && d <= end && t.type === 'expense'
        })
        const breakdown = {}
        txs.forEach((t) => {
          breakdown[t.category] = (breakdown[t.category] || 0) + t.amount
        })
        return Object.entries(breakdown)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount)
      },

      getRecentTransactions: (limit = 10) =>
        get()
          .transactions.slice()
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, limit),
    }),
    {
      tables: { transactions: 'transactions' },
    }
  )
)
