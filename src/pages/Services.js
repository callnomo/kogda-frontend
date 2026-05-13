import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Plus, MoreHorizontal, Trash2, Pencil, Copy, Eye, EyeOff, Code2, ExternalLink, Check, Layers, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import AppLayout from '../components/AppLayout'
import AIHelper from '../components/AIHelper'
import PromoCard from '../components/PromoCard'
import ServiceModal from '../components/ServiceModal'

const API = process.env.REACT_APP_API_URL || 'https://kogda-backend-production.up.railway.app'

const hideArrows = `
  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .delete-icon-btn {
    color: #999;
    transition: color 0.15s;
  }
  .delete-icon-btn:hover {
    color: #DC2626;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
`

// Обёртка для каждой карточки услуги — делает её перетаскиваемой через @dnd-kit.
function SortableCard({ id, isHovered, disabled, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 10 : 1,
    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
    opacity: isDragging ? 0.95 : 1
  }

  const handleVisible = isHovered && !disabled

  return (
    <div ref={setNodeRef} style={style}>
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          style={{
            position: 'absolute',
            left: -6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 28, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            opacity: handleVisible || isDragging ? 0.6 : 0,
            transition: 'opacity 0.15s',
            color: '#888',
            zIndex: 2,
            touchAction: 'none'
          }}
        >
          <GripVertical size={18} />
        </div>
      )}
      {children}
    </div>
  )
}

const iconBtnStyle = {
  width: 36, height: 36,
  borderRadius: 8,
  border: '1.5px solid #E0E0D8',
  background: 'transparent',
  color: '#111',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
  fontFamily: 'Inter, sans-serif',
  transition: 'background 0.15s, border-color 0.15s'
}

const sheetItemStyle = {
  display: 'flex', alignItems: 'center', gap: 14,
  width: '100%', padding: '14px 20px',
  background: 'transparent', border: 'none',
  cursor: 'pointer', textAlign: 'left',
  fontSize: 15, color: '#111',
  fontFamily: 'Inter, sans-serif',
  textDecoration: 'none'
}

const menuSoonBadgeStyle = {
  marginLeft: 'auto',
  fontSize: 10, fontWeight: 700,
  color: '#888',
  background: '#F7F6F1',
  padding: '3px 8px',
  borderRadius: 100,
  textTransform: 'uppercase',
  letterSpacing: 0.5
}

