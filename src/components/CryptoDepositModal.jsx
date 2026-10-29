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
  QrCode
} from 'lucide-react'
import { PLATFORM_RULES, CRYPTO_DEPOSIT_CONFIG } from '../data/mockData'

export default function CryptoDepositModal({ 
  isOpen, 
  onClose, 
  onDepositVerified 
}) {
  const [selectedNetworkIndex, setSelectedNetworkIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen) return null

  const currentNetwork = CRYPTO_DEPOSIT_CONFIG[selectedNetworkIndex]

  const copyAddress = () => {
    navigator.clipboard.writeText(currentNetwork.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

    // Simulate blockchain node confirmation
    setTimeout(() => {
      setIsVerifying(false)
      setIsSuccess(true)
      setTimeout(() => {
        onDepositVerified(trimmed)
        onClose()
      }, 1500)
    }, 1800)
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
              <p className="text-xs text-slate-400">Anti-sybil validator security deposit via Crypto</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Informational Policy Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Refundable Annotator Security Bond</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              To prevent bot spam, automated synthetic spamming, and sybil abuse, contributors must make a one-time activation deposit of <strong className="text-white">{PLATFORM_RULES.TASK_ACTIVATION_DEPOSIT_KES.toLocaleString()} KES</strong> (~{currentNetwork.depositUsdt || currentNetwork.depositBtc} {currentNetwork.network.split(' ')[0]}).
            </p>
            <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1.5 border-t border-slate-800/80">
              <span className="text-emerald-400 font-bold">•</span>
              <span>Fully credited toward your task clearance and refunded upon platform graduation or account closure.</span>
            </div>
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
                    setCopied(false)
                  }}
                  className={`p-3 rounded-xl border text-xs font-semibold transition text-left flex flex-col justify-between ${
                    selectedNetworkIndex === idx
                      ? 'bg-teal-500/10 border-teal-500 text-teal-300 shadow-sm shadow-teal-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
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

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <QrCode className="w-3.5 h-3.5 text-teal-400" />
              <span>Ensure you send on the exact <strong className="text-white">{currentNetwork.network}</strong> network to avoid loss of funds.</span>
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
                placeholder="Paste transaction ID e.g. 0x8f2a... or f4b7d..."
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                disabled={isVerifying || isSuccess}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500 transition"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Obtained from your Binance, Bybit, Trust Wallet, or exchange withdrawal receipt.
              </span>
            </div>

            {verificationError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{verificationError}</span>
              </div>
            )}

            {isSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Deposit verified successfully! Unlocking all production training campaigns...</span>
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
                  <span>Verify Deposit & Unlock Task Access</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
