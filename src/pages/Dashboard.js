import { useState, useEffect } from 'react'
import axios from 'axios'
import { QRCodeSVG } from 'qrcode.react'
import { User, Clock, BookOpen, Settings, Copy, Trash2, Plus, Check, ExternalLink, Calendar, QrCode, ChevronDown, ChevronUp, Edit2 } from 'lucide-react'

const API = 'https://kogda-backend-production.up.railway.app'

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
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

const emptyForm = { title: '', description: '', duration: 60, price: 0, buffer_before: 0, buffer_after: 0, min_notice: 0, max_days_ahead: 60, max_per_day: 0, require_confirm: false }

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 9,
  border: '1.5px solid #E0E0D8', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'Inter, sans-serif'
}

const selectStyle = { ...inputStyle, cursor: 'pointer', background: '#fff' }

const ServiceForm = ({ formData, setFormData, onSubmit, onCancel, showAdv, setShowAdv, isEdit }) => (
  <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: `1.5px solid ${isEdit ? '#E8FF47' : '#E8E7E0'}`, marginBottom: 20 }}>
    <h4 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>{isEdit ? 'Редактировать услугу' : 'Новая услуга'}</h4>
    <form onSubmit={onSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Название</label>
          <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
            placeholder="Первичная консультация" required style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Длительность (мин)</label>
          <select value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} style={selectStyle}>
            {[15,20,25,30,45,50,60,90,120].map(d => <option key={d} value={d}>{d} мин</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Описание</label>
        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
          placeholder="Расскажи клиенту что будет на встрече..."
          style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Цена (₽)</label>
        <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
          placeholder="0 - бесплатно" style={inputStyle} />
      </div>
      <div style={{ borderTop: '1px solid #F0EFE9', paddingTop: 16, marginBottom: 20 }}>
        <button type="button" onClick={() => setShowAdv(!showAdv)} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#888', padding: 0
        }}>
          {showAdv ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Дополнительные настройки
        </button>
        {showAdv && (
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Буфер до (мин)</label>
              <select value={formData.buffer_before} onChange={e => setFormData({...formData, buffer_before: Number(e.target.value)})} style={selectStyle}>
                {[0,5,10,15,20,30].map(v => <option key={v} value={v}>{v === 0 ? 'Без буфера' : `${v} мин`}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Буфер после (мин)</label>
              <select value={formData.buffer_after} onChange={e => setFormData({...formData, buffer_after: Number(e.target.value)})} style={selectStyle}>
                {[0,5,10,15,20,30].map(v => <option key={v} value={v}>{v === 0 ? 'Без буфера' : `${v} мин`}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Минимум до записи</label>
              <select value={formData.min_notice} onChange={e => setFormData({...formData, min_notice: Number(e.target.value)})} style={selectStyle}>
                {[0,1,2,4,8,12,24,48,72].map(v => <option key={v} value={v}>{v === 0 ? 'Без ограничений' : `${v} ч`}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Записи на сколько вперёд</label>
              <select value={formData.max_days_ahead} onChange={e => setFormData({...formData, max_days_ahead: Number(e.target.value)})} style={selectStyle}>
                {[7,14,30,60,90,180].map(v => <option key={v} value={v}>{v} дней</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Макс. встреч в день</label>
              <select value={formData.max_per_day} onChange={e => setFormData({...formData, max_per_day: Number(e.target.value)})} style={selectStyle}>
                {[0,1,2,3,4,5,6,8,10].map(v => <option key={v} value={v}>{v === 0 ? 'Без лимита' : `${v} встреч`}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F7F6F1', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Подтверждать вручную</div>
                  <div style={{ position: 'relative', display: 'inline-block' }}
                    onMouseEnter={e => e.currentTarget.querySelector('.tooltip').style.display = 'block'}
                    onMouseLeave={e => e.currentTarget.querySelector('.tooltip').style.display = 'none'}>
                    <div style={{ width: 16, height: 16, borderRadius: 8, background: '#E0E0D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#888', cursor: 'default' }}>?</div>
                    <div className="tooltip" style={{ display: 'none', position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#111', color: '#fff', fontSize: 12, padding: '8px 12px', borderRadius: 8, whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none' }}>
                      Каждая запись требует твоего подтверждения
                    </div>
                  </div>
                </div>
                <div onClick={() => setFormData({...formData, require_confirm: !formData.require_confirm})} style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: formData.require_confirm ? '#111' : '#E0E0D8',
                  cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s'
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: formData.require_confirm ? 23 : 3, transition: 'left 0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" style={{ background: '#111', color: '#F7F6F1', border: 'none', padding: '11px 26px', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          {isEdit ? 'Сохранить' : 'Создать'}
        </button>
        <button type="button" onClick={onCancel} style={{ background: 'transparent', border: '1.5px solid #E0E0D8', padding: '11px 26px', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Отмена
        </button>
      </div>
    </form>
  </div>
)

export default function Dashboard() {
  const [meetings, setMeetings] = useState([])
  const [bookings, setBookings] = useState([])
  const [user, setUser] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editMeeting, setEditMeeting] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [copiedId, setCopiedId] = useState(null)
  const [showQR, setShowQR] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showEditAdvanced, setShowEditAdvanced] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { window.location.href = '/login'; return }
    setUser(JSON.parse(u))
    loadMeetings()
    loadBookings()
  }, [])

  const loadMeetings = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API}/meetings`, { headers: { Authorization: `Bearer ${token}` } })
      setMeetings(res.data)
    } catch (err) { console.error(err) }
  }

  const loadBookings = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API}/bookings`, { headers: { Authorization: `Bearer ${token}` } })
      setBookings(res.data)
    } catch (err) { console.error(err) }
  }

  const createMeeting = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API}/meetings`, form, { headers: { Authorization: `Bearer ${token}` } })
      setShowForm(false)
      setForm(emptyForm)
      setShowAdvanced(false)
      loadMeetings()
    } catch (err) { console.error(err) }
  }

  const updateMeeting = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/meetings/${editMeeting.id}`, editForm, { headers: { Authorization: `Bearer ${token}` } })
      setEditMeeting(null)
      setShowEditAdvanced(false)
      loadMeetings()
    } catch (err) { console.error(err) }
  }

  const deleteMeeting = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await axios.delete(`${API}/meetings/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      loadMeetings()
    } catch (err) { console.error(err) }
  }

  const copyLink = (id) => {
    navigator.clipboard.writeText(bookingLink)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!user) return null

  const bookingLink = `https://app.kogda.app/${user.slug}`

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = (() => { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1 })()
  const today = new Date()

  const getBookingsForDay = (day) => bookings.filter(b => {
    const d = new Date(b.start_time)
    return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year && b.status !== 'cancelled'
  })

  const thisMonth = bookings.filter(b => {
    const d = new Date(b.start_time)
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  })
  const completed = bookings.filter(b => new Date(b.start_time) < today && b.status !== 'cancelled').length
  const cancelled = bookings.filter(b => b.status === 'cancelled').length

  const nextBooking = bookings
    .filter(b => new Date(b.start_time) > today && b.status !== 'cancelled')
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0]

  const selectedDayBookings = selectedDay ? getBookingsForDay(selectedDay) : []

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #E8E7E0', padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            <NavItem icon={User} label="Мой кабинет" href="/dashboard" active={true} />
            <NavItem icon={Clock} label="Расписание" href="/schedule" active={false} />
            <NavItem icon={BookOpen} label="Записи" href="/bookings" active={false} />
            <NavItem icon={Settings} label="Настройки" href="/settings" active={false} />
          </nav>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Привет, {user.name}!</h2>
            {nextBooking ? (
              <p style={{ color: '#888', marginTop: 6, fontSize: 15 }}>
                Ближайшая встреча: <strong style={{ color: '#111' }}>
                  {new Date(nextBooking.start_time).getDate()} {MONTHS_SHORT[new Date(nextBooking.start_time).getMonth()]} в {new Date(nextBooking.start_time).toTimeString().slice(0,5)}
                </strong> — {nextBooking.client_name}
              </p>
            ) : (
              <p style={{ color: '#888', marginTop: 6, fontSize: 15 }}>Нет предстоящих встреч</p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #E8E7E0' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#111', marginBottom: 4 }}>{thisMonth.length}</div>
              <div style={{ fontSize: 13, color: '#888' }}>Записей в этом месяце</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #E8E7E0' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#22C55E', marginBottom: 4 }}>{completed}</div>
              <div style={{ fontSize: 13, color: '#888' }}>Завершено</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #E8E7E0' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#DC2626', marginBottom: 4 }}>{cancelled}</div>
              <div style={{ fontSize: 13, color: '#888' }}>Отменено</div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E8E7E0', marginBottom: 20, overflow: 'hidden' }}>
            <div onClick={() => setCalendarOpen(!calendarOpen)} style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E8FF47', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={20} color="#111" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Календарь</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{bookings.filter(b => b.status !== 'cancelled').length} записей всего</div>
                </div>
              </div>
              {calendarOpen ? <ChevronUp size={18} color="#888" /> : <ChevronDown size={18} color="#888" />}
            </div>
            {calendarOpen && (
              <div style={{ borderTop: '1px solid #F0EFE9', padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <button onClick={() => setCurrentDate(new Date(year, month-1, 1))} style={{ background: 'none', border: '1.5px solid #E0E0D8', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>‹</button>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{MONTHS[month]} {year}</span>
                      <button onClick={() => setCurrentDate(new Date(year, month+1, 1))} style={{ background: 'none', border: '1.5px solid #E0E0D8', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>›</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                      {DAYS_SHORT.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888', padding: '4px 0' }}>{d}</div>)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                      {Array(firstDay).fill(null).map((_,i) => <div key={i} />)}
                      {Array(daysInMonth).fill(null).map((_,i) => {
                        const day = i + 1
                        const dayBookings = getBookingsForDay(day)
                        const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
                        const isSelected = selectedDay === day
                        const isPast = new Date(year, month, day) < new Date().setHours(0,0,0,0)
                        return (
                          <div key={day} onClick={() => setSelectedDay(day === selectedDay ? null : day)} style={{
                            textAlign: 'center', padding: '6px 4px', borderRadius: 8, cursor: 'pointer',
                            background: isSelected ? '#111' : isToday ? '#E8FF47' : 'transparent',
                            color: isSelected ? '#fff' : isPast ? '#ccc' : '#111',
                            fontWeight: isToday || isSelected ? 700 : 400, fontSize: 14
                          }}>
                            {day}
                            {dayBookings.length > 0 && <div style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#fff' : '#22C55E', margin: '2px auto 0' }} />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    {selectedDay ? (
                      <>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#888' }}>{selectedDay} {MONTHS[month].toLowerCase()}</div>
                        {selectedDayBookings.length === 0 ? (
                          <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '20px 0' }}>Нет записей</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {selectedDayBookings.map(b => (
                              <div key={b.id} style={{ background: '#F7F6F1', borderRadius: 10, padding: '12px 14px' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                                  {new Date(b.start_time).toTimeString().slice(0,5)} — {b.client_name}
                                </div>
                                <div style={{ fontSize: 12, color: '#888' }}>{b.meeting_title}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div>
                        <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Нажми на день чтобы увидеть записи</div>
                        <div style={{ borderTop: '1px solid #F0EFE9', paddingTop: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Синхронизация</div>
                          {[{ name: 'Google Calendar', color: '#4285F4' }, { name: 'Яндекс Календарь', color: '#FF0000' }, { name: 'Apple Calendar', color: '#111' }].map(cal => (
                            <div key={cal.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F7F6F1' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: 4, background: cal.color }} />
                                <span style={{ fontSize: 13 }}>{cal.name}</span>
                              </div>
                              <button style={{ background: 'transparent', border: '1px solid #E0E0D8', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#888' }}>Скоро</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: '20px 24px', border: '1px solid #E8E7E0', marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.5 }}>Твоя ссылка для клиентов</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ background: '#F7F6F1', borderRadius: 10, padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 12 }}>{bookingLink}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => copyLink('main')} style={{ background: copiedId === 'main' ? '#22C55E' : '#111', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
                    {copiedId === 'main' ? <Check size={13} /> : <Copy size={13} />}
                    {copiedId === 'main' ? 'Скопировано!' : 'Скопировать'}
                  </button>
                  <a href={bookingLink} target="_blank" rel="noreferrer" style={{ background: 'transparent', border: '1.5px solid #E0E0D8', color: '#111', padding: '10px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ExternalLink size={13} />Открыть
                  </a>
                  <button onClick={() => setShowQR(!showQR)} style={{ background: showQR ? '#E8FF47' : 'transparent', border: '1.5px solid #E0E0D8', color: '#111', padding: '10px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <QrCode size={13} />QR
                  </button>
                </div>
              </div>
              {showQR && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #E8E7E0', flexShrink: 0, textAlign: 'center' }}>
                  <QRCodeSVG value={bookingLink} size={100} />
                  <div style={{ fontSize: 11, color: '#888', marginTop: 8 }}>Сканируй телефоном</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Мои услуги</h3>
            <button onClick={() => setShowForm(!showForm)} style={{ background: '#E8FF47', color: '#111', border: 'none', padding: '10px 22px', borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={15} />Добавить услугу
            </button>
          </div>

          {showForm && (
            <ServiceForm
              formData={form} setFormData={setForm}
              onSubmit={createMeeting} onCancel={() => { setShowForm(false); setForm(emptyForm); setShowAdvanced(false) }}
              showAdv={showAdvanced} setShowAdv={setShowAdvanced}
              isEdit={false}
            />
          )}

          {editMeeting && (
            <ServiceForm
              formData={editForm} setFormData={setEditForm}
              onSubmit={updateMeeting} onCancel={() => { setEditMeeting(null); setShowEditAdvanced(false) }}
              showAdv={showEditAdvanced} setShowAdv={setShowEditAdvanced}
              isEdit={true}
            />
          )}

          {meetings.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '40px', border: '1px solid #E8E7E0', textAlign: 'center' }}>
              <Calendar size={36} color="#ccc" style={{ marginBottom: 12 }} />
              <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>Пока нет услуг</h4>
              <p style={{ color: '#888', fontSize: 14 }}>Добавь первую услугу и поделись ссылкой с клиентами</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {meetings.map(m => editMeeting?.id === m.id ? null : (
                <div key={m.id} style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #E8E7E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0EFE9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={20} color="#888" />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{m.title}</div>
                      <div style={{ fontSize: 13, color: '#888', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock size={12} />
                        {m.duration} мин · {m.price > 0 ? `${m.price} ₽` : 'Бесплатно'}
                        {m.buffer_after > 0 && <span>· +{m.buffer_after}м буфер</span>}
                        {m.max_per_day > 0 && <span>· макс {m.max_per_day}/день</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={bookingLink} target="_blank" rel="noreferrer" style={{ background: 'transparent', border: '1.5px solid #E0E0D8', color: '#111', padding: '8px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <ExternalLink size={12} />Открыть
                    </a>
                    <button onClick={() => { setEditMeeting(m); setEditForm({ title: m.title, description: m.description || '', duration: m.duration, price: m.price, buffer_before: m.buffer_before || 0, buffer_after: m.buffer_after || 0, min_notice: m.min_notice || 0, max_days_ahead: m.max_days_ahead || 60, max_per_day: m.max_per_day || 0 }) }} style={{ background: 'transparent', border: '1.5px solid #E0E0D8', color: '#111', padding: '8px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Edit2 size={12} />Редактировать
                    </button>
                    <button onClick={() => deleteMeeting(m.id)} style={{ background: 'transparent', border: '1.5px solid #FFE0E0', color: '#DC2626', padding: '8px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Trash2 size={12} />Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}