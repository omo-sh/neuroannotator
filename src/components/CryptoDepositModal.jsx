import React, { useState } from 'react'
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  Coins, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  Lock,
  QrCode,
  Smartphone,
  Zap
} from 'lucide-react'
import { PLATFORM_RULES, CRYPTO_DEPOSIT_CONFIG } from '../data/mockData'

export default function CryptoDepositModal({ 
  isOpen, 
  onClose, 
  onDepositVerified,
  defaultAmount = 5000
}) {
  const [depositTab, setDepositTab] = useState('mpesa') // 'mpesa' | 'crypto'
  
  // M-Pesa STK State
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [mpesaAmount, setMpesaAmount] = useState(() => String(defaultAmount || 5000))
  const [mpesaReceipt, setMpesaReceipt] = useState('')
  const [stkLoading, setStkLoading] = useState(false)
  const [stkSuccessMsg, setStkSuccessMsg] = useState('')
  const [mpesaError, setMpesaError] = useState('')
  const [submittingReceipt, setSubmittingReceipt] = useState(false)

  // Crypto State
  const [selectedNetworkIndex, setSelectedNetworkIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen) return null

  const currentNetwork = CRYPTO_DEPOSIT_CONFIG[selectedNetworkIndex]

  // M-Pesa STK Push trigger
  const handleTriggerMpesaStk = async () => {
    setMpesaError('')
    setStkSuccessMsg('')

    if (!mpesaPhone.trim()) {
      setMpesaError('Please enter your Safaricom M-Pesa phone number (e.g. 0712 345 678)')
      return
    }

    const numericAmount = Math.max(1, Math.round(Number(mpesaAmount) || 5000))
    setStkLoading(true)

    try {
      const res = await fetch('/api/deposits?action=mpesa_stk_push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localStorage.getItem('neuro_user_id') || 'guest_worker',
          username: localStorage.getItem('neuro_username') || 'annotator',
          phone: mpesaPhone.trim(),
          amountKes: numericAmount
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch M-Pesa prompt.')
      }

      setStkSuccessMsg(`📲 STK push prompt for KSh ${numericAmount.toLocaleString()} sent! Check your phone (${mpesaPhone}) now and enter your M-Pesa PIN.`)
    } catch (err) {
      console.error(err)
      setMpesaError(err.message || 'Error communicating with Safaricom Daraja.')
    } finally {
      setStkLoading(false)
    }
  }

  // M-Pesa manual receipt submission
  const handleSubmitMpesaReceipt = async (e) => {
    e.preventDefault()
    setMpesaError('')

    const code = mpesaReceipt.trim().toUpperCase()
    if (!code || code.length < 6) {
      setMpesaError('Please enter a valid 10-character M-Pesa transaction code.')
      return
    }

    setSubmittingReceipt(true)
    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localStorage.getItem('neuro_user_id') || 'guest_worker',
          username: localStorage.getItem('neuro_username') || 'annotator',
          email: localStorage.getItem('neuro_email') || '',
          network: 'M-Pesa Paybill 5570700',
          depositAddress: mpesaPhone.trim() || '254700000000',
          amountKes: Number(mpesaAmount) || 5000,
          amountUsdt: Math.round(((Number(mpesaAmount) || 5000) / 130) * 10) / 10,
          txHash: code
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to record deposit code.')

      setIsSuccess(true)
      setTimeout(() => {
        onDepositVerified(code)
        onClose()
      }, 1500)
    } catch (err) {
      setMpesaError(err.message || 'Failed to submit confirmation code.')
    } finally {
      setSubmittingReceipt(false)
    }
  }

  // Crypto copy address
  const copyAddress = () => {
    navigator.clipboard.writeText(currentNetwork.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Crypto verify Tx
  const handleVerifyTx = (e) => {
    e.preventDefault()
    setVerificationError('')

    const trimmed = txHash.trim()
    if (!trimmed) {
      setVerificationError('Please enter your crypto transaction hash or ID (TxHash).')
      return
    }

    if (trimmed.length < 16) {
      setVerificationError('Please enter a valid transaction hash (at least 16 characters).')
      return
    }

    setIsVerifying(true)

    fetch('/api/deposits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: localStorage.getItem('neuro_user_id') || 'guest_worker',
        username: localStorage.getItem('neuro_username') || 'annotator',
        email: localStorage.getItem('neuro_email') || '',
        network: currentNetwork.network,
        depositAddress: currentNetwork.address,
        amountKes: 5000,
        amountUsdt: currentNetwork.depositUsdt || 38.5,
        txHash: trimmed
      })
    })
      .then(res => res.json())
      .catch(err => console.error('Failed to save deposit record:', err))
      .finally(() => {
        setIsVerifying(false)
        setIsSuccess(true)
        setTimeout(() => {
          onDepositVerified(trimmed)
          onClose()
        }, 1500)
      })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-teal-500/30 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col relative">
        {/* Glow decoration */}
        <div className="absolute top-0 right-10 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Task Access Activation</span>
                <span className="text-[10px] bg-teal-500/10 border border-teal-500/20 text-teal-400 font-mono px-2 py-0.5 rounded-full">
                  5,000 KES Required
                </span>
              </h2>
              <p className="text-xs text-slate-400">One-time refundable security bond via M-Pesa or Crypto</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Payment Channel Toggle (M-Pesa STK Prompt vs Crypto) */}
        <div className="px-6 pt-4">
          <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setDepositTab('mpesa')}
              className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                depositTab === 'mpesa'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>M-Pesa Instant Prompt (Kenya)</span>
            </button>
            <button
              type="button"
              onClick={() => setDepositTab('crypto')}
              className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                depositTab === 'crypto'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Crypto (USDT / BTC)</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {depositTab === 'mpesa' ? (
            <div className="space-y-5">
              {/* Informational Policy Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Automated Safaricom M-Pesa STK Push</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your Safaricom number and deposit amount below to receive an instant PIN prompt on your phone screen. Your bond is credited to your active workstation balance.
                </p>
              </div>

              {/* STK Push Dispatch Box */}
              <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      M-Pesa Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="07XX XXX XXX"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Deposit Amount (KES) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="5000"
                      value={mpesaAmount}
                      onChange={(e) => setMpesaAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 text-emerald-400 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerMpesaStk}
                  disabled={stkLoading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  <span>
                    {stkLoading 
                      ? 'Dispatching STK Push...' 
                      : `Send M-Pesa STK Prompt (KSh ${Number(mpesaAmount || 0).toLocaleString()})`}
                  </span>
                </button>

                {stkSuccessMsg && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{stkSuccessMsg}</span>
                  </div>
                )}

                {mpesaError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{mpesaError}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Informational Policy Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Refundable Annotator Security Bond</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  To prevent bot spam and sybil abuse, contributors lock a one-time activation deposit of <strong className="text-white">{PLATFORM_RULES.TASK_ACTIVATION_DEPOSIT_KES.toLocaleString()} KES</strong> (~{currentNetwork.depositUsdt || currentNetwork.depositBtc} {currentNetwork.network.split(' ')[0]}).
                </p>
              </div>

              {/* Network Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  1. Select Deposit Network
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CRYPTO_DEPOSIT_CONFIG.map((net, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedNetworkIndex(idx)
                        setTxHash('')
                        setVerificationError('')
                      }}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1.5 ${
                        selectedNetworkIndex === idx
                          ? 'bg-teal-500/10 border-teal-500 shadow-sm'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-[11px] text-white">
                          {net.network.split(' ')[0]}
                        </span>
                        {net.recommended && (
                          <span className="text-[8px] bg-teal-500/20 text-teal-400 px-1 py-0.2 rounded font-mono uppercase">
                            Fast
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono truncate">
                        {net.network.includes('TRC20') ? 'TRC-20' : net.network.includes('Polygon') ? 'Polygon' : 'BTC'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Deposit Address & Amount Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">2. Send Exact Equivalent Amount</span>
                  <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-lg">
                    {currentNetwork.depositUsdt ? `${currentNetwork.depositUsdt} USDT` : `${currentNetwork.depositBtc} BTC`} (5,000 KES)
                  </span>
                </div>

                {/* Address copy container */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                    Official {currentNetwork.network} Deposit Address:
                  </span>
                  <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5">
                    <span className="text-xs font-mono text-teal-300 truncate select-all">
                      {currentNetwork.address}
                    </span>
                    <button
                      type="button"
                      onClick={copyAddress}
                      className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 font-semibold text-xs flex items-center gap-1.5 transition shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-teal-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Verification Form */}
              <form onSubmit={handleVerifyTx} className="space-y-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    3. Enter Transaction Hash (TxHash / TxID)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter transaction hash or ID"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    disabled={isVerifying || isSuccess}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                {verificationError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{verificationError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying || isSuccess}
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Confirming on Blockchain...</span>
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tasks Unlocked</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Unlock Task Workstation</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {isSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Deposit confirmed successfully! Unlocking all production training campaigns...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
