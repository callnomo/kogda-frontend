import { useState, useEffect, useRef, useMemo } from 'react'
import axios from 'axios'
import {
  Plus, Trash2, Pencil, Copy, Eye, EyeOff, Code2, ExternalLink, Check,
  Layers, ChevronUp, ChevronDown, ArrowLeft, Search, SlidersHorizontal, X
} from 'lucide-react'
import AppLayout from '../components/AppLayout'
import AIHelper from '../components/AIHelper'
import PromoCard from '../components/PromoCard'
import ServiceModal from '../components/ServiceModal'
import { CURRENCIES, getCurrencySymbol } from '../currencies'

const API = process.env.REACT_APP_API_URL || 'https://kogda-backend-production.up.railway.app'

const DEFAULT_NEW_SERVICE = {
  title: 'Новая услуга',
  description: '',
  duration: 60,
  price: 0,
  hide_price: false,
  price_mode: 'free',
  location_type: 'video',
  step_minutes: 30,
  buffer_before: 0,
  buffer_after: 0,
  min_notice: 0,
  max_days_ahead: 60,
  max_per_day: 0,
  require_confirm: false,
  cancellation_policy: '',
}

// ============ ВАЛЮТЫ ============
// Импортируем общий список из ../currencies (один источник правды).
// CURRENCIES — массив { code, symbol, label, aliases }
// Также есть OTHER кейс: услуга может быть в кастомной валюте (например 'KGS')
// которой нет в списке — это нормально, getCurrencySymbol вернёт сам код.

const PRICE_TYPES = [
  { key: 'amount', label: 'С фиксированной ценой' },
  { key: 'free', label: 'Бесплатные' },
  { key: 'on_request', label: 'Цена по запросу' },
  { key: 'hidden', label: 'Цена скрыта' },
]

const SORTS = [
  { key: 'newest', label: 'Новые сверху' },
  { key: 'oldest', label: 'Старые сверху' },
  { key: 'price_asc', label: 'Сначала дешевле' },
  { key: 'price_desc', label: 'Сначала дороже' },
  { key: 'duration', label: 'По длительности' },
]

const DEFAULT_FILTERS = {
  status: 'all',          // 'all' | 'active' | 'hidden'
  currencies: [],         // массив codes, [] = все
  priceTypes: [],         // массив keys, [] = все
  sort: 'newest',
}

const hideArrows = `
  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
  @keyframes scaleIn { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
`

const iconBtnStyle = {
  width: 36, height: 36, borderRadius: 8,
  border: '1.5px solid #E0E0D8', background: 'transparent', color: '#111',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  textDecoration: 'none', fontFamily: 'Inter, sans-serif',
  transition: 'background 0.15s, border-color 0.15s'
}

const sheetItemStyle = {
  display: 'flex', alignItems: 'center', gap: 14,
  width: '100%', padding: '14px 20px',
  background: 'transparent', border: 'none',
  cursor: 'pointer', textAlign: 'left',
  fontSize: 15, color: '#111',
  fontFamily: 'Inter, sans-serif', textDecoration: 'none'
}

const menuSoonBadgeStyle = {
  marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#888',
  background: '#F7F6F1', padding: '3px 8px', borderRadius: 100,
  textTransform: 'uppercase', letterSpacing: 0.5
}

// ============ FILTER DROPDOWN ============

