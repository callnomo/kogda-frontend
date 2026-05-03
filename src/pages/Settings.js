import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'https://kogda-backend-production.up.railway.app'

export default function Settings() {
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({ name: '', bio: '', slug: '' })
  const [saved, setSaved] = useState(false)
  const [telegramLink, setTelegramLink] = useState(null)
  const [telegramConnected, setTelegramConnected] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { window.location.href = '/login'; return }
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(res.data)
      setForm({ name: res.data.name, bio: res.data.bio || '', slug: res.data.slug })
      setTelegramConnected(!!res.data.telegram_chat_id)
    } catch (err) {
      console.error(err)
    }
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      const res = await axios.patch(`${API}/settings/profile`, form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      localStorage.setItem('user', JSON.stringify(res.data))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка сохранения')
    }
  }

  const connectTelegram = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const res = await axios.post(`${API}/settings/telegram/token`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTelegramLink(res.data.link)
      // Автоматически проверяем каждые 2 секунды
      const interval = setInterval(async () => {
        try {
          const check = await axios.get(`${API}/settings`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (check.data.telegram_chat_id) {
            setTelegramConnected(true)
            setTelegramLink(null)
            clearInterval(interval)
          }
        } catch {}
      }, 2000)
      // Останавливаем через 5 минут
      setTimeout(() => clearInterval(interval), 300000)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  if (!user) return null

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    border: '1.5px solid #E0E0D8', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'sans-serif'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', fontFamily: 'sans-serif' }}>
      <div style={{
        background: '#fff', borderBottom: '1px solid #E8E7E0',
        padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
          kog<span style={{ background: '#E8FF47', padding: '0 6px', borderRadius: 6 }}>DA</span>
        </h1>
      </div>

      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto', padding: '40px 24px', gap: 32 }}>
        {/* Sidebar */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { icon: '📅', label: 'Встречи', href: '/dashboard', active: false },
              { icon: '🕐', label: 'Расписание', href: '/schedule', active: false },
              { icon: '📊', label: 'Брони', href: '/bookings', active: false },
              { icon: '⚙️', label: 'Настройки', href: '/settings', active: true },
            ].map(item => (
              <a key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10, textDecoration: 'none',
                background: item.active ? '#E8FF47' : 'transparent',
                color: '#111', fontSize: 14, fontWeight: item.active ? 700 : 500,
              }}>
                <span>{item.icon}</span>{item.label}
              </a>
            ))}
          </nav>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Настройки</h2>
            <p style={{ color: '#888', marginTop: 6, fontSize: 15 }}>Управляй своим профилем и интеграциями</p>
          </div>

          {/* Telegram */}
          <div style={{
            background: '#fff', borderRadius: 20, padding: '32px',
            border: '1px solid #E8E7E0', marginBottom: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: '#229ED9', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 24, flexShrink: 0
              }}>✈️</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Telegram уведомления</div>
                <div style={{ fontSize: 14, color: '#888', marginTop: 2 }}>
                  Получай уведомления о новых бронированиях прямо в Telegram
                </div>
              </div>
              {telegramConnected && (
                <div style={{
                  marginLeft: 'auto', background: '#DCFCE7', color: '#16A34A',
                  padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600
                }}>
                  ✓ Подключён
                </div>
              )}
            </div>

            {telegramConnected ? (
              <div style={{
                background: '#F0FDF4', border: '1px solid #86EFAC',
                borderRadius: 12, padding: '16px 20px', fontSize: 14, color: '#16A34A'
              }}>
                Telegram подключён! Уведомления о бронированиях приходят тебе в бот.
              </div>
            ) : telegramLink ? (
              <div>
                <div style={{
                  background: '#FFF7ED', border: '1px solid #FED7AA',
                  borderRadius: 12, padding: '16px 20px', marginBottom: 16, fontSize: 14, color: '#92400E'
                }}>
                  Нажми кнопку ниже чтобы открыть бота, потом нажми START в Telegram
                </div>
                <a href={telegramLink} target="_blank" rel="noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    background: '#229ED9', color: '#fff', padding: '14px 28px',
                    borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none'
                  }}>
                  ✈️ Открыть бота в Telegram
                </a>

              </div>
            ) : (
              <button onClick={connectTelegram} disabled={loading} style={{
                background: '#229ED9', color: '#fff', border: 'none',
                padding: '14px 28px', borderRadius: 12, fontSize: 15,
                fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10
              }}>
                {loading ? 'Генерируем ссылку...' : '✈️ Подключить Telegram'}
              </button>
            )}
          </div>

          {/* Profile */}
          <div style={{
            background: '#fff', borderRadius: 20, padding: '32px',
            border: '1px solid #E8E7E0'
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Профиль</div>

            <form onSubmit={saveProfile}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Имя</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Анна Соколова" style={inputStyle} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Никнейм (для ссылки)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14, color: '#888', whiteSpace: 'nowrap' }}>app.kogda.app/</span>
                  <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                    placeholder="anna-sokolova" style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>О себе</label>
                <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                  placeholder="Психолог, КПТ, 5 лет практики..."
                  style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} />
              </div>

              <button type="submit" style={{
                background: saved ? '#22C55E' : '#111', color: '#fff',
                border: 'none', padding: '14px 32px', borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'background 0.3s'
              }}>
                {saved ? '✓ Сохранено!' : 'Сохранить профиль'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}