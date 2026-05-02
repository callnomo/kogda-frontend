import { useState } from 'react'
import axios from 'axios'

const API = 'https://kogda-backend-production.up.railway.app'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', slug: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${API}/auth/register`, form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации')
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 10,
    border: '1.5px solid #E0E0D8',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box'
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F7F6F1',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '48px 40px',
        width: 400, boxShadow: '0 8px 40px rgba(0,0,0,0.08)'
      }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
            kog<span style={{ background: '#E8FF47', padding: '0 6px', borderRadius: 6 }}>DA</span>
          </h1>
          <p style={{ color: '#888', marginTop: 8, fontSize: 15 }}>Создай аккаунт бесплатно</p>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2', color: '#DC2626', padding: '12px 16px',
            borderRadius: 10, marginBottom: 20, fontSize: 14
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Имя</label>
            <input
              type="text" value={form.name} required
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Анна Соколова"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email" value={form.email} required
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="твой@email.com"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Пароль</label>
            <input
              type="password" value={form.password} required
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="минимум 6 символов"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Никнейм (для ссылки)</label>
            <input
              type="text" value={form.slug} required
              onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
              placeholder="anna-sokolova"
              style={inputStyle}
            />
            {form.slug && (
              <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                Твоя ссылка: kogda.app/{form.slug}
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