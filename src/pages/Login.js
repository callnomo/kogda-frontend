import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Eye, EyeOff } from 'lucide-react'

const API = process.env.REACT_APP_API_URL || 'https://kogda-backend-production.up.railway.app'

// withCredentials=true чтобы cookie trusted_device_token летела на бэк и принималась оттуда
const api = axios.create({ baseURL: API, withCredentials: true })

export default function Login() {
  const [step, setStep] = useState('credentials') // 'credentials' | 'code'

  // Шаг 1
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Шаг 2
  const [userId, setUserId] = useState(null)
  const [emailHint, setEmailHint] = useState('')
  const [deviceLabel, setDeviceLabel] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const codeRefs = useRef([])
  const [resendCooldown, setResendCooldown] = useState(0)

  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  // Cooldown тикалка
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  // ============ ШАГ 1: email + пароль ============

  const submitCredentials = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      })

      // Сценарий А: бэк сразу вернул токен (trusted device или восстановленный аккаунт)
      if (res.data.token && res.data.user) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        if (res.data.restored) {
          setInfo('Аккаунт восстановлен. Перенаправляем...')
          setTimeout(() => { window.location.href = '/dashboard' }, 1500)
        } else {
          window.location.href = '/dashboard'
        }
        return
      }

      // Сценарий Б: требуется верификация устройства
      if (res.data.requires_verification) {
        setUserId(res.data.user_id)
        setEmailHint(res.data.email_hint || '')
        setDeviceLabel(res.data.device_label || '')
        setStep('code')
        setResendCooldown(60)
        setTimeout(() => codeRefs.current[0]?.focus(), 50)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный email или пароль')
    }
    setLoading(false)
  }

  // ============ ШАГ 2: код верификации ============

  const verifyCode = async (codeStr) => {
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/verify-login', {
        user_id: userId,
        code: codeStr,
      })
      if (!res.data.token || !res.data.user) {
        setError('Ответ сервера не содержит данных. Попробуй войти заново.')
        setLoading(false)
        return
      }
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      window.location.href = '/dashboard'
    } catch (err) {
      const data = err.response?.data
      if (data?.expired) {
        setError(data.error || 'Код устарел. Войди заново.')
        // Сброс к шагу 1
        setTimeout(() => {
          setStep('credentials')
          setCode(['', '', '', '', '', ''])
          setPassword('')
          setUserId(null)
          setError('')
        }, 2500)
      } else {
        setError(data?.error || 'Неверный код')
        setCode(['', '', '', '', '', ''])
        setTimeout(() => codeRefs.current[0]?.focus(), 50)
      }
    }
    setLoading(false)
  }

  const resendCode = async () => {
    if (resendCooldown > 0 || !userId) return
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/resend-login-code', { user_id: userId })
      setResendCooldown(60)
      setCode(['', '', '', '', '', ''])
      setTimeout(() => codeRefs.current[0]?.focus(), 50)
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка отправки')
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

  const goBackToCredentials = () => {
    setStep('credentials')
    setCode(['', '', '', '', '', ''])
    setPassword('')
    setUserId(null)
    setError('')
  }

  // ============ Стили ============

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    border: '1.5px solid #E1DED6', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', background: '#fff',
    fontFamily: 'inherit', transition: 'border-color 0.15s'
  }

  const codeBoxStyle = (filled) => ({
    width: 44, height: 56,
    borderRadius: 10,
    border: `1.5px solid ${filled ? '#111' : '#E1DED6'}`,
    fontSize: 24, fontWeight: 700,
    textAlign: 'center', outline: 'none',
    background: '#fff', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
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
        <div style={{ marginBottom: 32 }}>
          <img src="https://kogda.app/kogda-logo.png" alt="kogDA" style={{ height: 36, width: 'auto', display: 'block', marginBottom: 12 }} />
          {step === 'credentials' && (
            <p style={{ color: '#888', margin: 0, fontSize: 15 }}>Войди в свой аккаунт</p>
          )}
          {step === 'code' && (
            <p style={{ color: '#888', margin: 0, fontSize: 15, lineHeight: 1.5 }}>
              Подтверди вход с нового устройства
            </p>
          )}
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2', color: '#DC2626', padding: '12px 16px',
            borderRadius: 10, marginBottom: 20, fontSize: 14, lineHeight: 1.5
          }}>{error}</div>
        )}

        {info && (
          <div style={{
            background: '#F0F4F0', color: '#16A34A', padding: '12px 16px',
            borderRadius: 10, marginBottom: 20, fontSize: 14
          }}>{info}</div>
        )}

        {/* ============ ШАГ 1: Credentials ============ */}
        {step === 'credentials' && (
          <form onSubmit={submitCredentials} autoComplete="on">
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="твой@email.com"
                required
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                autoFocus
                style={{ ...inputStyle, textTransform: 'lowercase' }}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Пароль</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
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

            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <a href="/forgot-password" style={{
                fontSize: 13, color: '#888', textDecoration: 'none', fontWeight: 500
              }}>Забыл пароль?</a>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', background: '#111', color: '#F7F6F1',
              padding: '14px', borderRadius: 10, border: 'none',
              fontSize: 15, fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}>
              {loading ? 'Входим...' : 'Войти'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#888' }}>
              Нет аккаунта?{' '}
              <a href="/register" style={{ color: '#111', fontWeight: 600 }}>Зарегистрироваться</a>
            </p>
          </form>
        )}

        {/* ============ ШАГ 2: Code ============ */}
        {step === 'code' && (
          <div>
            <div style={{
              background: '#F7F6F1', borderRadius: 12, padding: '14px 16px',
              marginBottom: 20, fontSize: 13, lineHeight: 1.6, color: '#555',
            }}>
              Код отправлен на <b style={{ color: '#111' }}>{emailHint}</b>
              {deviceLabel && (
                <>
                  <br />
                  Устройство: <b style={{ color: '#111' }}>{deviceLabel}</b>
                </>
              )}
            </div>

            <div style={{
              display: 'flex', gap: 8, justifyContent: 'space-between',
              marginBottom: 20,
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

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
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
                    fontFamily: 'inherit',
                  }}
                >
                  Отправить код заново
                </button>
              )}
            </div>

            <button
              onClick={goBackToCredentials}
              disabled={loading}
              style={{
                width: '100%', background: 'transparent', color: '#888',
                padding: '12px', borderRadius: 10, border: '1.5px solid #E1DED6',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Назад
            </button>
          </div>
        )}
      </div>
    </div>
  )
}