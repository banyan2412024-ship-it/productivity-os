import { useState, useMemo } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight, Pencil, Check, X } from 'lucide-react'
import { useMoneyStore, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../stores/moneyStore'
import { useToastStore } from '../stores/toastStore'
import { format, addMonths, subMonths } from 'date-fns'

/* ── shared terminal styles ─────────────────────────────────────────────────── */
const panel = {
  borderTop: '2px solid var(--border-bright)',
  borderLeft: '2px solid var(--border-bright)',
  borderRight: '2px solid var(--border-dark)',
  borderBottom: '2px solid var(--border-dark)',
  background: 'var(--bg-surface)',
}

const overlayBox = { ...panel, width: '360px' }
const overlayTitle = {
  padding: '6px 12px', borderBottom: '1px solid var(--border)',
  fontSize: '10px', letterSpacing: '2px', color: 'var(--neon)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: 'var(--bg-elevated)',
}
const closeBtn = { background: 'transparent', border: 'none', color: 'var(--text-ghost)', cursor: 'pointer', fontSize: '14px', padding: '0 2px', minWidth: 'unset' }

/* ── inline editable transaction row ────────────────────────────────────────── */
function TxRow({ tx }) {
  const updateTransaction = useMoneyStore((s) => s.updateTransaction)
  const deleteTransaction = useMoneyStore((s) => s.deleteTransaction)
  const addTransaction = useMoneyStore((s) => s.addTransaction)
  const addToast = useToastStore((s) => s.addToast)

  const [editing, setEditing] = useState(false)
  const [amt, setAmt] = useState(String(tx.amount))
  const [cat, setCat] = useState(tx.category)

  const categories = tx.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const saveEdit = () => {
    const parsed = parseFloat(amt)
    if (!parsed || parsed <= 0) { setAmt(String(tx.amount)); setEditing(false); return }
    updateTransaction(tx.id, { amount: parsed, category: cat })
    addToast('Transaction updated', { type: 'success' })
    setEditing(false)
  }

  const cancelEdit = () => {
    setAmt(String(tx.amount))
    setCat(tx.category)
    setEditing(false)
  }

  const handleDelete = () => {
    const saved = { ...tx }
    deleteTransaction(tx.id)
    addToast(`${saved.type === 'income' ? '+' : '-'}$${saved.amount.toFixed(2)} removed`, {
      type: 'info',
      undoFn: () => { addTransaction(saved); addToast('Transaction restored', { type: 'success' }) },
    })
  }

  const amtColor = tx.type === 'income' ? 'var(--neon)' : 'var(--danger)'

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', borderBottom: '1px solid var(--border-dark)', background: 'var(--bg-elevated)' }}>
        <span style={{ fontSize: '10px', color: amtColor, minWidth: '10px' }}>{tx.type === 'income' ? '+' : '-'}</span>
        <input
          type="number"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
          autoFocus
          style={{ width: '70px', fontSize: '11px', padding: '2px 6px', background: 'var(--bg-base)', color: 'var(--neon)', border: '1px solid var(--neon)', outline: 'none' }}
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          style={{ flex: 1, fontSize: '10px', padding: '2px 4px', background: 'var(--bg-base)', color: 'var(--text)' }}
        >
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={saveEdit} style={{ background: 'transparent', border: 'none', color: 'var(--neon)', cursor: 'pointer', padding: '2px', minWidth: 'unset', display: 'flex' }}><Check size={13} /></button>
        <button onClick={cancelEdit} style={{ background: 'transparent', border: 'none', color: 'var(--text-ghost)', cursor: 'pointer', padding: '2px', minWidth: 'unset', display: 'flex' }}><X size={13} /></button>
      </div>
    )
  }

  return (
    <div
      className="list-row"
      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderBottom: '1px solid var(--border-dark)' }}
    >
      <span style={{ fontSize: '10px', color: amtColor, minWidth: '10px' }}>{tx.type === 'income' ? '+' : '-'}</span>
      <span style={{ fontSize: '12px', color: amtColor, minWidth: '60px', fontWeight: 'bold' }}>
        ${tx.amount.toFixed(2)}
      </span>
      <span style={{ fontSize: '10px', color: 'var(--text-dim)', flex: 1 }}>
        {tx.category}{tx.description ? ` — ${tx.description}` : ''}
      </span>
      <span style={{ fontSize: '9px', color: 'var(--text-ghost)' }}>{tx.date}</span>
      <button
        onClick={() => setEditing(true)}
        title="Edit"
        style={{ background: 'transparent', border: 'none', color: 'var(--text-ghost)', cursor: 'pointer', padding: '2px', minWidth: 'unset', display: 'flex', opacity: 0.5 }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
      ><Pencil size={11} /></button>
      <button
        onClick={handleDelete}
        title="Delete"
        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px', minWidth: 'unset', display: 'flex', opacity: 0.5 }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
      ><Trash2 size={11} /></button>
    </div>
  )
}

