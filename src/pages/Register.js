import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Eye, EyeOff } from 'lucide-react'

const API = 'https://kogda-backend-production.up.railway.app'

// Проверка пароля
const checkPassword = (pwd) => {
  if (!pwd) return { strength: null, valid: false, error: '' }
  const hasLetter = /[a-zA-Zа-яА-Я]/.test(pwd)
  const hasDigit = /\d/.test(pwd)
  const length = pwd.length

  if (length < 8) {
    return { strength: 'weak', valid: false, error: 'Минимум 8 символов' }
  }
  if (!hasLetter || !hasDigit) {
    return { strength: 'weak', valid: false, error: 'Нужна хотя бы одна буква и цифра' }
  }
  if (length >= 12) {
    return { strength: 'strong', valid: true, error: '' }
  }
  return { strength: 'medium', valid: true, error: '' }
}

export default function Register() {
  const [step, setStep] = useState('email')

  const [email, setEmail] = useState('')

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const codeRefs = useRef([])
  const [resendCooldown, setResendCooldown] = useState(0)

  const [tempToken, setTempToken] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const pwdCheck = checkPassword(password)
  const passwordsMismatch = passwordConfirm.length > 0 && password !== passwordConfirm
  const canSubmit = pwdCheck.valid && password === passwordConfirm && agreed && name.trim()

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
    if (!pwdCheck.valid) {
      setError(pwdCheck.error || 'Пароль не соответствует требованиям')
      return
    }
    if (password !== passwordConfirm) {
      setError('Пароли не совпадают')
      return
    }
    if (!agreed) {
      setError('Поставь галочку согласия с условиями')
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
          setPasswordConfirm('')
          setAgreed(false)
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

  const StrengthBar = ({ strength }) => {
    if (!strength) return null
    const colors = {
      weak: '#DC2626',
      medium: '#F59E0B',
      strong: '#16A34A'
    }
    const labels = {
      weak: 'Слабый',
      medium: 'Нормальный',
      strong: 'Сильный'
    }
    const filledBars = strength === 'weak' ? 1 : strength === 'medium' ? 2 : 3
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i < filledBars ? colors[strength] : '#E1DED6',
              transition: 'background 0.2s'
            }} />
          ))}
        </div>
        <p style={{
          margin: 0, fontSize: 12,
          color: colors[strength], fontWeight: 600
        }}>
          {labels[strength]} {strength === 'weak' && password.length > 0 && `— ${pwdCheck.error}`}
        </p>
      </div>
    )
  }

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
                    textDecoration: 'none'
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

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Пароль</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  required
                  onChange={e => setPassword(e.target.value)}
                  placeholder="буквы и цифры, минимум 8"
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
              <StrengthBar strength={pwdCheck.strength} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Пароль ещё раз</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  value={passwordConfirm}
                  required
                  onChange={e => setPasswordConfirm(e.target.value)}
                  placeholder="повтори пароль"
                  autoComplete="new-password"
                  onPaste={e => e.preventDefault()}
                  style={{
                    ...inputStyle,
                    paddingRight: 44,
                    border: passwordsMismatch ? '1.5px solid #DC2626' : '1.5px solid #E1DED6'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(s => !s)}
                  aria-label={showPasswordConfirm ? 'Скрыть пароль' : 'Показать пароль'}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    padding: 8, display: 'flex', alignItems: 'center', color: '#888'
                  }}
                >
                  {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordsMismatch && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#DC2626' }}>
                  Пароли не совпадают
                </p>
              )}
            </div>

            {/* Чекбокс согласия */}
            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              marginBottom: 24, cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                style={{
                  width: 18, height: 18, marginTop: 2,
                  accentColor: '#111', cursor: 'pointer', flexShrink: 0
                }}
              />
              <span style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>
                Соглашаюсь с{' '}
                <a href="/terms" target="_blank" rel="noreferrer" style={{ color: '#111', fontWeight: 600 }}>
                  Условиями использования
                </a>
                {' '}и{' '}
                <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: '#111', fontWeight: 600 }}>
                  Политикой конфиденциальности
                </a>
              </span>
            </label>

            <button type="submit" disabled={loading || !canSubmit} style={{
              width: '100%', background: canSubmit ? '#E8FF47' : '#E1DED6',
              color: canSubmit ? '#111' : '#888',
              padding: '14px', borderRadius: 10, border: 'none',
              fontSize: 15, fontWeight: 700,
              cursor: (loading || !canSubmit) ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'background 0.15s'
            }}>
              {loading ? 'Создаём...' : 'Создать аккаунт'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}