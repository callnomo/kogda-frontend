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

const BUFFERS = [0, 5, 10, 15, 20, 30, 45, 60]
const MIN_NOTICES = [0, 1, 2, 4, 8, 12, 24, 48, 72]
const MAX_DAYS = [7, 14, 30, 60, 90, 180, 365]
const MAX_PER_DAY = [0, 1, 2, 3, 4, 5, 6, 8, 10]
const STEP_MINUTES = [5, 10, 15, 20, 30, 45, 60]

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
  fieldBorder: '#E0E0D8',
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
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, overflow: 'hidden',
    }}>{children}</div>
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

// ============ DURATION INLINE PICKER ============

const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

const HOURS = Array.from({ length: 25 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

const ITEM_H = 36

const Wheel = ({ values, value, onChange, format }) => {
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
    // Debounce: ждём конца прокрутки, потом отдаём значение
    clearTimeout(scrollEndTimer.current)
    scrollEndTimer.current = setTimeout(() => {
      if (!ref.current) return
      const idx = Math.round(ref.current.scrollTop / ITEM_H)
      const clampedIdx = Math.max(0, Math.min(values.length - 1, idx))
      const next = values[clampedIdx]
      // Подравниваем визуально к snap-позиции
      ref.current.scrollTo({ top: clampedIdx * ITEM_H, behavior: 'smooth' })
      if (next !== lastSentRef.current) {
        lastSentRef.current = next
        onChange(next)
      }
    }, 120)
  }

  return (
    <div style={{ position: 'relative', height: ITEM_H * 5, flex: 1 }}>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: ITEM_H * 2,
        height: ITEM_H, background: C.fieldBg, borderRadius: 8,
        pointerEvents: 'none',
      }} />

      <div
        ref={ref}
        onScroll={handleScroll}
        className="kogda-wheel-scroll"
        style={{
          height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}
      >
        <style>{`.kogda-wheel-scroll::-webkit-scrollbar{display:none}`}</style>

        <div style={{ height: ITEM_H * 2 }} />
        {values.map((v) => (
          <div key={v} style={{
            height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: v === value ? 700 : 400,
            color: v === value ? C.text : C.muted,
            scrollSnapAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {format ? format(v) : v}
          </div>
        ))}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  )
}

const DurationField = ({ value, onChange }) => {
  const [open, setOpen] = useState(false)
  const initH = Math.floor(value / 60)
  const initM = value % 60
  const initMSnap = Math.round(initM / 5) * 5
  const [h, setH] = useState(initH)
  const [m, setM] = useState(initMSnap > 55 ? 0 : initMSnap)

  // Сохраняем при изменении любого из колёс
  useEffect(() => {
    if (!open) return
    const total = h * 60 + m
    if (total >= 5 && total !== value) {
      onChange(total)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h, m])

  const borderColor = open ? C.lime : C.border
  const borderWidth = open ? 1.5 : 1

  return (
    <div style={{
      background: C.card,
      border: `${borderWidth}px solid ${borderColor}`,
      borderRadius: 10,
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '10px 14px',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontWeight: open ? 500 : 400,
        }}
      >
        <span>{formatDuration(value)}</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={C.muted} strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Wheel values={HOURS} value={h} onChange={setH} />
            <div style={{ fontSize: 13, color: C.muted, padding: '0 4px' }}>ч</div>
            <Wheel values={MINUTES} value={m} onChange={setM}
              format={v => String(v).padStart(2, '0')} />
            <div style={{ fontSize: 13, color: C.muted, padding: '0 4px' }}>мин</div>
          </div>
        </div>
      )}
    </div>
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

  // Mobile
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

  // Desktop
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
  if (m.buffer_before > 0 || m.buffer_after > 0) return `Буфер ${m.buffer_after || m.buffer_before} мин`
  return `Шаг ${m.step_minutes} мин`
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
  </Group>
)

const AvailabilitySection = ({ meeting, update }) => {
  const DropRow = ({ label, value, onChange, options, formatFn, last }) => (
    <Row
      last={last}
      left={label}
      gap={8}
      right={
        <select
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            border: 'none', background: 'transparent', color: C.muted,
            fontSize: 15, cursor: 'pointer', appearance: 'none',
            textAlign: 'right', paddingRight: 18, fontFamily: 'Inter, sans-serif',
            backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23C8C7BF\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'9,18 15,12 9,6\'/></svg>")',
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right center',
          }}
        >
          {options.map(o => <option key={o} value={o}>{formatFn(o)}</option>)}
        </select>
      }
    />
  )

  return (
    <>
      <Group label="Буферы">
        <DropRow label="До встречи" value={meeting.buffer_before}
          onChange={v => update({ buffer_before: v })}
          options={BUFFERS} formatFn={v => v === 0 ? 'Нет' : `${v} мин`} />
        <DropRow last label="После встречи" value={meeting.buffer_after}
          onChange={v => update({ buffer_after: v })}
          options={BUFFERS} formatFn={v => v === 0 ? 'Нет' : `${v} мин`} />
      </Group>
      <Group label="Окно записи">
        <DropRow label="Минимум до записи" value={meeting.min_notice}
          onChange={v => update({ min_notice: v })}
          options={MIN_NOTICES}
          formatFn={v => v === 0 ? 'Сразу' : v >= 24 ? `${Math.floor(v / 24)} дн` : `${v} ч`} />
        <DropRow last label="На сколько вперёд" value={meeting.max_days_ahead}
          onChange={v => update({ max_days_ahead: v })}
          options={MAX_DAYS} formatFn={v => `${v} дней`} />
      </Group>
      <Group label="Слоты">
        <DropRow label="Шаг слотов" value={meeting.step_minutes}
          onChange={v => update({ step_minutes: v })}
          options={STEP_MINUTES} formatFn={v => `${v} мин`} />
        <DropRow last label="Макс. встреч в день" value={meeting.max_per_day}
          onChange={v => update({ max_per_day: v })}
          options={MAX_PER_DAY}
          formatFn={v => v === 0 ? 'Без лимита' : `${v}`} />
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
        <Row last
          left="Подтверждать вручную"
          right={
            <Toggle
              on={meeting.require_confirm}
              onClick={() => update({ require_confirm: !meeting.require_confirm })}
            />
          }
        />
      </Group>
      <Group label="Отмена">
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