import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { getCurrencySymbol, getCurrencyLabel, getCurrencyName, findCurrency } from '../currencies'

const API = process.env.REACT_APP_API_URL || 'https://kogda-backend-production.up.railway.app'

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
const DAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
const DAYS_FULL = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота']

const NOTES_MAX = 200
const PREFS_TTL = 30 * 24 * 60 * 60 * 1000 // 30 дней

// Полный список IANA timezone для дропдауна. Сгруппирован по регионам.
const TIMEZONE_GROUPS = [
  {
    label: 'СНГ',
    zones: [
      'Europe/Moscow', 'Europe/Kaliningrad', 'Asia/Yekaterinburg', 'Asia/Novosibirsk',
      'Asia/Krasnoyarsk', 'Asia/Irkutsk', 'Asia/Yakutsk', 'Asia/Vladivostok',
      'Europe/Kyiv', 'Europe/Minsk', 'Europe/Chisinau',
      'Asia/Almaty', 'Asia/Bishkek', 'Asia/Tashkent', 'Asia/Dushanbe', 'Asia/Ashgabat',
      'Asia/Yerevan', 'Asia/Tbilisi', 'Asia/Baku',
    ],
  },
  {
    label: 'Европа',
    zones: [
      'Europe/London', 'Europe/Dublin', 'Europe/Lisbon',
      'Europe/Paris', 'Europe/Berlin', 'Europe/Amsterdam', 'Europe/Brussels',
      'Europe/Madrid', 'Europe/Rome', 'Europe/Vienna', 'Europe/Zurich',
      'Europe/Warsaw', 'Europe/Prague', 'Europe/Budapest', 'Europe/Bucharest',
      'Europe/Stockholm', 'Europe/Oslo', 'Europe/Copenhagen', 'Europe/Helsinki',
      'Europe/Athens', 'Europe/Istanbul',
    ],
  },
  {
    label: 'Азия и Ближний Восток',
    zones: [
      'Asia/Dubai', 'Asia/Jerusalem', 'Asia/Riyadh', 'Asia/Tehran',
      'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Bangkok',
      'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul',
      'Asia/Jakarta', 'Asia/Manila', 'Asia/Kuala_Lumpur',
    ],
  },
  {
    label: 'Америка',
    zones: [
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'America/Toronto', 'America/Mexico_City', 'America/Sao_Paulo',
      'America/Argentina/Buenos_Aires', 'America/Bogota', 'America/Lima', 'America/Santiago',
    ],
  },
  {
    label: 'Океания и Африка',
    zones: [
      'Australia/Sydney', 'Australia/Perth', 'Pacific/Auckland',
      'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
    ],
  },
  {
    label: 'Другое',
    zones: ['UTC'],
  },
]

// Получить offset вида "UTC+3" для текущей даты
function getTzOffset(tz) {
  try {
    const date = new Date()
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }))
    const offsetMinutes = (tzDate - utcDate) / (1000 * 60)
    const sign = offsetMinutes >= 0 ? '+' : '-'
    const hours = Math.floor(Math.abs(offsetMinutes) / 60)
    const minutes = Math.abs(offsetMinutes) % 60
    return minutes === 0 ? `UTC${sign}${hours}` : `UTC${sign}${hours}:${String(minutes).padStart(2,'0')}`
  } catch { return '' }
}

