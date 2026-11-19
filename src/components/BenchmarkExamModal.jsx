import React, { useState } from 'react'
import { 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  HelpCircle, 
  ArrowRight, 
  ShieldCheck,
  Send,
  Sparkles
} from 'lucide-react'
import { BENCHMARK_ACCURACY_EXAM } from '../data/mockData'

export default function BenchmarkExamModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onExamSubmitted 
}) {
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState(null) // { score, passed, rewardKes }

  if (!isOpen) return null

  const totalQuestions = BENCHMARK_ACCURACY_EXAM.length
  const answeredCount = Object.keys(answers).length
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100)

  const handleSelectOption = (questionId, optionKey) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionKey }))
  }

  const handleSubmitExam = async () => {
    setErrorMsg('')
    if (answeredCount < totalQuestions) {
      setErrorMsg(`Please evaluate all 10 tasks before submitting. (${answeredCount}/${totalQuestions} completed)`)
      return
    }

    setSubmitting(true)
    try {
      const userId = currentUser?.id || localStorage.getItem('neuro_user_id')
      const res = await fetch('/api/tasks?action=submit_exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          answers
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit exam.')
      }

      setResult(data)
      if (onExamSubmitted) {
        onExamSubmitted(data)
      }
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 relative">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold font-mono mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>RLHF Calibration & Quality Gate</span>
            </div>
            <h3 className="text-xl font-black text-white">
              Worker Benchmark Accuracy Exam (10 Paid Tasks)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Evaluate each model response pair. Select which response provides the highest factual, helpful, and safe answer.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-teal-400 block">+850 KES</span>
            <span className="text-[10px] text-slate-500">Credited to QA Review</span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>Progress: {answeredCount} of {totalQuestions} tasks completed</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Post-submission result screen */}
        {result ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-teal-400" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-bold">Calibration Completed</span>
              <h4 className="text-2xl font-black text-white mt-1">
                Accuracy Score: {result.score}%
              </h4>
              <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
                {result.passed ? (
                  <span>
                    Outstanding work! Your evaluations achieved {result.score}% consensus benchmark. Your <strong>+KES {result.rewardKes?.toLocaleString()}</strong> reward has been deposited into your QA Review Queue.
                  </span>
                ) : (
                  <span>
                    Your calibration score is {result.score}%. Your responses are forwarded to the Super Admin desk for secondary manual review.
                  </span>
                )}
              </p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-left text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-2 font-bold text-teal-300">
                <ShieldCheck className="w-4 h-4" />
                <span>Super Admin Verification Queue</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Your account is currently flagged as <strong>Exam Status: {result.status}</strong>. The platform Super Admin will verify your profile on the administrative dashboard.
              </p>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-teal-500/20 transition"
            >
              Return to Workstation
            </button>
          </div>
        ) : (
          /* Question List */
          <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
            {BENCHMARK_ACCURACY_EXAM.map((task, idx) => {
              const selected = answers[task.id]

              return (
                <div 
                  key={task.id}
                  className={`p-5 rounded-2xl border transition ${
                    selected ? 'bg-slate-950 border-teal-500/40' : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-teal-400">
                      Task {idx + 1} of {totalQuestions} • {task.category}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      +{task.rewardKes} KES
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 mb-4">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">User Instruction / Prompt</span>
                    <p className="text-xs font-medium text-slate-200">{task.prompt}</p>
                  </div>

                  {/* Two Candidate Responses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectOption(task.id, 'A')}
                      className={`text-left p-4 rounded-xl border transition flex flex-col justify-between ${
                        selected === 'A'
                          ? 'bg-teal-950/40 border-teal-500 ring-1 ring-teal-500'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono font-bold text-teal-400 uppercase">Response Candidate A</span>
                        <p className="text-xs text-slate-300 leading-relaxed">{task.responseA}</p>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-teal-400">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${selected === 'A' ? 'text-teal-400' : 'text-slate-600'}`} />
                        <span>{selected === 'A' ? 'Selected as superior' : 'Select Response A'}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectOption(task.id, 'B')}
                      className={`text-left p-4 rounded-xl border transition flex flex-col justify-between ${
                        selected === 'B'
                          ? 'bg-teal-950/40 border-teal-500 ring-1 ring-teal-500'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono font-bold text-teal-400 uppercase">Response Candidate B</span>
                        <p className="text-xs text-slate-300 leading-relaxed">{task.responseB}</p>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-teal-400">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${selected === 'B' ? 'text-teal-400' : 'text-slate-600'}`} />
                        <span>{selected === 'B' ? 'Selected as superior' : 'Select Response B'}</span>
                      </div>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        {!result && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              Take Exam Later
            </button>

            <button
              onClick={handleSubmitExam}
              disabled={submitting || answeredCount === 0}
              className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Scoring Evaluation...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit 10 Calibration Tasks ({answeredCount}/10)</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
