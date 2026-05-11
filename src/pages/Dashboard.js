import { useState, useEffect } from 'react'
import axios from 'axios'
import { Copy, Check, Video, X as XIcon, RefreshCw, MoreVertical, MessageCircle, ExternalLink, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import AppLayout from '../components/AppLayout'
import AIHelper from '../components/AIHelper'

const API = process.env.REACT_APP_API_URL || 'https://kogda-backend-production.up.railway.app'

const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
const DAYS_FULL = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота']

const formatTime = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

const formatDateShort = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
}

const formatNextDay = (dateStr, today) => {
  const d = new Date(dateStr)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const isTomorrow = d.toDateString() === tomorrow.toDateString()

  if (isTomorrow) {
    return `Завтра · ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
  }
  const dayName = DAYS_FULL[d.getDay()]
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} · ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
}

const pluralize = (n, one, few, many) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

export default function Dashboard() {
  const [bookings, setBookings] = useState([])
  const [user, setUser] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { window.location.href = '/login'; return }
    setUser(JSON.parse(u))
    loadBookings()

    const onResize = () => setIsMobile(window.innerWidth < 900)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const loadBookings = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API}/bookings`, { headers: { Authorization: `Bearer ${token}` } })
      setBookings(res.data)
    } catch (err) { console.error(err) }
  }

  const confirmBooking = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/bookings/${id}/confirm`, {}, { headers: { Authorization: `Bearer ${token}` } })
      loadBookings()
    } catch (err) { console.error(err) }
  }

  const rejectBooking = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/bookings/${id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } })
      loadBookings()
    } catch (err) { console.error(err) }
  }

  const confirmReschedule = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/bookings/${id}/confirm-reschedule`, {}, { headers: { Authorization: `Bearer ${token}` } })
      loadBookings()
    } catch (err) { console.error(err) }
  }

  const rejectReschedule = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/bookings/${id}/reject-reschedule`, {}, { headers: { Authorization: `Bearer ${token}` } })
      loadBookings()
    } catch (err) { console.error(err) }
  }

  const bookingLink = user ? `https://app.kogda.app/${user.slug}` : ''

  const copyLink = () => {
    navigator.clipboard.writeText(bookingLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!user) return null

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  const todayBookings = bookings
    .filter(b => {
      const d = new Date(b.start_time)
      return d >= todayStart && d < todayEnd && b.status === 'confirmed'
    })
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

  const upcomingBookings = bookings
    .filter(b => {
      const d = new Date(b.start_time)
      return d >= todayEnd && b.status === 'confirmed'
    })
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 3)

  const pendingBookings = bookings.filter(b =>
    b.status === 'pending' || b.status === 'reschedule_requested'
  )

  const thisMonthCount = bookings.filter(b => {
    const d = new Date(b.start_time)
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() && b.status !== 'cancelled'
  }).length

  const completedCount = bookings.filter(b =>
    new Date(b.start_time) < today && b.status === 'confirmed'
  ).length

  const nextBookingIndex = todayBookings.findIndex(b => new Date(b.start_time) > today)

  const dayName = DAYS_FULL[today.getDay()]
  const dayNumber = today.getDate()
  const monthGen = MONTHS_GEN[today.getMonth()]

  const blockStyle = {
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #E8E7E0',
    padding: 20
  }

  const sectionLabelStyle = {
    fontSize: 11, fontWeight: 700, color: '#999',
    textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 14px'
  }

  const initial = (name) => name ? name.charAt(0).toUpperCase() : '?'

  const MeetingCard = ({ booking, isPast, isNext, showJoinButton }) => (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1px solid #E8E7E0',
      padding: '16px 20px',
      opacity: isPast ? 0.5 : 1,
      borderLeft: isNext ? '4px solid #E8FF47' : '1px solid #E8E7E0',
      paddingLeft: isNext ? 17 : 20,
      display: 'flex', alignItems: 'center', gap: 14,
      position: 'relative'
    }}>
      <div style={{
        fontSize: 14, fontWeight: 700,
        color: isPast ? '#999' : '#111',
        minWidth: 50, flexShrink: 0
      }}>
        {formatTime(booking.start_time)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600,
          color: isPast ? '#888' : '#111',
          marginBottom: 2
        }}>
          {booking.client_name}
        </div>
        <div style={{ fontSize: 12, color: '#999' }}>
          {booking.meeting_title}
        </div>
      </div>
      {showJoinButton && booking.video_link && (
        <a href={booking.video_link} target="_blank" rel="noreferrer" style={{
          background: '#111', color: '#fff', padding: '7px 14px',
          borderRadius: 100, fontSize: 12, fontWeight: 600,
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
          flexShrink: 0
        }}>
          <Video size={12} />Войти
        </a>
      )}
      <button style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        padding: 4, color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <MoreVertical size={16} />
      </button>
    </div>
  )

  // === ПРАВАЯ КОЛОНКА — теперь передаётся через проп rightColumn в AppLayout ===
  const rightColumn = (
    <>
      <AIHelper />

      <div>
        <h3 style={sectionLabelStyle}>Обзор</h3>
        <div style={blockStyle}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>В этом месяце</div>
            <div>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#111' }}>{thisMonthCount}</span>
              <span style={{ fontSize: 13, color: '#888', marginLeft: 6 }}>
                {pluralize(thisMonthCount, 'запись', 'записи', 'записей')}
              </span>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #F0EFE9', paddingTop: 16 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Проведено</div>
            <div>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#111' }}>{completedCount}</span>
              <span style={{ fontSize: 13, color: '#888', marginLeft: 6 }}>
                {pluralize(completedCount, 'встреча', 'встречи', 'встреч')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {upcomingBookings.length > 0 && (
        <div>
          <h3 style={sectionLabelStyle}>Ближайшие</h3>
          <div style={blockStyle}>
            {upcomingBookings.map((b, idx) => (
              <div key={b.id} style={{
                paddingTop: idx === 0 ? 0 : 14,
                paddingBottom: idx < upcomingBookings.length - 1 ? 14 : 0,
                borderBottom: idx < upcomingBookings.length - 1 ? '1px solid #F0EFE9' : 'none'
              }}>
                <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 4 }}>
                  {formatNextDay(b.start_time, today)}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>
                  {formatTime(b.start_time)} — {b.client_name}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>{b.meeting_title}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )

  return (
    <AppLayout rightColumn={rightColumn}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, fontFamily: 'Inter, sans-serif' }}>
          Мой кабинет
        </h1>
      </div>

      {/* === БЛОК ТВОЯ ССЫЛКА === */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #E8E7E0',
          padding: isMobile ? 20 : '20px 24px'
        }}>
          {/* Верхняя строка: аватар + текст + иконки */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? 16 : 20
          }}>
            {/* Левая часть: аватар + имя + bio + ссылка */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flex: 1,
              minWidth: 0
            }}>
              {/* Аватар */}
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  style={{
                    width: 52, height: 52, borderRadius: '50%',
                    objectFit: 'cover', flexShrink: 0
                  }}
                />
              ) : (
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: '#E0E0D8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: '#555',
                  flexShrink: 0
                }}>
                  {initial(user.name)}
                </div>
              )}

              {/* Текстовая часть */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
                  {user.name}
                </div>
                <a
                  href={bookingLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-block',
                    fontSize: 14, fontWeight: 600, color: '#111',
                    marginTop: 6,
                    textDecoration: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }}
                >
                  {bookingLink}
                </a>
              </div>
            </div>

            {/* Правая часть: 3 иконки */}
            <div style={{
              display: 'flex',
              gap: 8,
              flexShrink: 0,
              ...(isMobile ? { width: '100%' } : {})
            }}>
              {/* Open */}
              <a
                href={bookingLink}
                target="_blank"
                rel="noreferrer"
                title="Открыть страницу"
                style={{
                  ...(isMobile ? { flex: 1, height: 40 } : { width: 40, height: 40 }),
                  borderRadius: 10,
                  background: '#fff',
                  border: '1px solid #E0E0D8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#111',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                <ExternalLink size={18} />
              </a>

              {/* QR */}
              <button
                onClick={() => setShowQR(!showQR)}
                title="Показать QR-код"
                style={{
                  ...(isMobile ? { flex: 1, height: 40 } : { width: 40, height: 40 }),
                  borderRadius: 10,
                  background: showQR ? '#E8FF47' : '#fff',
                  border: showQR ? '1px solid #E8FF47' : '1px solid #E0E0D8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#111',
                  cursor: 'pointer'
                }}
              >
                <QrCode size={18} />
              </button>

              {/* Copy — главная */}
              <button
                onClick={copyLink}
                title="Скопировать ссылку"
                style={{
                  ...(isMobile ? { flex: 1, height: 40 } : { width: 40, height: 40 }),
                  borderRadius: 10,
                  background: '#111',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: copied ? '#E8FF47' : '#fff',
                  cursor: 'pointer',
                  transition: 'color 0.15s'
                }}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* QR-код раскрывается под верхней строкой */}
          {showQR && (
            <div style={{
              textAlign: 'center',
              padding: 16,
              background: '#F7F6F1',
              borderRadius: 10,
              marginTop: 16
            }}>
              <QRCodeSVG value={bookingLink} size={140} />
            </div>
          )}
        </div>
      </div>

      {pendingBookings.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={sectionLabelStyle}>
            Новое · {pendingBookings.length}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingBookings.map(b => {
              const actionsBlock = (
                <div style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  ...(isMobile ? { width: '100%', justifyContent: 'flex-end' } : { flexShrink: 0 })
                }}>
                  <button
                    onClick={() => b.status === 'reschedule_requested' ? rejectReschedule(b.id) : rejectBooking(b.id)}
                    style={{
                      background: 'transparent', border: '1.5px solid #E0E0D8', color: '#111',
                      padding: isMobile ? '10px 14px' : '8px 14px',
                      borderRadius: 100,
                      fontSize: isMobile ? 13 : 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 5,
                      ...(isMobile ? { flex: '1 1 auto', maxWidth: 200 } : {})
                    }}
                  >
                    <XIcon size={13} /> Отклонить
                  </button>
                  <button
                    onClick={() => b.status === 'reschedule_requested' ? confirmReschedule(b.id) : confirmBooking(b.id)}
                    style={{
                      background: '#111', color: '#fff', border: 'none',
                      padding: isMobile ? '10px 14px' : '8px 14px',
                      borderRadius: 100,
                      fontSize: isMobile ? 13 : 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 5,
                      ...(isMobile ? { flex: '1 1 auto', maxWidth: 200 } : {})
                    }}
                  >
                    <Check size={13} /> Подтвердить
                  </button>
                </div>
              )

              const notesBlock = b.notes && (
                <div style={{
                  background: '#F7F6F1', borderRadius: 9,
                  padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <MessageCircle size={14} color="#888" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: '#666', minWidth: 0 }}>
                    {b.notes}
                  </div>
                </div>
              )

              return (
                <div key={b.id} style={{
                  background: '#fff', borderRadius: 14, border: '1px solid #E8E7E0',
                  borderLeft: '4px solid #E8FF47',
                  padding: '20px 24px 20px 21px',
                  display: 'flex', flexDirection: 'column', gap: 14
                }}>
                  {/* Шапка: бейдж + дата */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#F7F6F1', padding: '4px 12px', borderRadius: 100
                    }}>
                      {b.status === 'reschedule_requested' && <RefreshCw size={11} color="#111" />}
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#111',
                        textTransform: 'uppercase', letterSpacing: 0.5
                      }}>
                        {b.status === 'reschedule_requested' ? 'Перенос' : 'Новая запись'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#888' }}>
                      {b.status === 'reschedule_requested' && b.reschedule_time
                        ? `${formatDateShort(b.reschedule_time)} · ${formatTime(b.reschedule_time)}`
                        : `${formatDateShort(b.start_time)} · ${formatTime(b.start_time)}`}
                    </div>
                  </div>

                  {/* На мобайле: notes сверху */}
                  {isMobile && notesBlock}

                  {/* Тело: аватар + текст (+ кнопки на десктопе) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: isMobile ? 'nowrap' : 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        background: '#E8FF47', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: '#111',
                        flexShrink: 0
                      }}>
                        {initial(b.client_name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{b.client_name}</div>
                        {b.client_email && (
                          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{b.client_email}</div>
                        )}
                        <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{b.meeting_title}</div>
                      </div>
                    </div>

                    {/* На десктопе кнопки в той же строке */}
                    {!isMobile && actionsBlock}
                  </div>

                  {/* На мобайле кнопки на отдельной строке снизу */}
                  {isMobile && actionsBlock}

                  {/* На десктопе notes снизу */}
                  {!isMobile && notesBlock}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <h3 style={sectionLabelStyle}>
          Сегодня <span style={{ fontWeight: 500, color: '#bbb', letterSpacing: 0, textTransform: 'none' }}>
            {dayNumber} {monthGen} · {dayName}
          </span>
        </h3>

        {todayBookings.length === 0 ? (
          <div style={{
            ...blockStyle,
            padding: '40px 20px', textAlign: 'center'
          }}>
            <div style={{ fontSize: 14, color: '#888' }}>Сегодня записей нет</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todayBookings.map((b, idx) => {
              const isPast = new Date(b.start_time) < today
              const isNext = idx === nextBookingIndex
              return (
                <MeetingCard
                  key={b.id}
                  booking={b}
                  isPast={isPast}
                  isNext={isNext}
                  showJoinButton={isNext}
                />
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}