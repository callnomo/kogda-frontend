import { useState } from 'react'
import axios from 'axios'

const API = 'https://kogda-backend-production.up.railway.app'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post(`${API}/auth/forgot-password`, {
        email: email.trim().toLowerCase()
      })
      setSent(true)
    } catch (err) {
      setSent(true)
    }
    setLoading(false)
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
          <p style={{ color: '#888', margin: 0, fontSize: 15 }}>
            {sent ? 'Письмо отправлено' : 'Восстановление пароля'}
          </p>
        </div>

        {sent ? (
          <div>
            <div style={{
              background: '#F7F6F1',
              border: '1px solid #E8E7E0',
              color: '#444',
              padding: '16px',
              borderRadius: 12,
              marginBottom: 16,
              fontSize: 14,
              lineHeight: 1.6
            }}>
              Если такой email зарегистрирован, мы отправили на него ссылку для сброса пароля. Ссылка действительна 1 час.
            </div>
            <p style={{ color: '#aaa', fontSize: 12, margin: '0 0 24px', lineHeight: 1.5 }}>
              Не получил письмо? Проверь папку «Спам».
            </p>
            <a href="/login" style={{
              display: 'block', textAlign: 'center', textDecoration: 'none',
              background: '#111', color: '#F7F6F1', padding: '14px',
              borderRadius: 10, fontSize: 15, fontWeight: 700
            }}>
              Вернуться ко входу
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Введи email, на который зарегистрирован аккаунт. Мы отправим ссылку для создания нового пароля.
            </p>

            <div style={{ marginBottom: 24 }}>
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
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 10,
                  border: '1.5px solid #E1DED6', fontSize: 15, outline: 'none',
                  boxSizing: 'border-box', background: '#fff',
                  fontFamily: 'inherit', textTransform: 'lowercase'
                }}
              />
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
              {loading ? 'Отправляем...' : 'Отправить ссылку'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#888' }}>
              Вспомнил пароль?{' '}
              <a href="/login" style={{ color: '#111', fontWeight: 600 }}>Войти</a>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}