function FilterDropdown({ filters, setFilters, onReset, onClose, isMobile }) {
  const wrapRef = useRef(null)
  const [openGroup, setOpenGroup] = useState(null) // 'status' | 'currencies' | 'priceTypes' | 'sort' | null

  // Клик вне → закрыть
  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target)) onClose()
    }
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
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
  }, [onClose])

  const toggleGroup = (key) => setOpenGroup(prev => prev === key ? null : key)

  // Лейбл текущего значения для свёрнутой строки
  const statusLabels = { all: 'Все', active: 'Активные', hidden: 'Скрытые' }
  const sortLabel = SORTS.find(s => s.key === filters.sort)?.label || ''
  const currenciesLabel = filters.currencies.length === 0
    ? 'Все валюты'
    : filters.currencies.length === 1
      ? CURRENCIES.find(c => c.code === filters.currencies[0])?.label || ''
      : `${filters.currencies.length} валют`
  const priceTypesLabel = filters.priceTypes.length === 0
    ? 'Все'
    : filters.priceTypes.length === 1
      ? PRICE_TYPES.find(p => p.key === filters.priceTypes[0])?.label || ''
      : `${filters.priceTypes.length} типа`

  // Тоггл для мультивыбора
  const toggleMulti = (field, value) => {
    setFilters(f => {
      const list = f[field]
      const next = list.includes(value)
        ? list.filter(v => v !== value)
        : [...list, value]
      return { ...f, [field]: next }
    })
  }

  // Установка для одиночного выбора
  const setSingle = (field, value) => {
    setFilters(f => ({ ...f, [field]: value }))
  }

  const wrapStyle = isMobile ? {
    // На мобайле — fullscreen bottom-sheet
    position: 'fixed', left: 0, right: 0, bottom: 0,
    width: '100%', maxHeight: '85vh',
    background: '#fff',
    borderRadius: '20px 20px 0 0',
    boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
    overflowY: 'auto',
    zIndex: 110,
    animation: 'slideUp 0.25s ease-out',
  } : {
    position: 'absolute', top: 'calc(100% + 8px)', left: 0,
    width: 380,
    background: '#fff',
    border: '1px solid #E8E7E0',
    borderRadius: 14,
    boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
    overflow: 'hidden',
    zIndex: 50,
  }

  // На мобайле нужен backdrop
  const content = (
    <div ref={wrapRef} style={wrapStyle}>
      {isMobile && (
        <>
          <div style={{ width: 40, height: 4, background: '#E0E0D8', borderRadius: 2, margin: '8px auto 4px' }} />
          <div style={{
            padding: '10px 18px 14px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', borderBottom: '1px solid #F0EFE9',
          }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Фильтры</span>
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
              display: 'flex', alignItems: 'center', color: '#888',
            }}>
              <X size={20} />
            </button>
          </div>
        </>
      )}

      {/* Статус */}
      <FilterRow
        label="Статус"
        valuePreview={statusLabels[filters.status]}
        open={openGroup === 'status'}
        onToggle={() => toggleGroup('status')}
      >
        <CheckList>
          {[
            { key: 'all', label: 'Все' },
            { key: 'active', label: 'Активные' },
            { key: 'hidden', label: 'Скрытые' },
          ].map((it, i, arr) => (
            <CheckItem
              key={it.key}
              active={filters.status === it.key}
              onClick={() => setSingle('status', it.key)}
              last={i === arr.length - 1}
            >
              {it.label}
            </CheckItem>
          ))}
        </CheckList>
      </FilterRow>

      {/* Валюта */}
      <FilterRow
        label="Валюта"
        valuePreview={currenciesLabel}
        open={openGroup === 'currencies'}
        onToggle={() => toggleGroup('currencies')}
      >
        <CheckList>
          <CheckItem
            active={filters.currencies.length === 0}
            onClick={() => setFilters(f => ({ ...f, currencies: [] }))}
          >
            Все валюты
          </CheckItem>
          {CURRENCIES.map((c, i, arr) => (
            <CheckItem
              key={c.code}
              active={filters.currencies.includes(c.code)}
              onClick={() => toggleMulti('currencies', c.code)}
              last={i === arr.length - 1}
            >
              {c.label}
            </CheckItem>
          ))}
        </CheckList>
      </FilterRow>

      {/* Тип цены */}
      <FilterRow
        label="Тип цены"
        valuePreview={priceTypesLabel}
        open={openGroup === 'priceTypes'}
        onToggle={() => toggleGroup('priceTypes')}
      >
        <CheckList>
          <CheckItem
            active={filters.priceTypes.length === 0}
            onClick={() => setFilters(f => ({ ...f, priceTypes: [] }))}
          >
            Все
          </CheckItem>
          {PRICE_TYPES.map((p, i, arr) => (
            <CheckItem
              key={p.key}
              active={filters.priceTypes.includes(p.key)}
              onClick={() => toggleMulti('priceTypes', p.key)}
              last={i === arr.length - 1}
            >
              {p.label}
            </CheckItem>
          ))}
        </CheckList>
      </FilterRow>

      {/* Сортировка */}
      <FilterRow
        label="Сортировка"
        valuePreview={sortLabel}
        open={openGroup === 'sort'}
        onToggle={() => toggleGroup('sort')}
        isLast
      >
        <CheckList>
          {SORTS.map((s, i, arr) => (
            <CheckItem
              key={s.key}
              active={filters.sort === s.key}
              onClick={() => setSingle('sort', s.key)}
              last={i === arr.length - 1}
            >
              {s.label}
            </CheckItem>
          ))}
        </CheckList>
      </FilterRow>

      {/* Низ: сброс */}
      <div style={{
        padding: '12px 18px', background: '#FAFAF7',
        borderTop: '1px solid #F0EFE9',
        textAlign: 'right',
      }}>
        <button onClick={onReset} style={{
          background: 'transparent', border: 'none',
          color: '#888', fontSize: 13, cursor: 'pointer', padding: 0,
          textDecoration: 'underline',
          fontFamily: 'Inter, sans-serif',
        }}>
          Сбросить фильтры
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 109,
          animation: 'fadeIn 0.2s ease-out',
        }} />
        {content}
      </>
    )
  }
  return content
}

