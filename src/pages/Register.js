import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Eye, EyeOff } from 'lucide-react'

const API = 'https://kogda-backend-production.up.railway.app'

export default function Register() {
  const [step, setStep] = useState('email') // 'email' | 'code' | 'profile'

  const [email, setEmail] = useState('')

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const codeRefs = useRef([])
  const [resendCooldown, setResendCooldown] = useState(0)

  const [tempToken, setTempToken] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const requestCode = async (e) => {
    e?.preventDefault()
    setError('')
    setLoading(true)
    try {
      await axios.post(`${API}/auth/request-code`, {
        email: email.trim().toLowerCase()
      })
      setStep('code')
      setResendCooldown(30)
      setTimeout(() => codeRefs.current[0]?.focus(), 50)
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка. Попробуй ещё раз.')
    }
    setLoading(false)
  }

  const handleCodeChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 1)
    const newCode = [...code]
    newCode[index] = cleaned
    setCode(newCode)
    setError('')
    if (cleaned && index < 5) {
      codeRefs.current[index + 1]?.focus()
    }
    if (newCode.every(c => c) && newCode.join('').length === 6) {
      verifyCode(newCode.join(''))
    }
  }

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const newCode = pasted.split('')
      setCode(newCode)
      verifyCode(pasted)
    }
  }

  const verifyCode = async (codeStr) => {
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(`${API}/auth/verify-code`, {
        email: email.trim().toLowerCase(),
        code: codeStr
      })
      setTempToken(res.data.tempToken)
      setStep('profile')
    } catch (err) {
      const data = err.response?.data
      if (data?.expired) {
        setError(data.error || 'Запроси код заново')
        setCode(['', '', '', '', '', ''])
        setTimeout(() => codeRefs.current[0]?.focus(), 50)
      } else {
        setError(data?.error || 'Неверный код')
        setCode(['', '', '', '', '', ''])
        setTimeout(() => codeRefs.current[0]?.focus(), 50)
      }
    }
    setLoading(false)
  }

  const resendCode = async () => {
    if (resendCooldown > 0) return
    setError('')
    setLoading(true)
    try {
      await axios.post(`${API}/auth/request-code`, {
        email: email.trim().toLowerCase()
      })
      setResendCooldown(30)
      setCode(['', '', '', '', '', ''])
      setTimeout(() => codeRefs.current[0]?.focus(), 50)
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка отправки')
    }
    setLoading(false)
  }

  const completeRegistration = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов')
      return
    }
    setLoading(true)
    try {
      const res = await axios.post(`${API}/auth/complete-registration`, {
        tempToken, name, password
      })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      window.location.href = '/dashboard'
    } catch (err) {
      const data = err.response?.data
      if (data?.expired) {
        setError('Сессия истекла. Начни регистрацию заново.')
        setTimeout(() => {
          setStep('email')
          setCode(['', '', '', '', '', ''])
          setTempToken('')
          setName('')
          setPassword('')
          setError('')
        }, 2500)
      } else {
        setError(data?.error || 'Ошибка регистрации')
      }
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    border: '1.5px solid #E1DED6', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', background: '#fff',
    fontFamily: 'inherit'
  }

  const codeBoxStyle = (filled) => ({
    width: 44, height: 56,
    borderRadius: 10,
    border: `1.5px solid ${filled ? '#111' : '#E1DED6'}`,
    fontSize: 24, fontWeight: 700,
    textAlign: 'center', outline: 'none',
    background: '#fff', fontFamily: 'inherit',
    transition: 'border-color 0.15s'
  })

  return (
    <div style={{
      minHeight: '100vh', background: '#F7F6F1',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', padding: '20px'
    }}>
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #fff inset !important;
          -webkit-text-fill-color: #111 !important;
          caret-color: #111;
          transition: background-color 5000s ease-in-out 0s;
        }
        input:focus {
          border-color: #111111 !important;
          box-shadow: none !important;
        }
      `}</style>

      <div style={{
        background: '#fff', borderRadius: 24, padding: '48px 40px',
        width: '100%', maxWidth: 400, boxShadow: '0 8px 40px rgba(0,0,0,0.08)'
      }}>
        <div style={{ marginBottom: 40 }}>
          <img src="https://kogda.app/kogda-logo.png" alt="kogDA" style={{ height: 36, width: 'auto', display: 'block', marginBottom: 12 }} />

          {step === 'email' && (
            <p style={{ color: '#888', margin: 0, fontSize: 15 }}>Создай аккаунт бесплатно</p>
          )}
          {step === 'code' && (
            <p style={{ color: '#888', margin: 0, fontSize: 15, lineHeight: 1.5 }}>
              Код отправлен на <b style={{ color: '#111' }}>{email}</b>
            </p>
          )}
          {/* На шаге 3 — без subtitle, только лого */}
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2', color: '#DC2626', padding: '12px 16px',
            borderRadius: 10, marginBottom: 20, fontSize: 14, lineHeight: 1.5
          }}>{error}</div>
        )}

        {/* ============ ШАГ 1: Email ============ */}
        {step === 'email' && (
          <form onSubmit={requestCode}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
              <input
                type="email" value={email} required
                onChange={e => setEmail(e.target.value)}
                placeholder="твой@email.com"
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                autoFocus
                style={{ ...inputStyle, textTransform: 'lowercase' }}
              />
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', background: '#E8FF47', color: '#111',
              padding: '14px', borderRadius: 10, border: 'none',
              fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}>
              {loading ? 'Отправляем...' : 'Продолжить'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#888' }}>
              Уже есть аккаунт?{' '}
              <a href="/login" style={{ color: '#111', fontWeight: 600 }}>Войти</a>
            </p>
          </form>
        )}

        {/* ============ ШАГ 2: Code ============ */}
        {step === 'code' && (
          <div>
            <div style={{
              display: 'flex', gap: 8, justifyContent: 'space-between',
              marginBottom: 20
            }}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => codeRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(i, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(i, e)}
                  onPaste={i === 0 ? handleCodePaste : undefined}
                  disabled={loading}
                  style={codeBoxStyle(!!digit)}
                />
              ))}
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              {resendCooldown > 0 ? (
                <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>
                  Отправить новый код через {resendCooldown}с
                </p>
              ) : (
                <button
                  onClick={resendCode}
                  disabled={loading}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 14, color: '#111', fontWeight: 600,
                    textDecoration: 'underline'
                  }}
                >
                  Отправить код заново
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setStep('email')
                setCode(['', '', '', '', '', ''])
                setError('')
              }}
              style={{
                width: '100%', background: 'transparent', color: '#888',
                padding: '12px', borderRadius: 10, border: '1.5px solid #E1DED6',
                fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}
            >
              Изменить email
            </button>
          </div>
        )}

        {/* ============ ШАГ 3: Profile ============ */}
        {step === 'profile' && (
          <form onSubmit={completeRegistration}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Имя</label>
              <input
                type="text" value={name} required
                onChange={e => setName(e.target.value)}
                placeholder="Анна Соколова"
                autoComplete="name"
                autoFocus
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Пароль</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  required
                  minLength={6}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="минимум 6 символов"
                  autoComplete="new-password"
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    padding: 8, display: 'flex', alignItems: 'center', color: '#888'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', background: '#E8FF47', color: '#111',
              padding: '14px', borderRadius: 10, border: 'none',
              fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}>
              {loading ? 'Создаём...' : 'Создать аккаунт'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}