// Локализованное имя timezone: "Москва" вместо "Europe/Moscow"
function formatTzName(tz) {
  const map = {
    'Europe/Moscow': 'Москва', 'Europe/Kaliningrad': 'Калининград',
    'Asia/Yekaterinburg': 'Екатеринбург', 'Asia/Novosibirsk': 'Новосибирск',
    'Asia/Krasnoyarsk': 'Красноярск', 'Asia/Irkutsk': 'Иркутск',
    'Asia/Yakutsk': 'Якутск', 'Asia/Vladivostok': 'Владивосток',
    'Europe/Kyiv': 'Киев', 'Europe/Minsk': 'Минск', 'Europe/Chisinau': 'Кишинёв',
    'Asia/Almaty': 'Алматы', 'Asia/Bishkek': 'Бишкек', 'Asia/Tashkent': 'Ташкент',
    'Asia/Dushanbe': 'Душанбе', 'Asia/Ashgabat': 'Ашхабад',
    'Asia/Yerevan': 'Ереван', 'Asia/Tbilisi': 'Тбилиси', 'Asia/Baku': 'Баку',
    'Europe/London': 'Лондон', 'Europe/Dublin': 'Дублин', 'Europe/Lisbon': 'Лиссабон',
    'Europe/Paris': 'Париж', 'Europe/Berlin': 'Берлин', 'Europe/Amsterdam': 'Амстердам',
    'Europe/Brussels': 'Брюссель', 'Europe/Madrid': 'Мадрид', 'Europe/Rome': 'Рим',
    'Europe/Vienna': 'Вена', 'Europe/Zurich': 'Цюрих', 'Europe/Warsaw': 'Варшава',
    'Europe/Prague': 'Прага', 'Europe/Budapest': 'Будапешт', 'Europe/Bucharest': 'Бухарест',
    'Europe/Stockholm': 'Стокгольм', 'Europe/Oslo': 'Осло', 'Europe/Copenhagen': 'Копенгаген',
    'Europe/Helsinki': 'Хельсинки', 'Europe/Athens': 'Афины', 'Europe/Istanbul': 'Стамбул',
    'Asia/Dubai': 'Дубай', 'Asia/Jerusalem': 'Иерусалим', 'Asia/Riyadh': 'Эр-Рияд',
    'Asia/Tehran': 'Тегеран', 'Asia/Karachi': 'Карачи', 'Asia/Kolkata': 'Дели',
    'Asia/Dhaka': 'Дакка', 'Asia/Bangkok': 'Бангкок', 'Asia/Singapore': 'Сингапур',
    'Asia/Hong_Kong': 'Гонконг', 'Asia/Shanghai': 'Шанхай', 'Asia/Tokyo': 'Токио',
    'Asia/Seoul': 'Сеул', 'Asia/Jakarta': 'Джакарта', 'Asia/Manila': 'Манила',
    'Asia/Kuala_Lumpur': 'Куала-Лумпур',
    'America/New_York': 'Нью-Йорк', 'America/Chicago': 'Чикаго',
    'America/Denver': 'Денвер', 'America/Los_Angeles': 'Лос-Анджелес',
    'America/Toronto': 'Торонто', 'America/Mexico_City': 'Мехико',
    'America/Sao_Paulo': 'Сан-Паулу', 'America/Argentina/Buenos_Aires': 'Буэнос-Айрес',
    'America/Bogota': 'Богота', 'America/Lima': 'Лима', 'America/Santiago': 'Сантьяго',
    'Australia/Sydney': 'Сидней', 'Australia/Perth': 'Перт', 'Pacific/Auckland': 'Окленд',
    'Africa/Cairo': 'Каир', 'Africa/Johannesburg': 'Йоханнесбург',
    'Africa/Lagos': 'Лагос', 'Africa/Nairobi': 'Найроби',
    'UTC': 'UTC',
  }
  return map[tz] || tz
}

// Форматирует цену с символом валюты услуги
function formatPrice(m) {
  if (!m) return null
  if (m.price_mode === 'hidden') return null
  if (m.hide_price === true) return null
  if (m.price_mode === 'free') return 'Бесплатно'
  if (m.price_mode === 'on_request') return 'По запросу'
  if (!(m.price > 0)) return 'Бесплатно'
  const symbol = getCurrencySymbol(m.currency || 'USD')
  return `${Number(m.price).toLocaleString('ru-RU')} ${symbol}`
}

function formatLocation(m) {
  if (!m) return { icon: '📹', label: 'Видеозвонок' }
  switch (m.location_type) {
    case 'phone': return { icon: '📞', label: 'Телефон' }
    case 'in_person': return { icon: '📍', label: 'Лично' }
    case 'video':
    default: return { icon: '📹', label: 'Видеозвонок' }
  }
}

// ============================================================================
// Соцсети: маппинг иконок (simpleicons CDN, как в Профиле — единообразие)
// ============================================================================
const SOCIAL_ICONS = {
  telegram:  'https://cdn.simpleicons.org/telegram/229ED9',
  instagram: 'https://cdn.simpleicons.org/instagram/E4405F',
  x:         'https://cdn.simpleicons.org/x/000000',
  vk:        'https://cdn.simpleicons.org/vk/0077FF',
  tiktok:    'https://cdn.simpleicons.org/tiktok/000000',
  youtube:   'https://cdn.simpleicons.org/youtube/FF0000',
  facebook:  'https://cdn.simpleicons.org/facebook/0866FF',
}

