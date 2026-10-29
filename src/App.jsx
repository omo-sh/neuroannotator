import React, { useState } from 'react'
import { 
  Bot, 
  Sparkles, 
  Wallet, 
  Award, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ChevronRight, 
  TrendingUp, 
  ShieldCheck,
  Building2,
  Users,
  AlertCircle,
  Lock,
  Unlock
} from 'lucide-react'
import { INITIAL_CAMPAIGNS, WORKER_QUALIFICATIONS, PLATFORM_RULES } from './data/mockData'
import TaskRunner from './components/TaskRunner'
import WalletModal from './components/WalletModal'
import ReferralSection from './components/ReferralSection'
import ClientCampaignCreator from './components/ClientCampaignCreator'
import CryptoDepositModal from './components/CryptoDepositModal'

export default function App() {
  const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS)
  const [activeCampaign, setActiveCampaign] = useState(null)
  const [currentTab, setCurrentTab] = useState('tasks') // 'tasks' | 'client' | 'referrals'
  
  // Task Activation / Anti-sybil Deposit Lock (5,000 KES)
  const [isTaskAccessUnlocked, setIsTaskAccessUnlocked] = useState(() => {
    return localStorage.getItem('neuro_task_access_unlocked') === 'true'
  })
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [pendingCampaignToStart, setPendingCampaignToStart] = useState(null)

  // Financial State
  const [balanceAvailable, setBalanceAvailable] = useState(26800) // Meets 25k KES threshold for test withdrawal
  const [balanceInReview, setBalanceInReview] = useState(4200)
  const [completedTasksCount, setCompletedTasksCount] = useState(54)
  const [accuracyScore, setAccuracyScore] = useState(97.2)
  const [isWalletOpen, setIsWalletOpen] = useState(false)
  const [payoutHistory, setPayoutHistory] = useState([
    {
      amount: 25000,
      method: "Crypto (USDT-Polygon)",
      batchDisbursementDate: "Friday, Oct 24, 2026",
      status: "Released"
    }
  ])

  // Handle deposit verification completion
  const handleDepositVerified = (txHash) => {
    setIsTaskAccessUnlocked(true)
    localStorage.setItem('neuro_task_access_unlocked', 'true')
    localStorage.setItem('neuro_deposit_txhash', txHash)
    if (pendingCampaignToStart) {
      setActiveCampaign(pendingCampaignToStart)
      setPendingCampaignToStart(null)
    }
  }

  // Handle campaign start click (requires unlocked deposit)
  const handleStartCampaignClick = (camp) => {
    if (!isTaskAccessUnlocked) {
      setPendingCampaignToStart(camp)
      setIsDepositModalOpen(true)
    } else {
      setActiveCampaign(camp)
    }
  }

  // Handle task submission from TaskRunner
  const handleTaskFinish = (submission) => {
    // Add earnings to pending balance for QA review
    setBalanceInReview(prev => prev + submission.earnedKes)
    setCompletedTasksCount(prev => prev + 1)

    // Update campaign progress
    setCampaigns(prev => prev.map(c => {
      if (c.id === submission.campaignId) {
        return { ...c, completedTasks: c.completedTasks + 1 }
      }
      return c
    }))
  }

  // Handle withdrawal request from WalletModal
  const handleRequestWithdrawal = (withdrawal) => {
    setBalanceAvailable(prev => Math.max(0, prev - withdrawal.amount))
    setPayoutHistory(prev => [withdrawal, ...prev])
  }

  // Handle new client campaign created
  const handleCreateCampaign = (newCamp) => {
    setCampaigns(prev => [newCamp, ...prev])
    setCurrentTab('tasks')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-teal-400" />
              </div>
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                NEURO<span className="text-teal-400">ANNOTATOR</span>
              </span>
              <span className="text-[10px] block font-mono text-slate-400 uppercase tracking-wider -mt-1">
                Precision AI Data & RLHF Hub
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900 border border-slate-800/80 p-1 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => { setActiveCampaign(null); setCurrentTab('tasks'); }}
              className={`px-4 py-1.5 rounded-xl transition ${
                currentTab === 'tasks' && !activeCampaign
                  ? 'bg-teal-500 text-slate-950 font-bold shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Task Workstation
            </button>
            <button
              onClick={() => { setActiveCampaign(null); setCurrentTab('client'); }}
              className={`px-4 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                currentTab === 'client' 
                  ? 'bg-teal-500 text-slate-950 font-bold shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Client Escrow (B2B)</span>
            </button>
            <button
              onClick={() => { setActiveCampaign(null); setCurrentTab('referrals'); }}
              className={`px-4 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                currentTab === 'referrals' 
                  ? 'bg-teal-500 text-slate-950 font-bold shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Referrals (500 KES)</span>
            </button>
          </nav>

          {/* Right User Bar & Wallet Pill */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsWalletOpen(true)}
              className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 px-3.5 py-1.5 rounded-xl transition shadow-sm group"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-105 transition">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold tracking-wider">
                  Available (Friday)
                </div>
                <div className="text-xs font-mono font-bold text-white group-hover:text-teal-400 transition">
                  {balanceAvailable.toLocaleString()} <span className="text-[10px] font-sans font-normal text-teal-400">KES</span>
                </div>
              </div>
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-teal-400 font-mono">
                IS
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* If Active Campaign is running, render TaskRunner directly */}
        {activeCampaign ? (
          <TaskRunner
            campaign={activeCampaign}
            onFinish={handleTaskFinish}
            onCancel={() => setActiveCampaign(null)}
          />
        ) : (
          <>
            {/* Top Metric Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                  <span>Target Earnings</span>
                </div>
                <div className="text-xl font-bold font-mono text-teal-400">
                  {PLATFORM_RULES.TARGET_WEEKLY_EARNINGS_KES.toLocaleString()} <span className="text-xs font-normal text-slate-400 font-sans">KES / week</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Accuracy Benchmark</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {accuracyScore}% <span className="text-xs font-normal text-slate-400 font-sans">consensus</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>QA Review Queue</span>
                </div>
                <div className="text-xl font-bold font-mono text-amber-400">
                  {balanceInReview.toLocaleString()} <span className="text-xs font-normal text-slate-400 font-sans">KES</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  <span>Settlement Cycle</span>
                </div>
                <div className="text-xs font-semibold text-white mt-1">
                  1 Week (Min {PLATFORM_RULES.MIN_WITHDRAWAL_KES.toLocaleString()} KES)
                </div>
              </div>
            </div>

            {/* Tab Views */}
            {currentTab === 'tasks' && (
              <div className="space-y-6">
                {/* Deposit Activation Banner if not unlocked */}
                {!isTaskAccessUnlocked ? (
                  <div className="bg-gradient-to-r from-teal-950/60 via-slate-900 to-amber-950/30 border border-teal-500/30 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl">
                    <div className="space-y-2 max-w-xl">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Security Deposit Required • 5,000 KES</span>
                      </div>
                      <h2 className="text-xl font-extrabold text-white">
                        Task Access Locked: Activate Your Annotator Account
                      </h2>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        To receive live production tasks and target up to <strong className="text-teal-400">12,000 KES / week</strong>, submit your one-time refundable sybil security bond of <strong className="text-white">5,000 KES</strong> via Crypto (USDT / BTC).
                      </p>
                    </div>
                    <button
                      onClick={() => setIsDepositModalOpen(true)}
                      className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 transition shrink-0"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>Deposit 5,000 KES to Unlock</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl px-5 py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 text-emerald-400 font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Task Account Active • 5,000 KES Security Bond Confirmed on Blockchain</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">Status: Unlocked</span>
                  </div>
                )}
                {/* Hero / Instruction Banner */}
                <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/20 rounded-3xl p-6 relative overflow-hidden">
                  <div className="max-w-2xl space-y-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400">
                      Live Production Task Feed
                    </span>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                      Train Frontier AI Models with Human Feedback
                    </h1>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Select an active client campaign below to start annotating. All tasks pay out per verified completion, reviewed through automated consensus and released weekly on Fridays.
                    </p>
                  </div>
                </div>

                {/* Campaign Feeds */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                      Available Annotation Batches ({campaigns.length})
                    </h2>
                    <span className="text-xs text-slate-500">Updated in real-time</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {campaigns.map((camp) => (
                      <div
                        key={camp.id}
                        className="bg-slate-900 border border-slate-800 hover:border-teal-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-teal-500/5 group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
                              +{camp.rewardPerTask} KES / task
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {camp.tierRequired}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                              Client: {camp.client}
                            </span>
                            <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition mt-0.5">
                              {camp.title}
                            </h3>
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {camp.description}
                          </p>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-3">
                          {/* Progress Bar */}
                          <div>
                            <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
                              <span>Batch Progress</span>
                              <span>{Math.round((camp.completedTasks / camp.totalTasks) * 100)}%</span>
                            </div>
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-teal-500 h-full rounded-full transition-all"
                                style={{ width: `${(camp.completedTasks / camp.totalTasks) * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleStartCampaignClick(camp)}
                            className="w-full py-2.5 bg-slate-800 group-hover:bg-teal-500 text-slate-200 group-hover:text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                          >
                            <span>Start Annotating</span>
                            {!isTaskAccessUnlocked ? (
                              <Lock className="w-3.5 h-3.5 text-amber-400 group-hover:text-slate-950" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Worker Qualification Badges */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-teal-400" />
                        <span>Skill-Based Qualification Badges</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Pass free accuracy benchmark exams to unlock higher-tier datasets without any upfront payment.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {WORKER_QUALIFICATIONS.map((q) => (
                      <div key={q.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {q.level}
                            </span>
                            {q.passed ? (
                              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                                <CheckCircle2 className="w-3 h-3" /> Certified ({q.score})
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-500">
                                Exam Required
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-white mb-1">{q.name}</h4>
                          <p className="text-[11px] text-slate-400">{q.tasksUnlocked}</p>
                        </div>

                        {!q.passed && (
                          <button 
                            onClick={() => alert("Starting qualification exam simulation...")}
                            className="mt-4 text-xs font-semibold py-1.5 px-3 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/20 transition text-center"
                          >
                            Take Qualification Exam
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Referrals Section */}
                <ReferralSection />
              </div>
            )}

            {currentTab === 'client' && (
              <ClientCampaignCreator onCreateCampaign={handleCreateCampaign} />
            )}

            {currentTab === 'referrals' && (
              <div className="space-y-6">
                <ReferralSection />
              </div>
            )}
          </>
        )}
      </main>

      {/* Friday Wallet & Disbursement Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        balanceAvailable={balanceAvailable}
        balanceInReview={balanceInReview}
        payoutHistory={payoutHistory}
        onRequestWithdrawal={handleRequestWithdrawal}
      />

      {/* Crypto Security Deposit Modal (5,000 KES Task Unlock) */}
      <CryptoDepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onDepositVerified={handleDepositVerified}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 NeuroAnnotator Platform • Built for Verified AI Model Alignment</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>1-Week Settlement Protocol</span>
            <span>•</span>
            <span>{PLATFORM_RULES.MIN_WITHDRAWAL_KES.toLocaleString()} KES Minimum Threshold</span>
            <span>•</span>
            <span>Weekdays Only</span>
            <span>•</span>
            <span>Crypto / M-Pesa / Bank Wire</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
