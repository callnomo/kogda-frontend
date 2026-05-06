import { useState } from 'react'
import axios from 'axios'
import { Eye, EyeOff } from 'lucide-react'

const API = 'https://kogda-backend-production.up.railway.app'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', slug: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${API}/auth/register`, {
        ...form,
        email: form.email.trim().toLowerCase()
      })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации')
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    border: '1.5px solid #E1DED6', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', background: '#fff',
    fontFamily: 'inherit'
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
          <p style={{ color: '#888', margin: 0, fontSize: 15 }}>Создай аккаунт бесплатно</p>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2', color: '#DC2626', padding: '12px 16px',
            borderRadius: 10, marginBottom: 20, fontSize: 14
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} autoComplete="on">
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Имя</label>
            <input
              type="text" value={form.name} required
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Анна Соколова"
              autoComplete="name"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email" value={form.email} required
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="твой@email.com"
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              style={{ ...inputStyle, textTransform: 'lowercase' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Пароль</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                required
                minLength={6}
                onChange={e => setForm({ ...form, password: e.target.value })}
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
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Никнейм (для ссылки)</label>
            <input
              type="text" value={form.slug} required
              onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
              placeholder="anna-sokolova"
              autoComplete="username"
              autoCapitalize="off"
              style={inputStyle}
            />
            {form.slug && (
              <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                Твоя ссылка: app.kogda.app/{form.slug}
              </p>
            )}
          </div>
          <button type="submit" style={{
            width: '100%', background: '#E8FF47', color: '#111',
            padding: '14px', borderRadius: 10, border: 'none',
            fontSize: 15, fontWeight: 700, cursor: 'pointer'
          }}>
            Создать аккаунт
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#888' }}>
          Уже есть аккаунт?{' '}
          <a href="/login" style={{ color: '#111', fontWeight: 600 }}>Войти</a>
        </p>
      </div>
    </div>
  )
}