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
  // Модалка подтверждения: null | { type: 'cancel'|'reschedule', id }
  const [confirmModal, setConfirmModal] = useState(null)
  const [confirmBusy, setConfirmBusy] = useState(false)

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

  // Открытие модалки (вместо window.confirm)
  const cancelBooking = (id) => setConfirmModal({ type: 'cancel', id })
  const rescheduleBooking = (id) => setConfirmModal({ type: 'reschedule', id })

  // Выполнение действия после подтверждения в модалке
  const runConfirmAction = async () => {
    if (!confirmModal) return
    const { type, id } = confirmModal
    const endpoint = type === 'cancel' ? 'cancel' : 'cancel-reschedule'
    const token = localStorage.getItem('token')
    setConfirmBusy(true)
    try {
      await axios.patch(`${API}/bookings/${id}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadBookings()
    } catch (err) { console.error(err) }
    setConfirmBusy(false)
    setConfirmModal(null)
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
        ...(isMobile ? { width: '100%', justifyContent: 'flex-end' } : { flexShrink: 0 })
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
              ...(isMobile ? { flex: '1 1 auto', maxWidth: 200 } : {})
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
              ...(isMobile ? { flex: '1 1 auto', maxWidth: 200 } : {})
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
              ...(isMobile ? { flex: '1 1 auto', maxWidth: 200 } : {})
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
              ...(isMobile ? { flex: '1 1 auto', maxWidth: 200 } : {})
            }}>
              <Check size={13} /> Подтвердить
            </button>
          </>
        )}

        {b.status === 'confirmed' && !isPast && b.video_link && (
          <>
            <div className="kg-tip-wrap" style={{ position: 'relative' }}>
              <button
                onClick={() => cancelBooking(b.id)}
                aria-label="Отменить запись"
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'transparent', border: '1px solid #E8E7E0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0,
                }}
              >
                <X size={19} color="#DC2626" />
              </button>
              <span className="kg-tip">Отменить запись</span>
            </div>

            <div className="kg-tip-wrap" style={{ position: 'relative' }}>
              <button
                onClick={() => rescheduleBooking(b.id)}
                aria-label="Перенести"
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'transparent', border: '1px solid #E8E7E0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0,
                }}
              >
                <RefreshCw size={18} color="#555" />
              </button>
              <span className="kg-tip">Перенести</span>
            </div>

            <div className="kg-tip-wrap" style={{ position: 'relative' }}>
              <a
                href={b.video_link} target="_blank" rel="noreferrer"
                aria-label="Войти на встречу"
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: '#111', border: '1px solid #111',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                <Video size={18} color="#fff" />
              </a>
              <span className="kg-tip">Войти на встречу</span>
            </div>
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
          <span style={{ fontSize: 13, color: '#888' }}>Отменено</span>
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
        .kg-tip-wrap .kg-tip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: #111;
          color: #fff;
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 8px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s;
          z-index: 20;
        }
        .kg-tip-wrap:hover .kg-tip { opacity: 1; }
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

      {/* Модалка подтверждения (вместо window.confirm) */}
      {confirmModal && (
        <div
          onClick={() => !confirmBusy && setConfirmModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 18, padding: 28,
              width: '100%', maxWidth: 340, textAlign: 'center',
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: confirmModal.type === 'cancel' ? '#FCEBEB' : '#F1F0EA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              {confirmModal.type === 'cancel'
                ? <X size={24} color="#DC2626" />
                : <RefreshCw size={22} color="#555" />}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 }}>
              {confirmModal.type === 'cancel' ? 'Отменить запись?' : 'Перенести запись?'}
            </div>
            <div style={{ fontSize: 14, color: '#888', lineHeight: 1.5, marginBottom: 22 }}>
              {confirmModal.type === 'cancel'
                ? 'Клиент получит письмо об отмене. Это время снова станет доступным для записи.'
                : 'Клиент получит письмо со ссылкой на выбор нового времени. Текущая запись будет отменена.'}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmModal(null)}
                disabled={confirmBusy}
                style={{
                  flex: 1, background: '#F1F0EA', color: '#111', border: 'none',
                  padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 600,
                  cursor: confirmBusy ? 'default' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Назад
              </button>
              <button
                onClick={runConfirmAction}
                disabled={confirmBusy}
                style={{
                  flex: 1,
                  background: '#111',
                  color: '#fff', border: 'none',
                  padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 600,
                  cursor: confirmBusy ? 'default' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  opacity: confirmBusy ? 0.6 : 1,
                }}
              >
                {confirmBusy
                  ? '...'
                  : confirmModal.type === 'cancel' ? 'Отменить' : 'Перенести'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}