function FilterRow({ label, valuePreview, open, onToggle, children, isLast }) {
  return (
    <div style={{
      borderBottom: isLast ? 'none' : '1px solid #F0EFE9',
      background: open ? '#FAF9F3' : 'transparent',
    }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: open ? 600 : 500, color: '#111' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#888' }}>{valuePreview}</span>
          <ChevronDown
            size={14}
            color="#888"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
          />
        </div>
      </div>
      {open && (
        <div style={{ padding: '0 18px 14px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function PillRow({ children }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
}

function Pill({ active, onClick, children }) {
  return (
    <span
      onClick={onClick}
      style={{
        background: active ? '#111' : '#fff',
        color: active ? '#fff' : '#111',
        border: `1px solid ${active ? '#111' : '#E8E7E0'}`,
        padding: '5px 11px',
        borderRadius: 999,
        fontSize: 12,
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        transition: 'background 0.12s, color 0.12s',
      }}
    >
      {children}
    </span>
  )
}

// Список с галочками (iOS Settings style)
function CheckList({ children }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E8E7E0',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      {children}
    </div>
  )
}

function CheckItem({ active, onClick, children, last }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '11px 14px',
        borderBottom: last ? 'none' : '1px solid #F0EFE9',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 14, color: '#111' }}>{children}</span>
      {active && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      )}
    </div>
  )
}

// ============ CONFIRM DELETE DIALOG ============
// Кастомный диалог подтверждения удаления услуги (вместо window.confirm).
// Стиль идентичен CantDeleteDialog: белая карточка по центру, scaleIn,
// затемнённый backdrop с fadeIn.

function ConfirmDeleteDialog({ meeting, onClose, onConfirm }) {
  if (!meeting) return null

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease-out', padding: 20
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, padding: '28px 28px 24px',
        maxWidth: 440, width: '100%',
        border: '1px solid #E8E7E0',
        animation: 'scaleIn 0.2s ease-out',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#111' }}>
          Удалить услугу?
        </div>
        <div style={{ fontSize: 14, color: '#555', lineHeight: 1.55, marginBottom: 22 }}>
          Услуга <b>«{meeting.title}»</b> будет удалена вместе со всеми прошедшими
          записями по ней. Это действие нельзя отменить.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1.5px solid #E0E0D8',
            padding: '10px 20px', borderRadius: 100,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', color: '#111'
          }}>
            Отмена
          </button>
          <button onClick={onConfirm} style={{
            background: '#DC2626', color: '#fff', border: 'none',
            padding: '10px 22px', borderRadius: 100,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif'
          }}>
            Да, удалить
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ CANT DELETE DIALOG ============