/* ── add transaction form (overlay) ─────────────────────────────────────────── */
function TransactionForm({ onSave, onClose }) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Other')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    onSave({ type, amount: parseFloat(amount), category, description, date })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div onClick={(e) => e.stopPropagation()} style={overlayBox}>
        <div style={overlayTitle}>
          <span>// ADD_TRANSACTION</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Type */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['expense', 'income'].map((t) => (
              <button key={t} type="button" onClick={() => { setType(t); setCategory('Other') }}
                style={{
                  flex: 1, padding: '5px', fontSize: '10px', letterSpacing: '1px', cursor: 'pointer',
                  background: type === t ? (t === 'expense' ? 'var(--danger)' : 'var(--neon)') : 'transparent',
                  color: type === t ? (t === 'expense' ? '#fff' : '#000') : 'var(--text-dim)',
                  border: `1px solid ${t === 'expense' ? 'var(--danger)' : 'var(--neon)'}`,
                  minWidth: 'unset',
                }}>
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <div>
            <div style={{ fontSize: '9px', color: 'var(--text-ghost)', letterSpacing: '1px', marginBottom: '4px' }}>AMOUNT</div>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00" autoFocus
              style={{ width: '100%', fontSize: '16px', fontWeight: 'bold', color: type === 'income' ? 'var(--neon)' : 'var(--danger)' }} />
          </div>

          <div>
            <div style={{ fontSize: '9px', color: 'var(--text-ghost)', letterSpacing: '1px', marginBottom: '4px' }}>CATEGORY</div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', fontSize: '11px' }}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <div style={{ fontSize: '9px', color: 'var(--text-ghost)', letterSpacing: '1px', marginBottom: '4px' }}>DESCRIPTION</div>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="optional note..."
              style={{ width: '100%', fontSize: '11px' }} />
          </div>

          <div>
            <div style={{ fontSize: '9px', color: 'var(--text-ghost)', letterSpacing: '1px', marginBottom: '4px' }}>DATE</div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', fontSize: '11px' }} />
          </div>

          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '6px', fontSize: '10px', cursor: 'pointer', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border-mid)', minWidth: 'unset' }}>
              CANCEL
            </button>
            <button type="submit"
              style={{ flex: 2, padding: '6px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold',
                background: type === 'expense' ? 'var(--danger)' : 'var(--neon)',
                color: type === 'expense' ? '#fff' : '#000',
                border: 'none', minWidth: 'unset' }}>
              + ADD {type.toUpperCase()}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── main page ───────────────────────────────────────────────────────────────── */
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
    () => transactions
      .filter((t) => { const d = new Date(t.date); return d.getFullYear() === year && d.getMonth() === month })
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
    monthTxs.filter((t) => t.type === 'expense').forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount })
    return Object.entries(map).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount)
  }, [monthTxs])

  const maxCat = categoryBreakdown[0]?.amount || 1

  return (
    <div style={{ padding: '20px 16px', maxWidth: '860px', margin: '0 auto', fontFamily: 'var(--font-mono)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--neon)', letterSpacing: '3px' }}>&gt; MONEY_TRACKER</div>
          <div style={{ fontSize: '10px', color: 'var(--text-ghost)', marginTop: '2px' }}>// track income &amp; expenses</div>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '10px', background: 'var(--bg-surface)', color: 'var(--neon)', cursor: 'pointer' }}>
          <Plus size={13} /> ADD TRANSACTION
        </button>
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px', minWidth: 'unset', display: 'flex' }}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: '11px', color: 'var(--text)', letterSpacing: '1px', minWidth: '120px', textAlign: 'center' }}>
          {format(viewMonth, 'MMMM yyyy')}
        </span>
        <button onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px', minWidth: 'unset', display: 'flex' }}>
          <ChevronRight size={16} />
        </button>
        <button onClick={() => setViewMonth(new Date())}
          style={{ fontSize: '9px', padding: '3px 10px', background: 'transparent', color: 'var(--text-ghost)', border: '1px solid var(--border-mid)', cursor: 'pointer', minWidth: 'unset' }}>
          THIS MONTH
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'INCOME', value: summary.income, color: 'var(--neon)', sign: '+' },
          { label: 'EXPENSES', value: summary.expenses, color: 'var(--danger)', sign: '-' },
          { label: 'NET', value: summary.net, color: summary.net >= 0 ? 'var(--neon)' : 'var(--danger)', sign: summary.net >= 0 ? '+' : '' },
        ].map((s) => (
          <div key={s.label} style={{ ...panel, padding: '10px 14px' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-ghost)', letterSpacing: '2px', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontSize: '18px', color: s.color, fontWeight: 'bold' }}>{s.sign}${Math.abs(s.value).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0, 220px)', gap: '12px' }}>

        {/* Transaction list */}
        <div style={panel}>
          <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', fontSize: '9px', color: 'var(--text-ghost)', letterSpacing: '2px', background: 'var(--bg-elevated)' }}>
            TRANSACTIONS — {monthTxs.length}
          </div>
          <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
            {monthTxs.length === 0 ? (
              <p style={{ fontSize: '11px', color: 'var(--text-ghost)', padding: '24px', textAlign: 'center' }}>&gt; no transactions this month</p>
            ) : (
              monthTxs.map((tx) => <TxRow key={tx.id} tx={tx} />)
            )}
          </div>
        </div>

        {/* Category breakdown */}
        <div style={{ ...panel, alignSelf: 'start' }}>
          <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', fontSize: '9px', color: 'var(--text-ghost)', letterSpacing: '2px', background: 'var(--bg-elevated)' }}>
            BY CATEGORY
          </div>
          <div style={{ padding: '10px' }}>
            {categoryBreakdown.length === 0 ? (
              <p style={{ fontSize: '10px', color: 'var(--text-ghost)', textAlign: 'center', padding: '12px 0' }}>&gt; no expenses</p>
            ) : (
              categoryBreakdown.map(({ category, amount }) => (
                <div key={category} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-dim)' }}>{category}</span>
                    <span style={{ color: 'var(--danger)' }}>${amount.toFixed(2)}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-base)', borderTop: '1px solid var(--border-dark)', borderLeft: '1px solid var(--border-dark)' }}>
                    <div style={{ height: '100%', background: 'var(--danger)', width: `${(amount / maxCat) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

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
