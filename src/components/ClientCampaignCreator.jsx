import React, { useState } from 'react'
import { 
  Building2, 
  PlusCircle, 
  Coins, 
  Users, 
  BarChart3, 
  CheckCircle, 
  Clock, 
  FileText,
  DollarSign
} from 'lucide-react'

export default function ClientCampaignCreator({ onCreateCampaign }) {
  const [clientName, setClientName] = useState('My AI Startup Inc.')
  const [title, setTitle] = useState('Code Quality & Python Logic Benchmark')
  const [category, setCategory] = useState('Code & Technical Reasoning')
  const [rewardPerTask, setRewardPerTask] = useState(120) // KES per task paid to worker
  const [totalTaskCount, setTotalTaskCount] = useState(200)
  const [promptText, setPromptText] = useState('Given a function that computes Fibonacci numbers, identify whether memoization is properly implemented.')
  const [respA, setRespA] = useState('def fib(n, memo={}):\n    if n in memo: return memo[n]\n    if n <= 1: return n\n    memo[n] = fib(n-1, memo) + fib(n-2, memo)\n    return memo[n]')
  const [respB, setRespB] = useState('def fib(n):\n    if n <= 1: return n\n    return fib(n-1) + fib(n-2)')
  const [success, setSuccess] = useState(false)

  // Platform fee calculation (30% service margin)
  const workerPoolTotal = rewardPerTask * totalTaskCount
  const platformFee = Math.round(workerPoolTotal * 0.3)
  const totalClientDeposit = workerPoolTotal + platformFee

  const handleCreate = (e) => {
    e.preventDefault()

    const newCampaign = {
      id: `camp-${Date.now()}`,
      client: clientName,
      title,
      category,
      rewardPerTask: Number(rewardPerTask),
      tierRequired: "Level 1 (Novice)",
      estimatedMinutes: 3,
      totalTasks: Number(totalTaskCount),
      completedTasks: 0,
      badgeColor: "teal",
      description: "Evaluate Python snippet efficiency and safety constraints.",
      instruction: "Examine code structure for performance bottlenecks or edge-case handling.",
      tasks: [
        {
          id: `t-${Date.now()}`,
          prompt: promptText,
          responseA: respA,
          responseB: respB,
          expectedBetter: "A",
          rationale: "Response A uses memoization to reduce time complexity to O(n)."
        }
      ]
    }

    onCreateCampaign(newCampaign)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-400" />
            <span>Client Campaign Creator (B2B Task Deposit)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Deposit annotation budgets to request verified human worker feedback
          </p>
        </div>
        <div className="text-xs font-mono bg-teal-500/10 text-teal-400 px-3 py-1 rounded-full border border-teal-500/20">
          Escrow Protection Active
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Client / Company Name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Campaign Project Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Task Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Worker Payout / Task (KES)</label>
            <input
              type="number"
              value={rewardPerTask}
              onChange={(e) => setRewardPerTask(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Batch Quantity (Units)</label>
            <input
              type="number"
              value={totalTaskCount}
              onChange={(e) => setTotalTaskCount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Financial Escrow Breakdown */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-slate-400 block text-[11px]">Worker Allocation:</span>
            <span className="font-mono text-sm font-bold text-white">{workerPoolTotal.toLocaleString()} KES</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Platform QA Fee (30%):</span>
            <span className="font-mono text-sm font-bold text-teal-400">+{platformFee.toLocaleString()} KES (Your Profit)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Total Escrow Funded:</span>
            <span className="font-mono text-sm font-bold text-emerald-400">{totalClientDeposit.toLocaleString()} KES</span>
          </div>
        </div>

        {/* Sample Prompt and Responses */}
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Sample Evaluation Prompt</label>
            <textarea
              rows="2"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Model Candidate A</label>
              <textarea
                rows="3"
                value={respA}
                onChange={(e) => setRespA(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Model Candidate B</label>
              <textarea
                rows="3"
                value={respB}
                onChange={(e) => setRespB(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Campaign deposited to escrow and live on worker workstation feeds!</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Deploy Client Campaign to Task Pool ({totalClientDeposit.toLocaleString()} KES)</span>
        </button>
      </form>
    </div>
  )
}
