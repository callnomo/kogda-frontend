import { useState, useEffect } from 'react'
import axios from 'axios'
import { User, Clock, BookOpen, Settings } from 'lucide-react'

const API = 'https://kogda-backend-production.up.railway.app'

const DAYS = [
  { id: 1, name: 'Понедельник' },
  { id: 2, name: 'Вторник' },
  { id: 3, name: 'Среда' },
  { id: 4, name: 'Четверг' },
  { id: 5, name: 'Пятница' },
  { id: 6, name: 'Суббота' },
  { id: 0, name: 'Воскресенье' },
]

const TIMES = []
for (let h = 6; h <= 22; h++) {
  TIMES.push(`${h.toString().padStart(2, '0')}:00`)
  TIMES.push(`${h.toString().padStart(2, '0')}:30`)
}

const NavItem = ({ icon: Icon, label, href, active }) => (
  <a href={href} style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', borderRadius: 10, textDecoration: 'none',
    background: active ? '#E8FF47' : 'transparent',
    color: '#111', fontSize: 14, fontWeight: active ? 700 : 500,
  }}>
    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
    {label}
  </a>
)

export default function Schedule() {
  const [schedule, setSchedule] = useState(
    DAYS.map(d => ({ day_of_week: d.id, start_time: '09:00', end_time: '18:00', is_active: d.id >= 1 && d.id <= 5 }))
  )
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { window.location.href = '/login'; return }
    loadSchedule()
  }, [])

  const loadSchedule = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API}/schedule`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.length > 0) {
        const loaded = DAYS.map(d => {
          const found = res.data.find(s => s.day_of_week === d.id)
          return found
            ? { day_of_week: d.id, start_time: found.start_time, end_time: found.end_time, is_active: true }
            : { day_of_week: d.id, start_time: '09:00', end_time: '18:00', is_active: false }
        })
        setSchedule(loaded)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const toggle = (dayId) => {
    setSchedule(schedule.map(s =>
      s.day_of_week === dayId ? { ...s, is_active: !s.is_active } : s
    ))
  }

  const update = (dayId, field, value) => {
    setSchedule(schedule.map(s =>
      s.day_of_week === dayId ? { ...s, [field]: value } : s
    ))
  }

  const save = async () => {
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API}/schedule`, { schedule }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    }
  }

  const selectStyle = {
    padding: '8px 12px', borderRadius: 8,
    border: '1.5px solid #E0E0D8', fontSize: 14,
    outline: 'none', background: '#fff', cursor: 'pointer',
    fontFamily: 'Inter, sans-serif'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E8E7E0',
        padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'Syne, sans-serif' }}>
          kog<span style={{ background: '#E8FF47', padding: '0 6px', borderRadius: 6 }}>DA</span>
        </h1>
        <button onClick={() => { localStorage.clear(); window.location.href = '/login' }}
          style={{ background: 'transparent', border: '1.5px solid #E0E0D8', padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Выйти
        </button>
      </div>

      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto', padding: '40px 24px', gap: 32 }}>
        {/* Sidebar */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <NavItem icon={User} label="Мой кабинет" href="/dashboard" active={false} />
            <NavItem icon={Clock} label="Расписание" href="/schedule" active={true} />
            <NavItem icon={BookOpen} label="Записи" href="/bookings" active={false} />
            <NavItem icon={Settings} label="Настройки" href="/settings" active={false} />
          </nav>
        </div>

        {/* Main */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Расписание</h2>
            <p style={{ color: '#888', marginTop: 6, fontSize: 15 }}>Укажи когда ты доступен для встреч</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
            {DAYS.map(day => {
              const slot = schedule.find(s => s.day_of_week === day.id)
              return (
                <div key={day.id} style={{
                  background: '#fff', borderRadius: 16, padding: '20px 24px',
                  border: `1.5px solid ${slot.is_active ? '#E8FF47' : '#E8E7E0'}`,
                  display: 'flex', alignItems: 'center', gap: 16,
                  transition: 'all 0.2s'
                }}>
                  <div onClick={() => toggle(day.id)} style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: slot.is_active ? '#111' : '#E0E0D8',
                    cursor: 'pointer', position: 'relative', flexShrink: 0,
                    transition: 'background 0.2s'
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 9, background: '#fff',
                      position: 'absolute', top: 3,
                      left: slot.is_active ? 23 : 3,
                      transition: 'left 0.2s'
                    }} />
                  </div>

                  <div style={{ width: 110, fontSize: 15, fontWeight: 600, color: slot.is_active ? '#111' : '#aaa' }}>
                    {day.name}
                  </div>

                  {slot.is_active ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                      <select value={slot.start_time} onChange={e => update(day.id, 'start_time', e.target.value)} style={selectStyle}>
                        {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span style={{ color: '#888', fontSize: 14 }}>до</span>
                      <select value={slot.end_time} onChange={e => update(day.id, 'end_time', e.target.value)} style={selectStyle}>
                        {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span style={{ color: '#888', fontSize: 13 }}>
                        {(() => {
                          const [sh, sm] = slot.start_time.split(':').map(Number)
                          const [eh, em] = slot.end_time.split(':').map(Number)
                          const diff = (eh * 60 + em) - (sh * 60 + sm)
                          return diff > 0 ? `${Math.floor(diff / 60)}ч ${diff % 60 > 0 ? diff % 60 + 'м' : ''}` : ''
                        })()}
                      </span>
                    </div>
                  ) : (
                    <div style={{ color: '#aaa', fontSize: 14 }}>Недоступен</div>
                  )}
                </div>
              )
            })}
          </div>

          <button onClick={save} style={{
            background: saved ? '#22C55E' : '#111', color: '#fff',
            border: 'none', padding: '14px 32px', borderRadius: 12,
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            transition: 'background 0.3s'
          }}>
            {saved ? '✓ Сохранено!' : 'Сохранить расписание'}
          </button>
        </div>
      </div>
    </div>
  )
}