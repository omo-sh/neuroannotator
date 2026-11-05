import React, { useState, useEffect } from 'react'
import { 
  ShieldCheck, 
  Users, 
  Coins, 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Search, 
  AlertCircle,
  ExternalLink,
  Unlock,
  Lock,
  DollarSign
} from 'lucide-react'

export default function AdminPortal({ currentUser }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    metrics: {
      totalWorkers: 0,
      totalDepositsKes: 0,
      pendingDepositsCount: 0,
      pendingWithdrawalsCount: 0,
      totalSubmissions: 0
    },
    users: [],
    deposits: [],
    withdrawals: [],
    submissions: []
  })

  const [activeTab, setActiveTab] = useState('deposits') // 'deposits' | 'withdrawals' | 'users'
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const fetchOverview = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?action=overview')
      const json = await res.json()
      if (res.ok) {
        setData(json)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOverview()
  }, [])

  // Approve or Reject Deposit
  const handleUpdateDeposit = async (depositId, status) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin?action=update_deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId, status })
      })
      if (res.ok) {
        setMsg(`Deposit #${depositId} marked as ${status}.`)
        setTimeout(() => setMsg(''), 4000)
        fetchOverview()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  // Toggle user task tier access
  const handleToggleAccess = async (userId, currentVal) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin?action=toggle_user_access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isUnlocked: !currentVal })
      })
      if (res.ok) {
        fetchOverview()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  // Approve or Reject Withdrawal
  const handleUpdateWithdrawal = async (withdrawalId, status) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin?action=update_withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, status })
      })
      if (res.ok) {
        setMsg(`Payout #${withdrawalId} marked as ${status}.`)
        setTimeout(() => setMsg(''), 4000)
        fetchOverview()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Super Admin Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Super Admin Root
            </span>
            <span className="text-xs text-slate-400 font-mono">Logged in as {currentUser?.username || 'suuki'}</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            NeuroAnnotator Platform Command Desk
          </h2>
          <p className="text-xs text-slate-400">
            Real-time verification of on-chain worker deposits, RLHF evaluations, and weekly M-Pesa batch disbursements.
          </p>
        </div>

        <button
          onClick={fetchOverview}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          <span>Sync Database</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs text-teal-300 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{msg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-400">Pending Crypto Deposits</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {data.metrics.pendingDepositsCount}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Requires TxHash check</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-400">Pending Withdrawals</span>
            <ArrowUpRight className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {data.metrics.pendingWithdrawalsCount}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Friday batch queue</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-400">Total Approved Capital</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            KES {data.metrics.totalDepositsKes.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Worker activation deposits</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-400">Registered Annotators</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {data.metrics.totalWorkers}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{data.metrics.totalSubmissions} RLHF tasks performed</span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
        <div className="flex gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('deposits')}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeTab === 'deposits' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Crypto Deposits ({data.deposits.length})
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeTab === 'withdrawals' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Withdrawal Requests ({data.withdrawals.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeTab === 'users' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Annotator Accounts ({data.users.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search username, TxHash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-800 focus:border-teal-500 text-xs text-white rounded-xl pl-9 pr-3 py-1.5 outline-none transition w-64"
          />
        </div>
      </div>

      {/* Tab 1: Crypto Deposits */}
      {activeTab === 'deposits' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Worker</th>
                  <th className="p-4">Network & Amount</th>
                  <th className="p-4">Transaction Hash (TxHash)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.deposits
                  .filter(d => 
                    !searchTerm || 
                    d.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    d.txHash.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(d => (
                    <tr key={d.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-4 font-mono text-slate-500">#{d.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-white">{d.username}</div>
                        <div className="text-[11px] text-slate-500">{d.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-teal-400">{d.network}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {d.amountUsdt} USDT (KES {d.amountKes.toLocaleString()})
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-300 max-w-xs">
                        <div className="truncate flex items-center gap-1.5" title={d.txHash}>
                          <span>{d.txHash}</span>
                          <a
                            href={
                              d.network.includes('Tron') 
                                ? `https://tronscan.org/#/transaction/${d.txHash}`
                                : `https://polygonscan.com/tx/${d.txHash}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-400 hover:text-teal-300"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <span className="text-[10px] text-slate-500">{new Date(d.createdAt).toLocaleString()}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          d.status === 'approved' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : d.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {d.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdateDeposit(d.id, 'approved')}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-lg text-xs transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateDeposit(d.id, 'rejected')}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-lg text-xs transition border border-rose-500/30"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}

                {data.deposits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No crypto deposits recorded in the database yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Withdrawals */}
      {activeTab === 'withdrawals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Worker</th>
                  <th className="p-4">Disbursement Method</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.withdrawals
                  .filter(w => !searchTerm || w.username.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(w => (
                    <tr key={w.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-4 font-mono text-slate-500">#{w.id}</td>
                      <td className="p-4 font-bold text-white">{w.username}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-200">{w.method}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{w.accountDetails}</div>
                      </td>
                      <td className="p-4 font-black text-teal-400">
                        KES {w.amount.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          w.status === 'completed' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : w.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {w.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdateWithdrawal(w.id, 'completed')}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-lg text-xs transition"
                            >
                              Mark Paid
                            </button>
                            <button
                              onClick={() => handleUpdateWithdrawal(w.id, 'rejected')}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-lg text-xs transition border border-rose-500/30"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Disbursed</span>
                        )}
                      </td>
                    </tr>
                  ))}

                {data.withdrawals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No withdrawal requests in queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Users Directory */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Task Tier Access</th>
                  <th className="p-4">Available Balance</th>
                  <th className="p-4">Tasks Completed</th>
                  <th className="p-4 text-right">Quick Access Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.users
                  .filter(u => 
                    !searchTerm || 
                    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    u.email.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-4">
                        <div className="font-bold text-white">{u.username}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                        <div className="text-[10px] text-slate-600 font-mono">Ref: {u.referral_code}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-slate-400">{u.role}</span>
                      </td>
                      <td className="p-4">
                        {u.is_task_unlocked ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Unlocked
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                            Locked (Deposit Req.)
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-mono font-bold text-white">
                        KES {u.balance_available.toLocaleString()}
                        <div className="text-[10px] text-slate-500 font-normal">Review: KES {u.balance_in_review.toLocaleString()}</div>
                      </td>
                      <td className="p-4 font-mono">{u.completed_tasks_count}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleAccess(u.id, u.is_task_unlocked)}
                          disabled={actionLoading}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ml-auto ${
                            u.is_task_unlocked
                              ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                              : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30'
                          }`}
                        >
                          {u.is_task_unlocked ? (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>Revoke Access</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3 h-3" />
                              <span>Grant Access</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