export default function Services() {
  const [meetings, setMeetings] = useState([])
  const [bookings, setBookings] = useState([])
  const [user, setUser] = useState(null)

  // Модалка: null = закрыта, 'new' = создание новой, число = id редактируемой услуги
  const [modalState, setModalState] = useState(null)

  const [isMobile, setIsMobile] = useState(false)
  const [openSheetId, setOpenSheetId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [filter, setFilter] = useState('all')  // 'all' или 'hidden'

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { window.location.href = '/login'; return }
    setUser(JSON.parse(u))
    loadMeetings()
    loadBookings()

    const onResize = () => setIsMobile(window.innerWidth < 900)
    onResize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Блокируем скролл body когда открыт sheet или модалка
  useEffect(() => {
    if (openSheetId !== null || modalState !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [openSheetId, modalState])

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

  const deleteMeeting = async (id) => {
    if (!window.confirm('Удалить эту услугу?')) return
    const token = localStorage.getItem('token')
    try {
      await axios.delete(`${API}/meetings/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      loadMeetings()
    } catch (err) { console.error(err) }
  }

  const toggleVisibility = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/meetings/${id}/visibility`, {}, { headers: { Authorization: `Bearer ${token}` } })
      loadMeetings()
    } catch (err) { console.error(err) }
  }

  if (!user) return null

  const bookingLink = `https://app.kogda.app/${user.slug}`

  const visibleMeetings = meetings
    .filter(m => filter === 'hidden' ? !m.is_active : true)

  const hiddenCount = meetings.filter(m => !m.is_active).length

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = meetings.findIndex(m => m.id === active.id)
    const newIndex = meetings.findIndex(m => m.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(meetings, oldIndex, newIndex)
    setMeetings(newOrder)

    const token = localStorage.getItem('token')
    try {
      await axios.patch(
        `${API}/meetings/reorder`,
        { order: newOrder.map(m => m.id) },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (err) {
      console.error('[reorder]', err)
      loadMeetings()
    }
  }

  // Самая популярная услуга
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
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #E8E7E0',
    padding: 20
  }

  // === ПРАВАЯ КОЛОНКА ===
  const rightColumn = (
    <>
      <AIHelper />

      <div>
        <h3 style={sectionLabelStyle}>Обзор</h3>
        <div style={blockStyle}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Всего услуг</div>
            <div>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#111' }}>{meetings.length}</span>
            </div>
          </div>
          {mostPopular && (
            <div style={{ borderTop: '1px solid #F0EFE9', paddingTop: 16 }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Самая популярная</div>
              <div style={{
                fontSize: 15, fontWeight: 700, color: '#111',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
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

  // Кнопка "Добавить услугу"
  const addButtonDesktop = (
    <button
      onClick={() => setModalState('new')}
      title="Добавить услугу"
      style={{
        background: '#E8FF47', color: '#111', border: 'none',
        width: 44, height: 44, borderRadius: '50%',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontFamily: 'Inter, sans-serif',
        transition: 'transform 0.15s'
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <Plus size={20} strokeWidth={2.5} />
    </button>
  )

  const addButtonMobile = (
    <button onClick={() => setModalState('new')} style={{
      background: '#E8FF47', color: '#111', border: 'none',
      padding: '12px 22px',
      borderRadius: 100,
      fontSize: 13, fontWeight: 700,
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontFamily: 'Inter, sans-serif',
      width: '100%'
    }}>
      <Plus size={15} />Добавить услугу
    </button>
  )

  return (
    <AppLayout rightColumn={rightColumn}>
      <style>{hideArrows}</style>

      {/* Шапка */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 12
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, fontFamily: 'Inter, sans-serif' }}>Услуги</h1>
        {!isMobile && addButtonDesktop}
      </div>

      {/* Фильтры */}
      {hiddenCount > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'Все' },
            { key: 'hidden', label: 'Скрытые' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '7px 16px',
                borderRadius: 100,
                background: filter === f.key ? '#111' : '#fff',
                color: filter === f.key ? '#fff' : '#111',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                border: `1.5px solid ${filter === f.key ? '#111' : '#E0E0D8'}`,
                transition: 'all 0.15s',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* МОДАЛКА — новая или редактирование */}
      {modalState !== null && (
        <ServiceModal
          meetingId={modalState === 'new' ? null : modalState}
          onClose={() => {
            setModalState(null)
            loadMeetings()
          }}
        />
      )}

      {meetings.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: '48px 20px', border: '1px solid #E8E7E0', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>Пока нет услуг</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>Добавь первую услугу и поделись ссылкой с клиентами</div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleMeetings.map(m => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visibleMeetings.map(m => {
                const detailsStr = [
                  `${m.duration} мин`,
                  m.buffer_after > 0 && `${m.buffer_after} мин буфер`,
                  m.max_per_day > 0 && `макс ${m.max_per_day}/день`,
                  m.require_confirm && 'требует подтверждения'
                ].filter(Boolean).join(' · ')

                const serviceLink = m.slug ? `https://app.kogda.app/${user.slug}/${m.slug}` : bookingLink

                const startEdit = () => {
                  setModalState(m.id)
                }

                const isHovered = hoveredId === m.id
                const isHidden = !m.is_active
                const showEye = isHovered || isHidden
                const showOtherButtons = isHovered

                // Отображение цены с учётом price_mode (новое поле)
                const renderPrice = () => {
                  if (m.price_mode === 'hidden' || m.hide_price) return null
                  if (m.price_mode === 'on_request') return 'По запросу'
                  if (m.price_mode === 'free') return 'Бесплатно'
                  if (m.price > 0) return `${Number(m.price).toLocaleString('ru-RU')} ₽`
                  return 'Бесплатно'
                }
                const priceLabel = renderPrice()

                return (
                  <SortableCard
                    key={m.id}
                    id={m.id}
                    isHovered={isHovered}
                    disabled={filter === 'hidden' || isMobile}
                  >
                  <div
                    onClick={() => isMobile && setOpenSheetId(m.id)}
                    onMouseEnter={() => !isMobile && setHoveredId(m.id)}
                    onMouseLeave={() => !isMobile && setHoveredId(null)}
                    style={{
                      background: isHovered ? '#FAFAF7' : '#fff',
                      borderRadius: 14,
                      border: '1px solid #E8E7E0',
                      padding: '20px 24px',
                      display: 'flex', flexDirection: 'column', gap: isMobile ? 0 : 14,
                      position: 'relative',
                      cursor: isMobile ? 'pointer' : 'default',
                      transition: 'background 0.15s',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    {/* Верх: название/детали + ценник */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {m.title}
                          {isHidden && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, color: '#888',
                              background: '#F0EFE9',
                              padding: '3px 8px',
                              borderRadius: 100,
                              textTransform: 'uppercase',
                              letterSpacing: 0.5
                            }}>Скрыта</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>{detailsStr}</div>
                      </div>

                      {/* Lime-ценник — только если есть что показать */}
                      {priceLabel && (
                        <div style={{
                          background: '#E8FF47',
                          borderRadius: 10,
                          padding: isMobile ? '8px 12px' : '10px 14px',
                          fontSize: isMobile ? 14 : 16,
                          fontWeight: 800,
                          color: '#111',
                          flexShrink: 0,
                          whiteSpace: 'nowrap'
                        }}>
                          {priceLabel}
                        </div>
                      )}
                    </div>

                    {/* Низ: бордер + кнопки — ТОЛЬКО на десктопе */}
                    {!isMobile && (
                    <div style={{
                      borderTop: '1px solid #F0EFE9',
                      paddingTop: 14,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      {/* Слева: глаз + Скоро-иконки + удалить */}
                      <div style={{
                        display: 'flex',
                        gap: 6,
                        alignItems: 'center'
                      }}>
                        <button
                          onClick={() => toggleVisibility(m.id)}
                          title={isHidden ? 'Услуга скрыта — показать на публичной странице' : 'Скрыть на публичной странице'}
                          style={{
                            ...iconBtnStyle,
                            cursor: 'pointer',
                            color: isHidden ? '#DC2626' : '#111',
                            opacity: showEye ? 1 : 0,
                            pointerEvents: showEye ? 'auto' : 'none',
                            transition: 'opacity 0.15s, background 0.15s, border-color 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F1'; e.currentTarget.style.borderColor = '#111' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E0E0D8' }}
                        >
                          {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>

                        <button
                          onClick={() => alert('Дублирование услуги — скоро будет доступно.')}
                          title="Дублировать (Скоро)"
                          style={{
                            ...iconBtnStyle,
                            cursor: 'pointer',
                            opacity: showOtherButtons ? 0.5 : 0,
                            pointerEvents: showOtherButtons ? 'auto' : 'none',
                            transition: 'opacity 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = '0.5' }}
                        >
                          <Layers size={16} />
                        </button>

                        <button
                          onClick={() => alert('Виджет для встраивания на сайт — Premium функция, скоро будет доступна')}
                          title="Встроить на сайт (Скоро)"
                          style={{
                            ...iconBtnStyle,
                            cursor: 'pointer',
                            opacity: showOtherButtons ? 0.5 : 0,
                            pointerEvents: showOtherButtons ? 'auto' : 'none',
                            transition: 'opacity 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = '0.5' }}
                        >
                          <Code2 size={16} />
                        </button>

                        <button
                          onClick={() => deleteMeeting(m.id)}
                          title="Удалить услугу"
                          style={{
                            ...iconBtnStyle,
                            cursor: 'pointer',
                            color: '#DC2626',
                            opacity: showOtherButtons ? 1 : 0,
                            pointerEvents: showOtherButtons ? 'auto' : 'none',
                            transition: 'opacity 0.15s, background 0.15s, border-color 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#DC2626' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E0E0D8' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Справа: Предпросмотр + Редактировать + Копировать */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <a
                          href={serviceLink}
                          target="_blank"
                          rel="noreferrer"
                          title="Предпросмотр"
                          style={iconBtnStyle}
                          onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F1'; e.currentTarget.style.borderColor = '#111' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E0E0D8' }}
                        >
                          <ExternalLink size={16} />
                        </a>

                        <button
                          onClick={startEdit}
                          title="Редактировать"
                          style={{ ...iconBtnStyle, cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F1'; e.currentTarget.style.borderColor = '#111' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E0E0D8' }}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(serviceLink)
                            setCopiedId(m.id)
                            setTimeout(() => setCopiedId(null), 1500)
                          }}
                          title={copiedId === m.id ? 'Скопировано' : 'Копировать ссылку на услугу'}
                          style={{
                            ...iconBtnStyle,
                            background: copiedId === m.id ? '#16A34A' : '#111',
                            borderColor: copiedId === m.id ? '#16A34A' : '#111',
                            color: '#fff',
                            cursor: 'pointer',
                            transition: 'background 0.2s, border-color 0.2s'
                          }}
                        >
                          {copiedId === m.id ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                    )}
                  </div>
                  </SortableCard>
                )
              })}

              {/* Мобайл: кнопка Добавить услугу снизу */}
              {isMobile && (
                <div style={{ marginTop: 12 }}>
                  {addButtonMobile}
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Если услуг нет — на мобайле кнопка снизу */}
      {meetings.length === 0 && isMobile && (
        <div style={{ marginTop: 20 }}>
          {addButtonMobile}
        </div>
      )}

      {/* Bottom Sheet для мобайла */}
      {openSheetId !== null && (() => {
        const sheetMeeting = meetings.find(m => m.id === openSheetId)
        if (!sheetMeeting) return null

        const startEditFromSheet = () => {
          setModalState(sheetMeeting.id)
          setOpenSheetId(null)
        }

        const sheetServiceLink = sheetMeeting.slug ? `https://app.kogda.app/${user.slug}/${sheetMeeting.slug}` : bookingLink

        // Цена для шита
        const sheetPriceLabel = (() => {
          if (sheetMeeting.price_mode === 'hidden' || sheetMeeting.hide_price) return 'Скрыта'
          if (sheetMeeting.price_mode === 'on_request') return 'По запросу'
          if (sheetMeeting.price_mode === 'free') return 'Бесплатно'
          if (sheetMeeting.price > 0) return `${Number(sheetMeeting.price).toLocaleString('ru-RU')} ₽`
          return 'Бесплатно'
        })()

        return (
          <div
            onClick={() => setOpenSheetId(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#fff',
                borderRadius: '20px 20px 0 0',
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
                padding: '8px 0 24px',
                animation: 'slideUp 0.25s ease-out'
              }}
            >
              <div style={{
                width: 40, height: 4,
                background: '#E0E0D8',
                borderRadius: 2,
                margin: '8px auto 16px'
              }} />

              <div style={{
                padding: '0 20px 16px',
                borderBottom: '1px solid #F0EFE9'
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{sheetMeeting.title}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  {sheetMeeting.duration} мин · {sheetPriceLabel}
                </div>
              </div>

              <div style={{ padding: '8px 0' }}>
                <a
                  href={sheetServiceLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpenSheetId(null)}
                  style={sheetItemStyle}
                >
                  <ExternalLink size={18} />
                  Предпросмотр
                </a>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sheetServiceLink)
                    setCopiedId(sheetMeeting.id)
                    setTimeout(() => {
                      setCopiedId(null)
                      setOpenSheetId(null)
                    }, 800)
                  }}
                  style={sheetItemStyle}
                >
                  {copiedId === sheetMeeting.id ? <Check size={18} color="#16A34A" /> : <Copy size={18} />}
                  {copiedId === sheetMeeting.id ? 'Скопировано' : 'Копировать ссылку'}
                </button>

                <button
                  onClick={startEditFromSheet}
                  style={sheetItemStyle}
                >
                  <Pencil size={18} />
                  Редактировать
                </button>

                <button
                  onClick={() => {
                    toggleVisibility(sheetMeeting.id)
                    setOpenSheetId(null)
                  }}
                  style={sheetItemStyle}
                >
                  {!sheetMeeting.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                  {!sheetMeeting.is_active ? 'Показать на публичной странице' : 'Скрыть на публичной странице'}
                </button>

                <button
                  onClick={() => {
                    alert('Дублирование — скоро будет доступно')
                    setOpenSheetId(null)
                  }}
                  style={sheetItemStyle}
                >
                  <Layers size={18} />
                  <span style={{ flex: 1, textAlign: 'left' }}>Дублировать</span>
                  <span style={menuSoonBadgeStyle}>Скоро</span>
                </button>

                <button
                  onClick={() => {
                    alert('Виджет для встраивания на сайт — Premium функция, скоро')
                    setOpenSheetId(null)
                  }}
                  style={sheetItemStyle}
                >
                  <Code2 size={18} />
                  <span style={{ flex: 1, textAlign: 'left' }}>Встроить на сайт</span>
                  <span style={menuSoonBadgeStyle}>Скоро</span>
                </button>

                <div style={{ borderTop: '1px solid #F0EFE9', margin: '8px 0' }} />

                <button
                  onClick={() => {
                    deleteMeeting(sheetMeeting.id)
                    setOpenSheetId(null)
                  }}
                  style={{ ...sheetItemStyle, color: '#DC2626' }}
                >
                  <Trash2 size={18} />
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </AppLayout>
  )
}