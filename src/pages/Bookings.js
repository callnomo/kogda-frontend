import { useState, useEffect } from 'react'
import axios from 'axios'
import { Video, X, Check, RefreshCw, MessageCircle } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import AIHelper from '../components/AIHelper'
import PromoCard from '../components/PromoCard'
import Footer from '../components/Footer'

const API = process.env.REACT_APP_API_URL || 'https://kogda-backend-production.up.railway.app'

const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']

const formatDateShort = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
}

const formatTime = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

const pluralize = (n, one, few, many) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

const initial = (name) => name ? name.charAt(0).toUpperCase() : '?'

const statusConfig = (status) => {
  switch(status) {
    case 'confirmed': return { text: 'ПОДТВЕРЖДЕНА', dot: '#22C55E' }
    case 'pending': return { text: 'ОЖИДАЕТ ПОДТВЕРЖДЕНИЯ', dot: '#999' }
    case 'reschedule_requested': return { text: 'ЗАПРОС НА ПЕРЕНОС', dot: '#999' }
    case 'cancelled': return { text: 'ОТМЕНЕНА', dot: '#999' }
    default: return { text: status.toUpperCase(), dot: '#999' }
  }
}

const sortGroup = (b) => {
  const isPending = b.status === 'pending' || b.status === 'reschedule_requested'
  const isCancelled = b.status === 'cancelled'
  const isPast = new Date(b.start_time) < new Date()

  if (isPending) return 1
  if (b.status === 'confirmed' && !isPast) return 2
  if (b.status === 'confirmed' && isPast) return 3
  if (isCancelled) return 4
  return 5
}

