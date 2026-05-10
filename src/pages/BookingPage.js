import { useState, useEffect } from 'react'
import axios from 'axios'

const API = process.env.REACT_APP_API_URL || 'https://kogda-backend-production.up.railway.app'

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
const DAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
const DAYS_FULL = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота']

const NOTES_MAX = 200

export default function BookingPage() {
  const slug = window.location.pathname.split('/').pop()
  const [profile, setProfile] = useState(null)
  const [meetings, setMeetings] = useState([])
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', email: '', notes: '' })
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    try {
      const res = await axios.get(`${API}/meetings/public/${slug}`)
      setProfile(res.data.user)
      setMeetings(res.data.meetings)
    } catch (err) {}
    setLoading(false)
  }

  const loadSlots = async (date) => {
    try {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
      const meetingId = selectedMeeting?.id || ''
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const res = await axios.get(`${API}/schedule/slots/${slug}?date=${dateStr}&meeting_type_id=${meetingId}&timezone=${encodeURIComponent(timezone)}`)
      setSlots(res.data.slots || [])
    } catch (err) { setSlots([]) }
  }

  const handleDateClick = async (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    if (date < new Date().setHours(0,0,0,0)) return
    setSelectedDate(date)
    setSelectedSlot(null)
    await loadSlots(date)
  }

  const handleNotesChange = (e) => {
    const value = e.target.value
    if (value.length <= NOTES_MAX) {
      setForm({...form, notes: value})
    }
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    setBookingLoading(true)
    try {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      await axios.post(`${API}/bookings`, {
        meeting_type_id: selectedMeeting.id,
        client_name: form.name,
        client_email: form.email,
        notes: form.notes,
        date: dateStr,
        time: selectedSlot,
        timezone
      })
      setStep(4)
    } catch (err) {
      alert('Ошибка при бронировании. Попробуй ещё раз.')
    }
    setBookingLoading(false)
  }

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
  const getFirstDay = (y, m) => { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1 }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: 15, color: '#aaa' }}>Загружаем...</div>
    </div>
  )

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>404</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Страница не найдена</div>
      </div>
    </div>
  )

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDay(year, month)
  const today = new Date()

  const inp = {
    width: '100%', padding: '13px 16px', borderRadius: 12,
    border: '1.5px solid #E8E7E0', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', background: '#fff'
  }

  const notesLength = form.notes.length
  const counterColor = notesLength >= NOTES_MAX ? '#DC2626' : notesLength >= 180 ? '#D97706' : '#aaa'

  const Sidebar = ({ showBack, onBack, backLabel }) => (
    <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #E8E7E0', height: 'fit-content' }}>
      {profile.avatar ? (
        <img
          src={profile.avatar}
          alt={profile.name}
          style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover', marginBottom: 12, display: 'block' }}
        />
      ) : (
        <div style={{ width: 48, height: 48, borderRadius: 24, background: '#E8FF47', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, marginBottom: 12, color: '#111' }}>
          {profile.name.charAt(0)}
        </div>
      )}
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: profile.bio ? 4 : 16 }}>{profile.name}</div>
      {profile.bio && <div style={{ fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 1.5 }}>{profile.bio}</div>}
      {selectedMeeting && (
        <div style={{ background: '#F7F6F1', borderRadius: 12, padding: '14px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{selectedMeeting.title}</div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 3 }}>⏱ {selectedMeeting.duration} мин · 📹 Видеозвонок</div>
          {selectedMeeting.price > 0 && <div style={{ fontSize: 15, fontWeight: 800, marginTop: 6 }}>{selectedMeeting.price.toLocaleString()} ₽</div>}
          {selectedDate && selectedSlot && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #E8E7E0' }}>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 3 }}>{DAYS_FULL[selectedDate.getDay()]}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedDate.getDate()} {MONTHS_GEN[selectedDate.getMonth()]} · {selectedSlot}</div>
            </div>
          )}
        </div>
      )}
      {showBack && (
        <button onClick={onBack} style={{ marginTop: 12, width: '100%', background: 'transparent', border: '1.5px solid #E8E7E0', padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#888' }}>
          ← {backLabel || 'Назад'}
        </button>
      )}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #E8E7E0', padding: '16px 48px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'Syne, sans-serif' }}>
          kog<span style={{ background: '#E8FF47', padding: '0 6px', borderRadius: 6 }}>DA</span>
        </h1>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>

        {step < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
            {['Тип встречи', 'Дата и время', 'Контакты'].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: step > i+1 ? '#22C55E' : step === i+1 ? '#111' : '#E8E7E0', color: step >= i+1 ? '#fff' : '#aaa' }}>
                    {step > i+1 ? '✓' : i+1}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: step === i+1 ? 700 : 400, color: step === i+1 ? '#111' : '#aaa' }}>{s}</span>
                </div>
                {i < 2 && <div style={{ width: 36, height: 1, background: '#E8E7E0', margin: '0 8px' }} />}
              </div>
            ))}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  style={{ width: 72, height: 72, borderRadius: 36, objectFit: 'cover', margin: '0 auto 14px', display: 'block' }}
                />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: 36, background: '#E8FF47', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, margin: '0 auto 14px', color: '#111' }}>
                  {profile.name.charAt(0)}
                </div>
              )}
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{profile.name}</h2>
              {profile.bio && <p style={{ fontSize: 14, color: '#888', margin: 0 }}>{profile.bio}</p>}
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center', marginBottom: 14 }}>Выберите тип встречи</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {meetings.map(m => (
                <div key={m.id} onClick={() => { setSelectedMeeting(m); setStep(2) }}
                  style={{ background: '#fff', borderRadius: 16, padding: '18px 22px', border: '1.5px solid #E8E7E0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E7E0'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{m.title}</div>
                    {m.description && <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{m.description}</div>}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: '#888', background: '#F7F6F1', padding: '3px 10px', borderRadius: 20 }}>⏱ {m.duration} мин</span>
                      <span style={{ fontSize: 12, color: '#888', background: '#F7F6F1', padding: '3px 10px', borderRadius: 20 }}>📹 Видеозвонок</span>
                      {m.price > 0 && <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>{m.price.toLocaleString()} ₽</span>}
                      {m.price === 0 && <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 700, background: '#DCFCE7', padding: '3px 10px', borderRadius: 20 }}>Бесплатно</span>}
                    </div>
                  </div>
                  <div style={{ width: 30, height: 30, borderRadius: 15, background: '#F7F6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>→</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
            <Sidebar showBack onBack={() => { setStep(1); setSelectedDate(null); setSelectedSlot(null); setSlots([]) }} backLabel="Назад" />
            <div style={{ background: '#fff', borderRadius: 20, padding: '28px', border: '1px solid #E8E7E0' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 22px' }}>Выберите дату и время</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 155px', gap: 24 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <button onClick={() => setCurrentDate(new Date(year, month-1, 1))} style={{ background: 'none', border: '1.5px solid #E8E7E0', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 15, color: '#888' }}>‹</button>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{MONTHS[month]} {year}</span>
                    <button onClick={() => setCurrentDate(new Date(year, month+1, 1))} style={{ background: 'none', border: '1.5px solid #E8E7E0', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 15, color: '#888' }}>›</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
                    {DAYS_SHORT.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#ccc', padding: '3px 0', textTransform: 'uppercase' }}>{d}</div>)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                    {Array(firstDay).fill(null).map((_,i) => <div key={i} />)}
                    {Array(daysInMonth).fill(null).map((_,i) => {
                      const day = i + 1
                      const date = new Date(year, month, day)
                      const isPast = date < new Date().setHours(0,0,0,0)
                      const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month
                      const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
                      return (
                        <div key={day} onClick={() => !isPast && handleDateClick(day)} style={{
                          textAlign: 'center', padding: '7px 2px', borderRadius: 8,
                          cursor: isPast ? 'default' : 'pointer',
                          background: isSelected ? '#111' : isToday ? '#E8FF47' : 'transparent',
                          color: isSelected ? '#fff' : isPast ? '#ddd' : '#111',
                          fontWeight: isSelected || isToday ? 700 : 400, fontSize: 13
                        }}>{day}</div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  {selectedDate ? (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {selectedDate.getDate()} {MONTHS_GEN[selectedDate.getMonth()]}
                      </div>
                      {slots.length === 0 ? (
                        <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '16px 0' }}>Нет времени</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {slots.map(slot => (
                            <div key={slot} onClick={() => setSelectedSlot(slot)} style={{
                              padding: '9px 6px', borderRadius: 9, textAlign: 'center',
                              border: `1.5px solid ${selectedSlot === slot ? '#111' : '#E8E7E0'}`,
                              background: selectedSlot === slot ? '#111' : '#fff',
                              color: selectedSlot === slot ? '#fff' : '#111',
                              cursor: 'pointer', fontSize: 14, fontWeight: 600
                            }}>{slot}</div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center', paddingTop: 16 }}>Выберите дату</div>
                  )}
                </div>
              </div>
              <button onClick={() => setStep(3)} disabled={!selectedDate || !selectedSlot}
                style={{ marginTop: 20, background: selectedDate && selectedSlot ? '#E8FF47' : '#E8E7E0', color: selectedDate && selectedSlot ? '#111' : '#aaa', border: 'none', padding: '13px 36px', borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: selectedDate && selectedSlot ? 'pointer' : 'default' }}>
                Далее →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
            <Sidebar showBack onBack={() => setStep(2)} backLabel="Изменить дату" />
            <div style={{ background: '#fff', borderRadius: 20, padding: '28px', border: '1px solid #E8E7E0' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 22px' }}>Ваши данные</h3>
              <form onSubmit={handleBooking}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>Имя и фамилия</label>
                  <input value={form.name} required onChange={e => setForm({...form, name: e.target.value})} placeholder="Анна Иванова" style={inp} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</label>
                  <input type="email" value={form.email} required onChange={e => setForm({...form, email: e.target.value})} placeholder="твой@email.com" style={inp} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>Комментарий <span style={{ color: '#aaa', fontWeight: 400, textTransform: 'none' }}>(необязательно)</span></label>
                  <textarea
                    value={form.notes}
                    onChange={handleNotesChange}
                    maxLength={NOTES_MAX}
                    placeholder="Расскажите с чем хотите поработать..."
                    style={{ ...inp, minHeight: 90, resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
                  />
                  <div style={{
                    fontSize: 12, color: counterColor, marginTop: 6, textAlign: 'right',
                    fontWeight: notesLength >= 180 ? 600 : 400
                  }}>
                    {notesLength} / {NOTES_MAX}
                  </div>
                </div>
                <button type="submit" disabled={bookingLoading} style={{ width: '100%', background: '#E8FF47', color: '#111', border: 'none', padding: '15px', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                  {bookingLoading ? 'Отправляем...' : selectedMeeting?.require_confirm ? 'Отправить запрос' : 'Подтвердить встречу'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <div style={{ background: '#fff', borderRadius: 24, padding: '52px 44px', border: '1px solid #E8E7E0', textAlign: 'center', maxWidth: 440, width: '100%' }}>
              <div style={{ width: 68, height: 68, borderRadius: 34, background: '#E8FF47', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 20px' }}>✓</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>
                {selectedMeeting?.require_confirm ? 'Запрос отправлен!' : 'Встреча забронирована!'}
              </h2>
              <p style={{ fontSize: 14, color: '#888', margin: '0 0 22px', lineHeight: 1.5 }}>
                {selectedMeeting?.require_confirm ? 'Коуч получил запрос и скоро подтвердит. Письмо придёт на ' : 'Подтверждение отправлено на '}
                <strong style={{ color: '#111' }}>{form.email}</strong>
              </p>
              <div style={{ background: '#F7F6F1', borderRadius: 14, padding: '16px 18px', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span>📅</span><span style={{ fontSize: 13, fontWeight: 600 }}>{selectedMeeting?.title}</span></div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span>🗓</span><span style={{ fontSize: 13, color: '#555' }}>{selectedDate?.getDate()} {MONTHS_GEN[selectedDate?.getMonth()]} · {selectedSlot}</span></div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span>📹</span><span style={{ fontSize: 13, color: '#555' }}>{selectedMeeting?.require_confirm ? 'Ссылка придёт после подтверждения' : 'Ссылка придёт на email'}</span></div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#aaa', margin: '18px 0 0' }}>
                Работает на <a href="https://kogda.app" style={{ color: '#111', fontWeight: 700, textDecoration: 'none' }}>kog<span style={{ background: '#E8FF47', padding: '0 3px', borderRadius: 3 }}>DA</span></a>
              </p>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', padding: '28px', borderTop: '1px solid #E8E7E0', marginTop: 32 }}>
        <span style={{ fontSize: 12, color: '#aaa' }}>Работает на </span>
        <a href="https://kogda.app" style={{ fontSize: 12, fontWeight: 700, color: '#111', textDecoration: 'none' }}>
          kog<span style={{ background: '#E8FF47', padding: '0 4px', borderRadius: 4 }}>DA</span>
        </a>
      </div>
    </div>
  )
}