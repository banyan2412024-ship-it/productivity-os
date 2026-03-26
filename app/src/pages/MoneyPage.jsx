import { useState, useMemo } from 'react'
import {
  DollarSign,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useMoneyStore, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../stores/moneyStore'
import { useToastStore } from '../stores/toastStore'
import { format, addMonths, subMonths } from 'date-fns'

export default function MoneyPage() {
  const [showForm, setShowForm] = useState(false)
  const [viewMonth, setViewMonth] = useState(new Date())

  const transactions = useMoneyStore((s) => s.transactions)
  const addTransaction = useMoneyStore((s) => s.addTransaction)
  const deleteTransaction = useMoneyStore((s) => s.deleteTransaction)
  const addToast = useToastStore((s) => s.addToast)

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()

  const monthTxs = useMemo(
    () =>
      transactions
        .filter((t) => {
          const d = new Date(t.date)
          return d.getFullYear() === year && d.getMonth() === month
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, year, month]
  )

  const summary = useMemo(() => {
    const income = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { income, expenses, net: income - expenses }
  }, [monthTxs])

  const categoryBreakdown = useMemo(() => {
    const map = {}
    monthTxs
      .filter((t) => t.type === 'expense')
      .forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount })
    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [monthTxs])

  const maxCategoryAmount = categoryBreakdown.length > 0 ? categoryBreakdown[0].amount : 1

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DollarSign size={24} className="text-emerald-500" />
          <h1 className="text-2xl font-bold text-gray-900">Money Tracker</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      {/* Month Nav */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setViewMonth(subMonths(viewMonth, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-gray-900 min-w-[160px] text-center">
          {format(viewMonth, 'MMMM yyyy')}
        </h2>
        <button onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => setViewMonth(new Date())}
          className="ml-2 px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
        >
          This Month
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight size={16} className="text-emerald-500" />
            <span className="text-sm text-gray-500">Income</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">${summary.income.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownRight size={16} className="text-red-500" />
            <span className="text-sm text-gray-500">Expenses</span>
          </div>
          <p className="text-2xl font-bold text-red-500">${summary.expenses.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            {summary.net >= 0 ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-red-500" />}
            <span className="text-sm text-gray-500">Net</span>
          </div>
          <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            ${Math.abs(summary.net).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Transactions list */}
        <div className="md:col-span-2">
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Transactions</h3>
            {monthTxs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No transactions this month</p>
            ) : (
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {monthTxs.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 group"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        tx.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowUpRight size={16} className="text-emerald-600" />
                      ) : (
                        <ArrowDownRight size={16} className="text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {tx.description || tx.category}
                      </p>
                      <p className="text-xs text-gray-400">
                        {tx.category} · {tx.date}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => {
                        const saved = { ...tx }
                        deleteTransaction(tx.id)
                        addToast(`${saved.type === 'income' ? '+' : '-'}$${saved.amount.toFixed(2)} removed`, {
                          type: 'info',
                          undoFn: () => { addTransaction(saved); addToast('Transaction restored', { type: 'success' }) },
                        })
                      }}
                      className="p-1 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Category breakdown */}
        <div>
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Spending by Category</h3>
            {categoryBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No expenses</p>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map(({ category, amount }) => (
                  <div key={category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700">{category}</span>
                      <span className="text-gray-500 font-medium">${amount.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-2 bg-red-400 rounded-full transition-all"
                        style={{ width: `${(amount / maxCategoryAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showForm && (
        <TransactionForm
          onSave={(data) => {
            const id = addTransaction(data)
            addToast(`${data.type === 'income' ? '+' : '-'}$${data.amount.toFixed(2)} ${data.category}`, {
              type: 'success',
              undoFn: () => { deleteTransaction(id); addToast('Undone', { type: 'info' }) },
            })
            setShowForm(false)
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

function TransactionForm({ onSave, onClose }) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Other')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  function handleSubmit(e) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    onSave({ type, amount: parseFloat(amount), category, description, date })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Transaction</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {['expense', 'income'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setCategory('Other') }}
                className={`flex-1 py-2 text-sm rounded-md transition-colors capitalize ${
                  type === t
                    ? t === 'expense'
                      ? 'bg-red-500 text-white shadow'
                      : 'bg-emerald-500 text-white shadow'
                    : 'text-gray-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Amount</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 text-lg font-semibold border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm text-white rounded-lg ${
                type === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              Add {type}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
