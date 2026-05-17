// kogda-frontend/src/pages/Calendar.js
// Календарь коуча — Apple-style, ТОЛЬКО просмотр (управление в Записях).
// Шаг 1 (17.05.2026): каркас + вид Неделя на реальных bookings.
// Данные: GET /bookings (start_time, end_time, meeting_title, client_name, status).
// Окно часов пока фиксированное 8:00–21:00 (адаптив — отдельный шаг).
// День / Месяц — заглушки в этом шаге.

import { useState, useEffect } from 'react'
import axios from 'axios'
import AppLayout from '../components/AppLayout'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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

// ============ ПАЛИТРА СТАТУСОВ (согласовано 17.05.2026) ============
// confirmed — сплошная синяя; pending — штриховка; reschedule — терракота.
const STATUS = {
  confirmed: {
    bg: '#EAEEF3',
    bar: '#2E4057',
    text: '#1F2D3D',
    striped: false,
  },
  pending: {
    bg: 'repeating-linear-gradient(45deg, #F1F3F5 0 5px, #FBFCFC 5px 10px)',
    bar: '#97A1AC',
    text: '#5E6B78',
    striped: true,
  },
  reschedule: {
    bg: '#F7EAE4',
    bar: '#C26B47',
    text: '#8A4329',
    subText: '#B05C33',
    striped: false,
  },
}

// Сетка часов: фиксированное окно (шаг 1). Адаптив — позже.
const HOUR_START = 8
const HOUR_END = 21
const HOUR_PX = 56 // высота одного часа в пикселях
const GUTTER = 46 // ширина колонки с подписями часов

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

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
  }, [])

  const today = new Date()
  const weekStart = startOfWeek(anchor)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // заголовок: "Май 2026" по понедельнику недели
  const headerTitle = `${MONTHS_NOM[weekStart.getMonth()]} ${weekStart.getFullYear()}`

  function goPrev() {
    if (view === 'week') setAnchor(addDays(anchor, -7))
    else if (view === 'day') setAnchor(addDays(anchor, -1))
  }
  function goNext() {
    if (view === 'week') setAnchor(addDays(anchor, 7))
    else if (view === 'day') setAnchor(addDays(anchor, 1))
  }
  function goToday() {
    setAnchor(new Date())
  }

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
        return { booking: b, start: s, end: e, top, height }
      })
  }

  // ---- стили ----
  const pageWrap = {
    background: C.bg,
    minHeight: '100vh',
    padding: '20px 24px 40px',
    boxSizing: 'border-box',
  }
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

  return (
    <AppLayout>
      <div style={pageWrap}>

        {/* ШАПКА */}
        <div style={headerRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{
              fontSize: 22, fontWeight: 800,
              fontFamily: 'Syne, sans-serif', color: C.text,
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

                {/* события по дням */}
                {weekDays.map((day, dayIdx) => {
                  const evs = eventsForDay(day)
                  return evs.map(({ booking, start, end, top, height }) => {
                    const sk = statusKey(booking.status)
                    const st = STATUS[sk]
                    const colLeft = `calc(${GUTTER}px + (100% - ${GUTTER}px) * ${dayIdx}/7 + 3px)`
                    const colWidth = `calc((100% - ${GUTTER}px) / 7 - 6px)`
                    const showService = height >= 44 && sk !== 'reschedule'
                    return (
                      <div
                        key={booking.id}
                        title={`${hhmm(start)}–${hhmm(end)} · ${booking.client_name || ''}${booking.meeting_title ? ' · ' + booking.meeting_title : ''}`}
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
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 500, color: st.text }}>
                          {hhmm(start)}{height >= 40 ? `–${hhmm(end)}` : ''}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: st.text }}>
                          {booking.client_name || '—'}
                        </div>
                        {sk === 'reschedule' && (
                          <div style={{ fontSize: 11, color: st.subText }}>
                            просит перенос
                          </div>
                        )}
                        {showService && booking.meeting_title && (
                          <div style={{ fontSize: 11, color: st.text, opacity: 0.7 }}>
                            {booking.meeting_title}
                          </div>
                        )}
                      </div>
                    )
                  })
                })}
              </div>
            </div>

            {/* легенда */}
            <div style={{ display: 'flex', gap: 16, marginTop: 11, padding: '0 4px' }}>
              <LegendDot label="Подтверждено" swatch={{ background: STATUS.confirmed.bar }} />
              <LegendDot label="Ждёт" swatch={{
                background: 'repeating-linear-gradient(45deg, #DDE1E5 0 3px, #FFFFFF 3px 6px)',
              }} />
              <LegendDot label="Просит перенос" swatch={{ background: STATUS.reschedule.bar }} />
            </div>
          </>
        )}

        {/* ВИД ДЕНЬ / МЕСЯЦ — заглушки этого шага */}
        {!loading && !error && (view === 'day' || view === 'month') && (
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: 60, textAlign: 'center',
            color: C.muted, fontSize: 14,
          }}>
            Вид «{view === 'day' ? 'День' : 'Месяц'}» — следующий шаг.
          </div>
        )}

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