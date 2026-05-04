import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'https://kogda-backend-production.up.railway.app'

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
const DAYS_FULL = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота']

export default function BookingPage() {
  const slug = window.location.pathname.split('/').pop()
  const [profile, setProfile] = useState(null)
  const [meetings, setMeetings] = useState([])
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [step, setStep] = useState(1) // 1=выбор встречи, 2=календарь, 3=контакты, 4=готово
  const [form, setForm] = useState({ name: '', email: '', notes: '' })
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await axios.get(`${API}/meetings/public/${slug}`)
      setProfile(res.data.user)
      setMeetings(res.data.meetings)
      setLoading(false)
    } catch (err) {
      setLoading(false)
    }
  }

  const loadSlots = async (date) => {
    try {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
      const meetingId = selectedMeeting?.id || ''
      const res = await axios.get(`${API}/schedule/slots/${slug}?date=${dateStr}&meeting_type_id=${meetingId}`)
      setSlots(res.data.slots || [])
    } catch (err) {
      setSlots([])
    }
  }

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1
  }

  const handleDateClick = async (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    if (date < new Date().setHours(0,0,0,0)) return
    setSelectedDate(date)
    setSelectedSlot(null)
    await loadSlots(date)
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    setBookingLoading(true)
    try {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`
      await axios.post(`${API}/bookings`, {
        meeting_type_id: selectedMeeting.id,
        client_name: form.name,
        client_email: form.email,
        notes: form.notes,
        date: dateStr,
        time: selectedSlot
      })
      setStep(4)
    } catch (err) {
      alert('Ошибка при бронировании. Попробуй ещё раз.')
    }
    setBookingLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: 16, color: '#888' }}>Загружаем страницу...</div>
    </div>
  )

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>404</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Страница не найдена</div>
        <div style={{ fontSize: 14, color: '#888' }}>Проверь правильность ссылки</div>
      </div>
    </div>
  )

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = new Date()

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8E7E0', padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'Syne, sans-serif' }}>
          kog<span style={{ background: '#E8FF47', padding: '0 6px', borderRadius: 6 }}>DA</span>
        </h1>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>

        {/* Progress bar */}
        {step < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40, justifyContent: 'center' }}>
            {['Тип встречи', 'Дата и время', 'Контакты'].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  opacity: step >= i + 1 ? 1 : 0.4
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 14,
                    background: step > i + 1 ? '#22C55E' : step === i + 1 ? '#111' : '#E8E7E0',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0
                  }}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? '#111' : '#888' }}>{s}</span>
                </div>
                {i < 2 && <div style={{ width: 40, height: 1, background: '#E8E7E0' }} />}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: step === 1 ? '1fr' : '280px 1fr', gap: 24 }}>

          {/* Profile sidebar - показываем на шагах 2 и 3 */}
          {step > 1 && step < 4 && (
            <div style={{ background: '#fff', borderRadius: 20, padding: '28px', border: '1px solid #E8E7E0', height: 'fit-content' }}>
              <div style={{ width: 64, height: 64, borderRadius: 32, background: '#E8FF47', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 16 }}>
                {profile.name.charAt(0)}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{profile.name}</div>
              {profile.bio && <div style={{ fontSize: 14, color: '#888', marginBottom: 20, lineHeight: 1.5 }}>{profile.bio}</div>}

              {selectedMeeting && (
                <div style={{ background: '#F7F6F1', borderRadius: 12, padding: '16px', marginTop: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{selectedMeeting.title}</div>
                  <div style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span>⏱</span> {selectedMeeting.duration} мин
                  </div>
                  <div style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span>📹</span> Видеозвонок
                  </div>
                  {selectedMeeting.price > 0 && (
                    <div style={{ fontSize: 15, fontWeight: 800, marginTop: 8 }}>{selectedMeeting.price} ₽</div>
                  )}
                  {selectedDate && selectedSlot && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E8E7E0' }}>
                      <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>
                        {DAYS_FULL[selectedDate.getDay()]}, {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()].toLowerCase()}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{selectedSlot}</div>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <button onClick={() => setStep(2)} style={{
                  marginTop: 16, background: 'transparent', border: '1.5px solid #E0E0D8',
                  padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', width: '100%'
                }}>
                  Изменить дату и время
                </button>
              )}
            </div>
          )}

          {/* Main content */}
          <div>

            {/* Шаг 1 — выбор типа встречи */}
            {step === 1 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                  <div style={{ width: 80, height: 80, borderRadius: 40, background: '#E8FF47', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 16px' }}>
                    {profile.name.charAt(0)}
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>{profile.name}</h2>
                  {profile.bio && <p style={{ fontSize: 16, color: '#888', margin: 0 }}>{profile.bio}</p>}
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>Выберите тип встречи</h3>

                {meetings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
                    Пока нет доступных встреч
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {meetings.map(m => (
                      <div key={m.id}
                        onClick={() => { setSelectedMeeting(m); setStep(2) }}
                        style={{
                          background: '#fff', borderRadius: 16, padding: '24px',
                          border: '1.5px solid #E8E7E0', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#E8FF47'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#E8E7E0'}
                      >
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{m.title}</div>
                          {m.description && <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>{m.description}</div>}
                          <div style={{ display: 'flex', gap: 16 }}>
                            <span style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>⏱</span> {m.duration} мин
                            </span>
                            <span style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>📹</span> Видеозвонок
                            </span>
                            {m.price > 0 && (
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
                                {m.price} ₽
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: 20, color: '#888' }}>→</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Шаг 2 — календарь */}
            {step === 2 && (
              <div style={{ background: '#fff', borderRadius: 20, padding: '32px', border: '1px solid #E8E7E0' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 24px' }}>Выберите дату и время</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 24 }}>
                  {/* Calendar */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                        style={{ background: 'none', border: '1.5px solid #E0E0D8', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>
                        ‹
                      </button>
                      <span style={{ fontSize: 16, fontWeight: 700 }}>{MONTHS[month]} {year}</span>
                      <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                        style={{ background: 'none', border: '1.5px solid #E0E0D8', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>
                        ›
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                      {DAYS_SHORT.map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#888', padding: '4px 0' }}>{d}</div>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                      {Array(firstDay).fill(null).map((_, i) => <div key={i} />)}
                      {Array(daysInMonth).fill(null).map((_, i) => {
                        const day = i + 1
                        const date = new Date(year, month, day)
                        const isPast = date < new Date().setHours(0,0,0,0)
                        const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month
                        const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year

                        return (
                          <div key={day}
                            onClick={() => !isPast && handleDateClick(day)}
                            style={{
                              textAlign: 'center', padding: '8px 4px', borderRadius: 8,
                              fontSize: 14, cursor: isPast ? 'default' : 'pointer',
                              background: isSelected ? '#111' : isToday ? '#E8FF47' : 'transparent',
                              color: isSelected ? '#fff' : isPast ? '#ccc' : '#111',
                              fontWeight: isSelected || isToday ? 700 : 400,
                              transition: 'all 0.15s'
                            }}
                          >
                            {day}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Time slots */}
                  <div>
                    {selectedDate ? (
                      <>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#888' }}>
                          {DAYS_FULL[selectedDate.getDay()]}, {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()].toLowerCase()}
                        </div>
                        {slots.length === 0 ? (
                          <div style={{ fontSize: 13, color: '#888', textAlign: 'center', padding: '20px 0' }}>
                            Нет доступного времени
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {slots.map(slot => (
                              <div key={slot}
                                onClick={() => setSelectedSlot(slot)}
                                style={{
                                  padding: '10px', borderRadius: 10, textAlign: 'center',
                                  border: `1.5px solid ${selectedSlot === slot ? '#111' : '#E0E0D8'}`,
                                  background: selectedSlot === slot ? '#111' : '#fff',
                                  color: selectedSlot === slot ? '#fff' : '#111',
                                  cursor: 'pointer', fontSize: 14, fontWeight: 600,
                                  transition: 'all 0.15s'
                                }}
                              >
                                {slot}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 13, color: '#888', textAlign: 'center', padding: '20px 0' }}>
                        Выберите дату
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedDate || !selectedSlot}
                  style={{
                    marginTop: 24, background: selectedDate && selectedSlot ? '#E8FF47' : '#E8E7E0',
                    color: selectedDate && selectedSlot ? '#111' : '#aaa',
                    border: 'none', padding: '14px 32px', borderRadius: 12,
                    fontSize: 15, fontWeight: 700, cursor: selectedDate && selectedSlot ? 'pointer' : 'default',
                    transition: 'all 0.2s'
                  }}
                >
                  Далее →
                </button>
              </div>
            )}

            {/* Шаг 3 — контакты */}
            {step === 3 && (
              <div style={{ background: '#fff', borderRadius: 20, padding: '32px', border: '1px solid #E8E7E0' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 24px' }}>Введите свои данные</h3>

                <form onSubmit={handleBooking}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Имя и фамилия</label>
                    <input
                      value={form.name} required
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Анна Иванова"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E0E0D8', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
                    <input
                      type="email" value={form.email} required
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="твой@email.com"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E0E0D8', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ marginBottom: 28 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Комментарий (необязательно)</label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      placeholder="Расскажите с чем хотите поработать..."
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E0E0D8', fontSize: 15, outline: 'none', boxSizing: 'border-box', minHeight: 100, resize: 'vertical' }}
                    />
                  </div>
                  <button type="submit" disabled={bookingLoading} style={{
                    width: '100%', background: '#E8FF47', color: '#111', border: 'none',
                    padding: '16px', borderRadius: 12, fontSize: 16, fontWeight: 800,
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    {bookingLoading ? 'Бронируем...' : 'Подтвердить встречу'}
                  </button>
                </form>
              </div>
            )}

            {/* Шаг 4 — готово */}
            {step === 4 && (
              <div style={{
                background: '#fff', borderRadius: 24, padding: '60px 40px',
                border: '1px solid #E8E7E0', textAlign: 'center',
                maxWidth: 520, margin: '0 auto'
              }}>
                <div style={{
                  width: 88, height: 88, borderRadius: 44, background: '#E8FF47',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 40, margin: '0 auto 28px', fontWeight: 700
                }}>
                  ✓
                </div>
                <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px', color: '#111' }}>
                  Встреча забронирована!
                </h2>
                <p style={{ fontSize: 16, color: '#888', margin: '0 0 6px', lineHeight: 1.5 }}>
                  Подтверждение отправлено на
                </p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 28px' }}>
                  {form.email}
                </p>

                <div style={{
                  background: '#F7F6F1', borderRadius: 16, padding: '20px 24px',
                  marginBottom: 28, textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>📅</span>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{selectedMeeting?.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>🗓</span>
                      <span style={{ fontSize: 15, color: '#555' }}>
                        {selectedDate && `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()].toLowerCase()}`} · {selectedSlot}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>📹</span>
                      <span style={{ fontSize: 15, color: '#555' }}>Ссылка на видеозвонок придёт на email</span>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>
                  Работает на{' '}
                  <a href="https://kogda.app" style={{ color: '#111', fontWeight: 700, textDecoration: 'none' }}>
                    kog<span style={{ background: '#E8FF47', padding: '0 3px', borderRadius: 3 }}>DA</span>
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '32px', borderTop: '1px solid #E8E7E0', marginTop: 40 }}>
        <span style={{ fontSize: 13, color: '#888' }}>Работает на </span>
        <a href="https://kogda.app" style={{ fontSize: 13, fontWeight: 700, color: '#111', textDecoration: 'none' }}>
          kog<span style={{ background: '#E8FF47', padding: '0 4px', borderRadius: 4 }}>DA</span>
        </a>
      </div>
    </div>
  )
}