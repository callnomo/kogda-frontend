import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

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

const DAY_VALUES = [1, 7, 14, 30, 60, 90, 180, 365]
const COUNT_VALUES = Array.from({ length: 21 }, (_, i) => i) // 0..20

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
  wheelFade2: '#d8d8d8',
  wheelFade1: '#a0a0a0',
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

const Group = ({ label, children, style }) => (
  <div style={{ marginBottom: 18, ...style }}>
    {label && (
      <div style={{
        fontSize: 11, fontWeight: 500, color: C.muted,
        letterSpacing: 0.5, textTransform: 'uppercase',
        marginBottom: 6, padding: '0 4px',
      }}>{label}</div>
    )}
    <div>{children}</div>
  </div>
)

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

// ============ WHEEL CORE ============

const ITEM_H = 36
const VISIBLE = 5 // строк сверху/снизу от центра (для высоты колеса 5*2+1 = но используем 5 строк всего видно)
const VISIBLE_HEIGHT_ROWS = 5 // итоговая высота колеса 5 строк

const Wheel = ({ values, value, onChange, format, width = 60 }) => {
  const ref = useRef(null)
  const lastSentRef = useRef(value)
  const scrollEndTimer = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    const idx = values.indexOf(value)
    if (idx >= 0) {
      ref.current.scrollTop = idx * ITEM_H
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleScroll = () => {
    if (!ref.current) return
    clearTimeout(scrollEndTimer.current)
    scrollEndTimer.current = setTimeout(() => {
      if (!ref.current) return
      const idx = Math.round(ref.current.scrollTop / ITEM_H)
      const clampedIdx = Math.max(0, Math.min(values.length - 1, idx))
      const next = values[clampedIdx]
      ref.current.scrollTo({ top: clampedIdx * ITEM_H, behavior: 'smooth' })
      if (next !== lastSentRef.current) {
        lastSentRef.current = next
        onChange(next)
      }
    }, 130)
  }

  const padCount = Math.floor(VISIBLE_HEIGHT_ROWS / 2)

  return (
    <div style={{ position: 'relative', height: ITEM_H * VISIBLE_HEIGHT_ROWS, minWidth: width }}>
      <div
        ref={ref}
        onScroll={handleScroll}
        className="kogda-wheel-scroll"
        style={{
          height: '100%', overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}
      >
        <style>{`.kogda-wheel-scroll::-webkit-scrollbar{display:none}`}</style>
        <div style={{ height: ITEM_H * padCount }} />
        {values.map((v) => {
          const active = v === value
          return (
            <div key={v} style={{
              height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: active ? 700 : 400,
              color: active ? C.text : C.muted,
              scrollSnapAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {format ? format(v) : v}
            </div>
          )
        })}
        <div style={{ height: ITEM_H * padCount }} />
      </div>
    </div>
  )
}

// Общая обёртка раскрывающегося поля
const RollerField = ({ open, setOpen, label, preview, children }) => {
  const borderColor = open ? C.lime : C.border
  const borderWidth = open ? 1.5 : 1

  return (
    <div style={{
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
const formatMinNotice = (minutes) => minutes === 0 ? 'Сразу' : formatDuration(minutes)
const formatStep = (minutes) => formatDuration(minutes) // 0 здесь не бывает
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

// ============ ROLLER TYPES ============

const HOURS_FULL = Array.from({ length: 25 }, (_, i) => i)  // 0..24
const HOURS_SHORT = Array.from({ length: 13 }, (_, i) => i) // 0..12 — для буферов
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5) // 0,5,...,55

// Тип 1: ч + мин
// minHours/maxHours — диапазон часов
// minTotal — минимально допустимое значение в минутах (для шага слотов = 5)
const HourMinRoller = ({ open, setOpen, label, value, onChange, hoursRange = HOURS_FULL, minTotal = 0, preview }) => {
  const initH = Math.floor(value / 60)
  const initM = value % 60
  const initMSnap = Math.round(initM / 5) * 5
  const [h, setH] = useState(initH)
  const [m, setM] = useState(initMSnap > 55 ? 0 : initMSnap)

  useEffect(() => {
    if (!open) return
    let total = h * 60 + m
    if (total < minTotal) total = minTotal
    if (total !== value) onChange(total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h, m])

  // Когда value снаружи изменилось — обновим колёса
  useEffect(() => {
    setH(Math.floor(value / 60))
    const mm = value % 60
    setM(Math.round(mm / 5) * 5 > 55 ? 0 : Math.round(mm / 5) * 5)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <RollerField open={open} setOpen={setOpen} label={label} preview={preview}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <Wheel values={hoursRange} value={h} onChange={setH} width={50} />
        <div style={{ fontSize: 13, color: C.muted, padding: '0 6px', zIndex: 1 }}>ч</div>
        <Wheel values={MINUTES} value={m} onChange={setM}
          format={v => String(v).padStart(2, '0')} width={50} />
        <div style={{ fontSize: 13, color: C.muted, padding: '0 6px', zIndex: 1 }}>мин</div>
      </div>
    </RollerField>
  )
}

// Тип 2: дни (одно колесо)
const DaysRoller = ({ open, setOpen, label, value, onChange, preview }) => {
  return (
    <RollerField open={open} setOpen={setOpen} label={label} preview={preview}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <Wheel values={DAY_VALUES} value={value} onChange={onChange} width={70} />
        <div style={{ fontSize: 13, color: C.muted, padding: '0 6px', zIndex: 1 }}>дней</div>
      </div>
    </RollerField>
  )
}

// Тип 3: число
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

// Тип 0: длительность (как было)
const DurationField = ({ value, onChange }) => {
  const [open, setOpen] = useState(false)
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

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
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
    payments: paymentsPreview(meeting),
    confirmation: meeting.require_confirm ? 'Вручную' : 'Автоматически',
    extra: '—',
  }

  const renderSection = () => {
    switch (section) {
      case 'basic': return <BasicSection meeting={meeting} update={update} />
      case 'price': return <PriceSection meeting={meeting} update={update} />
      case 'location': return <LocationSection meeting={meeting} update={update} />
      case 'availability': return <AvailabilitySection meeting={meeting} update={update} />
      case 'payments': return <PaymentsSection meeting={meeting} update={update} />
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
    case 'amount': return m.price > 0 ? `${Number(m.price).toLocaleString('ru-RU')} ₽` : '—'
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

function paymentsPreview(m) {
  const ep = m.enabled_payments
  if (!ep) return 'Все из настроек'
  if (Array.isArray(ep) && ep.length > 0) return `${ep.length} включено`
  return 'Не настроены'
}

const BasicSection = ({ meeting, update }) => {
  const [localTitle, setLocalTitle] = useState(meeting.title)
  const [localDesc, setLocalDesc] = useState(meeting.description || '')

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
        <DurationField
          value={meeting.duration}
          onChange={(total) => update({ duration: total })}
        />
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
        <Field label="Сумма (₽)">
          <input
            type="number"
            value={localPrice}
            onChange={e => setLocalPrice(e.target.value)}
            onBlur={() => {
              const num = Number(localPrice) || 0
              if (num !== Number(meeting.price)) update({ price: num })
            }}
            min={0}
            style={{ ...inputStyle, MozAppearance: 'textfield' }}
          />
        </Field>
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

const AvailabilitySection = ({ meeting, update }) => {
  // Одно поле открыто за раз — отслеживаем какое
  const [openKey, setOpenKey] = useState(null)
  const makeSetOpen = (key) => (next) => {
    setOpenKey(prev => {
      const isOpen = prev === key
      // next может быть функцией (setOpen(o => !o)) или булевым
      const wantOpen = typeof next === 'function' ? next(isOpen) : next
      return wantOpen ? key : null
    })
  }

  return (
    <>
      <Group label="Буферы">
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

      <Group label="Окно записи">
        <HourMinRoller
          open={openKey === 'min_notice'}
          setOpen={makeSetOpen('min_notice')}
          label="Минимум до записи"
          value={(meeting.min_notice || 0) * 60} // min_notice в БД в часах → переводим в минуты для UI
          onChange={v => update({ min_notice: Math.floor(v / 60) })} // обратно в часы
          hoursRange={HOURS_FULL}
          preview={formatMinNotice((meeting.min_notice || 0) * 60)}
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

      <Group label="Слоты">
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

const PaymentsSection = ({ meeting, update }) => (
  <div style={{
    padding: '60px 20px', textAlign: 'center',
    background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
  }}>
    <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>
      Сначала включи способы оплаты в&nbsp;
      <a href="/settings?tab=payments" style={{ color: C.text, textDecoration: 'underline' }}>
        Настройках → Оплата
      </a>
    </div>
    <div style={{ fontSize: 13, color: C.mutedLight }}>
      Здесь появятся способы которые ты включил
    </div>
  </div>
)

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