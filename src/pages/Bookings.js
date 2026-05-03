import { useState, useEffect } from 'react'
import { Calendar, Clock, BarChart2, Settings, Video, X } from 'lucide-react'
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

const statusConfig = (status) => {
  switch(status) {
    case 'confirmed': return { text: 'Подтверждена', bg: '#DCFCE7', color: '#16A34A', dot: '#22C55E' }
    case 'pending': return { text: 'На рассмотрении', bg: '#FEF9C3', color: '#CA8A04', dot: '#EAB308' }
    case 'cancelled': return { text: 'Отменена', bg: '#FEE2E2', color: '#DC2626', dot: '#EF4444' }
    default: return { text: status, bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' }
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
    <div style={{ minHeight: '100vh', background: '#F7F6F1', fontFamily: 'Inter, sans-serif' }}>
      <div style={{
        background: '#fff', borderBottom: '1px solid #E8E7E0',
        padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'Syne, sans-serif' }}>
          kog<span style={{ background: '#E8FF47', padding: '0 6px', borderRadius: 6 }}>DA</span>
        </h1>
      </div>

      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto', padding: '40px 24px', gap: 32 }}>
        <div style={{ width: 200, flexShrink: 0 }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { icon: Calendar, label: 'Мой кабинет', href: '/dashboard', active: false },
              { icon: Clock, label: 'Расписание', href: '/schedule', active: false },
              { icon: BarChart2, label: 'Записи', href: '/bookings', active: true },
              { icon: Settings, label: 'Настройки', href: '/settings', active: false },
            ].map(item => (
              <a key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10, textDecoration: 'none',
                background: item.active ? '#E8FF47' : 'transparent',
                color: '#111', fontSize: 14, fontWeight: item.active ? 700 : 500,
              }}>
                <item.icon size={16} strokeWidth={item.active ? 2.5 : 2} />{item.label}
              </a>
            ))}
          </nav>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Записи</h2>
            <p style={{ color: '#888', marginTop: 6, fontSize: 15 }}>Все записи твоих клиентов</p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #E8E7E0' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#16A34A', marginBottom: 4 }}>{upcoming}</div>
              <div style={{ fontSize: 13, color: '#888' }}>Предстоящих</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #E8E7E0' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#111', marginBottom: 4 }}>{total}</div>
              <div style={{ fontSize: 13, color: '#888' }}>Всего</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #E8E7E0' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#DC2626', marginBottom: 4 }}>{cancelled}</div>
              <div style={{ fontSize: 13, color: '#888' }}>Отменено</div>
            </div>
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
                padding: '8px 18px', borderRadius: 100,
                background: filter === f.key ? '#111' : '#fff',
                color: filter === f.key ? '#fff' : '#888',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(b => {
                const status = statusConfig(b.status)
                const isPast = new Date(b.start_time) < new Date()
                return (
                  <div key={b.id} style={{
                    background: '#fff', borderRadius: 16,
                    border: '1px solid #E8E7E0',
                    overflow: 'hidden',
                    opacity: b.status === 'cancelled' ? 0.6 : 1
                  }}>
                    {/* Card header */}
                    <div style={{
                      padding: '16px 24px',
                      background: isPast && b.status !== 'cancelled' ? '#F7F6F1' : '#fff',
                      borderBottom: '1px solid #F0EFE9',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: 4,
                          background: status.dot, flexShrink: 0
                        }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: status.color }}>
                          {status.text}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#888' }}>
                        {formatDate(b.start_time)} · {formatTime(b.start_time)}
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: b.notes ? 16 : 0 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: '#E8FF47',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, fontWeight: 800, color: '#111', flexShrink: 0
                        }}>
                          {b.client_name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{b.client_name}</div>
                          <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{b.client_email}</div>
                          <div style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>{b.meeting_title}</div>
                        </div>
                      </div>

                      {b.notes && (
                        <div style={{
                          background: '#F7F6F1', borderRadius: 10,
                          padding: '10px 14px', fontSize: 13, color: '#666',
                          marginBottom: 16, marginTop: 4
                        }}>
                          💬 {b.notes}
                        </div>
                      )}

                      {/* Actions */}
                      {b.status !== 'cancelled' && !isPast && (
                        <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid #F0EFE9' }}>
                          <a href={b.video_link} target="_blank" rel="noreferrer" style={{
                            background: '#111', color: '#fff',
                            padding: '10px 20px', borderRadius: 10,
                            fontSize: 13, fontWeight: 600, textDecoration: 'none',
                            display: 'flex', alignItems: 'center', gap: 6
                          }}>
                            📹 Войти на встречу
                          </a>
                          <button onClick={() => cancelBooking(b.id)} style={{
                            background: 'transparent', border: '1.5px solid #FFE0E0',
                            color: '#DC2626', padding: '10px 20px', borderRadius: 10,
                            fontSize: 13, fontWeight: 600, cursor: 'pointer'
                          }}>
                            Отменить
                          </button>
                        </div>
                      )}
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