function SocialLinks({ socials }) {
  const list = Array.isArray(socials)
    ? socials.filter(s => s && s.url && String(s.url).trim())
    : []
  if (list.length === 0) return null
  return (
    <div style={{
      display: 'flex', gap: 10, flexWrap: 'wrap',
      justifyContent: 'center', marginTop: 14,
    }}>
      {list.map((s, i) => {
        const icon = SOCIAL_ICONS[s.type]
        return (
          <a
            key={i}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            title={s.type}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: '#fff', border: '1px solid #E8E7E0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', flexShrink: 0,
            }}
          >
            {icon ? (
              <img src={icon} alt={s.type}
                style={{ width: 18, height: 18, objectFit: 'contain', display: 'block' }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            )}
          </a>
        )
      })}
    </div>
  )
}

// ============================================================================
// Onboarding модалка: уточняем timezone + валюту перед показом услуг
// ============================================================================
function OnboardingModal({
  initialTimezone, initialCurrency, availableCurrencies, onConfirm,
}) {
  const [tz, setTz] = useState(initialTimezone)
  const [currency, setCurrency] = useState(initialCurrency)
  const [tzOpen, setTzOpen] = useState(false)

  const showCurrencyBlock = availableCurrencies && availableCurrencies.length > 1

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 32,
        maxWidth: 420, width: '100%', maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            Уточни данные
          </div>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>
            Чтобы показать правильные цены и время
          </div>
        </div>

        {/* Timezone */}
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#999',
            textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8,
          }}>Часовой пояс</div>

          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setTzOpen(o => !o)}
              style={{
                background: '#F7F6F1', border: '1.5px solid #E8E7E0',
                borderRadius: 12, padding: '13px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer', userSelect: 'none',
              }}
            >
              <span style={{ fontSize: 14 }}>
                {formatTzName(tz)} ({getTzOffset(tz)})
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"
                style={{ transform: tzOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </div>
            {tzOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                background: '#fff', border: '1px solid #E8E7E0', borderRadius: 12,
                boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                maxHeight: 320, overflowY: 'auto', zIndex: 10,
              }}>
                {TIMEZONE_GROUPS.map((group, gi) => (
                  <div key={group.label}>
                    <div style={{
                      padding: '8px 14px 4px', fontSize: 10, fontWeight: 700,
                      color: '#999', textTransform: 'uppercase', letterSpacing: 1,
                      background: '#FAF9F3',
                    }}>{group.label}</div>
                    {group.zones.map((zone, i) => (
                      <div
                        key={zone}
                        onClick={() => { setTz(zone); setTzOpen(false) }}
                        style={{
                          padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                          background: tz === zone ? '#FAF9F3' : '#fff',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          borderBottom: i === group.zones.length - 1 ? 'none' : '1px solid #F0EFE9',
                        }}
                      >
                        <span>{formatTzName(zone)}</span>
                        <span style={{ fontSize: 11, color: '#aaa' }}>{getTzOffset(zone)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>
            Определили автоматически
          </div>
        </div>

        {/* Валюта — только если у коуча >1 валюты */}
        {showCurrencyBlock && (
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#999',
              textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8,
            }}>Валюта</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {availableCurrencies.map(code => {
                const c = findCurrency(code)
                const active = currency === code
                return (
                  <div
                    key={code}
                    onClick={() => setCurrency(code)}
                    style={{
                      background: '#fff',
                      border: `1.5px solid ${active ? '#111' : '#E8E7E0'}`,
                      borderRadius: 12, padding: '12px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      cursor: 'pointer', userSelect: 'none',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 9,
                      border: `2px solid ${active ? '#111' : '#ccc'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {active && <div style={{ width: 9, height: 9, borderRadius: 5, background: '#111' }}/>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {c ? c.label : code}
                      </div>
                      {c && (
                        <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
                          {c.name}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>
              Выбрали по вашей стране
            </div>
          </div>
        )}

        <button
          onClick={() => onConfirm({ timezone: tz, currency })}
          style={{
            width: '100%', background: '#E8FF47', color: '#111',
            border: 'none', padding: 14, borderRadius: 12,
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Подтвердить
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// BookingPage
// ============================================================================
export default function BookingPage() {
  const { slug, serviceSlug } = useParams()

  const [profile, setProfile] = useState(null)
  const [meetings, setMeetings] = useState([])
  const [allMeetings, setAllMeetings] = useState([]) // оригинальный список до фильтра
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', email: '', notes: '' })
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  // Ошибка бронирования. type: 'slot_taken' (время заняли) | 'generic' (прочее)
  const [bookingError, setBookingError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  // Prefs клиента: timezone + currency. Запоминаются в localStorage на 30 дней.
  const [prefs, setPrefs] = useState(null) // { timezone, currency }
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Уникальные валюты из услуг коуча (для опросника)
  const availableCurrencies = useMemo(() => {
    const set = new Set()
    for (const m of allMeetings) {
      if (m.currency) set.add(m.currency)
    }
    return Array.from(set)
  }, [allMeetings])

  // Загружаем prefs из localStorage при монтировании
  useEffect(() => {
    if (!slug) return
    try {
      const raw = localStorage.getItem(`kogda_prefs_${slug}`)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed && parsed.expires > Date.now()) {
        setPrefs({ timezone: parsed.timezone, currency: parsed.currency })
      }
    } catch {}
  }, [slug])

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    try {
      if (serviceSlug) {
        // Прямая ссылка на услугу: опросник не нужен (юзер уже выбрал)
        const res = await axios.get(`${API}/meetings/public/${slug}/${serviceSlug}`)
        setProfile(res.data.user)
        setAllMeetings([res.data.meeting])
        setMeetings([res.data.meeting])
        setSelectedMeeting(res.data.meeting)
        setStep(2)

        // Если нет prefs — устанавливаем по client_geo (без модалки)
        if (!prefs) {
          const tz = res.data.client_geo?.timezone ||
            Intl.DateTimeFormat().resolvedOptions().timeZone
          setPrefs({
            timezone: tz,
            currency: res.data.meeting.currency || res.data.client_geo?.currency || 'USD',
          })
        }
      } else {
        const res = await axios.get(`${API}/meetings/public/${slug}`)
        setProfile(res.data.user)
        setAllMeetings(res.data.meetings)
        // Если prefs уже есть в localStorage — применяем фильтр
        // Если нет — показываем onboarding
        if (!prefs) {
          // Авто-определение timezone от Cloudflare или браузера
          const autoTimezone = res.data.client_geo?.timezone ||
            Intl.DateTimeFormat().resolvedOptions().timeZone

          // Авто-определение валюты: страна клиента → если есть у коуча → берём её,
          // иначе берём default_currency коуча
          const suggested = res.data.client_geo?.currency
          const userDefault = res.data.user?.default_currency
          const currencies = new Set(res.data.meetings.map(m => m.currency).filter(Boolean))

          let autoCurrency = 'USD'
          if (suggested && currencies.has(suggested)) {
            autoCurrency = suggested
          } else if (userDefault && currencies.has(userDefault)) {
            autoCurrency = userDefault
          } else if (currencies.size > 0) {
            autoCurrency = Array.from(currencies)[0]
          }

          // Показываем модалку если есть что выбрать (>1 валюты) ИЛИ если хотим
          // дать клиенту проверить timezone (всегда показываем модалку при первом заходе)
          setPrefs({ timezone: autoTimezone, currency: autoCurrency })
          setShowOnboarding(true)
          // Меетинги пока не применяем — после Подтверждения
          setMeetings(res.data.meetings)
        } else {
          // Prefs уже есть — применяем фильтр
          setMeetings(res.data.meetings)
        }
      }
    } catch (err) {
      setNotFound(true)
    }
    setLoading(false)
  }

  // После Подтверждения в опроснике — сохраняем prefs и закрываем модалку
  const handleOnboardingConfirm = (newPrefs) => {
    setPrefs(newPrefs)
    setShowOnboarding(false)
    try {
      localStorage.setItem(`kogda_prefs_${slug}`, JSON.stringify({
        timezone: newPrefs.timezone,
        currency: newPrefs.currency,
        expires: Date.now() + PREFS_TTL,
      }))
    } catch {}
  }

  // Фильтрация услуг по выбранной валюте.
  // Если у коуча >1 валюты — фильтруем. Если 1 валюта или 0 — показываем все.
  const filteredMeetings = useMemo(() => {
    if (!prefs || availableCurrencies.length <= 1) return meetings
    return meetings.filter(m => (m.currency || 'USD') === prefs.currency)
  }, [meetings, prefs, availableCurrencies])

  const loadSlots = async (date) => {
    try {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
      const meetingId = selectedMeeting?.id || ''
      const timezone = prefs?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      const res = await axios.get(`${API}/schedule/slots/${slug}?date=${dateStr}&meeting_type_id=${meetingId}&timezone=${encodeURIComponent(timezone)}`)
      setSlots(res.data.slots || [])
    } catch (err) { setSlots([]) }
  }

  const handleDateClick = async (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    if (date < new Date().setHours(0,0,0,0)) return
    setSelectedDate(date)
    setSelectedSlot(null)
    await loadSlots(date)
  }

  const handleNotesChange = (e) => {
    const value = e.target.value
    if (value.length <= NOTES_MAX) {
      setForm({...form, notes: value})
    }
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    setBookingError(null)
    setBookingLoading(true)
    try {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`
      const timezone = prefs?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      await axios.post(`${API}/bookings`, {
        meeting_type_id: selectedMeeting.id,
        client_name: form.name,
        client_email: form.email,
        notes: form.notes,
        date: dateStr,
        time: selectedSlot,
        timezone
      })
      setStep(4)
    } catch (err) {
      // Бэкенд при овербукинге шлёт 409 { error: 'slot_taken' }.
      // Это НЕ "сервер сломался" — время заняли пока клиент заполнял форму.
      // Клиенту нужно выбрать другое время, а не повторять то же.
      if (err.response?.status === 409 && err.response?.data?.error === 'slot_taken') {
        setBookingError({ type: 'slot_taken' })
      } else {
        setBookingError({ type: 'generic' })
      }
    }
    setBookingLoading(false)
  }

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
  const getFirstDay = (y, m) => { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1 }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: 15, color: '#aaa' }}>Загружаем...</div>
    </div>
  )

  if (notFound || !profile) return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>404</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Страница не найдена</div>
      </div>
    </div>
  )

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDay(year, month)
  const today = new Date()

  const inp = {
    width: '100%', padding: '13px 16px', borderRadius: 12,
    border: '1.5px solid #E8E7E0', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', background: '#fff'
  }

  const notesLength = form.notes.length
  const counterColor = notesLength >= NOTES_MAX ? '#DC2626' : notesLength >= 180 ? '#D97706' : '#aaa'

  const canGoBack = !serviceSlug

  // Маленькая полоска с timezone в шапке (для информации клиента)
  const TimezonePill = prefs?.timezone ? (
    <div
      onClick={() => setShowOnboarding(true)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 12, color: '#888', cursor: 'pointer',
        padding: '4px 10px', borderRadius: 999,
        background: '#F7F6F1', border: '1px solid #E8E7E0',
      }}
      title="Изменить часовой пояс и валюту"
    >
      <span>🕐</span>
      <span>{formatTzName(prefs.timezone)}</span>
    </div>
  ) : null

  const Sidebar = ({ showBack, onBack, backLabel }) => {
    const priceLabel = formatPrice(selectedMeeting)
    const location = formatLocation(selectedMeeting)

    return (
      <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #E8E7E0', height: 'fit-content' }}>
        {profile.avatar ? (
          <img src={profile.avatar} alt={profile.name}
            style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover', marginBottom: 12, display: 'block' }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 24, background: '#E8FF47', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, marginBottom: 12, color: '#111' }}>
            {profile.name.charAt(0)}
          </div>
        )}
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: profile.bio ? 4 : 16 }}>{profile.name}</div>
        {profile.bio && <div style={{ fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 1.5 }}>{profile.bio}</div>}
        {selectedMeeting && (
          <div style={{ background: '#F7F6F1', borderRadius: 12, padding: '14px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{selectedMeeting.title}</div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 3 }}>⏱ {selectedMeeting.duration} мин · {location.icon} {location.label}</div>
            {priceLabel && <div style={{ fontSize: 15, fontWeight: 800, marginTop: 6 }}>{priceLabel}</div>}
            {selectedDate && selectedSlot && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #E8E7E0' }}>
                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 3 }}>{DAYS_FULL[selectedDate.getDay()]}</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedDate.getDate()} {MONTHS_GEN[selectedDate.getMonth()]} · {selectedSlot}</div>
                {prefs?.timezone && (
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>
                    {formatTzName(prefs.timezone)} · {getTzOffset(prefs.timezone)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {showBack && (
          <button onClick={onBack} style={{ marginTop: 12, width: '100%', background: 'transparent', border: '1.5px solid #E8E7E0', padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#888' }}>
            ← {backLabel || 'Назад'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', fontFamily: 'Inter, sans-serif' }}>
      <div style={{
        background: '#fff', borderBottom: '1px solid #E8E7E0',
        padding: '16px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'Syne, sans-serif' }}>
          kog<span style={{ background: '#E8FF47', padding: '0 6px', borderRadius: 6 }}>DA</span>
        </h1>
        {TimezonePill}
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>

        {step < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
            {(serviceSlug ? ['Дата и время', 'Контакты'] : ['Тип встречи', 'Дата и время', 'Контакты']).map((s, i) => {
              const stepNumber = serviceSlug ? i + 2 : i + 1
              const totalSteps = serviceSlug ? 2 : 3
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: step > stepNumber ? '#22C55E' : step === stepNumber ? '#111' : '#E8E7E0', color: step >= stepNumber ? '#fff' : '#aaa' }}>
                      {step > stepNumber ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: step === stepNumber ? 700 : 400, color: step === stepNumber ? '#111' : '#aaa' }}>{s}</span>
                  </div>
                  {i < totalSteps - 1 && <div style={{ width: 36, height: 1, background: '#E8E7E0', margin: '0 8px' }} />}
                </div>
              )
            })}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            {/* Обложка + аватар внахлёст + имя + специализация + био + соцсети */}
            <div style={{
              background: '#fff', borderRadius: 20,
              border: '1px solid #E8E7E0', overflow: 'hidden',
              marginBottom: 28,
            }}>
              {/* Обложка (или градиент-заглушка) */}
              <div style={{
                height: 140,
                background: profile.cover
                  ? `center / cover no-repeat url("${profile.cover}")`
                  : 'linear-gradient(135deg, #2B2A28 0%, #4A4640 55%, #6E665A 100%)',
              }} />
              <div style={{ padding: '0 24px 24px', textAlign: 'center' }}>
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name}
                    style={{
                      width: 88, height: 88, borderRadius: 44, objectFit: 'cover',
                      border: '4px solid #fff', margin: '-44px auto 12px', display: 'block',
                      boxSizing: 'border-box', background: '#fff',
                    }} />
                ) : (
                  <div style={{
                    width: 88, height: 88, borderRadius: 44, background: '#E8FF47',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, fontWeight: 800, color: '#111',
                    border: '4px solid #fff', margin: '-44px auto 12px',
                    boxSizing: 'border-box',
                  }}>
                    {profile.name.charAt(0)}
                  </div>
                )}
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>{profile.name}</h2>
                {profile.headline && (
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#555', margin: '0 0 6px', lineHeight: 1.4 }}>
                    {profile.headline}
                  </p>
                )}
                {profile.bio && (
                  <p style={{ fontSize: 14, color: '#888', margin: 0, lineHeight: 1.5 }}>
                    {profile.bio}
                  </p>
                )}
                <SocialLinks socials={profile.socials} />
              </div>
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center', marginBottom: 14 }}>Выберите тип встречи</p>
            {filteredMeetings.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 20px',
                background: '#fff', borderRadius: 16, border: '1.5px solid #E8E7E0',
              }}>
                <div style={{ fontSize: 14, color: '#888', marginBottom: 12 }}>
                  В этой валюте услуг нет
                </div>
                <button
                  onClick={() => setShowOnboarding(true)}
                  style={{
                    background: '#111', color: '#fff', border: 'none',
                    padding: '10px 20px', borderRadius: 10,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Сменить валюту
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredMeetings.map(m => {
                  const priceLabel = formatPrice(m)
                  const location = formatLocation(m)

                  return (
                    <div key={m.id} onClick={() => { setSelectedMeeting(m); setStep(2) }}
                      style={{ background: '#fff', borderRadius: 16, padding: '18px 22px', border: '1.5px solid #E8E7E0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E7E0'; e.currentTarget.style.transform = 'translateY(0)' }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{m.title}</div>
                        {m.description && <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{m.description}</div>}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: '#888', background: '#F7F6F1', padding: '3px 10px', borderRadius: 20 }}>⏱ {m.duration} мин</span>
                          <span style={{ fontSize: 12, color: '#888', background: '#F7F6F1', padding: '3px 10px', borderRadius: 20 }}>{location.icon} {location.label}</span>
                          {priceLabel === 'Бесплатно' && (
                            <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 700, background: '#DCFCE7', padding: '3px 10px', borderRadius: 20 }}>Бесплатно</span>
                          )}
                          {priceLabel === 'По запросу' && (
                            <span style={{ fontSize: 12, color: '#888', fontWeight: 600, background: '#F7F6F1', padding: '3px 10px', borderRadius: 20 }}>По запросу</span>
                          )}
                          {priceLabel && priceLabel !== 'Бесплатно' && priceLabel !== 'По запросу' && (
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>{priceLabel}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ width: 30, height: 30, borderRadius: 15, background: '#F7F6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>→</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
            <Sidebar
              showBack={canGoBack}
              onBack={() => { setStep(1); setSelectedDate(null); setSelectedSlot(null); setSlots([]); setSelectedMeeting(null) }}
              backLabel="Назад"
            />
            <div style={{ background: '#fff', borderRadius: 20, padding: '28px', border: '1px solid #E8E7E0' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 22px' }}>Выберите дату и время</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 155px', gap: 24 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <button onClick={() => setCurrentDate(new Date(year, month-1, 1))} style={{ background: 'none', border: '1.5px solid #E8E7E0', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 15, color: '#888' }}>‹</button>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{MONTHS[month]} {year}</span>
                    <button onClick={() => setCurrentDate(new Date(year, month+1, 1))} style={{ background: 'none', border: '1.5px solid #E8E7E0', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 15, color: '#888' }}>›</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
                    {DAYS_SHORT.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#ccc', padding: '3px 0', textTransform: 'uppercase' }}>{d}</div>)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                    {Array(firstDay).fill(null).map((_,i) => <div key={i} />)}
                    {Array(daysInMonth).fill(null).map((_,i) => {
                      const day = i + 1
                      const date = new Date(year, month, day)
                      const isPast = date < new Date().setHours(0,0,0,0)
                      const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month
                      const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
                      return (
                        <div key={day} onClick={() => !isPast && handleDateClick(day)} style={{
                          textAlign: 'center', padding: '7px 2px', borderRadius: 8,
                          cursor: isPast ? 'default' : 'pointer',
                          background: isSelected ? '#111' : isToday ? '#E8FF47' : 'transparent',
                          color: isSelected ? '#fff' : isPast ? '#ddd' : '#111',
                          fontWeight: isSelected || isToday ? 700 : 400, fontSize: 13
                        }}>{day}</div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  {selectedDate ? (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {selectedDate.getDate()} {MONTHS_GEN[selectedDate.getMonth()]}
                      </div>
                      {slots.length === 0 ? (
                        <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '16px 0' }}>Нет времени</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {slots.map(slot => (
                            <div key={slot} onClick={() => setSelectedSlot(slot)} style={{
                              padding: '9px 6px', borderRadius: 9, textAlign: 'center',
                              border: `1.5px solid ${selectedSlot === slot ? '#111' : '#E8E7E0'}`,
                              background: selectedSlot === slot ? '#111' : '#fff',
                              color: selectedSlot === slot ? '#fff' : '#111',
                              cursor: 'pointer', fontSize: 14, fontWeight: 600
                            }}>{slot}</div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center', paddingTop: 16 }}>Выберите дату</div>
                  )}
                </div>
              </div>
              <button onClick={() => setStep(3)} disabled={!selectedDate || !selectedSlot}
                style={{ marginTop: 20, background: selectedDate && selectedSlot ? '#E8FF47' : '#E8E7E0', color: selectedDate && selectedSlot ? '#111' : '#aaa', border: 'none', padding: '13px 36px', borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: selectedDate && selectedSlot ? 'pointer' : 'default' }}>
                Далее →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
            <Sidebar showBack onBack={() => setStep(2)} backLabel="Изменить дату" />
            <div style={{ background: '#fff', borderRadius: 20, padding: '28px', border: '1px solid #E8E7E0' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 22px' }}>Ваши данные</h3>
              <form onSubmit={handleBooking}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>Имя и фамилия</label>
                  <input value={form.name} required onChange={e => setForm({...form, name: e.target.value})} placeholder="Анна Иванова" style={inp} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</label>
                  <input type="email" value={form.email} required onChange={e => setForm({...form, email: e.target.value})} placeholder="твой@email.com" style={inp} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>Комментарий <span style={{ color: '#aaa', fontWeight: 400, textTransform: 'none' }}>(необязательно)</span></label>
                  <textarea
                    value={form.notes}
                    onChange={handleNotesChange}
                    maxLength={NOTES_MAX}
                    placeholder="Расскажите с чем хотите поработать..."
                    style={{ ...inp, minHeight: 90, resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
                  />
                  <div style={{
                    fontSize: 12, color: counterColor, marginTop: 6, textAlign: 'right',
                    fontWeight: notesLength >= 180 ? 600 : 400
                  }}>
                    {notesLength} / {NOTES_MAX}
                  </div>
                </div>

                {/* Сообщение об ошибке бронирования — в стиле страницы, НЕ системный alert */}
                {bookingError && (
                  <div style={{
                    background: '#fff', border: '1.5px solid #E8E7E0',
                    borderRadius: 12, padding: '20px 18px', marginBottom: 16,
                    textAlign: 'center',
                  }}>
                    {bookingError.type === 'slot_taken' ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{
                            display: 'inline-flex', width: 20, height: 20, borderRadius: '50%',
                            background: '#E8FF47', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>
                            Слот уже занят
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5, marginBottom: 16 }}>
                          Пока вы заполняли форму, выбранное время стало недоступно. Выберите другое время, чтобы продолжить.
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setBookingError(null)
                            setSelectedSlot(null)
                            setStep(2)
                          }}
                          style={{
                            background: '#fff', color: '#111', border: '1.5px solid #E8E7E0',
                            padding: '10px 22px', borderRadius: 10,
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          Выбрать другое время
                        </button>
                      </>
                    ) : (
                      <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>
                        Не удалось забронировать встречу. Проверьте соединение и попробуйте ещё раз.
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" disabled={bookingLoading || !!bookingError} style={{ width: '100%', background: (bookingLoading || bookingError) ? '#E8E7E0' : '#E8FF47', color: (bookingLoading || bookingError) ? '#aaa' : '#111', border: 'none', padding: '15px', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: (bookingLoading || bookingError) ? 'default' : 'pointer' }}>
                  {bookingLoading ? 'Отправляем...' : selectedMeeting?.require_confirm ? 'Отправить запрос' : 'Подтвердить встречу'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (() => {
          const location = formatLocation(selectedMeeting)
          return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <div style={{ background: '#fff', borderRadius: 24, padding: '52px 44px', border: '1px solid #E8E7E0', textAlign: 'center', maxWidth: 440, width: '100%' }}>
              <div style={{ width: 68, height: 68, borderRadius: 34, background: '#E8FF47', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 20px' }}>✓</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>
                {selectedMeeting?.require_confirm ? 'Запрос отправлен!' : 'Встреча забронирована!'}
              </h2>
              <p style={{ fontSize: 14, color: '#888', margin: '0 0 22px', lineHeight: 1.5 }}>
                {selectedMeeting?.require_confirm ? 'Коуч получил запрос и скоро подтвердит. Письмо придёт на ' : 'Подтверждение отправлено на '}
                <strong style={{ color: '#111' }}>{form.email}</strong>
              </p>
              <div style={{ background: '#F7F6F1', borderRadius: 14, padding: '16px 18px', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span>📅</span><span style={{ fontSize: 13, fontWeight: 600 }}>{selectedMeeting?.title}</span></div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span>🗓</span><span style={{ fontSize: 13, color: '#555' }}>{selectedDate?.getDate()} {MONTHS_GEN[selectedDate?.getMonth()]} · {selectedSlot}</span></div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span>{location.icon}</span><span style={{ fontSize: 13, color: '#555' }}>{selectedMeeting?.require_confirm ? `${location.label} · ссылка придёт после подтверждения` : `${location.label} · детали придут на email`}</span></div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#aaa', margin: '18px 0 0' }}>
                Работает на <a href="https://kogda.app" style={{ color: '#111', fontWeight: 700, textDecoration: 'none' }}>kog<span style={{ background: '#E8FF47', padding: '0 3px', borderRadius: 3 }}>DA</span></a>
              </p>
            </div>
          </div>
          )
        })()}
      </div>

      <div style={{ textAlign: 'center', padding: '28px', borderTop: '1px solid #E8E7E0', marginTop: 32 }}>
        <span style={{ fontSize: 12, color: '#aaa' }}>Работает на </span>
        <a href="https://kogda.app" style={{ fontSize: 12, fontWeight: 700, color: '#111', textDecoration: 'none' }}>
          kog<span style={{ background: '#E8FF47', padding: '0 4px', borderRadius: 4 }}>DA</span>
        </a>
      </div>

      {/* Onboarding модалка */}
      {showOnboarding && prefs && (
        <OnboardingModal
          initialTimezone={prefs.timezone}
          initialCurrency={prefs.currency}
          availableCurrencies={availableCurrencies}
          onConfirm={handleOnboardingConfirm}
        />
      )}
    </div>
  )
}