function CantDeleteDialog({ meeting, bookingsCount, onClose, onHide }) {
  if (!meeting) return null
  const isHidden = !meeting.is_active

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease-out', padding: 20
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, padding: '28px 28px 24px',
        maxWidth: 440, width: '100%',
        border: '1px solid #E8E7E0',
        animation: 'scaleIn 0.2s ease-out',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#111' }}>
          Нельзя удалить услугу
        </div>
        <div style={{ fontSize: 14, color: '#555', lineHeight: 1.55, marginBottom: 22 }}>
          На услуге <b>«{meeting.title}»</b> {bookingsCount}{' '}
          {bookingsCount === 1 ? 'запись' : (bookingsCount >= 2 && bookingsCount <= 4 ? 'записи' : 'записей')}.
          История записей не может быть удалена.
          {!isHidden && ' Можешь скрыть услугу — она исчезнет с публичной страницы, но записи останутся.'}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1.5px solid #E0E0D8',
            padding: '10px 20px', borderRadius: 100,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', color: '#111'
          }}>
            Понятно
          </button>
          {!isHidden && (
            <button onClick={onHide} style={{
              background: '#111', color: '#fff', border: 'none',
              padding: '10px 22px', borderRadius: 100,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif'
            }}>
              Скрыть услугу
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============ MAIN ============

export default function Services() {
  const [meetings, setMeetings] = useState([])
  const [bookings, setBookings] = useState([])
  const [user, setUser] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [openSheetId, setOpenSheetId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [cantDeleteDialog, setCantDeleteDialog] = useState(null)
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(null)

  // Фильтры и поиск
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false) // мобайл — раскрытие поиска

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { window.location.href = '/login'; return }
    setUser(JSON.parse(u))
    loadMeetings()
    loadBookings()
    const onResize = () => setIsMobile(window.innerWidth < 900)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const mobileEditOpen = isMobile && editingId !== null
    if (openSheetId !== null || cantDeleteDialog !== null || confirmDeleteDialog !== null || mobileEditOpen || filterOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [openSheetId, cantDeleteDialog, confirmDeleteDialog, isMobile, editingId, filterOpen])

  const loadMeetings = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API}/meetings`, { headers: { Authorization: `Bearer ${token}` } })
      setMeetings(res.data)
    } catch (err) { console.error(err) }
  }

  const loadBookings = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API}/bookings`, { headers: { Authorization: `Bearer ${token}` } })
      setBookings(res.data)
    } catch (err) { console.error(err) }
  }

  const createNewService = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.post(`${API}/meetings`, DEFAULT_NEW_SERVICE, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await loadMeetings()
      setEditingId(res.data.id)
    } catch (err) {
      console.error('[createNewService]', err)
      alert('Не удалось создать услугу. Попробуй ещё раз.')
    }
  }

  const handleMeetingUpdate = (updated) => {
    setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m))
  }

  // Клик «Удалить» → открываем кастомный диалог подтверждения
  const requestDelete = (id) => {
    const meeting = meetings.find(m => m.id === id)
    if (!meeting) return
    setConfirmDeleteDialog({ meeting })
  }

  // Реальное удаление — вызывается из ConfirmDeleteDialog по кнопке «Да, удалить»
  const performDelete = async (id) => {
    setConfirmDeleteDialog(null)
    const token = localStorage.getItem('token')
    try {
      await axios.delete(`${API}/meetings/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (editingId === id) setEditingId(null)
      loadMeetings()
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.error === 'has_bookings') {
        const meeting = meetings.find(m => m.id === id)
        const bookingsCount = err.response.data.bookings_count || 0
        setCantDeleteDialog({ meeting, bookingsCount })
        return
      }
      console.error('[performDelete]', err)
      alert('Не удалось удалить услугу. Попробуй ещё раз.')
    }
  }

  const toggleVisibility = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/meetings/${id}/visibility`, {}, { headers: { Authorization: `Bearer ${token}` } })
      loadMeetings()
    } catch (err) { console.error(err) }
  }

  const hideMeetingFromDialog = async () => {
    if (!cantDeleteDialog?.meeting) return
    const id = cantDeleteDialog.meeting.id
    setCantDeleteDialog(null)
    await toggleVisibility(id)
  }

  // ============ ФИЛЬТРАЦИЯ + СОРТИРОВКА + ПОИСК ============

  const visibleMeetings = useMemo(() => {
    let arr = [...meetings]

    // 1. Статус
    if (filters.status === 'active') arr = arr.filter(m => m.is_active)
    if (filters.status === 'hidden') arr = arr.filter(m => !m.is_active)

    // 2. Валюты (если выбраны)
    if (filters.currencies.length > 0) {
      arr = arr.filter(m => {
        const c = m.currency || 'RUB' // legacy без поля = RUB
        return filters.currencies.includes(c)
      })
    }

    // 3. Тип цены (если выбраны)
    if (filters.priceTypes.length > 0) {
      arr = arr.filter(m => filters.priceTypes.includes(m.price_mode || 'amount'))
    }

    // 4. Поиск (по названию + описанию)
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      arr = arr.filter(m => {
        const t = (m.title || '').toLowerCase()
        const d = (m.description || '').toLowerCase()
        return t.includes(q) || d.includes(q)
      })
    }

    // 5. Сортировка
    switch (filters.sort) {
      case 'newest':
        arr.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        break
      case 'oldest':
        arr.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
        break
      case 'price_asc':
        arr.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
        break
      case 'price_desc':
        arr.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
        break
      case 'duration':
        arr.sort((a, b) => (a.duration || 0) - (b.duration || 0))
        break
      default:
        break
    }

    return arr
  }, [meetings, filters, searchQuery])

  // Подсчёт активных фильтров для бейджа
  const activeFilterCount = useMemo(() => {
    let c = 0
    if (filters.status !== DEFAULT_FILTERS.status) c++
    if (filters.currencies.length > 0) c++
    if (filters.priceTypes.length > 0) c++
    if (filters.sort !== DEFAULT_FILTERS.sort) c++
    return c
  }, [filters])

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setSearchQuery('')
  }

  if (!user) return null

  const bookingLink = `https://app.kogda.app/${user.slug}`

  // ============ ОБЗОР В ПРАВОЙ КОЛОНКЕ ============

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed')
  const bookingsCount = {}
  confirmedBookings.forEach(b => {
    const title = b.meeting_title
    if (!title) return
    bookingsCount[title] = (bookingsCount[title] || 0) + 1
  })

  let mostPopular = null
  if (Object.keys(bookingsCount).length > 0) {
    const sorted = Object.entries(bookingsCount).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return a[0].localeCompare(b[0], 'ru')
    })
    mostPopular = { title: sorted[0][0], count: sorted[0][1] }
  } else if (meetings.length > 0) {
    const sorted = [...meetings].sort((a, b) => a.title.localeCompare(b.title, 'ru'))
    mostPopular = { title: sorted[0].title, count: 0 }
  }

  const sectionLabelStyle = {
    fontSize: 11, fontWeight: 700, color: '#999',
    textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 14px'
  }

  const blockStyle = {
    background: '#fff', borderRadius: 14,
    border: '1px solid #E8E7E0', padding: 20
  }

  const rightColumn = (
    <>
      <AIHelper />
      <div>
        <h3 style={sectionLabelStyle}>Обзор</h3>
        <div style={blockStyle}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Всего услуг</div>
            <div><span style={{ fontSize: 32, fontWeight: 800, color: '#111' }}>{meetings.length}</span></div>
          </div>
          {mostPopular && (
            <div style={{ borderTop: '1px solid #F0EFE9', paddingTop: 16 }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Самая популярная</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {mostPopular.title}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                {mostPopular.count === 0
                  ? 'Ещё нет бронирований'
                  : `${mostPopular.count} ${mostPopular.count === 1 ? 'бронирование' : (mostPopular.count >= 2 && mostPopular.count <= 4 ? 'бронирования' : 'бронирований')}`}
              </div>
            </div>
          )}
        </div>
      </div>
      <PromoCard />
    </>
  )

  // ============ КНОПКИ ============

  const addButtonDesktop = (
    <span className="kg-tip-wrap" style={{ display: 'inline-flex' }}>
      <button onClick={createNewService} aria-label="Добавить услугу" style={{
        background: '#E8FF47', color: '#111', border: 'none',
        width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontFamily: 'Inter, sans-serif', transition: 'transform 0.15s'
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        <Plus size={20} strokeWidth={2.5} />
      </button>
      <span className="kg-tip">Добавить услугу</span>
    </span>
  )

  const addButtonMobile = (
    <button onClick={createNewService} style={{
      background: '#E8FF47', color: '#111', border: 'none',
      padding: '12px 22px', borderRadius: 100,
      fontSize: 13, fontWeight: 700, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontFamily: 'Inter, sans-serif', width: '100%'
    }}>
      <Plus size={15} />Добавить услугу
    </button>
  )

  const mobileEditingMeeting = (isMobile && editingId !== null)
    ? meetings.find(m => m.id === editingId)
    : null

  // ============ КНОПКА «ФИЛЬТРЫ» ============

  const filterButton = (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setFilterOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#FAF9F3', color: '#111',
          border: '1px solid #E8E7E0',
          borderRadius: 999,
          padding: '9px 16px',
          fontSize: 14, fontWeight: 500, cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          height: 38,
          boxSizing: 'border-box',
        }}
      >
        <SlidersHorizontal size={14} />
        Фильтры
        {activeFilterCount > 0 && (
          <span style={{
            background: '#111', color: '#E8FF47',
            fontSize: 11, fontWeight: 700,
            minWidth: 18, height: 18, lineHeight: '14px',
            padding: '0 6px',
            borderRadius: 999,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxSizing: 'border-box',
          }}>{activeFilterCount}</span>
        )}
      </button>
      {filterOpen && !isMobile && (
        <FilterDropdown
          filters={filters}
          setFilters={setFilters}
          onReset={resetFilters}
          onClose={() => setFilterOpen(false)}
          isMobile={false}
        />
      )}
    </div>
  )

  // Поле поиска (десктоп)
  const searchInputDesktop = (
    <div style={{ position: 'relative', width: 260 }}>
      <Search size={14} color="#888" style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
      }} />
      <input
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Поиск услуг…"
        style={{
          width: '100%',
          padding: '9px 14px 9px 38px',
          border: '1px solid #E8E7E0',
          borderRadius: 999,
          background: '#fff',
          fontSize: 14,
          outline: 'none',
          fontFamily: 'Inter, sans-serif',
          boxSizing: 'border-box',
          height: 38,
        }}
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
            display: 'flex', alignItems: 'center', color: '#888',
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )

  // Иконки поиска и фильтра (мобайл)
  const searchButtonMobile = (
    <button
      onClick={() => setSearchOpen(o => !o)}
      style={{
        width: 38, height: 38, borderRadius: 999,
        background: searchQuery ? '#111' : '#FAF9F3',
        color: searchQuery ? '#E8FF47' : '#111',
        border: `1px solid ${searchQuery ? '#111' : '#E8E7E0'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
      }}
    >
      <Search size={16} />
    </button>
  )

  const filterButtonMobile = (
    <button
      onClick={() => setFilterOpen(true)}
      style={{
        width: 38, height: 38, borderRadius: 999,
        background: activeFilterCount > 0 ? '#111' : '#FAF9F3',
        color: activeFilterCount > 0 ? '#E8FF47' : '#111',
        border: `1px solid ${activeFilterCount > 0 ? '#111' : '#E8E7E0'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
        position: 'relative',
      }}
    >
      <SlidersHorizontal size={16} />
      {activeFilterCount > 0 && (
        <span style={{
          position: 'absolute', top: -4, right: -4,
          background: '#E8FF47', color: '#111',
          fontSize: 10, fontWeight: 700,
          minWidth: 16, height: 16, lineHeight: '12px',
          padding: '0 4px',
          borderRadius: 999,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #FAF9F3',
        }}>{activeFilterCount}</span>
      )}
    </button>
  )

  return (
    <AppLayout rightColumn={rightColumn}>
      <style>{hideArrows}</style>

      {/* Заголовок — точь-в-точь как на Записях */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, fontFamily: 'Inter, sans-serif' }}>Услуги</h1>
      </div>

      {/* Кнопка добавить — строкой ниже заголовка (десктоп) */}
      {!isMobile && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          {addButtonDesktop}
        </div>
      )}

      {/* Панель фильтров + поиска */}
      {meetings.length > 0 && (
        <>
          {!isMobile ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              {filterButton}
              {searchInputDesktop}
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {filterButtonMobile}
                {searchButtonMobile}
                <div style={{ flex: 1 }} />
              </div>
              {searchOpen && (
                <div style={{ position: 'relative', marginTop: 10 }}>
                  <Search size={14} color="#888" style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Поиск услуг…"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      border: '1px solid #E8E7E0',
                      borderRadius: 999,
                      background: '#fff',
                      fontSize: 14,
                      outline: 'none',
                      fontFamily: 'Inter, sans-serif',
                      boxSizing: 'border-box',
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', color: '#888',
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Мобильный фильтр-bottomsheet */}
      {filterOpen && isMobile && (
        <FilterDropdown
          filters={filters}
          setFilters={setFilters}
          onReset={resetFilters}
          onClose={() => setFilterOpen(false)}
          isMobile={true}
        />
      )}

      {/* Список услуг */}
      {meetings.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: '48px 20px', border: '1px solid #E8E7E0', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>Пока нет услуг</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>Добавь первую услугу и поделись ссылкой с клиентами</div>
        </div>
      ) : visibleMeetings.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: '48px 20px', border: '1px solid #E8E7E0', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 6 }}>Ничего не найдено</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 18 }}>
            Попробуй изменить или сбросить фильтры
          </div>
          <button onClick={resetFilters} style={{
            background: '#111', color: '#fff',
            border: 'none', borderRadius: 100,
            padding: '10px 20px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}>
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visibleMeetings.map(m => {
            const detailsStr = [
              `${m.duration} мин`,
              m.buffer_after > 0 && `${m.buffer_after} мин буфер`,
              m.max_per_day > 0 && `макс ${m.max_per_day}/день`,
              m.require_confirm && 'требует подтверждения'
            ].filter(Boolean).join(' · ')

            const serviceLink = m.slug ? `https://app.kogda.app/${user.slug}/${m.slug}` : bookingLink
            const isExpanded = !isMobile && editingId === m.id

            const toggleEdit = () => {
              setEditingId(editingId === m.id ? null : m.id)
            }

            const isHovered = hoveredId === m.id
            const isHidden = !m.is_active
            const showEye = isHovered || isHidden
            const showOtherButtons = isHovered

            const renderPrice = () => {
              if (m.price_mode === 'hidden' || m.hide_price) return null
              if (m.price_mode === 'on_request') return 'По запросу'
              if (m.price_mode === 'free') return 'Бесплатно'
              const currency = m.currency || 'USD'
              const symbol = getCurrencySymbol(currency)
              if (m.price > 0) return `${Number(m.price).toLocaleString('ru-RU')} ${symbol}`
              return 'Бесплатно'
            }
            const priceLabel = renderPrice()

            return (
              <div key={m.id}>
                <div
                  onClick={() => isMobile && !isExpanded && setOpenSheetId(m.id)}
                  onMouseEnter={() => !isMobile && setHoveredId(m.id)}
                  onMouseLeave={() => !isMobile && setHoveredId(null)}
                  style={{
                    background: isHovered ? '#FAFAF7' : '#fff',
                    borderRadius: isExpanded ? '14px 14px 0 0' : 14,
                    border: `1px solid ${isExpanded ? '#E8FF47' : '#E8E7E0'}`,
                    borderBottom: isExpanded ? 'none' : `1px solid #E8E7E0`,
                    padding: '20px 24px',
                    display: 'flex', flexDirection: 'column', gap: isMobile ? 0 : 14,
                    position: 'relative',
                    cursor: isMobile && !isExpanded ? 'pointer' : 'default',
                    transition: 'background 0.15s, border-color 0.2s',
                    WebkitTapHighlightColor: 'transparent'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#111', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {m.title}
                        {isHidden && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, color: '#888',
                            background: '#F0EFE9', padding: '3px 8px', borderRadius: 100,
                            textTransform: 'uppercase', letterSpacing: 0.5
                          }}>Скрыта</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>{detailsStr}</div>
                    </div>
                    {priceLabel && (
                      <div style={{
                        background: '#E8FF47', borderRadius: 10,
                        padding: isMobile ? '8px 12px' : '10px 14px',
                        fontSize: isMobile ? 14 : 16, fontWeight: 800, color: '#111',
                        flexShrink: 0, whiteSpace: 'nowrap'
                      }}>
                        {priceLabel}
                      </div>
                    )}
                  </div>

                  {!isMobile && (
                  <div style={{
                    borderTop: '1px solid #F0EFE9', paddingTop: 14,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8
                  }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className="kg-tip-wrap" style={{ display: 'inline-flex' }}>
                      <button onClick={() => toggleVisibility(m.id)}
                        aria-label={isHidden ? 'Показать услугу' : 'Скрыть услугу'}
                        style={{
                          ...iconBtnStyle, cursor: 'pointer',
                          color: isHidden ? '#DC2626' : '#111',
                          opacity: showEye ? 1 : 0,
                          pointerEvents: showEye ? 'auto' : 'none',
                          transition: 'opacity 0.15s, background 0.15s, border-color 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F1'; e.currentTarget.style.borderColor = '#111' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E0E0D8' }}>
                        {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                        <span className="kg-tip">{isHidden ? 'Показать' : 'Скрыть'}</span>
                      </span>
                      <span className="kg-tip-wrap" style={{ display: 'inline-flex' }}>
                      <button onClick={() => alert('Дублирование услуги — скоро будет доступно.')} aria-label="Дублировать"
                        style={{
                          ...iconBtnStyle, cursor: 'pointer',
                          opacity: showOtherButtons ? 0.5 : 0,
                          pointerEvents: showOtherButtons ? 'auto' : 'none',
                          transition: 'opacity 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.5' }}>
                        <Layers size={16} />
                      </button>
                        <span className="kg-tip">Дублировать · скоро</span>
                      </span>
                      <span className="kg-tip-wrap" style={{ display: 'inline-flex' }}>
                      <button onClick={() => alert('Виджет для встраивания на сайт — Premium функция, скоро будет доступна')} aria-label="Встроить на сайт"
                        style={{
                          ...iconBtnStyle, cursor: 'pointer',
                          opacity: showOtherButtons ? 0.5 : 0,
                          pointerEvents: showOtherButtons ? 'auto' : 'none',
                          transition: 'opacity 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.5' }}>
                        <Code2 size={16} />
                      </button>
                        <span className="kg-tip">Встроить · скоро</span>
                      </span>
                      <span className="kg-tip-wrap" style={{ display: 'inline-flex' }}>
                      <button onClick={() => requestDelete(m.id)} aria-label="Удалить услугу"
                        style={{
                          ...iconBtnStyle, cursor: 'pointer', color: '#DC2626',
                          opacity: showOtherButtons ? 1 : 0,
                          pointerEvents: showOtherButtons ? 'auto' : 'none',
                          transition: 'opacity 0.15s, background 0.15s, border-color 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#DC2626' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E0E0D8' }}>
                        <Trash2 size={16} />
                      </button>
                        <span className="kg-tip">Удалить</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className="kg-tip-wrap" style={{ display: 'inline-flex' }}>
                        <a href={serviceLink} target="_blank" rel="noreferrer" aria-label="Предпросмотр" style={iconBtnStyle}
                          onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F1'; e.currentTarget.style.borderColor = '#111' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E0E0D8' }}>
                          <ExternalLink size={16} />
                        </a>
                        <span className="kg-tip">Предпросмотр</span>
                      </span>

                      <span className="kg-tip-wrap" style={{ display: 'inline-flex' }}>
                        <button onClick={toggleEdit}
                          aria-label={isExpanded ? 'Свернуть' : 'Редактировать'}
                          style={{
                            ...iconBtnStyle, cursor: 'pointer',
                            background: isExpanded ? '#E8FF47' : 'transparent',
                            borderColor: isExpanded ? '#E8FF47' : '#E0E0D8',
                          }}
                          onMouseEnter={e => { if (!isExpanded) { e.currentTarget.style.background = '#F7F6F1'; e.currentTarget.style.borderColor = '#111' } }}
                          onMouseLeave={e => { if (!isExpanded) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E0E0D8' } }}>
                          <Pencil size={16} />
                        </button>
                        <span className="kg-tip">{isExpanded ? 'Свернуть' : 'Редактировать'}</span>
                      </span>

                      <span className="kg-tip-wrap" style={{ display: 'inline-flex' }}>
                        <button onClick={() => {
                            navigator.clipboard.writeText(serviceLink)
                            setCopiedId(m.id)
                            setTimeout(() => setCopiedId(null), 1500)
                          }}
                          aria-label={copiedId === m.id ? 'Скопировано' : 'Копировать ссылку на услугу'}
                          style={{
                            ...iconBtnStyle,
                            background: '#111',
                            borderColor: '#111',
                            color: copiedId === m.id ? '#E8FF47' : '#fff',
                            cursor: 'pointer',
                            transition: 'color 0.2s'
                          }}>
                          {copiedId === m.id ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                        <span className="kg-tip">{copiedId === m.id ? 'Скопировано' : 'Копировать ссылку'}</span>
                      </span>
                    </div>
                  </div>
                  )}
                </div>

                {isExpanded && (
                  <>
                    <div
                      onClick={toggleEdit}
                      style={{
                        background: '#FAF9F4',
                        borderLeft: '1px solid #E8FF47',
                        borderRight: '1px solid #E8FF47',
                        borderTop: '1px solid #F0EFE9',
                        padding: '12px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                        Редактирование услуги
                      </div>
                      <span className="kg-tip-wrap" style={{ display: 'inline-flex' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleEdit() }}
                          aria-label="Свернуть"
                          style={{ ...iconBtnStyle, cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F1'; e.currentTarget.style.borderColor = '#111' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E0E0D8' }}
                        >
                          <ChevronUp size={18} />
                        </button>
                        <span className="kg-tip">Свернуть</span>
                      </span>
                    </div>

                    <div style={{
                      background: '#fff',
                      border: '1px solid #E8FF47',
                      borderTop: '1px solid #F0EFE9',
                      borderRadius: '0 0 14px 14px',
                      overflow: 'hidden',
                    }}>
                      <ServiceModal meetingId={m.id} onUpdate={handleMeetingUpdate} />
                    </div>
                  </>
                )}
              </div>
            )
          })}

          {isMobile && (
            <div style={{ marginTop: 12 }}>{addButtonMobile}</div>
          )}
        </div>
      )}

      {meetings.length === 0 && isMobile && (
        <div style={{ marginTop: 20 }}>{addButtonMobile}</div>
      )}

      {/* Bottom Sheet для мобайла (действия на услуге) */}
      {openSheetId !== null && (() => {
        const sheetMeeting = meetings.find(m => m.id === openSheetId)
        if (!sheetMeeting) return null

        const startEditFromSheet = () => {
          setEditingId(sheetMeeting.id)
          setOpenSheetId(null)
        }

        const sheetServiceLink = sheetMeeting.slug ? `https://app.kogda.app/${user.slug}/${sheetMeeting.slug}` : bookingLink

        const sheetPriceLabel = (() => {
          if (sheetMeeting.price_mode === 'hidden' || sheetMeeting.hide_price) return 'Скрыта'
          if (sheetMeeting.price_mode === 'on_request') return 'По запросу'
          if (sheetMeeting.price_mode === 'free') return 'Бесплатно'
          const currency = sheetMeeting.currency || 'USD'
          const symbol = getCurrencySymbol(currency)
          if (sheetMeeting.price > 0) return `${Number(sheetMeeting.price).toLocaleString('ru-RU')} ${symbol}`
          return 'Бесплатно'
        })()

        return (
          <div onClick={() => setOpenSheetId(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: '#fff', borderRadius: '20px 20px 0 0',
              width: '100%', maxHeight: '85vh', overflowY: 'auto',
              padding: '8px 0 24px', animation: 'slideUp 0.25s ease-out'
            }}>
              <div style={{ width: 40, height: 4, background: '#E0E0D8', borderRadius: 2, margin: '8px auto 16px' }} />
              <div style={{ padding: '0 20px 16px', borderBottom: '1px solid #F0EFE9' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{sheetMeeting.title}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  {sheetMeeting.duration} мин · {sheetPriceLabel}
                </div>
              </div>
              <div style={{ padding: '8px 0' }}>
                <a href={sheetServiceLink} target="_blank" rel="noreferrer"
                  onClick={() => setOpenSheetId(null)} style={sheetItemStyle}>
                  <ExternalLink size={18} />Предпросмотр
                </a>
                <button onClick={() => {
                  navigator.clipboard.writeText(sheetServiceLink)
                  setCopiedId(sheetMeeting.id)
                  setTimeout(() => { setCopiedId(null); setOpenSheetId(null) }, 800)
                }} style={sheetItemStyle}>
                  {copiedId === sheetMeeting.id ? <Check size={18} color="#E8FF47" /> : <Copy size={18} />}
                  {copiedId === sheetMeeting.id ? 'Скопировано' : 'Копировать ссылку'}
                </button>
                <button onClick={startEditFromSheet} style={sheetItemStyle}>
                  <Pencil size={18} />Редактировать
                </button>
                <button onClick={() => { toggleVisibility(sheetMeeting.id); setOpenSheetId(null) }} style={sheetItemStyle}>
                  {!sheetMeeting.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                  {!sheetMeeting.is_active ? 'Показать на публичной странице' : 'Скрыть на публичной странице'}
                </button>
                <button onClick={() => { alert('Дублирование — скоро будет доступно'); setOpenSheetId(null) }} style={sheetItemStyle}>
                  <Layers size={18} /><span style={{ flex: 1, textAlign: 'left' }}>Дублировать</span>
                  <span style={menuSoonBadgeStyle}>Скоро</span>
                </button>
                <button onClick={() => { alert('Виджет для встраивания на сайт — Premium функция, скоро'); setOpenSheetId(null) }} style={sheetItemStyle}>
                  <Code2 size={18} /><span style={{ flex: 1, textAlign: 'left' }}>Встроить на сайт</span>
                  <span style={menuSoonBadgeStyle}>Скоро</span>
                </button>
                <div style={{ borderTop: '1px solid #F0EFE9', margin: '8px 0' }} />
                <button onClick={() => {
                    setOpenSheetId(null)
                    requestDelete(sheetMeeting.id)
                  }}
                  style={{ ...sheetItemStyle, color: '#DC2626' }}>
                  <Trash2 size={18} />Удалить
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Fullscreen-редактирование на мобайле */}
      {mobileEditingMeeting && (
        <div style={{
          position: 'fixed', inset: 0, background: '#F7F6F1', zIndex: 200,
          display: 'flex', flexDirection: 'column',
          animation: 'slideInRight 0.25s ease-out',
          fontFamily: 'Inter, sans-serif',
        }}>
          {/* Хедер с кнопкой назад */}
          <div style={{
            background: '#fff',
            borderBottom: '1px solid #E8E7E0',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}>
            <button
              onClick={() => setEditingId(null)}
              style={{
                background: 'transparent', border: 'none',
                padding: 4, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                color: '#111', fontSize: 15, fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <ArrowLeft size={20} />
              <span>Услуги</span>
            </button>
            <div style={{
              flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700,
              color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              paddingRight: 60,
            }}>
              {mobileEditingMeeting.title}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <ServiceModal meetingId={mobileEditingMeeting.id} onUpdate={handleMeetingUpdate} />
          </div>
        </div>
      )}

      {confirmDeleteDialog && (
        <ConfirmDeleteDialog
          meeting={confirmDeleteDialog.meeting}
          onClose={() => setConfirmDeleteDialog(null)}
          onConfirm={() => performDelete(confirmDeleteDialog.meeting.id)}
        />
      )}

      {cantDeleteDialog && (
        <CantDeleteDialog
          meeting={cantDeleteDialog.meeting}
          bookingsCount={cantDeleteDialog.bookingsCount}
          onClose={() => setCantDeleteDialog(null)}
          onHide={hideMeetingFromDialog}
        />
      )}
    </AppLayout>
  )
}