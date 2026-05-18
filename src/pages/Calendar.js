// kogda-frontend/src/pages/Calendar.js
// Календарь коуча — Apple-style, ТОЛЬКО просмотр (управление в Записях).
// Шаг 1 (17.05.2026): каркас + вид Неделя на реальных bookings.
// Данные: GET /bookings (start_time, end_time, meeting_title, client_name, status).
// Окно часов пока фиксированное 8:00–21:00 (адаптив — отдельный шаг).
// День / Месяц — заглушки в этом шаге.
// 18.05.2026: палитра 1 (фиолет/бирюза/коралл). Выбор палитры коучем — позже.

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import AppLayout from '../components/AppLayout'
import AIHelper from '../components/AIHelper'
import PromoCard from '../components/PromoCard'
import { ChevronLeft, ChevronRight, CalendarOff } from 'lucide-react'

const API = process.env.REACT_APP_API_URL || 'https://kogda-backend-production.up.railway.app'

// ============ ДИЗАЙН-ТОКЕНЫ (система kogDA) ============
const C = {
  bg: '#F5F4EE',
  card: '#FFFFFF',
  cardSoft: '#FAF9F3',
  border: '#E8E7E0',
  borderSoft: '#F0EFE9',
  gridLine: '#F4F3ED',
  text: '#111111',
  muted: '#888888',
  mutedLight: '#AAAAAA',
  lime: '#E8FF47',
  limeSoftBg: '#FCFFE0',
  limeText: '#7C8400',
}

// ============ ПАЛИТРА СТАТУСОВ — Вариант 1 (18.05.2026) ============
// confirmed — фиолет; pending — бирюза; reschedule — коралл.
// busy — нейтральный графит (занятость из личного календаря, НЕ статус).
const STATUS = {
  confirmed: {
    bg: '#ECE7FB',
    bar: '#7C5CE0',
    text: '#4A2FA8',
    striped: false,
  },
  pending: {
    bg: '#DDF3EF',
    bar: '#15A89A',
    text: '#0B6B61',
    striped: false,
  },
  reschedule: {
    bg: '#FCE6DC',
    bar: '#E8633A',
    text: '#A8401E',
    subText: '#C2542A',
    striped: false,
  },
  busy: {
    bg: '#E6E5DD',
    bar: '#C9C8BF',
    text: '#76756B',
    striped: false,
  },
}

// Сетка часов: фиксированное окно (шаг 1). Адаптив — позже.
const HOUR_START = 8
const HOUR_END = 21
const HOUR_PX = 44 // высота одного часа в пикселях (Неделя)
const GUTTER = 46 // ширина колонки с подписями часов

// Вид День — полная сетка 0..24
const DAY_HOUR_PX = 52 // высота часа в виде День (просторнее, подробные карточки)

const DAYS_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]
const MONTHS_NOM = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

// ---- утилиты дат ----

