import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Eye, EyeOff } from 'lucide-react'

const API = 'https://kogda-backend-production.up.railway.app'

export default function ResetPassword() {
  const { token } = useParams()
  const [checking, setChecking] = useState(true)
  const [valid, setValid] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkToken()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkToken = async () => {
    try {
      const res = await axios.get(`${API}/auth/reset-password/${token}/check`)
      setValid(true)
      setEmail(res.data.email)
    } catch (err) {
      setValid(false)
    }
    setChecking(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов')
      return
    }
    setError('')
    setLoading(true)
    try {
      await axios.post(`${API}/auth/reset-password`, { token, password })
      setDone(true)
      setTimeout(() => { window.location.href = '/login' }, 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка. Попробуй ещё раз')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    border: '1.5px solid #E0E0D8', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', background: '#fff',
    fontFamily: 'inherit'
  }

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F7F6F1',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, sans-serif', color: '#888', fontSize: 14
      }}>
        Проверяем ссылку...
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
          border-color: #111 !important;
        }
      `}</style>

      <div style={{
        background: '#fff', borderRadius: 24, padding: '48px 40px',
        width: '100%', maxWidth: 400, boxShadow: '0 8px 40px rgba(0,0,0,0.08)'
      }}>
        <div style={{ marginBottom: 32 }}>
          <img src="https://kogda.app/kogda-logo.png" alt="kogDA" style={{ height: 36, width: 'auto', display: 'block', marginBottom: 12 }} />
          <p style={{ color: '#888', margin: 0, fontSize: 15 }}>Новый пароль</p>
        </div>

        {!valid && (
          <div>
            <div style={{
              background: '#FEE2E2', color: '#DC2626', padding: '16px',
              borderRadius: 12, marginBottom: 20, fontSize: 14, lineHeight: 1.6
            }}>
              Ссылка недействительна или устарела. Запроси новую — ссылки живут 1 час.
            </div>
            <a href="/forgot-password" style={{
              display: 'block', textAlign: 'center', textDecoration: 'none',
              background: '#111', color: '#F7F6F1', padding: '14px',
              borderRadius: 10, fontSize: 15, fontWeight: 700
            }}>
              Запросить новую ссылку
            </a>
          </div>
        )}

        {valid && done && (
          <div style={{
            background: '#F7F6F1', border: '1px solid #E8E7E0',
            color: '#444', padding: '16px',
            borderRadius: 12, marginBottom: 20, fontSize: 14, lineHeight: 1.6
          }}>
            Пароль изменён. Перенаправляем на вход...
          </div>
        )}

        {valid && !done && (
          <form onSubmit={handleSubmit}>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 8, lineHeight: 1.6 }}>
              Аккаунт: <b style={{ color: '#111' }}>{email}</b>
            </p>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              Придумай новый пароль. Минимум 6 символов.
            </p>

            {error && (
              <div style={{
                background: '#FEE2E2', color: '#DC2626', padding: '12px 16px',
                borderRadius: 10, marginBottom: 20, fontSize: 14
              }}>{error}</div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Новый пароль</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  autoFocus
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

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', background: '#111', color: '#F7F6F1',
                padding: '14px', borderRadius: 10, border: 'none',
                fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Сохраняем...' : 'Сохранить пароль'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}