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
  AlertCircle
} from 'lucide-react'
import { INITIAL_CAMPAIGNS, WORKER_QUALIFICATIONS } from './data/mockData'
import TaskRunner from './components/TaskRunner'
import WalletModal from './components/WalletModal'
import ReferralSection from './components/ReferralSection'
import ClientCampaignCreator from './components/ClientCampaignCreator'

export default function App() {
  const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS)
  const [activeCampaign, setActiveCampaign] = useState(null)
  const [currentTab, setCurrentTab] = useState('tasks') // 'tasks' | 'client' | 'referrals'
  
  // Financial State
  const [balanceAvailable, setBalanceAvailable] = useState(12450) // Above 10k KES to allow demo withdrawal
  const [balanceInReview, setBalanceInReview] = useState(3800)
  const [completedTasksCount, setCompletedTasksCount] = useState(48)
  const [accuracyScore, setAccuracyScore] = useState(96.4)
  const [isWalletOpen, setIsWalletOpen] = useState(false)
  const [payoutHistory, setPayoutHistory] = useState([
    {
      amount: 14200,
      method: "Crypto (USDT-Polygon)",
      batchDisbursementDate: "Friday, Oct 17, 2026",
      status: "Released"
    }
  ])

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
              <span>Referrals (5%)</span>
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
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Tasks Completed</span>
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {completedTasksCount} <span className="text-xs font-normal text-slate-400 font-sans">verified</span>
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
                  Every Friday (Min 10,000 KES)
                </div>
              </div>
            </div>

            {/* Tab Views */}
            {currentTab === 'tasks' && (
              <div className="space-y-6">
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
                            onClick={() => setActiveCampaign(camp)}
                            className="w-full py-2.5 bg-slate-800 group-hover:bg-teal-500 text-slate-200 group-hover:text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                          >
                            <span>Start Annotating</span>
                            <ChevronRight className="w-3.5 h-3.5" />
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

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 NeuroAnnotator Platform • Built for Verified AI Model Alignment</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Friday Settlement Protocol</span>
            <span>•</span>
            <span>10,000 KES Minimum Threshold</span>
            <span>•</span>
            <span>Crypto / M-Pesa / Bank Wire</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
