import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import CurrencyPicker from './CurrencyPicker'
import { getCurrencyLabel, getCurrencySymbol } from '../currencies'

const API = process.env.REACT_APP_API_URL || 'https://kogda-backend-production.up.railway.app'

const SECTIONS = [
  { key: 'basic', label: 'Основное' },
  { key: 'price', label: 'Цена' },
  { key: 'location', label: 'Видео и место' },
  { key: 'availability', label: 'Доступность' },
  { key: 'payments', label: 'Способы оплаты' },
  { key: 'confirmation', label: 'Подтверждение' },
  { key: 'extra', label: 'Дополнительно' },
]

const DURATIONS = [15, 20, 25, 30, 45, 50, 60, 90, 120, 180]

const PRICE_MODES = [
  { value: 'amount', label: 'Указать цену' },
  { value: 'hidden', label: 'Не показывать' },
  { value: 'on_request', label: 'По запросу' },
  { value: 'free', label: 'Бесплатно' },
]

const LOCATION_TYPES = [
  { value: 'video', label: 'Видеозвонок' },
  { value: 'phone', label: 'Телефон' },
  { value: 'in_person', label: 'Лично' },
  { value: 'client_chooses', label: 'Клиент выберет' },
]

const BUFFERS = [0, 5, 10, 15, 20, 30, 45, 60, 90, 120]
const MIN_NOTICES = [0, 1, 2, 4, 8, 12, 24, 48, 72, 168]
const MAX_DAYS = [7, 14, 30, 60, 90, 180, 365]
const MAX_PER_DAY = [0, 1, 2, 3, 4, 5, 6, 8, 10]
const STEP_MINUTES = [5, 10, 15, 20, 30, 45, 60]

const DAY_VALUES = Array.from({ length: 365 }, (_, i) => i + 1)
const COUNT_VALUES = Array.from({ length: 21 }, (_, i) => i)

// Способы оплаты — ключи соответствуют Settings → Оплата
const PAYMENT_METHODS = [
  { key: 'payment_sbp', label: 'СБП' },
  { key: 'payment_tinkoff', label: 'Российская карта / банк' },
  { key: 'payment_paypal', label: 'PayPal' },
  { key: 'payment_wise', label: 'Wise' },
  { key: 'payment_bank', label: 'Банковский перевод' },
  { key: 'payment_usdt', label: 'USDT' },
]

const C = {
  card: '#FFFFFF',
  border: '#E8E7E0',
  divider: '#F1F0EA',
  sidebarBg: '#FAF9F4',
  text: '#111',
  muted: '#888',
  mutedLight: '#B4B2A9',
  lime: '#E8FF47',
  toggleOff: '#E8E7E0',
  fieldBg: '#F7F6F1',
}

const Toggle = ({ on, onClick }) => (
  <div onClick={onClick} style={{
    width: 36, height: 22, borderRadius: 999,
    background: on ? C.text : C.toggleOff,
    cursor: 'pointer', position: 'relative', flexShrink: 0,
    transition: 'background 0.15s',
  }}>
    <div style={{
      width: 16, height: 16, borderRadius: '50%', background: '#FFF',
      position: 'absolute', top: 3, left: on ? 17 : 3,
      transition: 'left 0.15s',
    }} />
  </div>
)

const Group = ({ label, tip, children, style }) => {
  const [tipOpen, setTipOpen] = useState(false)
  const tipRef = useRef(null)

  useEffect(() => {
    if (!tipOpen) return
    const onDocClick = (e) => {
      if (!tipRef.current) return
      if (!tipRef.current.contains(e.target)) setTipOpen(false)
    }
    const t = setTimeout(() => {
      document.addEventListener('mousedown', onDocClick)
      document.addEventListener('touchstart', onDocClick)
    }, 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('touchstart', onDocClick)
    }
  }, [tipOpen])

  return (
    <div style={{ marginBottom: 18, ...style }}>
      {label && (
        <div ref={tipRef} style={{
          fontSize: 11, fontWeight: 500, color: C.muted,
          letterSpacing: 0.5, textTransform: 'uppercase',
          marginBottom: 6, padding: '0 4px',
          display: 'flex', alignItems: 'center', gap: 6,
          position: 'relative',
        }}>
          <span
            onClick={() => tip && setTipOpen(o => !o)}
            onMouseEnter={() => tip && setTipOpen(true)}
            onMouseLeave={() => tip && setTipOpen(false)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              cursor: tip ? 'pointer' : 'default',
              userSelect: 'none',
            }}
          >
            {label}
            {tip && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 16, height: 16, borderRadius: '50%',
                border: '1.4px solid #A8A69B', flexShrink: 0,
                textTransform: 'none',
              }}>
                <span style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic', fontSize: 11, fontWeight: 600,
                  color: '#8A887D', lineHeight: 1,
                  textTransform: 'none',
                  transform: 'translateY(-0.5px)',
                }}>i</span>
              </span>
            )}
          </span>
          {tipOpen && tip && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 'auto',
              background: '#F0EFE9', color: '#444',
              padding: '12px 16px', borderRadius: 10,
              fontSize: 13, lineHeight: 1.55,
              width: 'min(320px, calc(100vw - 60px))',
              zIndex: 50,
              boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
              border: '1px solid #E0E0D8',
              textTransform: 'none', letterSpacing: 0, fontWeight: 400,
              whiteSpace: 'normal',
            }}>
              {tip}
              <div style={{
                position: 'absolute',
                top: -7, left: 16,
                width: 12, height: 12,
                background: '#F0EFE9',
                borderLeft: '1px solid #E0E0D8',
                borderTop: '1px solid #E0E0D8',
                transform: 'rotate(45deg)',
              }} />
            </div>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}

