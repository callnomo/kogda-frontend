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
      await axios.post(`${API}/auth/forgot-password`, { email })
      setSent(true)
    } catch (err) {
      // Всё равно показываем "отправлено", чтобы не дать перебирать email
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F7F6F1',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'sans-serif', padding: '20px'
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '48px 40px',
        width: '100%', maxWidth: 400, boxShadow: '0 8px 40px rgba(0,0,0,0.08)'
      }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
            kog<span style={{ background: '#E8FF47', padding: '0 6px', borderRadius: 6 }}>DA</span>
          </h1>
          <p style={{ color: '#888', marginTop: 8, fontSize: 15 }}>
            {sent ? 'Письмо отправлено' : 'Восстановление пароля'}
          </p>
        </div>

        {sent ? (
          <div>
            <div style={{
              background: '#DCFCE7', color: '#16A34A', padding: '16px',
              borderRadius: 12, marginBottom: 20, fontSize: 14, lineHeight: 1.6
            }}>
              Если такой email зарегистрирован, мы отправили на него ссылку для сброса пароля.
              Ссылка действительна 1 час.
            </div>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              Не получил письмо? Проверь папку «Спам». Если ничего нет — попробуй ещё раз через минуту.
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
            <p style={{ color: '#666', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
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
                autoFocus
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 10,
                  border: '1.5px solid #E0E0D8', fontSize: 15, outline: 'none',
                  boxSizing: 'border-box'
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
              {loading ? 'Отправляем...' : 'Отправить ссылку →'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#888' }}>
          Вспомнил пароль?{' '}
          <a href="/login" style={{ color: '#111', fontWeight: 600 }}>Войти</a>
        </p>
      </div>
    </div>
  )
}