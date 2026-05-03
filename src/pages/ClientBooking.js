import { useState, useEffect } from 'react'
import axios from 'axios'
import { Calendar, Clock, Video, X, RefreshCw, Check } from 'lucide-react'

const API = 'https://kogda-backend-production.up.railway.app'

const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
const MONTHS_FULL = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

const formatTime = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

export default function ClientBooking() {
  const token = window.location.pathname.split('/booking/')[1]
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState('view') // view, reschedule, cancelled, rescheduled
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)

  useEffect(() => {
    loadBooking()
  }, [])

  const loadBooking = async () => {
    try {
      const res = await axios.get(`${API}/bookings/client/${token}`)
      setBooking(res.data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const loadSlots = async (date) => {
    try {
      const slug = booking?.expert_slug
      const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
      const res = await axios.get(`${API}/schedule/slots/${booking.slug}?date=${dateStr}`)
      setSlots(res.data.slots || [])
    } catch (err) {
      setSlots([])
    }
  }

  const handleDateClick = async (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    if (date < new Date().setHours(0,0,0,0)) return
    setSelectedDate(date)
    setSelectedSlot(null)
    await loadSlots(date)
  }

  const cancelBooking = async () => {
    if (!window.confirm('Отменить встречу?')) return
    try {
      await axios.post(`${API}/bookings/client/${token}/cancel`)
      setStep('cancelled')
    } catch (err) {
      console.error(err)
    }
  }

  const requestReschedule = async () => {
    if (!selectedDate || !selectedSlot) return
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`
    try {
      await axios.post(`${API}/bookings/client/${token}/reschedule`, {
        new_date: dateStr,
        new_time: selectedSlot
      })
      setStep('rescheduled')
    } catch (err) {
      console.error(err)
    }
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = (() => { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1 })()
  const today = new Date()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ color: '#888' }}>Загружаем...</div>
    </div>
  )

  if (!booking) return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Бронь не найдена</div>
        <div style={{ color: '#888', marginTop: 8 }}>Проверь правильность ссылки</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8E7E0', padding: '16px 48px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'Syne, sans-serif' }}>
          kog<span style={{ background: '#E8FF47', padding: '0 6px', borderRadius: 6 }}>DA</span>
        </h1>
      </div>

      <div style={{ maxWidth: 560, margin: '48px auto', padding: '0 24px' }}>

        {/* Cancelled */}
        {step === 'cancelled' && (
          <div style={{ background: '#fff', borderRadius: 24, padding: '48px 40px', textAlign: 'center', border: '1px solid #E8E7E0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Встреча отменена</h2>
            <p style={{ color: '#888', fontSize: 15 }}>Мы уведомили {booking.expert_name} об отмене</p>
          </div>
        )}

        {/* Reschedule requested */}
        {step === 'rescheduled' && (
          <div style={{ background: '#fff', borderRadius: 24, padding: '48px 40px', textAlign: 'center', border: '1px solid #E8E7E0' }}>
            <div style={{ width: 72, height: 72, borderRadius: 36, background: '#E8FF47', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>
              ✓
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Запрос отправлен!</h2>
            <p style={{ color: '#888', fontSize: 15 }}>
              {booking.expert_name} получил запрос на перенос и скоро подтвердит новое время.
            </p>
            <p style={{ color: '#888', fontSize: 14, marginTop: 8 }}>
              Новое время: <strong style={{ color: '#111' }}>
                {selectedDate && `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]}`} в {selectedSlot}
              </strong>
            </p>
          </div>
        )}

        {/* View booking */}
        {step === 'view' && (
          <div style={{ background: '#fff', borderRadius: 24, padding: '32px', border: '1px solid #E8E7E0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                Твоя запись
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0EFE9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={16} color="#888" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#888' }}>Встреча</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{booking.meeting_title}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0EFE9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={16} color="#888" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#888' }}>Дата и время</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>
                      {formatDate(booking.start_time)} в {formatTime(booking.start_time)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0EFE9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={16} color="#888" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#888' }}>Эксперт</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{booking.expert_name}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video link */}
            {booking.status !== 'cancelled' && (
              <a href={booking.video_link} target="_blank" rel="noreferrer" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: '#111', color: '#fff', padding: '14px',
                borderRadius: 12, textDecoration: 'none', fontSize: 15, fontWeight: 700,
                marginBottom: 16
              }}>
                <Video size={16} />
                Войти на встречу
              </a>
            )}

            {/* Status */}
            {booking.status === 'reschedule_requested' && (
              <div style={{ background: '#FEF9C3', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#92400E' }}>
                ⏳ Запрос на перенос отправлен — ожидай подтверждения
              </div>
            )}

            {/* Actions */}
            {booking.status === 'confirmed' && new Date(booking.start_time) > new Date() && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('reschedule')} style={{
                  flex: 1, background: '#F0EFE9', color: '#111', border: 'none',
                  padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                  <RefreshCw size={14} />
                  Перенести
                </button>
                <button onClick={cancelBooking} style={{
                  flex: 1, background: '#FEE2E2', color: '#DC2626', border: 'none',
                  padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                  <X size={14} />
                  Отменить
                </button>
              </div>
            )}

            {booking.status === 'cancelled' && (
              <div style={{ background: '#FEE2E2', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#DC2626', textAlign: 'center' }}>
                Эта встреча отменена
              </div>
            )}
          </div>
        )}

        {/* Reschedule */}
        {step === 'reschedule' && (
          <div style={{ background: '#fff', borderRadius: 24, padding: '32px', border: '1px solid #E8E7E0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button onClick={() => setStep('view')} style={{
                background: 'transparent', border: '1.5px solid #E0E0D8',
                padding: '8px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}>← Назад</button>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Выбери новое время</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 20 }}>
              {/* Calendar */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <button onClick={() => setCurrentDate(new Date(year, month-1, 1))}
                    style={{ background: 'none', border: '1.5px solid #E0E0D8', width: 32, height: 32, borderRadius: 8, cursor: 'pointer' }}>‹</button>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{MONTHS_FULL[month]} {year}</span>
                  <button onClick={() => setCurrentDate(new Date(year, month+1, 1))}
                    style={{ background: 'none', border: '1.5px solid #E0E0D8', width: 32, height: 32, borderRadius: 8, cursor: 'pointer' }}>›</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                  {DAYS_SHORT.map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888' }}>{d}</div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                  {Array(firstDay).fill(null).map((_,i) => <div key={i} />)}
                  {Array(daysInMonth).fill(null).map((_,i) => {
                    const day = i + 1
                    const date = new Date(year, month, day)
                    const isPast = date < new Date().setHours(0,0,0,0)
                    const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month
                    const isToday = today.getDate() === day && today.getMonth() === month

                    return (
                      <div key={day} onClick={() => !isPast && handleDateClick(day)} style={{
                        textAlign: 'center', padding: '7px 4px', borderRadius: 8,
                        cursor: isPast ? 'default' : 'pointer',
                        background: isSelected ? '#111' : isToday ? '#E8FF47' : 'transparent',
                        color: isSelected ? '#fff' : isPast ? '#ccc' : '#111',
                        fontWeight: isSelected || isToday ? 700 : 400, fontSize: 14
                      }}>{day}</div>
                    )
                  })}
                </div>
              </div>

              {/* Slots */}
              <div>
                {selectedDate ? (
                  slots.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#888', textAlign: 'center', paddingTop: 20 }}>
                      Нет свободного времени
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {slots.map(slot => (
                        <div key={slot} onClick={() => setSelectedSlot(slot)} style={{
                          padding: '10px', borderRadius: 10, textAlign: 'center',
                          border: `1.5px solid ${selectedSlot === slot ? '#111' : '#E0E0D8'}`,
                          background: selectedSlot === slot ? '#111' : '#fff',
                          color: selectedSlot === slot ? '#fff' : '#111',
                          cursor: 'pointer', fontSize: 14, fontWeight: 600
                        }}>{slot}</div>
                      ))}
                    </div>
                  )
                ) : (
                  <div style={{ fontSize: 13, color: '#888', textAlign: 'center', paddingTop: 20 }}>
                    Выбери дату
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={requestReschedule}
              disabled={!selectedDate || !selectedSlot}
              style={{
                marginTop: 20, width: '100%',
                background: selectedDate && selectedSlot ? '#E8FF47' : '#E8E7E0',
                color: selectedDate && selectedSlot ? '#111' : '#aaa',
                border: 'none', padding: '14px', borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: selectedDate && selectedSlot ? 'pointer' : 'default'
              }}>
              Запросить перенос
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span style={{ fontSize: 13, color: '#aaa' }}>Работает на </span>
          <a href="https://kogda.app" style={{ fontSize: 13, fontWeight: 700, color: '#111', textDecoration: 'none' }}>
            kog<span style={{ background: '#E8FF47', padding: '0 3px', borderRadius: 3 }}>DA</span>
          </a>
        </div>
      </div>
    </div>
  )
}