import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'https://kogda-backend-production.up.railway.app'

const MONTHS = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

const formatTime = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

const statusLabel = (status) => {
  switch(status) {
    case 'confirmed': return { text: 'Подтверждена', bg: '#DCFCE7', color: '#16A34A' }
    case 'pending': return { text: 'На рассмотрении', bg: '#FEF9C3', color: '#CA8A04' }
    case 'cancelled': return { text: 'Отменена', bg: '#FEE2E2', color: '#DC2626' }
    default: return { text: status, bg: '#F3F4F6', color: '#6B7280' }
  }
}

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { window.location.href = '/login'; return }
    loadBookings()
  }, [])

  const loadBookings = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBookings(res.data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const cancelBooking = async (id) => {
    if (!window.confirm('Отменить эту бронь?')) return
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/bookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadBookings()
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = bookings.filter(b => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return new Date(b.start_time) > new Date() && b.status !== 'cancelled'
    if (filter === 'past') return new Date(b.start_time) < new Date()
    if (filter === 'cancelled') return b.status === 'cancelled'
    return true
  })

  const upcoming = bookings.filter(b => new Date(b.start_time) > new Date() && b.status !== 'cancelled').length
  const total = bookings.length
  const cancelled = bookings.filter(b => b.status === 'cancelled').length

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
              { icon: '📊', label: 'Брони', href: '/bookings', active: true },
              { icon: '⚙️', label: 'Настройки', href: '/settings', active: false },
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
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Брони</h2>
            <p style={{ color: '#888', marginTop: 6, fontSize: 15 }}>Все записи твоих клиентов</p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Предстоящих', value: upcoming, icon: '📅', color: '#16A34A' },
              { label: 'Всего', value: total, icon: '📊', color: '#111' },
              { label: 'Отменено', value: cancelled, icon: '❌', color: '#DC2626' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #E8E7E0' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[
              { key: 'all', label: 'Все' },
              { key: 'upcoming', label: 'Предстоящие' },
              { key: 'past', label: 'Прошедшие' },
              { key: 'cancelled', label: 'Отменённые' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '8px 18px', borderRadius: 100, border: 'none',
                background: filter === f.key ? '#111' : '#fff',
                color: filter === f.key ? '#fff' : '#888',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${filter === f.key ? '#111' : '#E0E0D8'}`,
                transition: 'all 0.15s'
              }}>{f.label}</button>
            ))}
          </div>

          {/* Bookings list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>Загружаем...</div>
          ) : filtered.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '48px', border: '1px solid #E8E7E0', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>Нет бронирований</h4>
              <p style={{ color: '#888', fontSize: 14 }}>Поделись ссылкой с клиентами чтобы они записались</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(b => {
                const status = statusLabel(b.status)
                const isPast = new Date(b.start_time) < new Date()
                return (
                  <div key={b.id} style={{
                    background: '#fff', borderRadius: 16, padding: '24px',
                    border: '1px solid #E8E7E0',
                    opacity: isPast && b.status !== 'cancelled' ? 0.7 : 1
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 12, background: '#F0EFE9',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 22, flexShrink: 0
                        }}>
                          {b.status === 'cancelled' ? '❌' : isPast ? '✓' : '📅'}
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{b.client_name}</div>
                          <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{b.client_email}</div>
                          <div style={{ fontSize: 14, color: '#555', fontWeight: 500 }}>
                            {b.meeting_title} · {formatDate(b.start_time)} в {formatTime(b.start_time)}
                          </div>
                          {b.notes && (
                            <div style={{ fontSize: 13, color: '#888', marginTop: 8, background: '#F7F6F1', padding: '8px 12px', borderRadius: 8 }}>
                              💬 {b.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                        <div style={{
                          background: status.bg, color: status.color,
                          padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600
                        }}>
                          {status.text}
                        </div>

                        {b.status !== 'cancelled' && !isPast && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <a href={b.video_link} target="_blank" rel="noreferrer" style={{
                              background: '#E8FF47', color: '#111', padding: '7px 14px',
                              borderRadius: 100, fontSize: 12, fontWeight: 600, textDecoration: 'none'
                            }}>
                              📹 Войти
                            </a>
                            <button onClick={() => cancelBooking(b.id)} style={{
                              background: 'transparent', border: '1.5px solid #FFE0E0',
                              color: '#DC2626', padding: '7px 14px', borderRadius: 100,
                              fontSize: 12, fontWeight: 600, cursor: 'pointer'
                            }}>
                              Отменить
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}