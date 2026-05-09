import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Plus, Trash2, Check } from 'lucide-react'
import AppLayout from '../components/AppLayout'

const API = process.env.REACT_APP_API_URL || 'https://kogda-backend-production.up.railway.app'

const DAYS = [
  { id: 1, full: 'Понедельник' },
  { id: 2, full: 'Вторник' },
  { id: 3, full: 'Среда' },
  { id: 4, full: 'Четверг' },
  { id: 5, full: 'Пятница' },
  { id: 6, full: 'Суббота' },
  { id: 0, full: 'Воскресенье' },
]

const TIMES = []
for (let h = 6; h <= 23; h++) {
  TIMES.push(`${h.toString().padStart(2,'0')}:00`)
  TIMES.push(`${h.toString().padStart(2,'0')}:30`)
}

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
const DAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

const getDuration = (start, end) => {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  if (diff <= 0) return ''
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return h > 0 && m > 0 ? `${h}ч ${m}м` : h > 0 ? `${h}ч` : `${m}м`
}

export default function Schedule() {
  const [scheduleType, setScheduleType] = useState('standard')
  const [schedule, setSchedule] = useState(
    DAYS.map(d => ({ day_of_week: d.id, start_time: '09:00', end_time: '18:00', is_active: false }))
  )
  const [flexSlots, setFlexSlots] = useState([])
  const [saveStatus, setSaveStatus] = useState('idle')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [newSlot, setNewSlot] = useState({ start_time: '09:00', end_time: '18:00' })
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [slotError, setSlotError] = useState('')
  const [overrides, setOverrides] = useState([])

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { window.location.href = '/login'; return }
    loadScheduleType()
    loadSchedule()
    loadFlexSlots()
    loadOverrides()
  }, [])

  const loadOverrides = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API}/schedule/overrides`, { headers: { Authorization: `Bearer ${token}` } })
      setOverrides(res.data)
    } catch (err) { console.error(err) }
  }

  const toggleOverride = async (date) => {
    const token = localStorage.getItem('token')
    const existing = overrides.find(o => o.date.slice(0, 10) === date)
    try {
      if (existing) {
        await axios.delete(`${API}/schedule/overrides/${existing.id}`, { headers: { Authorization: `Bearer ${token}` } })
      } else {
        await axios.post(`${API}/schedule/overrides`, { date, is_available: false }, { headers: { Authorization: `Bearer ${token}` } })
      }
      loadOverrides()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch (err) { console.error(err) }
  }

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

  const triggerSave = useCallback(async (data) => {
    const token = localStorage.getItem('token')
    setSaveStatus('saving')
    try {
      await axios.post(`${API}/schedule`, { schedule: data }, { headers: { Authorization: `Bearer ${token}` } })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch (err) { setSaveStatus('idle') }
  }, [])

  const toggle = (dayId) => {
    const updated = schedule.map(s => s.day_of_week === dayId ? { ...s, is_active: !s.is_active } : s)
    setSchedule(updated)
    triggerSave(updated)
  }

  const update = (dayId, field, value) => {
    const updated = schedule.map(s => s.day_of_week === dayId ? { ...s, [field]: value } : s)
    setSchedule(updated)
    triggerSave(updated)
  }

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

  const selectedSlots = flexSlots
    .filter(s => selectedDate && s.date.startsWith(selectedDateStr))
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  const addFlexSlot = async () => {
    if (!selectedDate) return
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`
    const [sh, sm] = newSlot.start_time.split(':').map(Number)
    const [eh, em] = newSlot.end_time.split(':').map(Number)
    const newStart = sh * 60 + sm
    const newEnd = eh * 60 + em
    if (newEnd <= newStart) { setSlotError('Время окончания должно быть позже начала'); return }
    const hasOverlap = selectedSlots.some(s => {
      const [esh, esm] = s.start_time.split(':').map(Number)
      const [eeh, eem] = s.end_time.split(':').map(Number)
      return newStart < (eeh * 60 + eem) && newEnd > (esh * 60 + esm)
    })
    if (hasOverlap) { setSlotError('Это время пересекается с уже добавленным'); return }
    setSlotError('')
    const token = localStorage.getItem('token')
    try {
      setSaveStatus('saving')
      await axios.post(`${API}/schedule/flexible`, { date: dateStr, ...newSlot }, { headers: { Authorization: `Bearer ${token}` } })
      loadFlexSlots()
      setShowAddSlot(false)
      setNewSlot({ start_time: '09:00', end_time: '18:00' })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch (err) { console.error(err) }
  }

  const deleteFlexSlot = async (id) => {
    const token = localStorage.getItem('token')
    try {
      setSaveStatus('saving')
      await axios.delete(`${API}/schedule/flexible/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      loadFlexSlots()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch (err) { console.error(err) }
  }

  const sel = {
    padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E8E7E0',
    fontSize: 13, outline: 'none', background: '#F7F6F1',
    cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#111'
  }

  return (
    <AppLayout>
      {/* Title + save indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Расписание</h2>
          <p style={{ color: '#888', marginTop: 4, fontSize: 14 }}>Укажи когда ты доступен для встреч</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 100,
          background: saveStatus === 'saved' ? '#DCFCE7' : '#F0EFE9',
          transition: 'background 0.3s'
        }}>
          {saveStatus === 'saving' && <div style={{ width: 6, height: 6, borderRadius: 3, background: '#bbb' }} />}
          {saveStatus === 'saved' && <Check size={11} color="#16A34A" strokeWidth={3} />}
          {saveStatus === 'idle' && <div style={{ width: 6, height: 6, borderRadius: 3, background: '#ccc' }} />}
          <span style={{ fontSize: 11, fontWeight: 700, color: saveStatus === 'saved' ? '#16A34A' : '#aaa' }}>
            {saveStatus === 'saving' ? 'Сохраняем...' : saveStatus === 'saved' ? 'Сохранено' : 'Авто-сохранение'}
          </span>
        </div>
      </div>

      {/* Type switcher */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '4px', border: '1px solid #E8E7E0', marginBottom: 24, display: 'inline-flex' }}>
        {[{ key: 'standard', label: 'Стандартное' }, { key: 'flexible', label: 'Гибкое' }].map(t => (
          <button key={t.key} onClick={() => switchType(t.key)} style={{
            padding: '8px 20px', borderRadius: 9, border: 'none',
            background: scheduleType === t.key ? '#111' : 'transparent',
            color: scheduleType === t.key ? '#fff' : '#888',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
          }}>{t.label}</button>
        ))}
      </div>

      {/* STANDARD */}
      {scheduleType === 'standard' && (
        <div>
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E8E7E0', overflow: 'hidden', maxWidth: 620 }}>
          {DAYS.map((day, idx) => {
            const slot = schedule.find(s => s.day_of_week === day.id)
            return (
              <div key={day.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 20px',
                borderBottom: idx < DAYS.length - 1 ? '1px solid #F5F4F0' : 'none',
                background: slot.is_active ? '#fff' : '#FAFAF8',
              }}>
                <div onClick={() => toggle(day.id)} style={{
                  width: 36, height: 20, borderRadius: 10,
                  background: slot.is_active ? '#111' : '#DDD',
                  cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s'
                }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: 7, background: '#fff',
                    position: 'absolute', top: 3,
                    left: slot.is_active ? 19 : 3, transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                  }} />
                </div>

                <div style={{ width: 110, fontSize: 14, fontWeight: 600, color: slot.is_active ? '#111' : '#bbb', flexShrink: 0 }}>
                  {day.full}
                </div>

                {slot.is_active ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select value={slot.start_time} onChange={e => update(day.id, 'start_time', e.target.value)} style={sel}>
                      {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span style={{ color: '#ccc' }}>—</span>
                    <select value={slot.end_time} onChange={e => update(day.id, 'end_time', e.target.value)} style={sel}>
                      {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#aaa', background: '#F5F4F0', padding: '3px 8px', borderRadius: 5 }}>
                      {getDuration(slot.start_time, slot.end_time)}
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: 13, color: '#ccc' }}>Выходной</span>
                )}
              </div>
            )
          })}
          </div>

          {/* Исключения — закрытые даты */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E8E7E0', padding: '22px', marginTop: 16, maxWidth: 620 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Выходные дни</div>
              <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>Закрой конкретные даты — например праздники или отпуск</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button onClick={() => setCurrentDate(new Date(year, month-1, 1))} style={{ background: 'none', border: '1.5px solid #E8E7E0', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 15, color: '#888' }}>‹</button>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{MONTHS[month]} {year}</span>
              <button onClick={() => setCurrentDate(new Date(year, month+1, 1))} style={{ background: 'none', border: '1.5px solid #E8E7E0', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 15, color: '#888' }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
              {DAYS_SHORT.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#ccc', padding: '3px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {Array(firstDay).fill(null).map((_,i) => <div key={i} />)}
              {Array(daysInMonth).fill(null).map((_,i) => {
                const day = i + 1
                const dateObj = new Date(year, month, day)
                const isPast = dateObj < new Date().setHours(0,0,0,0)
                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
                const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                const isClosed = overrides.some(o => o.date.slice(0, 10) === dateStr)
                return (
                  <div key={day} onClick={() => !isPast && toggleOverride(dateStr)}
                    title={isClosed ? 'Нажми чтобы открыть день' : 'Нажми чтобы закрыть день'}
                    style={{
                      textAlign: 'center', padding: '7px 2px', borderRadius: 8,
                      cursor: isPast ? 'default' : 'pointer',
                      background: isClosed ? '#FEE2E2' : isToday ? '#E8FF47' : 'transparent',
                      color: isClosed ? '#DC2626' : isPast ? '#ddd' : '#111',
                      fontWeight: isClosed || isToday ? 700 : 400,
                      fontSize: 13, transition: 'all 0.15s',
                      textDecoration: isClosed ? 'line-through' : 'none'
                    }}>
                    {day}
                  </div>
                )
              })}
            </div>
            {overrides.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #F5F4F0' }}>
                <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8, fontWeight: 600 }}>Закрытые дни:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {overrides.map(o => (
                    <div key={o.id} style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {new Date(o.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      <span onClick={() => toggleOverride(o.date.slice(0, 10))} style={{ cursor: 'pointer', opacity: 0.6 }}>✕</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FLEXIBLE */}
      {scheduleType === 'flexible' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, maxWidth: 720 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '22px', border: '1px solid #E8E7E0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <button onClick={() => setCurrentDate(new Date(year, month-1, 1))}
                style={{ background: 'none', border: '1.5px solid #E8E7E0', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 15, color: '#888' }}>‹</button>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{MONTHS[month]} {year}</span>
              <button onClick={() => setCurrentDate(new Date(year, month+1, 1))}
                style={{ background: 'none', border: '1.5px solid #E8E7E0', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 15, color: '#888' }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
              {DAYS_SHORT.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#ccc', padding: '3px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</div>
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
                  <div key={day} onClick={() => !isPast && setSelectedDate(new Date(year, month, day))} style={{
                    textAlign: 'center', padding: '7px 2px', borderRadius: 8,
                    cursor: isPast ? 'default' : 'pointer',
                    background: isSelected ? '#111' : isToday ? '#E8FF47' : 'transparent',
                    color: isSelected ? '#fff' : isPast ? '#ddd' : '#111',
                    fontWeight: isSelected || isToday ? 700 : 400, fontSize: 13, transition: 'all 0.15s'
                  }}>
                    {day}
                    {hasSlots && <div style={{ width: 3, height: 3, borderRadius: '50%', background: isSelected ? '#E8FF47' : '#111', margin: '2px auto 0' }} />}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: '22px', border: '1px solid #E8E7E0' }}>
            {selectedDate ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{selectedDate.getDate()} {MONTHS_GEN[selectedDate.getMonth()]}</div>
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{DAYS.find(d => d.id === selectedDate.getDay())?.full || 'Воскресенье'}</div>
                </div>
                {selectedSlots.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {selectedSlots.map(slot => (
                      <div key={slot.id} style={{ background: '#F7F6F1', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{slot.start_time} — {slot.end_time}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#aaa', background: '#EEEEE8', padding: '2px 6px', borderRadius: 4 }}>{getDuration(slot.start_time, slot.end_time)}</span>
                        </div>
                        <button onClick={() => deleteFlexSlot(slot.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ddd', padding: '2px', display: 'flex', transition: 'color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
                          onMouseLeave={e => e.currentTarget.style.color = '#ddd'}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {showAddSlot ? (
                  <div style={{ background: '#F7F6F1', borderRadius: 12, padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <select value={newSlot.start_time} onChange={e => { setNewSlot({...newSlot, start_time: e.target.value}); setSlotError('') }} style={{ ...sel, flex: 1 }}>
                        {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span style={{ color: '#ccc', fontSize: 12 }}>—</span>
                      <select value={newSlot.end_time} onChange={e => { setNewSlot({...newSlot, end_time: e.target.value}); setSlotError('') }} style={{ ...sel, flex: 1 }}>
                        {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    {slotError && <div style={{ fontSize: 11, color: '#DC2626', marginBottom: 8, padding: '5px 8px', background: '#FEF2F2', borderRadius: 6 }}>{slotError}</div>}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={addFlexSlot} style={{ background: '#111', color: '#fff', border: 'none', padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', flex: 1 }}>Добавить</button>
                      <button onClick={() => { setShowAddSlot(false); setSlotError(''); setNewSlot({ start_time: '09:00', end_time: '18:00' }) }} style={{ background: 'transparent', border: '1.5px solid #E0E0D8', padding: '8px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer', color: '#888' }}>✕</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAddSlot(true)} style={{ background: '#E8FF47', color: '#111', border: 'none', padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}>
                    <Plus size={13} strokeWidth={2.5} /> Добавить время
                  </button>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#aaa' }}>Выбери день в календаре</div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  )
}