const sortBookings = (arr) => {
  return [...arr].sort((a, b) => {
    const groupA = sortGroup(a)
    const groupB = sortGroup(b)
    if (groupA !== groupB) return groupA - groupB

    const dateA = new Date(a.start_time)
    const dateB = new Date(b.start_time)

    if (groupA === 1 || groupA === 2) {
      return dateA - dateB
    }
    return dateB - dateA
  })
}

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { window.location.href = '/login'; return }
    loadBookings()

    const onResize = () => setIsMobile(window.innerWidth < 900)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
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

  const confirmBooking = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/bookings/${id}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadBookings()
    } catch (err) { console.error(err) }
  }

  const rejectBooking = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/bookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadBookings()
    } catch (err) { console.error(err) }
  }

  const confirmReschedule = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/bookings/${id}/confirm-reschedule`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadBookings()
    } catch (err) { console.error(err) }
  }

  const rejectReschedule = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/bookings/${id}/reject-reschedule`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadBookings()
    } catch (err) { console.error(err) }
  }

  const cancelBooking = async (id) => {
    if (!window.confirm('Отменить эту запись?')) return
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/bookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadBookings()
    } catch (err) { console.error(err) }
  }

  const filtered = sortBookings(bookings.filter(b => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return new Date(b.start_time) > new Date() && b.status !== 'cancelled'
    if (filter === 'pending') return b.status === 'pending' || b.status === 'reschedule_requested'
    if (filter === 'past') return new Date(b.start_time) < new Date() && b.status !== 'cancelled'
    if (filter === 'cancelled') return b.status === 'cancelled'
    return true
  }))

  const upcoming = bookings.filter(b => new Date(b.start_time) > new Date() && b.status !== 'cancelled').length
  const total = bookings.length
  const cancelled = bookings.filter(b => b.status === 'cancelled').length
  const pending = bookings.filter(b => b.status === 'pending' || b.status === 'reschedule_requested').length

  // Статистика за последние 7 дней
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const inWeek = (b) => {
    const t = new Date(b.start_time).getTime()
    return t >= weekAgo.getTime() && t <= now.getTime()
  }

  const weekMeetings = bookings.filter(b => inWeek(b) && b.status !== 'cancelled').length
  const weekCancelled = bookings.filter(b => inWeek(b) && b.status === 'cancelled').length
  const weekCompleted = bookings.filter(b =>
    inWeek(b) && b.status === 'confirmed' && new Date(b.start_time) < now
  ).length

  // Новые клиенты: первая запись по email попала в окно недели
  const firstByEmail = {}
  bookings.forEach(b => {
    if (!b.client_email) return
    const t = new Date(b.start_time).getTime()
    if (!firstByEmail[b.client_email] || t < firstByEmail[b.client_email]) {
      firstByEmail[b.client_email] = t
    }
  })
  const weekNewClients = Object.values(firstByEmail).filter(t =>
    t >= weekAgo.getTime() && t <= now.getTime()
  ).length

  const blockStyle = {
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #E8E7E0',
    padding: 20
  }

  const renderBookingCard = (b) => {
    const status = statusConfig(b.status)
    const isPast = new Date(b.start_time) < new Date()
    const isPending = b.status === 'pending' || b.status === 'reschedule_requested'
    const isCancelled = b.status === 'cancelled'
    const isPastConfirmed = isPast && b.status === 'confirmed'

    const cardOpacity = isCancelled ? 0.4 : isPastConfirmed ? 0.5 : 1
    const showLimeAccent = isPending

    // Блок кнопок действий — выносим в переменную чтобы рендерить в разных местах
    const actionsBlock = (
      <div style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        ...(isMobile ? { width: '100%' } : { flexShrink: 0 })
      }}>
        {b.status === 'pending' && (
          <>
            <button onClick={() => rejectBooking(b.id)} style={{
              background: 'transparent', border: '1.5px solid #E0E0D8', color: '#111',
              padding: isMobile ? '10px 14px' : '8px 14px',
              borderRadius: 100,
              fontSize: isMobile ? 13 : 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 5,
              flex: isMobile ? 1 : 'none'
            }}>
              <X size={13} /> Отклонить
            </button>
            <button onClick={() => confirmBooking(b.id)} style={{
              background: '#111', color: '#fff', border: 'none',
              padding: isMobile ? '10px 14px' : '8px 14px',
              borderRadius: 100,
              fontSize: isMobile ? 13 : 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 5,
              flex: isMobile ? 1 : 'none'
            }}>
              <Check size={13} /> Подтвердить
            </button>
          </>
        )}

        {b.status === 'reschedule_requested' && (
          <>
            <button onClick={() => rejectReschedule(b.id)} style={{
              background: 'transparent', border: '1.5px solid #E0E0D8', color: '#111',
              padding: isMobile ? '10px 14px' : '8px 14px',
              borderRadius: 100,
              fontSize: isMobile ? 13 : 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 5,
              flex: isMobile ? 1 : 'none'
            }}>
              <X size={13} /> Отклонить
            </button>
            <button onClick={() => confirmReschedule(b.id)} style={{
              background: '#111', color: '#fff', border: 'none',
              padding: isMobile ? '10px 14px' : '8px 14px',
              borderRadius: 100,
              fontSize: isMobile ? 13 : 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 5,
              flex: isMobile ? 1 : 'none'
            }}>
              <Check size={13} /> Подтвердить
            </button>
          </>
        )}

        {b.status === 'confirmed' && !isPast && b.video_link && (
          <>
            <button onClick={() => cancelBooking(b.id)} style={{
              background: 'transparent', border: 'none',
              color: '#999', padding: '8px 4px', fontSize: 12, fontWeight: 500,
              cursor: 'pointer'
            }}>
              Отменить
            </button>
            <a href={b.video_link} target="_blank" rel="noreferrer" style={{
              background: '#111', color: '#fff', padding: '8px 14px',
              borderRadius: 100, fontSize: 12, fontWeight: 600, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 5
            }}>
              <Video size={13} /> Войти
            </a>
          </>
        )}
      </div>
    )

    // Блок коммента (notes) — рендерим только если есть
    const notesBlock = b.notes ? (
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
    ) : null

    // Блок reschedule_time (если есть)
    const rescheduleBlock = (b.status === 'reschedule_requested' && b.reschedule_time) ? (
      <div style={{
        background: '#F7F6F1', borderRadius: 9,
        padding: '10px 14px',
        fontSize: 13, color: '#111', fontWeight: 600
      }}>
        → перенести на {formatDateShort(b.reschedule_time)} в {formatTime(b.reschedule_time)}
      </div>
    ) : null

    return (
      <div key={b.id} style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #E8E7E0',
        borderLeft: showLimeAccent ? '4px solid #E8FF47' : '1px solid #E8E7E0',
        padding: '20px 24px 20px 21px',
        opacity: cardOpacity
      }}>
        {/* Шапка: статус + дата */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 16
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#F7F6F1', padding: '4px 12px', borderRadius: 100
          }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: status.dot }} />
            {b.status === 'reschedule_requested' && <RefreshCw size={11} color="#111" />}
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#111',
              textTransform: 'uppercase', letterSpacing: 0.5
            }}>
              {status.text}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#888' }}>
            {formatDateShort(b.start_time)} · {formatTime(b.start_time)}
          </div>
        </div>

        {isMobile ? (
          // ============== МОБАЙЛ ==============
          // Структура: клиент (с услугой) → коммент → кнопки на всю ширину
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: '#E8FF47', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: '#111',
                flexShrink: 0
              }}>
                {initial(b.client_name)}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{b.client_name}</div>
                {b.client_email && (
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.client_email}</div>
                )}
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{b.meeting_title}</div>
              </div>
            </div>

            {rescheduleBlock}
            {notesBlock}
            {actionsBlock}
          </div>
        ) : (
          // ============== ДЕСКТОП ==============
          // Структура как было: клиент + кнопки в одной строке, потом reschedule, потом коммент
          <>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, flexWrap: 'wrap'
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

              {actionsBlock}
            </div>

            {rescheduleBlock && <div style={{ marginTop: 14 }}>{rescheduleBlock}</div>}
            {notesBlock && <div style={{ marginTop: 14 }}>{notesBlock}</div>}
          </>
        )}
      </div>
    )
  }

  // Блок "За эту неделю" — рендерится в правой колонке (только на десктопе)
  const weekStatsBlock = (
    <div>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#888',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 10,
        paddingLeft: 2
      }}>
        За эту неделю
      </div>
      <div style={blockStyle}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 4,
          paddingBottom: 12
        }}>
          <span style={{ fontSize: 13, color: '#888' }}>Встречи</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{weekMeetings}</span>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 12,
          paddingBottom: 12,
          borderTop: '1px solid #F0EFE9'
        }}>
          <span style={{ fontSize: 13, color: '#888' }}>Новых клиентов</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{weekNewClients}</span>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 12,
          paddingBottom: 12,
          borderTop: '1px solid #F0EFE9'
        }}>
          <span style={{ fontSize: 13, color: '#888' }}>Проведено</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{weekCompleted}</span>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 12,
          paddingBottom: 4,
          borderTop: '1px solid #F0EFE9'
        }}>
          <span style={{ fontSize: 13, color: '#888' }}>Отмен</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#666' }}>{weekCancelled}</span>
        </div>
      </div>
    </div>
  )

  const rightColumn = (
    <>
      <AIHelper />
      {weekStatsBlock}
      <PromoCard />
      <Footer />
    </>
  )

  return (
    <AppLayout rightColumn={rightColumn}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, fontFamily: 'Inter, sans-serif' }}>Записи</h1>
        <p style={{ color: '#888', marginTop: 6, fontSize: 14 }}>Все записи твоих клиентов</p>
      </div>

      {/* Stats — только на десктопе */}
      {/* Filter tabs */}
      <div
        className="bookings-filter-tabs"
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          ...(isMobile
            ? {
                flexWrap: 'nowrap',
                overflowX: 'auto',
                marginLeft: -16,
                marginRight: -16,
                paddingLeft: 16,
                paddingRight: 16,
                scrollbarWidth: 'none'
              }
            : { flexWrap: 'wrap' })
        }}
      >
        {[
          { key: 'all', label: 'Все' },
          { key: 'pending', label: pending > 0 ? `Ожидают (${pending})` : 'Ожидают' },
          { key: 'upcoming', label: 'Предстоящие' },
          { key: 'past', label: 'Прошедшие' },
          { key: 'cancelled', label: 'Отменённые' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '8px 18px', borderRadius: 100,
            background: filter === f.key ? '#111' : '#fff',
            color: filter === f.key ? '#fff' : '#111',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: `1.5px solid ${filter === f.key ? '#111' : '#E0E0D8'}`,
            transition: 'all 0.15s',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}>{f.label}</button>
        ))}
      </div>

      {/* Скрываем scrollbar в Webkit-браузерах */}
      <style>{`
        .bookings-filter-tabs::-webkit-scrollbar { display: none; }
      `}</style>

      {/* List */}
      {loading ? (
        <div style={{ ...blockStyle, padding: '48px 20px', textAlign: 'center', color: '#888', fontSize: 14 }}>
          Загружаем...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...blockStyle, padding: '48px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>Нет записей</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>Поделись ссылкой с клиентами чтобы они записались</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((b, idx) => (
            <div key={`wrap-${b.id}`} style={{ display: 'contents' }}>
              {renderBookingCard(b)}
              {/* На мобайле — промо после 3-й карточки (idx === 2) */}
              {isMobile && idx === 2 && <PromoCard key="promo-mobile" />}
            </div>
          ))}
          {/* На мобайле, если карточек < 3 — промо в конце */}
          {isMobile && filtered.length > 0 && filtered.length < 3 && <PromoCard key="promo-mobile-end" />}
        </div>
      )}
    </AppLayout>
  )
}