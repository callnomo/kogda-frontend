import { useState } from 'react'
import axios from 'axios'

const API = 'https://kogda-backend-production.up.railway.app'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      window.location.href = '/dashboard'
    } catch (err) {
      setError('Неверный email или пароль')
    }
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
          <p style={{ color: '#888', marginTop: 8, fontSize: 15 }}>Войди в свой аккаунт</p>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2', color: '#DC2626', padding: '12px 16px',
            borderRadius: 10, marginBottom: 20, fontSize: 14
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="твой@email.com" required
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 10,
                border: '1.5px solid #E0E0D8', fontSize: 15, outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Пароль</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 10,
                border: '1.5px solid #E0E0D8', fontSize: 15, outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <button type="submit" style={{
            width: '100%', background: '#111', color: '#F7F6F1',
            padding: '14px', borderRadius: 10, border: 'none',
            fontSize: 15, fontWeight: 700, cursor: 'pointer'
          }}>
            Войти →
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#888' }}>
          Нет аккаунта?{' '}
          <a href="/register" style={{ color: '#111', fontWeight: 600 }}>Зарегистрироваться</a>
        </p>
      </div>
    </div>
  )
}