const Row = ({ left, right, onClick, last, gap }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '13px 16px',
    borderBottom: last ? 'none' : `1px solid ${C.divider}`,
    cursor: onClick ? 'pointer' : 'default',
    gap: gap || 12,
  }}>
    <div style={{ flex: 1, fontSize: 15 }}>{left}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{right}</div>
  </div>
)

const Field = ({ label, children, style }) => (
  <div style={{ marginBottom: 18, ...style }}>
    {label && (
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{label}</div>
    )}
    {children}
  </div>
)

const inputStyle = {
  width: '100%',
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'Inter, sans-serif',
  color: C.text,
}

// ============ DRAG WHEEL (только для мобайла) ============

const ITEM_H = 36
const VISIBLE_ROWS = 5

const Wheel = ({ values, value, onChange, format, width = 60 }) => {
  const wrapRef = useRef(null)
  const trackRef = useRef(null)
  const [translateY, setTranslateY] = useState(0)
  const [animate, setAnimate] = useState(true)

  const currentIdx = values.indexOf(value) >= 0 ? values.indexOf(value) : 0
  const baseTranslate = -(currentIdx * ITEM_H)

  const dragRef = useRef({
    active: false,
    startY: 0,
    startTranslate: 0,
  })

  const lastSentRef = useRef(value)

  const handleStart = useCallback((clientY) => {
    dragRef.current.active = true
    dragRef.current.startY = clientY
    dragRef.current.startTranslate = translateY
    setAnimate(false)
  }, [translateY])

  const handleMove = useCallback((clientY) => {
    if (!dragRef.current.active) return
    const dy = clientY - dragRef.current.startY
    const newTranslate = dragRef.current.startTranslate + dy
    const min = -(values.length - 1) * ITEM_H - baseTranslate
    const max = -baseTranslate
    const clamped = Math.max(min, Math.min(max, newTranslate))
    setTranslateY(clamped)
  }, [values.length, baseTranslate])

  const handleEnd = useCallback(() => {
    if (!dragRef.current.active) return
    dragRef.current.active = false
    const moved = Math.round(-translateY / ITEM_H)
    const newIdx = Math.max(0, Math.min(values.length - 1, currentIdx + moved))
    const newValue = values[newIdx]

    setAnimate(true)
    setTranslateY(0)

    if (newValue !== lastSentRef.current) {
      lastSentRef.current = newValue
      onChange(newValue)
    }
  }, [translateY, currentIdx, values, onChange])

  useEffect(() => {
    const onMouseMove = (e) => {
      if (dragRef.current.active) handleMove(e.clientY)
    }
    const onMouseUp = () => handleEnd()
    const onTouchMove = (e) => {
      if (dragRef.current.active) {
        e.preventDefault()
        handleMove(e.touches[0].clientY)
      }
    }
    const onTouchEnd = () => handleEnd()

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchEnd)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [handleMove, handleEnd])

  useEffect(() => {
    setTranslateY(0)
    lastSentRef.current = value
  }, [value])

  return (
    <div
      ref={wrapRef}
      onMouseDown={(e) => { e.preventDefault(); handleStart(e.clientY) }}
      onTouchStart={(e) => { handleStart(e.touches[0].clientY) }}
      style={{
        position: 'relative',
        height: ITEM_H * VISIBLE_ROWS,
        width,
        overflow: 'hidden',
        cursor: dragRef.current.active ? 'grabbing' : 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
    >
      <div
        ref={trackRef}
        style={{
          position: 'absolute',
          left: 0, right: 0,
          top: ITEM_H * Math.floor(VISIBLE_ROWS / 2),
          transform: `translateY(${baseTranslate + translateY}px)`,
          transition: animate ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {values.map((v, i) => {
          const diff = Math.abs(i - currentIdx)
          let color = C.text
          let weight = 700
          if (diff === 1) { color = '#a0a0a0'; weight = 400 }
          else if (diff === 2) { color = '#ccc'; weight = 400 }
          else if (diff > 2) { color = '#e0e0e0'; weight = 400 }
          return (
            <div key={v} style={{
              height: ITEM_H,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
              fontWeight: weight,
              color,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {format ? format(v) : v}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const RollerField = ({ open, setOpen, label, preview, children }) => {
  const wrapRef = useRef(null)
  const borderColor = open ? C.lime : C.border
  const borderWidth = open ? 1.5 : 1

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        setOpen(false)
      }
    }
    const t = setTimeout(() => {
      document.addEventListener('mousedown', onDocClick)
      document.addEventListener('touchstart', onDocClick)
      document.addEventListener('keydown', onKey)
    }, 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('touchstart', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  return (
    <div ref={wrapRef} style={{
      background: C.card,
      border: `${borderWidth}px solid ${borderColor}`,
      borderRadius: 10,
      overflow: 'hidden',
      transition: 'border-color 0.15s',
      marginBottom: 8,
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '13px 16px',
          fontSize: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <span>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: C.muted, fontWeight: 500 }}>{preview}</span>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke={C.muted} strokeWidth="2.5"
            style={{ transform: open ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.15s' }}
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${C.divider}`, padding: 12, background: C.card }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 0, right: 0,
              top: '50%', transform: 'translateY(-50%)',
              height: ITEM_H, background: C.fieldBg, borderRadius: 8,
              pointerEvents: 'none',
            }} />
            {children}
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              marginTop: 12,
              width: '100%',
              background: C.text,
              color: '#fff',
              border: 'none',
              padding: '11px',
              borderRadius: 9,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Готово
          </button>
        </div>
      )}
    </div>
  )
}

// ============ FORMATTERS ============

const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0 && m === 0) return '0 мин'
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

const formatBuffer = (minutes) => minutes === 0 ? 'Нет' : formatDuration(minutes)

const formatMinNotice = (totalHours) => {
  if (totalHours === 0) return 'Сразу'
  const d = Math.floor(totalHours / 24)
  const h = totalHours % 24
  if (d === 0) return `${h} ч`
  if (h === 0) return `${d} ${pluralDays(d)}`
  return `${d} ${pluralDays(d)} ${h} ч`
}

const formatStep = (minutes) => formatDuration(minutes)
const formatDays = (d) => `${d} ${pluralDays(d)}`
const formatCount = (n) => n === 0 ? 'Без лимита' : `${n}`

function pluralDays(n) {
  const last = n % 10
  const lastTwo = n % 100
  if (lastTwo >= 11 && lastTwo <= 14) return 'дней'
  if (last === 1) return 'день'
  if (last >= 2 && last <= 4) return 'дня'
  return 'дней'
}

function pluralPayments(n) {
  const last = n % 10
  const lastTwo = n % 100
  if (lastTwo >= 11 && lastTwo <= 14) return 'способов'
  if (last === 1) return 'способ'
  if (last >= 2 && last <= 4) return 'способа'
  return 'способов'
}

// ============ MOBILE ROLLER TYPES ============

const HOURS_FULL = Array.from({ length: 25 }, (_, i) => i)
const HOURS_SHORT = Array.from({ length: 13 }, (_, i) => i)
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i)
const DAYS_30 = Array.from({ length: 31 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

const HourMinRoller = ({ open, setOpen, label, value, onChange, hoursRange = HOURS_FULL, minTotal = 0, preview }) => {
  const h = Math.floor(value / 60)
  const mRaw = value % 60
  const m = Math.round(mRaw / 5) * 5 > 55 ? 0 : Math.round(mRaw / 5) * 5

  const handleH = (newH) => {
    let total = newH * 60 + m
    if (total < minTotal) total = minTotal
    onChange(total)
  }
  const handleM = (newM) => {
    let total = h * 60 + newM
    if (total < minTotal) total = minTotal
    onChange(total)
  }

  return (
    <RollerField open={open} setOpen={setOpen} label={label} preview={preview}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <Wheel values={hoursRange} value={h} onChange={handleH} width={50} />
        <div style={{ fontSize: 13, color: C.muted, padding: '0 6px' }}>ч</div>
        <Wheel values={MINUTES} value={m} onChange={handleM}
          format={v => String(v).padStart(2, '0')} width={50} />
        <div style={{ fontSize: 13, color: C.muted, padding: '0 6px' }}>мин</div>
      </div>
    </RollerField>
  )
}

const DayHourRoller = ({ open, setOpen, label, value, onChange, preview }) => {
  const d = Math.floor(value / 24)
  const h = value % 24

  const handleD = (newD) => onChange(newD * 24 + h)
  const handleH = (newH) => onChange(d * 24 + newH)

  return (
    <RollerField open={open} setOpen={setOpen} label={label} preview={preview}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <Wheel values={DAYS_30} value={d} onChange={handleD} width={50} />
        <div style={{ fontSize: 13, color: C.muted, padding: '0 6px' }}>дн</div>
        <Wheel values={HOURS_24} value={h} onChange={handleH} width={50} />
        <div style={{ fontSize: 13, color: C.muted, padding: '0 6px' }}>ч</div>
      </div>
    </RollerField>
  )
}

const DaysRoller = ({ open, setOpen, label, value, onChange, preview }) => {
  return (
    <RollerField open={open} setOpen={setOpen} label={label} preview={preview}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <Wheel values={DAY_VALUES} value={value} onChange={onChange} width={70} />
        <div style={{ fontSize: 13, color: C.muted, padding: '0 6px' }}>дней</div>
      </div>
    </RollerField>
  )
}

const CountRoller = ({ open, setOpen, label, value, onChange, preview }) => {
  return (
    <RollerField open={open} setOpen={setOpen} label={label} preview={preview}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <Wheel values={COUNT_VALUES} value={value} onChange={onChange} width={70}
          format={v => v === 0 ? '∞' : String(v)} />
      </div>
    </RollerField>
  )
}

const DurationRoller = ({ value, onChange, open, setOpen }) => {
  return (
    <HourMinRoller
      open={open}
      setOpen={setOpen}
      label="Длительность"
      value={value}
      onChange={onChange}
      hoursRange={HOURS_FULL}
      minTotal={5}
      preview={formatDuration(value)}
    />
  )
}

// ============ MAIN ============

export default function ServiceModal({ meetingId, onUpdate }) {
  const [meeting, setMeeting] = useState(null)
  const [section, setSection] = useState('basic')
  const [loading, setLoading] = useState(true)
  const [isNarrow, setIsNarrow] = useState(window.innerWidth < 900)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)

  // Настройки юзера — нужны для PaymentsSection чтобы знать какие способы включены глобально
  const [userPayments, setUserPayments] = useState(null) // null = ещё не загружено

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Загрузка способов оплаты из настроек юзера (один раз)
  useEffect(() => {
    const loadUserPayments = async () => {
      const token = localStorage.getItem('token')
      try {
        const res = await axios.get(`${API}/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setUserPayments({
          payment_sbp: !!res.data.payment_sbp,
          payment_tinkoff: !!res.data.payment_tinkoff,
          payment_paypal: !!res.data.payment_paypal,
          payment_wise: !!res.data.payment_wise,
          payment_bank: !!res.data.payment_bank,
          payment_usdt: !!res.data.payment_usdt,
          payment_other: typeof res.data.payment_other === 'string' ? res.data.payment_other : '',
        })
      } catch (err) {
        console.error('[ServiceModal load userPayments]', err)
        setUserPayments({})
      }
    }
    loadUserPayments()
  }, [])

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token')
      try {
        if (meetingId) {
          const res = await axios.get(`${API}/meetings`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const found = res.data.find(m => m.id === meetingId)
          if (found) setMeeting(found)
        }
      } catch (err) {
        console.error('[ServiceModal load]', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [meetingId])

  const update = async (changes) => {
    if (!meeting) return
    const prev = meeting
    const next = { ...meeting, ...changes }
    setMeeting(next)
    const token = localStorage.getItem('token')
    try {
      const res = await axios.patch(
        `${API}/meetings/${meeting.id}`,
        changes,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMeeting(res.data)
      if (onUpdate) onUpdate(res.data)
    } catch (err) {
      console.error('[ServiceModal update]', err)
      setMeeting(prev)
      alert('Не удалось сохранить, попробуй ещё раз')
    }
  }

  if (loading || !meeting) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 200, color: C.muted, fontSize: 14,
      }}>Загружаю...</div>
    )
  }

  const previews = {
    basic: formatDuration(meeting.duration),
    price: pricePreview(meeting),
    location: locationPreview(meeting.location_type),
    availability: availabilityPreview(meeting),
    payments: paymentsPreview(meeting, userPayments),
    confirmation: meeting.require_confirm ? 'Вручную' : 'Автоматически',
    extra: '—',
  }

  const renderSection = () => {
    switch (section) {
      case 'basic': return <BasicSection meeting={meeting} update={update} isNarrow={isNarrow} />
      case 'price': return <PriceSection meeting={meeting} update={update} />
      case 'location': return <LocationSection meeting={meeting} update={update} />
      case 'availability': return <AvailabilitySection meeting={meeting} update={update} isNarrow={isNarrow} />
      case 'payments': return <PaymentsSection meeting={meeting} update={update} userPayments={userPayments} />
      case 'confirmation': return <ConfirmationSection meeting={meeting} update={update} />
      case 'extra': return <ExtraSection />
      default: return null
    }
  }

  if (isNarrow) {
    return (
      <div style={{ padding: '14px 16px' }}>
        {!mobileShowDetail ? (
          SECTIONS.map(s => (
            <div
              key={s.key}
              onClick={() => { setSection(s.key); setMobileShowDetail(true) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 14px', background: C.card,
                border: `1px solid ${C.border}`, borderRadius: 10,
                marginBottom: 8, cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{previews[s.key]}</div>
              </div>
              <div style={{ color: '#C8C7BF', fontSize: 18 }}>›</div>
            </div>
          ))
        ) : (
          <>
            <div onClick={() => setMobileShowDetail(false)} style={{
              fontSize: 14, color: C.text, cursor: 'pointer',
              marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6,
            }}>‹ <span style={{ color: C.muted }}>Все разделы</span></div>
            {renderSection()}
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 460 }}>
      <div style={{ background: C.sidebarBg, padding: '10px 8px' }}>
        {SECTIONS.map(s => {
          const active = section === s.key
          return (
            <div
              key={s.key}
              onClick={() => setSection(s.key)}
              style={{
                padding: '9px 12px',
                paddingLeft: active ? 9 : 12,
                marginBottom: 2,
                background: active ? C.card : 'transparent',
                borderRadius: 8,
                borderLeft: active ? `3px solid ${C.lime}` : 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: active ? 600 : 500, fontSize: 14 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{previews[s.key]}</div>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '22px 26px', borderLeft: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
          {SECTIONS.find(s => s.key === section)?.label}
        </div>
        {renderSection()}
      </div>
    </div>
  )
}

function pricePreview(m) {
  switch (m.price_mode) {
    case 'amount': {
      if (!(m.price > 0)) return '—'
      const symbol = getCurrencySymbol(m.currency || 'USD')
      return `${Number(m.price).toLocaleString('ru-RU')} ${symbol}`
    }
    case 'hidden': return 'Скрыта'
    case 'on_request': return 'По запросу'
    case 'free': return 'Бесплатно'
    default: return '—'
  }
}

function locationPreview(type) {
  const map = {
    video: 'Видеозвонок',
    phone: 'Телефон',
    in_person: 'Лично',
    client_chooses: 'Клиент выберет',
  }
  return map[type] || '—'
}

function availabilityPreview(m) {
  if (m.buffer_before > 0 || m.buffer_after > 0) {
    return `Буфер ${formatDuration(m.buffer_after || m.buffer_before)}`
  }
  return `Шаг ${formatDuration(m.step_minutes)}`
}

// Превью для сайдбара. userPayments может быть null если ещё не загружено.
function paymentsPreview(m, userPayments) {
  const ep = m.enabled_payments
  // Индивидуальный режим
  if (Array.isArray(ep)) {
    if (ep.length === 0) return 'Не выбрано'
    return `${ep.length} ${pluralPayments(ep.length)}`
  }
  // По умолчанию — считаем глобальные
  if (userPayments) {
    const count = Object.entries(userPayments).filter(([k, v]) =>
      k.startsWith('payment_') && k !== 'payment_other' && v === true
    ).length
    const hasOther = !!userPayments.payment_other
    const total = count + (hasOther ? 1 : 0)
    if (total === 0) return 'Не настроены'
  }
  return 'Все из настроек'
}

// ============ SECTIONS ============

const BasicSection = ({ meeting, update, isNarrow }) => {
  const [localTitle, setLocalTitle] = useState(meeting.title)
  const [localDesc, setLocalDesc] = useState(meeting.description || '')
  const [durationOpen, setDurationOpen] = useState(false)

  useEffect(() => { setLocalTitle(meeting.title) }, [meeting.title])
  useEffect(() => { setLocalDesc(meeting.description || '') }, [meeting.description])

  return (
    <>
      <Field label="Название">
        <input
          value={localTitle}
          onChange={e => setLocalTitle(e.target.value)}
          onBlur={() => { if (localTitle !== meeting.title) update({ title: localTitle }) }}
          style={inputStyle}
        />
      </Field>

      <Field label="Длительность">
        {isNarrow ? (
          <DurationRoller
            value={meeting.duration}
            onChange={(total) => update({ duration: total })}
            open={durationOpen}
            setOpen={setDurationOpen}
          />
        ) : (
          <select
            value={DURATIONS.includes(meeting.duration) ? meeting.duration : ''}
            onChange={e => update({ duration: Number(e.target.value) })}
            style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
          >
            {!DURATIONS.includes(meeting.duration) && (
              <option value={meeting.duration}>{formatDuration(meeting.duration)}</option>
            )}
            {DURATIONS.map(d => <option key={d} value={d}>{formatDuration(d)}</option>)}
          </select>
        )}
      </Field>

      <Field label="Описание">
        <textarea
          value={localDesc}
          onChange={e => setLocalDesc(e.target.value)}
          onBlur={() => { if (localDesc !== (meeting.description || '')) update({ description: localDesc }) }}
          placeholder="Краткое описание услуги"
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
        />
      </Field>
    </>
  )
}

const PriceSection = ({ meeting, update }) => {
  const [localPrice, setLocalPrice] = useState(meeting.price || 0)
  useEffect(() => { setLocalPrice(meeting.price || 0) }, [meeting.price])

  const currencyCode = meeting.currency || 'USD'
  const currencySymbol = getCurrencySymbol(currencyCode)

  return (
    <>
      <Group>
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, overflow: 'hidden',
        }}>
          {PRICE_MODES.map((m, i) => {
            const active = meeting.price_mode === m.value
            return (
              <Row
                key={m.value}
                last={i === PRICE_MODES.length - 1}
                onClick={() => { if (!active) update({ price_mode: m.value }) }}
                left={m.label}
                right={<Toggle on={active} onClick={() => { if (!active) update({ price_mode: m.value }) }} />}
              />
            )
          })}
        </div>
      </Group>
      {meeting.price_mode === 'amount' && (
        <>
          <Field label={`Сумма (${currencySymbol})`}>
            <input
              type="number"
              value={localPrice === 0 || localPrice === '0' ? '' : localPrice}
              onChange={e => setLocalPrice(e.target.value)}
              onBlur={() => {
                const num = Number(localPrice) || 0
                if (num !== Number(meeting.price)) update({ price: num })
              }}
              min={0}
              placeholder="0"
              style={{ ...inputStyle, MozAppearance: 'textfield' }}
            />
          </Field>

          {/* Валюта — открывает оверлей через CurrencyPicker */}
          <Group>
            <CurrencyPicker
              value={meeting.currency}
              onChange={(code) => update({ currency: code })}
              colors={{
                text: C.text,
                muted: C.muted,
                mutedLight: C.mutedLight,
                border: C.border,
                borderSoft: C.borderSoft || '#F0EFE9',
                bg: C.bg,
                card: C.card,
                cardSoft: C.cardSoft,
              }}
              renderTrigger={({ triggerRef, label, isOpen, onClick }) => (
                <div ref={triggerRef}>
                  <div style={{
                    background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 12, overflow: 'hidden',
                  }}>
                    <Row
                      last
                      left="Валюта"
                      onClick={onClick}
                      right={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, color: C.muted }}>{label}</span>
                          <svg
                            width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="#888" strokeWidth="2"
                            style={{
                              transform: isOpen ? 'rotate(90deg)' : 'rotate(0)',
                              transition: 'transform 0.15s',
                            }}
                          >
                            <polyline points="9,18 15,12 9,6" />
                          </svg>
                        </div>
                      }
                    />
                  </div>
                </div>
              )}
            />
          </Group>
        </>
      )}
    </>
  )
}

const LocationSection = ({ meeting, update }) => (
  <Group>
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, overflow: 'hidden',
    }}>
      {LOCATION_TYPES.map((t, i) => {
        const active = meeting.location_type === t.value
        return (
          <Row
            key={t.value}
            last={i === LOCATION_TYPES.length - 1}
            onClick={() => { if (!active) update({ location_type: t.value }) }}
            left={t.label}
            right={<Toggle on={active} onClick={() => { if (!active) update({ location_type: t.value }) }} />}
          />
        )
      })}
    </div>
  </Group>
)

// Десктоп — селекты внутри обёртки группы
const DesktopDropRow = ({ label, value, onChange, options, formatFn, last }) => (
  <Row
    last={last}
    left={label}
    gap={8}
    right={
      <select
        value={options.includes(value) ? value : ''}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          border: 'none', background: 'transparent', color: C.muted,
          fontSize: 15, cursor: 'pointer', appearance: 'none',
          textAlign: 'right', paddingRight: 18, fontFamily: 'Inter, sans-serif',
          backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23C8C7BF\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'9,18 15,12 9,6\'/></svg>")',
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right center',
        }}
      >
        {!options.includes(value) && <option value={value}>{formatFn(value)}</option>}
        {options.map(o => <option key={o} value={o}>{formatFn(o)}</option>)}
      </select>
    }
  />
)

const AvailabilitySection = ({ meeting, update, isNarrow }) => {
  const [openKey, setOpenKey] = useState(null)
  const makeSetOpen = (key) => (next) => {
    setOpenKey(prev => {
      const isOpen = prev === key
      const wantOpen = typeof next === 'function' ? next(isOpen) : next
      return wantOpen ? key : null
    })
  }

  // ===== Мобайл: роллеры =====
  if (isNarrow) {
    return (
      <>
        <Group label="Буферы" tip="Время до или после записи. Клиенты не увидят это время как доступное.">
          <HourMinRoller
            open={openKey === 'buffer_before'}
            setOpen={makeSetOpen('buffer_before')}
            label="До встречи"
            value={meeting.buffer_before || 0}
            onChange={v => update({ buffer_before: v })}
            hoursRange={HOURS_SHORT}
            preview={formatBuffer(meeting.buffer_before || 0)}
          />
          <HourMinRoller
            open={openKey === 'buffer_after'}
            setOpen={makeSetOpen('buffer_after')}
            label="После встречи"
            value={meeting.buffer_after || 0}
            onChange={v => update({ buffer_after: v })}
            hoursRange={HOURS_SHORT}
            preview={formatBuffer(meeting.buffer_after || 0)}
          />
        </Group>

        <Group label="Окно записи" tip="За сколько до встречи нельзя записаться и как далеко вперёд клиент видит свободное время.">
          <DayHourRoller
            open={openKey === 'min_notice'}
            setOpen={makeSetOpen('min_notice')}
            label="Минимум до записи"
            value={meeting.min_notice || 0}
            onChange={v => update({ min_notice: v })}
            preview={formatMinNotice(meeting.min_notice || 0)}
          />
          <DaysRoller
            open={openKey === 'max_days_ahead'}
            setOpen={makeSetOpen('max_days_ahead')}
            label="На сколько вперёд"
            value={meeting.max_days_ahead || 30}
            onChange={v => update({ max_days_ahead: v })}
            preview={formatDays(meeting.max_days_ahead || 30)}
          />
        </Group>

        <Group label="Слоты" tip="Шаг времени, который видит клиент при выборе, и сколько встреч можно проводить в день.">
          <HourMinRoller
            open={openKey === 'step_minutes'}
            setOpen={makeSetOpen('step_minutes')}
            label="Шаг слотов"
            value={meeting.step_minutes || 30}
            onChange={v => update({ step_minutes: Math.max(5, v) })}
            hoursRange={HOURS_SHORT}
            minTotal={5}
            preview={formatStep(meeting.step_minutes || 30)}
          />
          <CountRoller
            open={openKey === 'max_per_day'}
            setOpen={makeSetOpen('max_per_day')}
            label="Макс. встреч в день"
            value={meeting.max_per_day || 0}
            onChange={v => update({ max_per_day: v })}
            preview={formatCount(meeting.max_per_day || 0)}
          />
        </Group>
      </>
    )
  }

  // ===== Десктоп: старые селекты =====
  return (
    <>
      <Group label="Буферы" tip="Время до или после записи. Клиенты не увидят это время как доступное.">
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, overflow: 'hidden',
        }}>
          <DesktopDropRow label="До встречи" value={meeting.buffer_before || 0}
            onChange={v => update({ buffer_before: v })}
            options={BUFFERS} formatFn={v => v === 0 ? 'Нет' : `${v} мин`} />
          <DesktopDropRow last label="После встречи" value={meeting.buffer_after || 0}
            onChange={v => update({ buffer_after: v })}
            options={BUFFERS} formatFn={v => v === 0 ? 'Нет' : `${v} мин`} />
        </div>
      </Group>
      <Group label="Окно записи" tip="За сколько до встречи нельзя записаться и как далеко вперёд клиент видит свободное время.">
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, overflow: 'hidden',
        }}>
          <DesktopDropRow label="Минимум до записи" value={meeting.min_notice || 0}
            onChange={v => update({ min_notice: v })}
            options={MIN_NOTICES}
            formatFn={v => v === 0 ? 'Сразу' : v >= 24 ? `${Math.floor(v / 24)} дн` : `${v} ч`} />
          <DesktopDropRow last label="На сколько вперёд" value={meeting.max_days_ahead || 30}
            onChange={v => update({ max_days_ahead: v })}
            options={MAX_DAYS} formatFn={v => `${v} дней`} />
        </div>
      </Group>
      <Group label="Слоты" tip="Шаг времени, который видит клиент при выборе, и сколько встреч можно проводить в день.">
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, overflow: 'hidden',
        }}>
          <DesktopDropRow label="Шаг слотов" value={meeting.step_minutes || 30}
            onChange={v => update({ step_minutes: v })}
            options={STEP_MINUTES} formatFn={v => `${v} мин`} />
          <DesktopDropRow last label="Макс. встреч в день" value={meeting.max_per_day || 0}
            onChange={v => update({ max_per_day: v })}
            options={MAX_PER_DAY}
            formatFn={v => v === 0 ? 'Без лимита' : `${v}`} />
        </div>
      </Group>
    </>
  )
}

// ============ PAYMENTS SECTION ============

const PaymentsSection = ({ meeting, update, userPayments }) => {
  // Пока настройки не загружены
  if (!userPayments) {
    return (
      <div style={{
        padding: '60px 20px', textAlign: 'center',
        color: C.muted, fontSize: 14,
      }}>
        Загружаю…
      </div>
    )
  }

  // Список включённых в Настройках способов (ключ + label)
  const enabledGlobal = PAYMENT_METHODS.filter(m => userPayments[m.key])
  // Свой способ
  const hasOther = !!userPayments.payment_other
  const otherLabel = userPayments.payment_other || ''

  // Полный список доступных в этой услуге = глобальные + 'other' если задан
  const availableList = [
    ...enabledGlobal,
    ...(hasOther ? [{ key: 'payment_other', label: otherLabel }] : [])
  ]

  // === Состояние 1: в настройках ничего не включено ===
  if (availableList.length === 0) {
    return (
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '40px 24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>
          Способы оплаты пока не настроены
        </div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 20 }}>
          Добавь способы оплаты в разделе «Настройки → Оплата»,<br />
          и они появятся здесь.
        </div>
        <a
          href="/settings?section=payments"
          style={{
            display: 'inline-block',
            background: C.text, color: '#fff',
            padding: '10px 20px', borderRadius: 8,
            fontSize: 13, fontWeight: 600,
            textDecoration: 'none',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Открыть настройки оплаты
        </a>
      </div>
    )
  }

  // === Режим: array → индивидуально, null/undefined → по умолчанию ===
  const isIndividual = Array.isArray(meeting.enabled_payments)
  const selected = isIndividual ? meeting.enabled_payments : []

  const setMode = (mode) => {
    if (mode === 'default' && isIndividual) {
      update({ enabled_payments: null })
    } else if (mode === 'individual' && !isIndividual) {
      // Переходя в индивидуальный — копируем глобальные как стартовое
      const initial = availableList.map(m => m.key)
      update({ enabled_payments: initial })
    }
  }

  const toggleMethod = (key) => {
    const next = selected.includes(key)
      ? selected.filter(k => k !== key)
      : [...selected, key]
    update({ enabled_payments: next })
  }

  // Список включённых способов больше не показываем в подписи —
  // используем фиксированный текст как в мокапе

  return (
    <>
      {/* 2 режима */}
      <Group>
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, overflow: 'hidden',
        }}>
          <Row
            onClick={() => setMode('default')}
            left={
              <div>
                <div style={{ fontSize: 15, color: C.text, marginBottom: 2 }}>По умолчанию</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>Использовать все способы из настроек</div>
              </div>
            }
            right={<Toggle on={!isIndividual} onClick={() => setMode('default')} />}
          />
          <Row
            last
            onClick={() => setMode('individual')}
            left={
              <div>
                <div style={{ fontSize: 15, color: C.text, marginBottom: 2 }}>Индивидуально для услуги</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>Выбрать способы для этой услуги</div>
              </div>
            }
            right={<Toggle on={isIndividual} onClick={() => setMode('individual')} />}
          />
        </div>
      </Group>

      {/* Чекбоксы способов появляются только если режим "индивидуально" */}
      {isIndividual && (
        <Group>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, overflow: 'hidden',
          }}>
            {availableList.map((m, i) => (
              <Row
                key={m.key}
                last={i === availableList.length - 1}
                onClick={() => toggleMethod(m.key)}
                left={m.label}
                right={
                  <Toggle
                    on={selected.includes(m.key)}
                    onClick={() => toggleMethod(m.key)}
                  />
                }
              />
            ))}
          </div>
        </Group>
      )}
    </>
  )
}

const ConfirmationSection = ({ meeting, update }) => {
  const [localCancel, setLocalCancel] = useState(meeting.cancellation_policy || '')
  useEffect(() => { setLocalCancel(meeting.cancellation_policy || '') }, [meeting.cancellation_policy])

  return (
    <>
      <Group label="Запрос на запись">
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, overflow: 'hidden',
        }}>
          <Row last
            left="Подтверждать вручную"
            right={
              <Toggle
                on={meeting.require_confirm}
                onClick={() => update({ require_confirm: !meeting.require_confirm })}
              />
            }
          />
        </div>
      </Group>
      <Group label="Отмена">
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 14px' }}>
            <textarea
              value={localCancel}
              onChange={e => setLocalCancel(e.target.value)}
              onBlur={() => {
                if (localCancel !== (meeting.cancellation_policy || '')) {
                  update({ cancellation_policy: localCancel })
                }
              }}
              placeholder="Например: отмена бесплатно за 24 часа"
              style={{
                width: '100%', border: 'none', outline: 'none', resize: 'vertical',
                minHeight: 60, fontSize: 14, fontFamily: 'Inter, sans-serif',
                background: 'transparent', color: C.text,
              }}
            />
          </div>
        </div>
      </Group>
    </>
  )
}

const ExtraSection = () => (
  <div style={{
    padding: '60px 20px', textAlign: 'center',
  }}>
    <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.6 }}>
      Здесь появятся дополнительные настройки
    </div>
  </div>
)