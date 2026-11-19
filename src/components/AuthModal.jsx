import React, { useState } from 'react'
import { 
  Bot, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  KeyRound,
  CheckCircle2,
  X 
} from 'lucide-react'

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [step, setStep] = useState('form') // 'form' | 'verify_email'
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [tempUser, setTempUser] = useState(null)
  const [otpSentMsg, setOtpSentMsg] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = mode === 'signup' 
        ? '/api/auth?action=signup' 
        : '/api/auth?action=login'

      const payload = mode === 'signup'
        ? { email: email.trim(), username: username.trim(), password, referral_code: referralCode.trim() }
        : { usernameOrEmail: (username || email).trim(), password }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.')
      }

      if (mode === 'signup' && data.requiresEmailVerification) {
        setTempUser(data)
        setStep('verify_email')
        if (data.verificationCode) {
          setOtpSentMsg(`Verification security code sent to ${email} (Code: ${data.verificationCode})`)
        } else {
          setOtpSentMsg(`Verification security code sent to ${email}. Check your inbox.`)
        }
        return
      }

      // Save user session in localStorage
      localStorage.setItem('neuro_user_session', JSON.stringify(data))
      if (data.is_task_unlocked) {
        localStorage.setItem('neuro_task_access_unlocked', 'true')
      }

      onAuthSuccess(data)
      onClose()
    } catch (err) {
      console.error(err)
      setError(err.message || 'An error occurred during authentication.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setError('Please enter the full 6-digit verification code.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth?action=verify_otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: tempUser?.id,
          email: email.trim(),
          code: otpCode.trim()
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Verification code failed.')
      }

      const activeUser = data || tempUser
      localStorage.setItem('neuro_user_session', JSON.stringify(activeUser))
      if (activeUser.is_task_unlocked) {
        localStorage.setItem('neuro_task_access_unlocked', 'true')
      }

      onAuthSuccess(activeUser)
      onClose()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to verify email code.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth?action=resend_otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: tempUser?.id,
          email: email.trim()
        })
      })
      const data = await res.json()
      if (data.verificationCode) {
        setOtpSentMsg(`New code sent to ${email} (Code: ${data.verificationCode})`)
      } else {
        setOtpSentMsg(`New verification code sent to ${email}`)
      }
    } catch {
      setError('Failed to resend code. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'verify_email' ? (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 mx-auto mb-3 shadow-lg shadow-teal-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Mail className="w-6 h-6 text-teal-400" />
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-white">
                Verify Your Email Address
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter the 6-digit confirmation security code sent to <strong className="text-white">{email}</strong>
              </p>
            </div>

            {otpSentMsg && (
              <div className="mb-4 p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-start gap-2.5 text-xs text-teal-300">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>{otpSentMsg}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 text-center">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="582914"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-teal-500 text-teal-300 rounded-xl px-4 py-3 text-2xl font-mono text-center tracking-widest font-extrabold outline-none shadow-inner transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Confirm Email & Activate Account'}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-teal-400 hover:text-teal-300 underline"
                >
                  Resend code
                </button>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-slate-400 hover:text-white"
                >
                  Change Email
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 mx-auto mb-3 shadow-lg shadow-teal-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Bot className="w-6 h-6 text-teal-400" />
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-white">
                {mode === 'login' ? 'Worker & Admin Sign In' : 'Create Worker Account'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {mode === 'login' 
                  ? 'Access your RLHF evaluation workstation and payout balances' 
                  : 'Join the precision AI data annotation network & start earning'}
              </p>
            </div>

            {/* Mode Toggle Tabs */}
            <div className="flex bg-slate-950 border border-slate-800/80 p-1 rounded-xl mb-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2 rounded-lg transition ${
                  mode === 'login'
                    ? 'bg-teal-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); }}
                className={`flex-1 py-2 rounded-lg transition ${
                  mode === 'signup'
                    ? 'bg-teal-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Work Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs outline-none transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {mode === 'login' ? 'Username or Email' : 'Desired Username'} *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={mode === 'login' ? 'Enter username or email' : 'Choose unique username'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Enter secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs outline-none transition"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Referral Code (Optional - Earn 500 KES bonus)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Enter referral code"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs uppercase font-mono outline-none transition"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In to Hub' : 'Register & Send Email Verification'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}
