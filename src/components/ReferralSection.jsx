import React, { useState } from 'react'
import { 
  Users, 
  Copy, 
  Check, 
  Share2, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  Award
} from 'lucide-react'

export default function ReferralSection({ referralCode = "NEURO-8829" }) {
  const [copied, setCopied] = useState(false)

  const referralLink = `https://neuroannotator.ai/join?ref=${referralCode}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Contributor Program</span>
          </div>
          <h3 className="text-lg font-bold text-white">
            Invite High-Accuracy Annotators
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Earn a recurring <strong className="text-white">5% commission</strong> from the platform service fee on every verified, quality-approved task your invited peers complete—credited straight into your Friday payout balance.
          </p>
        </div>

        {/* Copy Link Box */}
        <div className="w-full md:w-auto bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2 min-w-[280px]">
          <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
            Your Contributor Referral Link
          </span>
          <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
            <span className="text-xs font-mono text-slate-200 truncate select-all">
              {referralLink}
            </span>
            <button
              onClick={copyToClipboard}
              className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 transition shrink-0"
              title="Copy referral link"
            >
              {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-0.5">
            <span>Referrals Active: <strong>3 peers</strong></span>
            <span>Earned: <strong>1,850 KES</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}
