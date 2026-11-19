import React, { useState, useEffect } from 'react'
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
  Unlock,
  LogIn,
  LogOut,
  SlidersHorizontal
} from 'lucide-react'
import { INITIAL_CAMPAIGNS, WORKER_QUALIFICATIONS, PLATFORM_RULES } from './data/mockData'
import TaskRunner from './components/TaskRunner'
import WalletModal from './components/WalletModal'
import ReferralSection from './components/ReferralSection'
import ClientCampaignCreator from './components/ClientCampaignCreator'
import CryptoDepositModal from './components/CryptoDepositModal'
import AuthModal from './components/AuthModal'
import AdminPortal from './components/AdminPortal'
import BenchmarkExamModal from './components/BenchmarkExamModal'

export default function App() {
  const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS)
  const [activeCampaign, setActiveCampaign] = useState(null)
  const [activationDepositKes, setActivationDepositKes] = useState(5000)
  const [isExamModalOpen, setIsExamModalOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (path === '/portal' || path === '/admin' || hash === '#portal' || hash === '#admin') ? 'admin' : 'tasks';
  });

  useEffect(() => {
    const checkAdminRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/portal' || path === '/admin' || hash === '#portal' || hash === '#admin') {
        setCurrentTab('admin');
      } else if (currentTab === 'admin') {
        setCurrentTab('tasks');
      }
    };
    window.addEventListener('popstate', checkAdminRoute);
    window.addEventListener('hashchange', checkAdminRoute);
    return () => {
      window.removeEventListener('popstate', checkAdminRoute);
      window.removeEventListener('hashchange', checkAdminRoute);
    };
  }, [currentTab]);
  
  // Auth & Session State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('neuro_user_session')
      return saved ? JSON.parse(saved) : null
    } catch (_) {
      return null
    }
  })
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Task Activation / Anti-sybil Deposit Lock (5,000 KES)
  const [isTaskAccessUnlocked, setIsTaskAccessUnlocked] = useState(() => {
    return localStorage.getItem('neuro_task_access_unlocked') === 'true'
  })
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [pendingCampaignToStart, setPendingCampaignToStart] = useState(null)

  // Financial State
  const [balanceAvailable, setBalanceAvailable] = useState(() => {
    return currentUser ? Number(currentUser.balance_available) || 0 : 26800
  })
  const [balanceInReview, setBalanceInReview] = useState(() => {
    return currentUser ? Number(currentUser.balance_in_review) || 0 : 4200
  })
  const [completedTasksCount, setCompletedTasksCount] = useState(() => {
    return currentUser ? Number(currentUser.completed_tasks_count) || 0 : 54
  })
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

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('neuro_user_id', currentUser.id)
      localStorage.setItem('neuro_username', currentUser.username)
      localStorage.setItem('neuro_email', currentUser.email || '')
      if (currentUser.is_task_unlocked) {
        setIsTaskAccessUnlocked(true)
        localStorage.setItem('neuro_task_access_unlocked', 'true')
      }
      setBalanceAvailable(currentUser.balance_available ?? 0)
      setBalanceInReview(currentUser.balance_in_review ?? 0)
      setCompletedTasksCount(currentUser.completed_tasks_count ?? 0)
    }
  }, [currentUser])

  // Fetch platform settings (deposit amount)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin?action=overview')
        if (res.ok) {
          const json = await res.json()
          if (json.settings?.activation_deposit_kes) {
            setActivationDepositKes(json.settings.activation_deposit_kes)
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      }
    }
    fetchSettings()
  }, [])

  // Refresh profile data periodically
  useEffect(() => {
    if (!currentUser?.id) return
    const refreshProfile = async () => {
      try {
        const res = await fetch(`/api/auth?action=me&userId=${currentUser.id}`)
        if (res.ok) {
          const fresh = await res.json()
          setCurrentUser(prev => ({ ...prev, ...fresh }))
          localStorage.setItem('neuro_user_session', JSON.stringify({ ...currentUser, ...fresh }))
          if (fresh.is_task_unlocked) {
            setIsTaskAccessUnlocked(true)
            localStorage.setItem('neuro_task_access_unlocked', 'true')
          }
          if (fresh.exam_status === 'pending') {
            setIsExamModalOpen(true)
          }
        }
      } catch (err) {
        console.error('Session sync error:', err)
      }
    }
    refreshProfile()
  }, [])

  // Handle Login / Sign Out
  const handleAuthSuccess = (user) => {
    setCurrentUser(user)
    if (user.is_super_admin) {
      setCurrentTab('admin')
    } else if (user.exam_status === 'pending') {
      setIsExamModalOpen(true)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('neuro_user_session')
    localStorage.removeItem('neuro_user_id')
    localStorage.removeItem('neuro_username')
    localStorage.removeItem('neuro_email')
    setCurrentUser(null)
    setIsTaskAccessUnlocked(false)
    localStorage.removeItem('neuro_task_access_unlocked')
    setCurrentTab('tasks')
  }

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
    if (!currentUser) {
      setIsAuthModalOpen(true)
      return
    }

    if (!isTaskAccessUnlocked) {
      setPendingCampaignToStart(camp)
      setIsDepositModalOpen(true)
    } else {
      setActiveCampaign(camp)
    }
  }

  // Handle task submission from TaskRunner
  const handleTaskFinish = (submission) => {
    setBalanceInReview(prev => prev + submission.earnedKes)
    setCompletedTasksCount(prev => prev + 1)

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

  const isSuperAdmin = currentUser?.is_super_admin || currentUser?.username === 'admin' || currentUser?.role === 'super_admin'

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

            {/* Auth Button or User Profile Pill */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center font-bold text-xs text-teal-300 font-mono" title={currentUser.username}>
                  {currentUser.username.substring(0, 2).toUpperCase()}
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        
        {/* Render Admin Portal if admin tab active */}
        {currentTab === 'admin' ? (
          <AdminPortal currentUser={currentUser} />
        ) : activeCampaign ? (
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
                  Automated Weekly (Fridays)
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Min: {PLATFORM_RULES.MIN_WITHDRAWAL_KES.toLocaleString()} KES • Weekdays
                </div>
              </div>
            </div>

            {/* TAB CONTENT */}
            {currentTab === 'tasks' && (
              <div className="space-y-6">
                
                {/* Anti-Sybil / Security Deposit Banner */}
                {!isTaskAccessUnlocked && (
                  <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 rounded-3xl p-6 relative overflow-hidden">
                    <div className="max-w-2xl space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold font-mono">
                        <Lock className="w-3 h-3" />
                        <span>Worker Account Activation Required</span>
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        Activate Evaluation Tasks with One-Time Security Deposit
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        To maintain high dataset integrity and quality benchmarks, new evaluators lock a refundable <strong>{activationDepositKes.toLocaleString()} KES (~{(activationDepositKes / 130).toFixed(1)} USDT)</strong> security bond. Deposits are credited to your active workstation balance and unlock immediate task queue access.
                      </p>
                      <div className="flex flex-wrap items-center gap-4 pt-2">
                        <button
                          onClick={() => {
                            if (!currentUser) setIsAuthModalOpen(true)
                            else setIsDepositModalOpen(true)
                          }}
                          className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition flex items-center gap-2"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Unlock All High-Yield Campaigns ({activationDepositKes.toLocaleString()} KES)</span>
                        </button>
                        <span className="text-xs text-slate-400 font-mono">
                          Accepted: M-Pesa Express • USDT (TRC20 / Polygon) • BTC
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Campaign Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">Live AI Training Campaigns</h3>
                      <p className="text-xs text-slate-400">Select a project segment to begin evaluation & RLHF labeling</p>
                    </div>
                    <span className="text-xs font-mono text-slate-500">{campaigns.length} Active Benchmarks</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {campaigns.map((camp) => (
                      <div
                        key={camp.id}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition group shadow-sm"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {camp.category}
                            </span>
                            <span className="text-xs font-mono font-bold text-teal-400">
                              +{camp.rewardPerTask} KES / task
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-white group-hover:text-teal-400 transition">
                              {camp.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              Client: {camp.client}
                            </p>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                            {camp.description}
                          </p>

                          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>Queue Completion</span>
                              <span className="font-mono">{Math.round((camp.completedTasks / camp.totalTasks) * 100)}%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-teal-500 h-1.5 rounded-full" 
                                style={{ width: `${(camp.completedTasks / camp.totalTasks) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mt-2">
                          <button
                            onClick={() => handleStartCampaignClick(camp)}
                            className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-white transition flex items-center justify-center gap-1.5 group-hover:bg-teal-500 group-hover:text-slate-950 shadow"
                          >
                            <span>{!isTaskAccessUnlocked ? 'Unlock Queue & Start' : 'Start Annotation Queue'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Worker Tier Qualifications */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-teal-400" />
                        <span>Domain Certification & Skill Badges</span>
                      </h3>
                      <p className="text-xs text-slate-400">Higher tiers unlock high-yield clinical medical summaries, financial math, and STEM reasoning (+200% payout)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {WORKER_QUALIFICATIONS.map((q) => (
                      <div 
                        key={q.id}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between"
                      >
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

      {/* Auth Modal (Sign In / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Friday Wallet & Disbursement Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        balanceAvailable={balanceAvailable}
        balanceInReview={balanceInReview}
        payoutHistory={payoutHistory}
        onRequestWithdrawal={handleRequestWithdrawal}
      />

      {/* Crypto Security Deposit Modal */}
      <CryptoDepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onDepositVerified={handleDepositVerified}
        defaultAmount={activationDepositKes}
      />

      {/* Benchmark Accuracy Exam Modal (10 Paid Evaluation Tasks) */}
      <BenchmarkExamModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        currentUser={currentUser}
        onExamSubmitted={(examResult) => {
          if (currentUser) {
            const updated = { ...currentUser, exam_score: examResult.score, exam_status: examResult.status }
            setCurrentUser(updated)
            localStorage.setItem('neuro_user_session', JSON.stringify(updated))
          }
          if (examResult.rewardKes) {
            setBalanceInReview(prev => prev + examResult.rewardKes)
          }
        }}
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
