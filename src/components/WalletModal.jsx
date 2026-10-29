import React, { useState } from 'react'
import { 
  Wallet, 
  ArrowUpRight, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  Coins,
  CreditCard,
  Building2,
  ExternalLink
} from 'lucide-react'

export default function WalletModal({ 
  isOpen, 
  onClose, 
  balanceAvailable, 
  balanceInReview, 
  payoutHistory,
  onRequestWithdrawal 
}) {
  const [withdrawalMethod, setWithdrawalMethod] = useState('crypto') // 'crypto' | 'mpesa' | 'bank'
  const [destinationAddress, setDestinationAddress] = useState('')
  const [requestedAmount, setRequestedAmount] = useState(10000)
  const [phoneOrAccount, setPhoneOrAccount] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  if (!isOpen) return null

  const MIN_WITHDRAWAL_KES = 25000

  // Check if current day is a weekday (Monday=1 to Friday=5)
  const isWeekday = () => {
    const day = new Date().getDay()
    return day >= 1 && day <= 5 // 1 = Mon, 5 = Fri
  }

  // Calculate upcoming disbursement date (1 week release cycle, weekdays only)
  const getNextDisbursementDate = () => {
    const today = new Date()
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + 7) // 1 week payout cycle
    
    // If the 7th day falls on a weekend, adjust to next business day (Monday)
    const dayOfWeek = targetDate.getDay()
    if (dayOfWeek === 6) { // Saturday
      targetDate.setDate(targetDate.getDate() + 2)
    } else if (dayOfWeek === 0) { // Sunday
      targetDate.setDate(targetDate.getDate() + 1)
    }
    
    return targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleWithdrawalSubmit = (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    // Rule: Withdrawal only on weekdays
    if (!isWeekday()) {
      setErrorMessage('Withdrawals are restricted to Weekdays only (Monday to Friday 09:00 - 17:00 UTC). Please request on the next business day.')
      return
    }

    if (requestedAmount < MIN_WITHDRAWAL_KES) {
      setErrorMessage(`The minimum withdrawal threshold is ${MIN_WITHDRAWAL_KES.toLocaleString()} KES.`)
      return
    }

    if (requestedAmount > balanceAvailable) {
      setErrorMessage(`Insufficient available balance. You currently have ${balanceAvailable.toLocaleString()} KES approved.`)
      return
    }

    if (withdrawalMethod === 'crypto' && !destinationAddress.trim()) {
      setErrorMessage('Please provide a valid USDT (TRC-20 / Polygon) recipient wallet address.')
      return
    }

    if (withdrawalMethod === 'mpesa' && !phoneOrAccount.trim()) {
      setErrorMessage('Please provide an active Safaricom M-Pesa registered mobile number.')
      return
    }

    const payload = {
      amount: requestedAmount,
      method: withdrawalMethod,
      destination: withdrawalMethod === 'crypto' ? destinationAddress : phoneOrAccount,
      batchDisbursementDate: getNextDisbursementDate(),
      dateRequested: new Date().toISOString()
    }

    onRequestWithdrawal(payload)
    setSuccessMessage(`Withdrawal requested successfully! Your payout of ${requestedAmount.toLocaleString()} KES has been queued. Payouts are released after a 1-week settlement verification period on ${getNextDisbursementDate()}.`)
    setDestinationAddress('')
    setPhoneOrAccount('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Earnings & Payout Settlement</h2>
              <p className="text-xs text-slate-400">Weekly automated micro-task settlement cycle • Weekdays only</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Dual Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                Available Balance
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {balanceAvailable.toLocaleString()} <span className="text-sm font-sans font-normal text-teal-400">KES</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                Approved by client QA • Ready for weekly release
              </div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-teal-500/5 rounded-full blur-xl pointer-events-none"></div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Under Quality Review
              </div>
              <div className="text-2xl font-bold font-mono text-slate-200">
                {balanceInReview.toLocaleString()} <span className="text-sm font-sans font-normal text-amber-400">KES</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                Tasks submitted within 24–48h awaiting consensus
              </div>
            </div>
          </div>

          {/* Payout Schedule Banner */}
          <div className="bg-teal-950/20 border border-teal-500/20 rounded-2xl p-4 flex items-start gap-3">
            <Calendar className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <span>Estimated Release: {getNextDisbursementDate()}</span>
                <span className="bg-teal-500/10 text-teal-400 text-[10px] px-2 py-0.5 rounded-full font-mono border border-teal-500/20 font-normal">
                  Weekdays Only
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Task earnings mature over a <strong className="text-white">1-week verification period</strong>. 
                Approved withdrawals require a minimum balance of <strong className="text-teal-400">{MIN_WITHDRAWAL_KES.toLocaleString()} KES</strong> and are disbursed 
                strictly on <strong className="text-white">Weekdays (Monday to Friday)</strong>.
              </p>
            </div>
          </div>

          {/* Withdrawal Form */}
          <form onSubmit={handleWithdrawalSubmit} className="space-y-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Request Friday Disbursement
            </div>

            {/* Payment Method Switcher */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setWithdrawalMethod('crypto')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                  withdrawalMethod === 'crypto'
                    ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Crypto (USDT)</span>
              </button>

              <button
                type="button"
                onClick={() => setWithdrawalMethod('mpesa')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                  withdrawalMethod === 'mpesa'
                    ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>M-Pesa Express</span>
              </button>

              <button
                type="button"
                onClick={() => setWithdrawalMethod('bank')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                  withdrawalMethod === 'bank'
                    ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Bank Wire</span>
              </button>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Amount to Withdraw (KES)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={MIN_WITHDRAWAL_KES}
                  step="100"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-teal-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setRequestedAmount(balanceAvailable)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-teal-400 hover:text-teal-300 bg-teal-500/10 px-2 py-1 rounded-md"
                >
                  MAX
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Minimum: {MIN_WITHDRAWAL_KES.toLocaleString()} KES • Available: {balanceAvailable.toLocaleString()} KES
              </p>
            </div>

            {/* Address / Destination input */}
            {withdrawalMethod === 'crypto' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  USDT Wallet Address (TRC-20 or Polygon)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0x71C... or TR7NHqje..."
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500 transition"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Funds converted at spot market rate with zero deposit gas deductions.
                </span>
              </div>
            )}

            {withdrawalMethod === 'mpesa' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Safaricom M-Pesa Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. +254 712 345 678"
                  value={phoneOrAccount}
                  onChange={(e) => setPhoneOrAccount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            )}

            {withdrawalMethod === 'bank' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bank Name & Account Number / IBAN
                </label>
                <input
                  type="text"
                  placeholder="e.g. KCB Bank - Acc: 1234567890"
                  value={phoneOrAccount}
                  onChange={(e) => setPhoneOrAccount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            )}

            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={balanceAvailable < MIN_WITHDRAWAL_KES}
              className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:hover:bg-teal-500 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Queue Withdrawal for Friday Release</span>
            </button>
          </form>

          {/* Past Transactions */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Disbursement Log</span>
              <span className="text-[11px] text-slate-500">Auto-audited weekly</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden text-xs">
              {payoutHistory.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  No previous disbursements yet. Complete tasks and reach {MIN_WITHDRAWAL_KES.toLocaleString()} KES to schedule your first Friday release.
                </div>
              ) : (
                payoutHistory.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-900/50 transition">
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{item.amount.toLocaleString()} KES</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {item.method}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Scheduled for: {item.batchDisbursementDate || 'Pending'}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      Queued
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