// Понедельник недели, в которую попадает дата d
function startOfWeek(d) {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay() // 0=вс..6=сб
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function hhmm(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// Привести статус брони к ключу палитры
function statusKey(status) {
  if (status === 'confirmed') return 'confirmed'
  if (status === 'reschedule_requested') return 'reschedule'
  // pending — и всё прочее неподтверждённое показываем как ожидание
  return 'pending'
}

export default function Calendar() {
  const [view, setView] = useState('week') // 'month' | 'week' | 'day'
  const [anchor, setAnchor] = useState(() => new Date()) // дата, относительно которой смотрим
  const [bookings, setBookings] = useState([])
  // Занятость из личного Google-календаря коуча: [{ start, end }] (ISO).
  // Без названий — scope freebusy. Сбой загрузки → [] (календарь работает).
  const [googleBusy, setGoogleBusy] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const dayScrollRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    axios.get(`${API}/bookings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setBookings(Array.isArray(res.data) ? res.data : [])
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })

    // Занятость из Google за широкое окно (−1 / +2 месяца от сегодня),
    // чтобы хватало при листании недель/месяцев без дозапросов.
    // Любой сбой (Google не подключён, ошибка) → пустой список,
    // календарь просто не покажет занятость, брони не пострадают.
    const gFrom = new Date()
    gFrom.setMonth(gFrom.getMonth() - 1)
    const gTo = new Date()
    gTo.setMonth(gTo.getMonth() + 2)
    axios.get(
      `${API}/integrations/google/busy?from=${gFrom.toISOString()}&to=${gTo.toISOString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(res => setGoogleBusy(Array.isArray(res.data?.busy) ? res.data.busy : []))
      .catch(() => setGoogleBusy([]))
  }, [])

  // Занятость Google на конкретный день → позиции в сетке.
  // hourPx — высота часа (Неделя/День разные), fromMidnight — отсчёт от 0:00 (вид День).
  function busyForDay(day, hourPx, fromMidnight) {
    return googleBusy
      .map(g => {
        const s = new Date(g.start)
        const e = new Date(g.end)
        if (isNaN(s.getTime()) || isNaN(e.getTime())) return null
        if (!sameDay(s, day)) return null
        const startMin = s.getHours() * 60 + s.getMinutes()
        const endMin = e.getHours() * 60 + e.getMinutes()
        const base = fromMidnight ? 0 : HOUR_START * 60
        const top = ((startMin - base) / 60) * hourPx
        const height = Math.max(((endMin - startMin) / 60) * hourPx, 22)
        const isPast = e.getTime() < Date.now()
        return { start: s, end: e, top, height, isPast }
      })
      .filter(Boolean)
  }

  // Есть ли занятость Google в этот день (для вида Месяц)
  function hasBusyOnDay(day) {
    return googleBusy.some(g => {
      const s = new Date(g.start)
      return !isNaN(s.getTime()) && sameDay(s, day)
    })
  }

  const today = new Date()
  const weekStart = startOfWeek(anchor)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // заголовок: для Месяца — по anchor, иначе по понедельнику недели
  const titleDate = view === 'month' ? anchor : weekStart
  const headerTitle = `${MONTHS_NOM[titleDate.getMonth()]} ${titleDate.getFullYear()}`

  function goPrev() {
    if (view === 'week') setAnchor(addDays(anchor, -7))
    else if (view === 'day') setAnchor(addDays(anchor, -1))
    else if (view === 'month') {
      const d = new Date(anchor)
      d.setMonth(d.getMonth() - 1, 1)
      setAnchor(d)
    }
  }
  function goNext() {
    if (view === 'week') setAnchor(addDays(anchor, 7))
    else if (view === 'day') setAnchor(addDays(anchor, 1))
    else if (view === 'month') {
      const d = new Date(anchor)
      d.setMonth(d.getMonth() + 1, 1)
      setAnchor(d)
    }
  }
  function goToday() {
    setAnchor(new Date())
  }

  // Вид День: при открытии/смене даты проскроллить к 8:00,
  // а если выбранный день — сегодня, то к текущему времени.
  useEffect(() => {
    if (view !== 'day') return
    const el = dayScrollRef.current
    if (!el) return
    const isToday = sameDay(anchor, new Date())
    let targetMin
    if (isToday) {
      const now = new Date()
      targetMin = now.getHours() * 60 + now.getMinutes()
    } else {
      targetMin = HOUR_START * 60 // 8:00
    }
    const y = (targetMin / 60) * DAY_HOUR_PX - 80 // -80 чтобы цель была не вплотную к верху
    el.scrollTop = Math.max(0, y)
  }, [view, anchor])

  // отфильтровать брони, попадающие в конкретный день, и посчитать позицию
  function eventsForDay(day) {
    return bookings
      .filter(b => {
        if (b.status === 'cancelled') return false // отменённые не показываем (шаг 1)
        const s = new Date(b.start_time)
        return sameDay(s, day)
      })
      .map(b => {
        const s = new Date(b.start_time)
        const e = new Date(b.end_time)
        const startMin = s.getHours() * 60 + s.getMinutes()
        const endMin = e.getHours() * 60 + e.getMinutes()
        const top = ((startMin - HOUR_START * 60) / 60) * HOUR_PX
        const height = Math.max(((endMin - startMin) / 60) * HOUR_PX, 22)
        const isPast = e.getTime() < Date.now()
        return { booking: b, start: s, end: e, top, height, isPast }
      })
  }

  // Версия для вида День: позиции от полуночи (сетка 0..24), DAY_HOUR_PX
  function eventsForDayFull(day) {
    return bookings
      .filter(b => {
        if (b.status === 'cancelled') return false
        const s = new Date(b.start_time)
        return sameDay(s, day)
      })
      .map(b => {
        const s = new Date(b.start_time)
        const e = new Date(b.end_time)
        const startMin = s.getHours() * 60 + s.getMinutes()
        const endMin = e.getHours() * 60 + e.getMinutes()
        const top = (startMin / 60) * DAY_HOUR_PX
        const height = Math.max(((endMin - startMin) / 60) * DAY_HOUR_PX, 30)
        const isPast = e.getTime() < Date.now()
        return { booking: b, start: s, end: e, top, height, isPast }
      })
      .sort((a, b) => a.start - b.start)
  }

  // Для вида Месяц: брони конкретного дня, отсортированы по времени
  function bookingsOfDay(day) {
    return bookings
      .filter(b => {
        if (b.status === 'cancelled') return false
        return sameDay(new Date(b.start_time), day)
      })
      .map(b => {
        const s = new Date(b.start_time)
        const e = new Date(b.end_time)
        return { booking: b, start: s, isPast: e.getTime() < Date.now() }
      })
      .sort((a, b) => a.start - b.start)
  }

  // ---- стили ----
  const headerRow = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16, flexWrap: 'wrap', gap: 12,
  }
  const navBtn = {
    width: 30, height: 30, display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center',
    border: `1px solid ${C.border}`, borderRadius: 8,
    background: C.card, color: C.muted, cursor: 'pointer',
  }
  const todayBtn = {
    height: 30, padding: '0 14px', display: 'inline-flex',
    alignItems: 'center', fontSize: 13,
    border: `1px solid ${C.border}`, borderRadius: 8,
    background: C.card, color: C.text, fontWeight: 500, cursor: 'pointer',
  }
  function viewTab(active) {
    return {
      padding: '6px 14px', fontSize: 13, cursor: 'pointer',
      background: active ? C.text : 'transparent',
      color: active ? C.card : C.mutedLight,
      fontWeight: active ? 500 : 400,
    }
  }

  const gridTemplate = `${GUTTER}px repeat(7, 1fr)`
  const bodyHeight = (HOUR_END - HOUR_START) * HOUR_PX

  // ---- данные для третьей колонки ----
  const sectionLabelStyle = {
    fontSize: 11, fontWeight: 700, color: '#999',
    textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 14px',
  }
  const blockStyle = {
    background: '#fff', borderRadius: 14,
    border: '1px solid #E8E7E0', padding: 20,
  }

  // считаем по реальным броням
  const activeBookings = bookings.filter(b => b.status !== 'cancelled')
  const todayCount = activeBookings.filter(b => sameDay(new Date(b.start_time), today)).length
  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const rescheduleCount = bookings.filter(b => b.status === 'reschedule_requested').length

  // Подключённые календари. Сейчас всегда пусто — реальный OAuth это Этап 2.
  // Когда сделаем синхронизацию, сюда придёт список из API. Иконки — те же
  // источники, что в Settings.js → Интеграции (один источник правды).
  // Формат элемента: { key, label, icon }
  // Пример для Этапа 2:
  //   { key: 'google', label: 'Google Calendar', icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg' }
  //   { key: 'apple',  label: 'Apple Calendar',  icon: 'https://cdn.simpleicons.org/apple/000000' }
  const connectedCalendars = []

  const rightColumn = (
    <>
      <AIHelper />

      <div>
        <h3 style={sectionLabelStyle}>Сегодня</h3>
        <div style={blockStyle}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: 4, paddingBottom: 12,
          }}>
            <span style={{ fontSize: 13, color: '#888' }}>Записей</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{todayCount}</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: 12, paddingBottom: 12, borderTop: '1px solid #F0EFE9',
          }}>
            <span style={{ fontSize: 13, color: '#888' }}>Ждут подтверждения</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{pendingCount}</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: 12, paddingBottom: 4, borderTop: '1px solid #F0EFE9',
          }}>
            <span style={{ fontSize: 13, color: '#888' }}>Просят перенос</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#666' }}>{rescheduleCount}</span>
          </div>
        </div>
      </div>

      <PromoCard />

      {/* Блок «Календари» — информативный, без действий.
          Реальное подключение (OAuth) — Этап 2. Пока подключать нечем,
          поэтому connectedCalendars всегда []. На Этапе 2 сюда придёт
          реальный список из API — ветка со списком уже готова ниже. */}
      <div>
        <h3 style={sectionLabelStyle}>Календари</h3>
        <div style={blockStyle}>
          {connectedCalendars.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: C.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <CalendarOff size={18} color={C.muted} />
              </div>
              <div style={{ fontSize: 13, color: C.muted }}>
                Нет подключённых календарей
              </div>
            </div>
          ) : (
            connectedCalendars.map((cal, i) => (
              <div key={cal.key} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                paddingTop: i === 0 ? 0 : 14,
                paddingBottom: i < connectedCalendars.length - 1 ? 14 : 0,
                borderTop: i === 0 ? 'none' : `1px solid ${C.borderSoft}`,
              }}>
                <img
                  src={cal.icon}
                  alt={cal.label}
                  style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: C.text }}>
                  {cal.label}
                </div>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#22C55E', flexShrink: 0,
                }} />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )

  return (
    <AppLayout rightColumn={rightColumn}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, fontFamily: 'Inter, sans-serif' }}>Календарь</h1>
      </div>

      <div>

        {/* ШАПКА: месяц + навигация + переключатель видов */}
        <div style={headerRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{
              fontSize: 18, fontWeight: 700,
              fontFamily: 'Inter, sans-serif', color: C.text,
            }}>
              {headerTitle}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={navBtn} onClick={goPrev} aria-label="Назад">
                <ChevronLeft size={16} />
              </span>
              <span style={todayBtn} onClick={goToday}>Сегодня</span>
              <span style={navBtn} onClick={goNext} aria-label="Вперёд">
                <ChevronRight size={16} />
              </span>
            </div>
          </div>

          <div style={{
            display: 'inline-flex', border: `1px solid ${C.border}`,
            borderRadius: 8, overflow: 'hidden', background: C.card,
          }}>
            <span style={viewTab(view === 'month')} onClick={() => setView('month')}>Месяц</span>
            <span style={viewTab(view === 'week')} onClick={() => setView('week')}>Неделя</span>
            <span style={viewTab(view === 'day')} onClick={() => setView('day')}>День</span>
          </div>
        </div>

        {/* СОСТОЯНИЯ ЗАГРУЗКИ / ОШИБКИ */}
        {loading && (
          <div style={{ padding: 60, textAlign: 'center', color: C.muted, fontSize: 14 }}>
            Загрузка…
          </div>
        )}
        {error && !loading && (
          <div style={{ padding: 60, textAlign: 'center', color: C.muted, fontSize: 14 }}>
            Не удалось загрузить записи. Обнови страницу.
          </div>
        )}

        {/* ВИД НЕДЕЛЯ */}
        {!loading && !error && view === 'week' && (
          <>
            <div style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
              {/* строка дней */}
              <div style={{
                display: 'grid', gridTemplateColumns: gridTemplate,
                borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{ borderRight: `1px solid ${C.borderSoft}` }} />
                {weekDays.map((d, i) => {
                  const isToday = sameDay(d, today)
                  return (
                    <div key={i} style={{
                      textAlign: 'center', padding: '8px 0',
                      borderRight: i < 6 ? `1px solid ${C.borderSoft}` : 'none',
                      background: isToday ? C.limeSoftBg : 'transparent',
                    }}>
                      <div style={{
                        fontSize: 11, textTransform: 'uppercase',
                        color: isToday ? C.limeText : C.mutedLight,
                        fontWeight: isToday ? 500 : 400,
                      }}>
                        {DAYS_SHORT[i]}
                      </div>
                      <div style={{
                        fontSize: 15, marginTop: 2,
                        color: isToday ? C.text : C.muted,
                        ...(isToday ? {
                          background: C.lime, width: 24, height: 24,
                          lineHeight: '24px', borderRadius: '50%',
                          display: 'inline-block', fontWeight: 500,
                        } : {}),
                      }}>
                        {d.getDate()}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* тело сетки */}
              <div style={{ position: 'relative', height: bodyHeight, overflow: 'hidden' }}>
                {/* фон: колонка часов + вертикальные колонки с линиями */}
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'grid', gridTemplateColumns: gridTemplate,
                }}>
                  {/* подписи часов */}
                  <div style={{ borderRight: `1px solid ${C.borderSoft}` }}>
                    {Array.from({ length: HOUR_END - HOUR_START }, (_, h) => (
                      <div key={h} style={{ height: HOUR_PX, position: 'relative' }}>
                        <span style={{
                          position: 'absolute', top: -7, right: 6,
                          fontSize: 11, color: C.mutedLight,
                        }}>
                          {HOUR_START + h}:00
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* 7 колонок дней с горизонтальными линиями часов */}
                  {weekDays.map((d, i) => {
                    const isToday = sameDay(d, today)
                    return (
                      <div key={i} style={{
                        borderRight: i < 6 ? `1px solid ${C.borderSoft}` : 'none',
                        backgroundColor: isToday ? C.limeSoftBg : 'transparent',
                        backgroundImage: `repeating-linear-gradient(${C.gridLine} 0 1px, transparent 1px ${HOUR_PX}px)`,
                      }} />
                    )
                  })}
                </div>

                {/* линия текущего времени (только если сегодня в этой неделе и в окне часов) */}
                {weekDays.some(d => sameDay(d, today)) && (() => {
                  const nowMin = today.getHours() * 60 + today.getMinutes()
                  if (nowMin < HOUR_START * 60 || nowMin > HOUR_END * 60) return null
                  const top = ((nowMin - HOUR_START * 60) / 60) * HOUR_PX
                  return (
                    <div style={{
                      position: 'absolute', left: GUTTER, right: 0, top,
                      height: 1, background: '#E0837A', zIndex: 5,
                    }}>
                      <div style={{
                        position: 'absolute', left: -2.5, top: -2,
                        width: 5, height: 5, borderRadius: '50%',
                        background: '#E0837A',
                      }} />
                    </div>
                  )
                })()}

                {/* занятость из Google (под бронями) */}
                {weekDays.map((day, dayIdx) => {
                  const bs = busyForDay(day, HOUR_PX, false)
                  return bs.map((b, bi) => {
                    const st = STATUS.busy
                    const colLeft = `calc(${GUTTER}px + (100% - ${GUTTER}px) * ${dayIdx}/7 + 3px)`
                    const colWidth = `calc((100% - ${GUTTER}px) / 7 - 6px)`
                    return (
                      <div
                        key={`busy-${dayIdx}-${bi}`}
                        title={`${hhmm(b.start)}–${hhmm(b.end)} · Занято (личный календарь)`}
                        style={{
                          position: 'absolute',
                          left: colLeft, width: colWidth,
                          top: b.top, height: b.height,
                          background: st.bg,
                          borderRadius: 6,
                          padding: '4px 7px',
                          boxSizing: 'border-box',
                          overflow: 'hidden',
                          opacity: b.isPast ? 0.4 : 0.9,
                          zIndex: 1,
                        }}
                      >
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 500, color: st.text,
                        }}>
                          <span style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: st.bar, flexShrink: 0,
                          }} />
                          Занято
                        </div>
                      </div>
                    )
                  })
                })}

                {/* события по дням */}
                {weekDays.map((day, dayIdx) => {
                  const evs = eventsForDay(day)
                  return evs.map(({ booking, start, end, top, height, isPast }) => {
                    const sk = statusKey(booking.status)
                    const st = STATUS[sk]
                    const colLeft = `calc(${GUTTER}px + (100% - ${GUTTER}px) * ${dayIdx}/7 + 3px)`
                    const colWidth = `calc((100% - ${GUTTER}px) / 7 - 6px)`
                    return (
                      <div
                        key={booking.id}
                        title={`${hhmm(start)}–${hhmm(end)} · ${booking.client_name || ''}${booking.meeting_title ? ' · ' + booking.meeting_title : ''}${isPast ? ' · прошла' : ''}`}
                        style={{
                          position: 'absolute',
                          left: colLeft, width: colWidth,
                          top, height,
                          background: st.bg,
                          borderLeft: `3px solid ${st.bar}`,
                          borderRadius: '0 6px 6px 0',
                          padding: '5px 7px',
                          boxSizing: 'border-box',
                          overflow: 'hidden',
                          opacity: isPast ? 0.45 : 1,
                          zIndex: 2,
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 500, color: st.text }}>
                          {hhmm(start)}{height >= 40 ? `–${hhmm(end)}` : ''}
                        </div>
                        <div style={{
                          fontSize: 12, fontWeight: 500, color: st.text,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {booking.client_name || '—'}
                        </div>
                      </div>
                    )
                  })
                })}
              </div>
            </div>

            {/* легенда */}
            <div style={{ display: 'flex', gap: 16, marginTop: 11, padding: '0 4px', flexWrap: 'wrap' }}>
              <LegendDot label="Подтверждено" swatch={{ background: STATUS.confirmed.bar }} />
              <LegendDot label="Ждёт подтверждения" swatch={{ background: STATUS.pending.bar }} />
              <LegendDot label="Просит перенос" swatch={{ background: STATUS.reschedule.bar }} />
              <LegendDot label="Занято (личный календарь)" swatch={{ background: STATUS.busy.bar }} />
            </div>
          </>
        )}

        {/* ВИД ДЕНЬ — сетка 0..24 со скроллом, подробные карточки */}
        {!loading && !error && view === 'day' && (() => {
          const dayDate = new Date(anchor)
          const isToday = sameDay(dayDate, today)
          const dayTitle = `${DAYS_SHORT[(dayDate.getDay() + 6) % 7]}, ${dayDate.getDate()} ${MONTHS[dayDate.getMonth()]}`
          const evs = eventsForDayFull(dayDate)
          const fullHeight = 24 * DAY_HOUR_PX
          const nowMin = today.getHours() * 60 + today.getMinutes()
          return (
            <>
              <div style={{
                fontSize: 15, fontWeight: 500, color: C.text,
                margin: '0 0 12px 2px',
              }}>
                {dayTitle}{isToday ? ' · сегодня' : ''}
              </div>

              <div style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 12, overflow: 'hidden',
              }}>
                <div
                  ref={dayScrollRef}
                  style={{ position: 'relative', height: 560, overflowY: 'auto' }}
                >
                  <div style={{ position: 'relative', height: fullHeight }}>
                    {/* фон: подписи часов + горизонтальные линии */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'grid', gridTemplateColumns: `${GUTTER}px 1fr`,
                    }}>
                      <div style={{ borderRight: `1px solid ${C.borderSoft}` }}>
                        {Array.from({ length: 24 }, (_, h) => (
                          <div key={h} style={{ height: DAY_HOUR_PX, position: 'relative' }}>
                            <span style={{
                              position: 'absolute', top: -7, right: 6,
                              fontSize: 11, color: C.mutedLight,
                            }}>
                              {h}:00
                            </span>
                          </div>
                        ))}
                      </div>
                      <div style={{
                        backgroundImage: `repeating-linear-gradient(${C.gridLine} 0 1px, transparent 1px ${DAY_HOUR_PX}px)`,
                      }} />
                    </div>

                    {/* линия текущего времени (только если выбран сегодня) */}
                    {isToday && (
                      <div style={{
                        position: 'absolute', left: GUTTER, right: 0,
                        top: (nowMin / 60) * DAY_HOUR_PX,
                        height: 1, background: '#E0837A', zIndex: 5,
                      }}>
                        <div style={{
                          position: 'absolute', left: -2.5, top: -2,
                          width: 5, height: 5, borderRadius: '50%',
                          background: '#E0837A',
                        }} />
                      </div>
                    )}

                    {/* занятость Google (под бронями) */}
                    {busyForDay(dayDate, DAY_HOUR_PX, true).map((b, bi) => {
                      const st = STATUS.busy
                      return (
                        <div
                          key={`busy-day-${bi}`}
                          title={`${hhmm(b.start)}–${hhmm(b.end)} · Занято (личный календарь)`}
                          style={{
                            position: 'absolute',
                            left: GUTTER + 6, right: 8,
                            top: b.top, height: b.height,
                            background: st.bg,
                            borderRadius: 6,
                            padding: '7px 10px',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            opacity: b.isPast ? 0.4 : 0.9,
                            zIndex: 1,
                          }}
                        >
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            fontSize: 12, fontWeight: 500, color: st.text,
                          }}>
                            <span style={{
                              width: 5, height: 5, borderRadius: '50%',
                              background: st.bar, flexShrink: 0,
                            }} />
                            {hhmm(b.start)}–{hhmm(b.end)} · Занято
                          </div>
                        </div>
                      )
                    })}

                    {/* события — подробные карточки */}
                    {evs.map(({ booking, start, end, top, height, isPast }) => {
                      const sk = statusKey(booking.status)
                      const st = STATUS[sk]
                      return (
                        <div
                          key={booking.id}
                          style={{
                            position: 'absolute',
                            left: GUTTER + 6, right: 8,
                            top, height,
                            background: st.bg,
                            borderLeft: `3px solid ${st.bar}`,
                            borderRadius: '0 6px 6px 0',
                            padding: '7px 10px',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            opacity: isPast ? 0.45 : 1,
                            zIndex: 2,
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 500, color: st.text }}>
                            {hhmm(start)}–{hhmm(end)} · {booking.client_name || '—'}
                          </div>
                          {booking.meeting_title && height >= 44 && (
                            <div style={{ fontSize: 12, color: st.text, opacity: 0.7, marginTop: 2 }}>
                              {booking.meeting_title}
                            </div>
                          )}
                          {sk === 'reschedule' && height >= 60 && (
                            <div style={{ fontSize: 12, color: st.subText, marginTop: 2 }}>
                              просит перенос
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* легенда */}
              <div style={{ display: 'flex', gap: 16, marginTop: 11, padding: '0 4px', flexWrap: 'wrap' }}>
                <LegendDot label="Подтверждено" swatch={{ background: STATUS.confirmed.bar }} />
                <LegendDot label="Ждёт подтверждения" swatch={{ background: STATUS.pending.bar }} />
                <LegendDot label="Просит перенос" swatch={{ background: STATUS.reschedule.bar }} />
                <LegendDot label="Занято (личный календарь)" swatch={{ background: STATUS.busy.bar }} />
              </div>
            </>
          )
        })()}

        {/* ВИД МЕСЯЦ — сетка дней, события строчками */}
        {!loading && !error && view === 'month' && (() => {
          const y = anchor.getFullYear()
          const m = anchor.getMonth()
          const firstOfMonth = new Date(y, m, 1)
          const gridStart = startOfWeek(firstOfMonth) // понедельник первой строки
          const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
          const MAX_LINES = 3 // сколько событий показываем в клетке

          return (
            <>
              <div style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 12, overflow: 'hidden',
              }}>
                {/* шапка дней недели */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  {DAYS_SHORT.map((d, i) => (
                    <div key={i} style={{
                      textAlign: 'center', padding: '8px 0',
                      fontSize: 11, textTransform: 'uppercase',
                      color: C.mutedLight,
                      borderRight: i < 6 ? `1px solid ${C.borderSoft}` : 'none',
                    }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* сетка 6 строк × 7 дней */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gridAutoRows: '104px',
                }}>
                  {cells.map((cellDate, idx) => {
                    const inMonth = cellDate.getMonth() === m
                    const isToday = sameDay(cellDate, today)
                    const col = idx % 7
                    const row = Math.floor(idx / 7)
                    const evs = bookingsOfDay(cellDate)
                    const shown = evs.slice(0, MAX_LINES)
                    const more = evs.length - shown.length
                    return (
                      <div
                        key={idx}
                        onClick={() => { setAnchor(new Date(cellDate)); setView('day') }}
                        style={{
                          borderRight: col < 6 ? `1px solid ${C.borderSoft}` : 'none',
                          borderBottom: row < 5 ? `1px solid ${C.borderSoft}` : 'none',
                          background: isToday ? C.limeSoftBg : 'transparent',
                          padding: '6px 6px 4px',
                          boxSizing: 'border-box',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          opacity: inMonth ? 1 : 0.35,
                        }}
                      >
                        <div style={{
                          fontSize: 13, marginBottom: 4,
                          textAlign: 'right', paddingRight: 2,
                          color: isToday ? C.text : C.muted,
                          fontWeight: isToday ? 500 : 400,
                        }}>
                          {isToday ? (
                            <span style={{
                              background: C.lime, color: C.text,
                              width: 22, height: 22, lineHeight: '22px',
                              borderRadius: '50%', display: 'inline-block',
                              textAlign: 'center', fontWeight: 500,
                            }}>{cellDate.getDate()}</span>
                          ) : cellDate.getDate()}
                        </div>

                        {shown.map(({ booking, start, isPast }) => {
                          const sk = statusKey(booking.status)
                          const st = STATUS[sk]
                          return (
                            <div
                              key={booking.id}
                              title={`${hhmm(start)} · ${booking.client_name || ''}`}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                fontSize: 11, lineHeight: '15px',
                                color: st.text,
                                opacity: isPast ? 0.45 : 1,
                                whiteSpace: 'nowrap', overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginBottom: 1,
                              }}
                            >
                              <span style={{
                                width: 6, height: 6, borderRadius: 2,
                                background: st.bar, flexShrink: 0,
                              }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {hhmm(start)} {booking.client_name || '—'}
                              </span>
                            </div>
                          )
                        })}

                        {more > 0 && (
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                            ещё {more}
                          </div>
                        )}

                        {hasBusyOnDay(cellDate) && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 11, lineHeight: '15px',
                            color: STATUS.busy.text, marginTop: 1,
                          }}>
                            <span style={{
                              width: 6, height: 6, borderRadius: 2,
                              background: STATUS.busy.bar, flexShrink: 0,
                            }} />
                            <span>Занято</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* легенда */}
              <div style={{ display: 'flex', gap: 16, marginTop: 11, padding: '0 4px', flexWrap: 'wrap' }}>
                <LegendDot label="Подтверждено" swatch={{ background: STATUS.confirmed.bar }} />
                <LegendDot label="Ждёт подтверждения" swatch={{ background: STATUS.pending.bar }} />
                <LegendDot label="Просит перенос" swatch={{ background: STATUS.reschedule.bar }} />
                <LegendDot label="Занято (личный календарь)" swatch={{ background: STATUS.busy.bar }} />
              </div>
            </>
          )
        })()}

      </div>
    </AppLayout>
  )
}

// маленький маркер легенды
function LegendDot({ label, swatch }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: 8, height: 8, borderRadius: 2,
        display: 'inline-block', ...swatch,
      }} />
      <span style={{ fontSize: 11, color: '#999999' }}>{label}</span>
    </div>
  )
}