import React, { useState, useEffect } from 'react'
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Award, 
  ShieldAlert, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react'

export default function TaskRunner({ campaign, onFinish, onCancel }) {
  const [taskIndex, setTaskIndex] = useState(0)
  const [selectedModel, setSelectedModel] = useState(null)
  const [dimensionScores, setDimensionScores] = useState({
    factualAccuracy: 5,
    instructionFollowing: 5,
    helpfulness: 5,
    safety: 5
  })
  const [justification, setJustification] = useState('')
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState('')

  const currentTask = campaign.tasks[taskIndex] || campaign.tasks[0]

  // Task timer to ensure worker is taking legitimate time to read
  useEffect(() => {
    setTimeSpentSeconds(0)
    const interval = setInterval(() => {
      setTimeSpentSeconds(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [taskIndex])

  const handleScoreChange = (dim, val) => {
    setDimensionScores(prev => ({ ...prev, [dim]: val }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setValidationError('')

    if (!selectedModel) {
      setValidationError('Please select which response is superior (Model A or Model B).')
      return
    }

    if (justification.trim().length < 20) {
      setValidationError('Please provide a substantive justification (minimum 20 characters) explaining your choice.')
      return
    }

    // Minimum review time safeguard (prevents automated bot-clicking)
    if (timeSpentSeconds < 8) {
      setValidationError('Please review both outputs thoroughly before submitting (minimum 8s reading time).')
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      setIsSubmitting(false)
      const isCorrect = currentTask.expectedBetter ? selectedModel === currentTask.expectedBetter : true

      // Notify parent of successful task submission
      onFinish({
        campaignId: campaign.id,
        taskId: currentTask.id,
        chosen: selectedModel,
        earnedKes: campaign.rewardPerTask,
        isQualityPass: isCorrect,
        timeSeconds: timeSpentSeconds
      })

      // Move to next task or finish
      if (taskIndex + 1 < campaign.tasks.length) {
        setTaskIndex(prev => prev + 1)
        setSelectedModel(null)
        setJustification('')
      } else {
        // All tasks in this campaign segment finished
      }
    }, 600)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
          >
            ← Exit Task
          </button>
          <div className="h-4 w-px bg-slate-700"></div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>{campaign.title}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20">
                +{campaign.rewardPerTask} KES
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Client: <span className="text-slate-300 font-medium">{campaign.client}</span> • Task {taskIndex + 1} of {campaign.tasks.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span>Time on task: {Math.floor(timeSpentSeconds / 60)}m {timeSpentSeconds % 60}s</span>
          </div>
          <div className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg font-medium">
            Strict QA Active
          </div>
        </div>
      </div>

      {/* Guidelines Accordion */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Guidelines: </span>
          {campaign.instruction}
        </div>
      </div>

      {/* Prompt Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-semibold">User Prompt Input</span>
          <span className="text-xs text-slate-400 font-mono">ID: {currentTask.id}</span>
        </div>
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 font-mono text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
          {currentTask.prompt}
        </div>
      </div>

      {/* Side-by-side Response Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model A */}
        <div 
          onClick={() => setSelectedModel('A')}
          className={`cursor-pointer rounded-2xl border transition-all duration-200 p-6 flex flex-col justify-between ${
            selectedModel === 'A' 
              ? 'bg-teal-950/20 border-teal-500 shadow-lg shadow-teal-500/10 ring-1 ring-teal-500' 
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-teal-400">
                  A
                </span>
                Model Response A
              </span>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                selectedModel === 'A' ? 'border-teal-400 bg-teal-400 text-slate-950' : 'border-slate-700'
              }`}>
                {selectedModel === 'A' && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
            <div className="text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
              {currentTask.responseA}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-500">Click card or button to select</span>
            <button 
              type="button"
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                selectedModel === 'A' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {selectedModel === 'A' ? 'Selected as Superior' : 'Select Model A'}
            </button>
          </div>
        </div>

        {/* Model B */}
        <div 
          onClick={() => setSelectedModel('B')}
          className={`cursor-pointer rounded-2xl border transition-all duration-200 p-6 flex flex-col justify-between ${
            selectedModel === 'B' 
              ? 'bg-teal-950/20 border-teal-500 shadow-lg shadow-teal-500/10 ring-1 ring-teal-500' 
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-teal-400">
                  B
                </span>
                Model Response B
              </span>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                selectedModel === 'B' ? 'border-teal-400 bg-teal-400 text-slate-950' : 'border-slate-700'
              }`}>
                {selectedModel === 'B' && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
            <div className="text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
              {currentTask.responseB}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-500">Click card or button to select</span>
            <button 
              type="button"
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                selectedModel === 'B' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {selectedModel === 'B' ? 'Selected as Superior' : 'Select Model B'}
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Rubric & Evaluation Rationale */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Quality Rubric & Justification</span>
          <span className="text-xs text-slate-400 font-normal">(Required for AI alignment datasets)</span>
        </h3>

        {/* Rubric sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: 'factualAccuracy', label: 'Factual Accuracy' },
            { key: 'instructionFollowing', label: 'Instruction Following' },
            { key: 'helpfulness', label: 'Helpfulness & Tone' },
            { key: 'safety', label: 'Harmlessness / Safety' },
          ].map(dim => (
            <div key={dim.key} className="bg-slate-950/70 border border-slate-800/60 p-3.5 rounded-xl">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-slate-300 font-medium">{dim.label}</span>
                <span className="font-mono text-teal-400 font-bold">{dimensionScores[dim.key]}/5</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="5" 
                value={dimensionScores[dim.key]}
                onChange={(e) => handleScoreChange(dim.key, parseInt(e.target.value))}
                className="w-full accent-teal-500 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          ))}
        </div>

        {/* Written Justification */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Annotator Justification (Why is your chosen response superior?)
          </label>
          <textarea
            rows="3"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="E.g., Model A provided step-by-step math formulation and solved for the correct time and distance, whereas Model B made an arithmetic error..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
          />
          <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
            <span>Minimum 20 characters required</span>
            <span>{justification.length} / 20+ chars</span>
          </div>
        </div>

        {validationError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            Cancel / Save for Later
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-6 py-2.5 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition flex items-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>Submitting & Validating...</>
            ) : (
              <>
                <span>Submit Annotation (+{campaign.rewardPerTask} KES)</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
