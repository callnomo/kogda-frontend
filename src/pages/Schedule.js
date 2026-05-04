import { useState, useEffect } from 'react'
import axios from 'axios'
import { User, Clock, BookOpen, Settings, Plus, Trash2 } from 'lucide-react'

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
  TIMES.push(`${h.toString().padStart(2,'0')}:00`)
  TIMES.push(`${h.toString().padStart(2,'0')}:30`)
}

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

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
  const [scheduleType, setScheduleType] = useState('standard')
  const [schedule, setSchedule] = useState(
    DAYS.map(d => ({ day_of_week: d.id, start_time: '09:00', end_time: '18:00', is_active: false }))
  )
  const [flexSlots, setFlexSlots] = useState([])
  const [saved, setSaved] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [newSlot, setNewSlot] = useState({ start_time: '09:00', end_time: '18:00' })
  const [showAddSlot, setShowAddSlot] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { window.location.href = '/login'; return }
    loadScheduleType()
    loadSchedule()
    loadFlexSlots()
  }, [])

  const loadScheduleType = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API}/schedule/type`, { headers: { Authorization: `Bearer ${token}` } })
      setScheduleType(res.data.schedule_type || 'standard')
    } catch (err) { console.error(err) }
  }

  const loadSchedule = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API}/schedule`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.length > 0) {
        const loaded = DAYS.map(d => {
          const found = res.data.find(s => s.day_of_week === d.id)
          return found
            ? { day_of_week: d.id, start_time: found.start_time, end_time: found.end_time, is_active: true }
            : { day_of_week: d.id, start_time: '09:00', end_time: '18:00', is_active: false }
        })
        setSchedule(loaded)
      }
    } catch (err) { console.error(err) }
  }

  const loadFlexSlots = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API}/schedule/flexible`, { headers: { Authorization: `Bearer ${token}` } })
      setFlexSlots(res.data)
    } catch (err) { console.error(err) }
  }

  const switchType = async (type) => {
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API}/schedule/type`, { schedule_type: type }, { headers: { Authorization: `Bearer ${token}` } })
      setScheduleType(type)
    } catch (err) { console.error(err) }
  }

  const toggle = (dayId) => setSchedule(schedule.map(s => s.day_of_week === dayId ? { ...s, is_active: !s.is_active } : s))
  const update = (dayId, field, value) => setSchedule(schedule.map(s => s.day_of_week === dayId ? { ...s, [field]: value } : s))

  const saveStandard = async () => {
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API}/schedule`, { schedule }, { headers: { Authorization: `Bearer ${token}` } })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) { console.error(err) }
  }

  const addFlexSlot = async () => {
    if (!selectedDate) return
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`
    
    // Проверка на дубликат
    const isDuplicate = selectedSlots.some(s => s.start_time === newSlot.start_time && s.end_time === newSlot.end_time)
    if (isDuplicate) return

    // Проверка что end_time > start_time
    const [sh, sm] = newSlot.start_time.split(':').map(Number)
    const [eh, em] = newSlot.end_time.split(':').map(Number)
    if (eh * 60 + em <= sh * 60 + sm) return

    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API}/schedule/flexible`, { date: dateStr, ...newSlot }, { headers: { Authorization: `Bearer ${token}` } })
      loadFlexSlots()
      setShowAddSlot(false)
    } catch (err) { console.error(err) }
  }

  const deleteFlexSlot = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await axios.delete(`${API}/schedule/flexible/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      loadFlexSlots()
    } catch (err) { console.error(err) }
  }

  // Calendar helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = (() => { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1 })()
  const today = new Date()

  const hasFlexSlots = (day) => {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return flexSlots.some(s => s.date.startsWith(dateStr))
  }

  const selectedDateStr = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`
    : null

  const selectedSlots = flexSlots.filter(s => selectedDate && s.date.startsWith(selectedDateStr))

  const selectStyle = {
    padding: '8px 12px', borderRadius: 8,
    border: '1.5px solid #E0E0D8', fontSize: 14,
    outline: 'none', background: '#fff', cursor: 'pointer',
    fontFamily: 'Inter, sans-serif'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', fontFamily: 'Inter, sans-serif' }}>
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
        <div style={{ width: 200, flexShrink: 0 }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <NavItem icon={User} label="Мой кабинет" href="/dashboard" active={false} />
            <NavItem icon={Clock} label="Расписание" href="/schedule" active={true} />
            <NavItem icon={BookOpen} label="Записи" href="/bookings" active={false} />
            <NavItem icon={Settings} label="Настройки" href="/settings" active={false} />
          </nav>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Расписание</h2>
            <p style={{ color: '#888', marginTop: 6, fontSize: 15 }}>Укажи когда ты доступен для встреч</p>
          </div>

          {/* Type switcher */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '6px', border: '1px solid #E8E7E0', marginBottom: 24, display: 'inline-flex', gap: 4 }}>
            {[
              { key: 'standard', label: 'Стандартное', desc: 'Каждую неделю одинаково' },
              { key: 'flexible', label: 'Гибкое', desc: 'Выбираю конкретные даты' }
            ].map(t => (
              <button key={t.key} onClick={() => switchType(t.key)} style={{
                padding: '10px 20px', borderRadius: 12, border: 'none',
                background: scheduleType === t.key ? '#111' : 'transparent',
                color: scheduleType === t.key ? '#fff' : '#888',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Active status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#22C55E' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#22C55E' }}>
              {scheduleType === 'standard' ? 'Стандартное расписание активно' : 'Гибкое расписание активно'}
            </span>
          </div>

          {/* Standard schedule */}
          {scheduleType === 'standard' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {DAYS.map(day => {
                  const slot = schedule.find(s => s.day_of_week === day.id)
                  return (
                    <div key={day.id} style={{
                      background: '#fff', borderRadius: 16, padding: '18px 24px',
                      border: `1.5px solid ${slot.is_active ? '#E8FF47' : '#E8E7E0'}`,
                      display: 'flex', alignItems: 'center', gap: 16,
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
                              const diff = (eh*60+em) - (sh*60+sm)
                              return diff > 0 ? `${Math.floor(diff/60)}ч ${diff%60 > 0 ? diff%60+'м' : ''}` : ''
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
              <button onClick={saveStandard} style={{
                background: saved ? '#22C55E' : '#111', color: '#fff',
                border: 'none', padding: '14px 32px', borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'background 0.3s'
              }}>
                {saved ? '✓ Сохранено!' : 'Сохранить расписание'}
              </button>
            </div>
          )}

          {/* Flexible schedule */}
          {scheduleType === 'flexible' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
              {/* Calendar */}
              <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #E8E7E0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <button onClick={() => setCurrentDate(new Date(year, month-1, 1))}
                    style={{ background: 'none', border: '1.5px solid #E0E0D8', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>‹</button>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{MONTHS[month]} {year}</span>
                  <button onClick={() => setCurrentDate(new Date(year, month+1, 1))}
                    style={{ background: 'none', border: '1.5px solid #E0E0D8', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>›</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                  {DAYS_SHORT.map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888', padding: '4px 0' }}>{d}</div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                  {Array(firstDay).fill(null).map((_,i) => <div key={i} />)}
                  {Array(daysInMonth).fill(null).map((_,i) => {
                    const day = i + 1
                    const date = new Date(year, month, day)
                    const isPast = date < new Date().setHours(0,0,0,0)
                    const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month
                    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
                    const hasSlots = hasFlexSlots(day)

                    return (
                      <div key={day}
                        onClick={() => !isPast && setSelectedDate(new Date(year, month, day))}
                        style={{
                          textAlign: 'center', padding: '8px 4px', borderRadius: 8,
                          cursor: isPast ? 'default' : 'pointer',
                          background: isSelected ? '#111' : isToday ? '#E8FF47' : 'transparent',
                          color: isSelected ? '#fff' : isPast ? '#ccc' : '#111',
                          fontWeight: isSelected || isToday ? 700 : 400,
                          fontSize: 14, position: 'relative'
                        }}>
                        {day}
                        {hasSlots && (
                          <div style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: isSelected ? '#E8FF47' : '#22C55E',
                            margin: '2px auto 0'
                          }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Day slots */}
              <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #E8E7E0' }}>
                {selectedDate ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}><div style={{ fontSize: 15, fontWeight: 700 }}>
                      {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()].toLowerCase()}</div><div style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>● Авто-сохранение</div></div>

                    {selectedSlots.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                        {selectedSlots.map(slot => (
                          <div key={slot.id} style={{
                            background: '#F7F6F1', borderRadius: 10, padding: '10px 14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                          }}>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>
                              {slot.start_time} — {slot.end_time}
                            </span>
                            <button onClick={() => deleteFlexSlot(slot.id)} style={{
                              background: 'transparent', border: 'none', cursor: 'pointer', color: '#DC2626'
                            }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {showAddSlot ? (
                      <div style={{ background: '#F7F6F1', borderRadius: 12, padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <select value={newSlot.start_time} onChange={e => setNewSlot({...newSlot, start_time: e.target.value})} style={selectStyle}>
                            {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <span style={{ color: '#888' }}>до</span>
                          <select value={newSlot.end_time} onChange={e => setNewSlot({...newSlot, end_time: e.target.value})} style={selectStyle}>
                            {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={addFlexSlot} style={{
                            background: '#111', color: '#fff', border: 'none',
                            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                          }}>Добавить</button>
                          <button onClick={() => setShowAddSlot(false)} style={{
                            background: 'transparent', border: '1.5px solid #E0E0D8',
                            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                          }}>Отмена</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowAddSlot(true)} style={{
                        background: '#E8FF47', color: '#111', border: 'none',
                        padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center'
                      }}>
                        <Plus size={14} />
                        Добавить время
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: '#888', fontSize: 14, padding: '40px 0' }}>
                    Выбери день в календаре чтобы добавить доступное время
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}