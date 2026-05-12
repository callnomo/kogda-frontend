import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Plus, ChevronDown, ChevronUp, MoreHorizontal, Trash2, Pencil, Copy, Eye, EyeOff, Code2, ExternalLink, Check, Layers, Link2 } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import AIHelper from '../components/AIHelper'
import PromoCard from '../components/PromoCard'

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

const emptyForm = { title: '', description: '', duration: 60, price: 0, hide_price: false, buffer_before: 0, buffer_after: 0, min_notice: 0, max_days_ahead: 60, max_per_day: 0, require_confirm: false }

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 9,
  border: '1.5px solid #E0E0D8', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'Inter, sans-serif'
}

const selectStyle = { ...inputStyle, cursor: 'pointer', background: '#fff' }

const menuItemStyle = {
  display: 'flex', alignItems: 'center', gap: 10,
  width: '100%', padding: '12px 16px',
  background: 'transparent', border: 'none',
  cursor: 'pointer', textAlign: 'left',
  fontSize: 14, color: '#111',
  fontFamily: 'Inter, sans-serif'
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

const initial = (name) => name ? name.charAt(0).toUpperCase() : '?'

const ServiceForm = ({ formData, setFormData, onSubmit, onCancel, showAdv, setShowAdv, isEdit }) => (
  <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: `1px solid ${isEdit ? '#E8FF47' : '#E8E7E0'}`, borderLeft: isEdit ? '4px solid #E8FF47' : '1px solid #E8E7E0', paddingLeft: isEdit ? 21 : 24, marginBottom: 20 }}>
    <h4 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>{isEdit ? 'Редактировать услугу' : 'Новая услуга'}</h4>
    <form onSubmit={onSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Название</label>
          <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
            placeholder="Первичная консультация" required style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Длительность (мин)</label>
          <select value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} style={selectStyle}>
            {[15,20,25,30,45,50,60,90,120].map(d => <option key={d} value={d}>{d} мин</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Описание</label>
        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
          placeholder="Расскажи клиенту что будет на встрече..."
          style={{ ...inputStyle, minHeight: 72, resize: 'vertical', fontFamily: 'Inter, sans-serif' }} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Цена (₽)</label>
        <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
          placeholder="0 - бесплатно" min="0" style={{ ...inputStyle, MozAppearance: 'textfield' }} />
      </div>
      <div style={{ borderTop: '1px solid #F0EFE9', paddingTop: 16, marginBottom: 20 }}>
        <button type="button" onClick={() => setShowAdv(!showAdv)} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#888', padding: 0,
          fontFamily: 'Inter, sans-serif'
        }}>
          {showAdv ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Дополнительные настройки
        </button>
        {showAdv && (
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Буфер до (мин)</label>
              <select value={formData.buffer_before} onChange={e => setFormData({...formData, buffer_before: Number(e.target.value)})} style={selectStyle}>
                {[0,5,10,15,20,30].map(v => <option key={v} value={v}>{v === 0 ? 'Без буфера' : `${v} мин`}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Буфер после (мин)</label>
              <select value={formData.buffer_after} onChange={e => setFormData({...formData, buffer_after: Number(e.target.value)})} style={selectStyle}>
                {[0,5,10,15,20,30].map(v => <option key={v} value={v}>{v === 0 ? 'Без буфера' : `${v} мин`}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Минимум до записи</label>
              <select value={formData.min_notice} onChange={e => setFormData({...formData, min_notice: Number(e.target.value)})} style={selectStyle}>
                {[0,1,2,4,8,12,24,48,72].map(v => <option key={v} value={v}>{v === 0 ? 'Без ограничений' : `${v} ч`}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Записи на сколько вперёд</label>
              <select value={formData.max_days_ahead} onChange={e => setFormData({...formData, max_days_ahead: Number(e.target.value)})} style={selectStyle}>
                {[7,14,30,60,90,180].map(v => <option key={v} value={v}>{v} дней</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Макс. встреч в день</label>
              <select value={formData.max_per_day} onChange={e => setFormData({...formData, max_per_day: Number(e.target.value)})} style={selectStyle}>
                {[0,1,2,3,4,5,6,8,10].map(v => <option key={v} value={v}>{v === 0 ? 'Без лимита' : `${v} встреч`}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F7F6F1', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Подтверждать вручную</div>
                  <div style={{ position: 'relative', display: 'inline-block' }}
                    onMouseEnter={e => e.currentTarget.querySelector('.tooltip').style.display = 'block'}
                    onMouseLeave={e => e.currentTarget.querySelector('.tooltip').style.display = 'none'}>
                    <div style={{ width: 16, height: 16, borderRadius: 8, background: '#E0E0D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#888', cursor: 'default' }}>?</div>
                    <div className="tooltip" style={{ display: 'none', position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#111', color: '#fff', fontSize: 12, padding: '8px 12px', borderRadius: 8, whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none' }}>
                      Каждая запись требует твоего подтверждения
                    </div>
                  </div>
                </div>
                <div onClick={() => setFormData({...formData, require_confirm: !formData.require_confirm})} style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: formData.require_confirm ? '#111' : '#E0E0D8',
                  cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s'
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: formData.require_confirm ? 23 : 3, transition: 'left 0.2s' }} />
                </div>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F7F6F1', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Скрыть цену на публичной странице</div>
                  <div style={{ position: 'relative', display: 'inline-block' }}
                    onMouseEnter={e => e.currentTarget.querySelector('.tooltip').style.display = 'block'}
                    onMouseLeave={e => e.currentTarget.querySelector('.tooltip').style.display = 'none'}>
                    <div style={{ width: 16, height: 16, borderRadius: 8, background: '#E0E0D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#888', cursor: 'default' }}>?</div>
                    <div className="tooltip" style={{ display: 'none', position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#111', color: '#fff', fontSize: 12, padding: '8px 12px', borderRadius: 8, whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none' }}>
                      Клиент увидит «Цена по запросу» вместо суммы
                    </div>
                  </div>
                </div>
                <div onClick={() => setFormData({...formData, hide_price: !formData.hide_price})} style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: formData.hide_price ? '#111' : '#E0E0D8',
                  cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s'
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: formData.hide_price ? 23 : 3, transition: 'left 0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={onCancel} style={{ background: 'transparent', border: '1.5px solid #E0E0D8', padding: '11px 26px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Отмена
        </button>
        <button type="submit" style={{ background: '#111', color: '#F7F6F1', border: 'none', padding: '11px 26px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          {isEdit ? 'Сохранить' : 'Создать'}
        </button>
      </div>
    </form>
  </div>
)

export default function Services() {
  const [meetings, setMeetings] = useState([])
  const [bookings, setBookings] = useState([])
  const [user, setUser] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editMeeting, setEditMeeting] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showEditAdvanced, setShowEditAdvanced] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [openSheetId, setOpenSheetId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { window.location.href = '/login'; return }
    setUser(JSON.parse(u))
    loadMeetings()
    loadBookings()

    const onResize = () => setIsMobile(window.innerWidth < 900)
    onResize()
    window.addEventListener('resize', onResize)

    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', onClickOutside)

    return () => {
      window.removeEventListener('resize', onResize)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [])

  // Блокируем скролл body когда открыт sheet
  useEffect(() => {
    if (openSheetId !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [openSheetId])

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

  const createMeeting = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API}/meetings`, form, { headers: { Authorization: `Bearer ${token}` } })
      setShowForm(false)
      setForm(emptyForm)
      setShowAdvanced(false)
      loadMeetings()
    } catch (err) { console.error(err) }
  }

  const updateMeeting = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/meetings/${editMeeting.id}`, editForm, { headers: { Authorization: `Bearer ${token}` } })
      setEditMeeting(null)
      setShowEditAdvanced(false)
      loadMeetings()
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

  const visibleMeetings = meetings.filter(m => editMeeting?.id !== m.id)

  // Самая популярная услуга — считаем по подтверждённым бронированиям
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed')
  const bookingsCount = {}
  confirmedBookings.forEach(b => {
    const title = b.meeting_title
    if (!title) return
    bookingsCount[title] = (bookingsCount[title] || 0) + 1
  })

  let mostPopular = null
  if (Object.keys(bookingsCount).length > 0) {
    // Сортируем по количеству, при равенстве — по алфавиту
    const sorted = Object.entries(bookingsCount).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return a[0].localeCompare(b[0], 'ru')
    })
    mostPopular = { title: sorted[0][0], count: sorted[0][1] }
  } else if (meetings.length > 0) {
    // Если бронирований нет — показываем первую услугу по алфавиту с 0 бронирований
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
  // На десктопе — круглая иконка с tooltip
  // На мобайле — полноширинная кнопка с текстом
  const addButtonDesktop = (
    <button
      onClick={() => setShowForm(!showForm)}
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
    <button onClick={() => setShowForm(!showForm)} style={{
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

      {/* Шапка: заголовок + кнопка справа на десктопе */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
        gap: 12
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, fontFamily: 'Inter, sans-serif' }}>Услуги</h1>
        {!isMobile && addButtonDesktop}
      </div>

      {showForm && (
        <ServiceForm
          formData={form} setFormData={setForm}
          onSubmit={createMeeting} onCancel={() => { setShowForm(false); setForm(emptyForm); setShowAdvanced(false) }}
          showAdv={showAdvanced} setShowAdv={setShowAdvanced}
          isEdit={false}
        />
      )}

      {editMeeting && (
        <ServiceForm
          formData={editForm} setFormData={setEditForm}
          onSubmit={updateMeeting} onCancel={() => { setEditMeeting(null); setShowEditAdvanced(false) }}
          showAdv={showEditAdvanced} setShowAdv={setShowEditAdvanced}
          isEdit={true}
        />
      )}

      {meetings.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: '48px 20px', border: '1px solid #E8E7E0', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>Пока нет услуг</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>Добавь первую услугу и поделись ссылкой с клиентами</div>
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

            const startEdit = () => {
              setEditMeeting(m)
              setEditForm({
                title: m.title, description: m.description || '',
                duration: m.duration, price: m.price,
                hide_price: m.hide_price || false,
                buffer_before: m.buffer_before || 0, buffer_after: m.buffer_after || 0,
                min_notice: m.min_notice || 0, max_days_ahead: m.max_days_ahead || 60,
                max_per_day: m.max_per_day || 0, require_confirm: m.require_confirm || false
              })
              setOpenMenuId(null)
            }

            const isHovered = hoveredId === m.id
            const isHidden = !m.is_active
            const showEye = isHovered || isHidden

            return (
              <div
                key={m.id}
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

                  {/* Lime-ценник */}
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
                    {m.hide_price ? 'По запросу' : (m.price > 0 ? `${m.price.toLocaleString('ru-RU')} ₽` : 'Бесплатно')}
                  </div>
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
                  {/* Слева: глаз + Скоро-иконки + удалить — на hover (или если скрыта) */}
                  <div style={{
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center',
                    opacity: showEye ? 1 : 0,
                    pointerEvents: showEye ? 'auto' : 'none',
                    transition: 'opacity 0.15s'
                  }}>
                    {/* Глаз */}
                    <button
                      onClick={() => toggleVisibility(m.id)}
                      title={isHidden ? 'Услуга скрыта — показать на публичной странице' : 'Скрыть на публичной странице'}
                      style={{
                        ...iconBtnStyle,
                        cursor: 'pointer',
                        color: isHidden ? '#DC2626' : '#111'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F1'; e.currentTarget.style.borderColor = '#111' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E0E0D8' }}
                    >
                      {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>

                    {/* Создать одноразовую — Скоро */}
                    <button
                      onClick={() => alert('Одноразовая ссылка — скоро будет доступна. Ссылка которая работает только для одного бронирования и автоматически закроется после использования.')}
                      title="Создать одноразовую ссылку (Скоро)"
                      style={{ ...iconBtnStyle, cursor: 'pointer', opacity: 0.5 }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0.5' }}
                    >
                      <Link2 size={16} />
                    </button>

                    {/* Дублировать — Скоро */}
                    <button
                      onClick={() => alert('Дублирование услуги — скоро будет доступно.')}
                      title="Дублировать (Скоро)"
                      style={{ ...iconBtnStyle, cursor: 'pointer', opacity: 0.5 }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0.5' }}
                    >
                      <Layers size={16} />
                    </button>

                    {/* Встроить — Скоро */}
                    <button
                      onClick={() => alert('Виджет для встраивания на сайт — Premium функция, скоро будет доступна')}
                      title="Встроить на сайт (Скоро)"
                      style={{ ...iconBtnStyle, cursor: 'pointer', opacity: 0.5 }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0.5' }}
                    >
                      <Code2 size={16} />
                    </button>

                    {/* Удалить — красная корзина */}
                    <button
                      onClick={() => deleteMeeting(m.id)}
                      title="Удалить услугу"
                      style={{ ...iconBtnStyle, cursor: 'pointer', color: '#DC2626' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#DC2626' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E0E0D8' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Справа: Предпросмотр + Редактировать + Копировать (всегда видны) */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {/* Предпросмотр */}
                    <a
                      href={bookingLink}
                      target="_blank"
                      rel="noreferrer"
                      title="Предпросмотр"
                      style={iconBtnStyle}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F1'; e.currentTarget.style.borderColor = '#111' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E0E0D8' }}
                    >
                      <ExternalLink size={16} />
                    </a>

                    {/* Редактировать */}
                    <button
                      onClick={startEdit}
                      title="Редактировать"
                      style={{ ...iconBtnStyle, cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F1'; e.currentTarget.style.borderColor = '#111' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E0E0D8' }}
                    >
                      <Pencil size={16} />
                    </button>

                    {/* Копировать ссылку — главная (чёрная) */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(bookingLink)
                        setCopiedId(m.id)
                        setTimeout(() => setCopiedId(null), 1500)
                      }}
                      title={copiedId === m.id ? 'Скопировано' : 'Копировать ссылку'}
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
            )
          })}

          {/* Мобайл: кнопка Добавить услугу снизу */}
          {isMobile && (
            <div style={{ marginTop: 12 }}>
              {addButtonMobile}
            </div>
          )}
        </div>
      )}

      {/* Если услуг нет — на мобайле тоже нужна кнопка снизу */}
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
          setEditMeeting(sheetMeeting)
          setEditForm({
            title: sheetMeeting.title, description: sheetMeeting.description || '',
            duration: sheetMeeting.duration, price: sheetMeeting.price,
            hide_price: sheetMeeting.hide_price || false,
            buffer_before: sheetMeeting.buffer_before || 0, buffer_after: sheetMeeting.buffer_after || 0,
            min_notice: sheetMeeting.min_notice || 0, max_days_ahead: sheetMeeting.max_days_ahead || 60,
            max_per_day: sheetMeeting.max_per_day || 0, require_confirm: sheetMeeting.require_confirm || false
          })
          setOpenSheetId(null)
        }

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
              {/* Полоска свайпа */}
              <div style={{
                width: 40, height: 4,
                background: '#E0E0D8',
                borderRadius: 2,
                margin: '8px auto 16px'
              }} />

              {/* Заголовок */}
              <div style={{
                padding: '0 20px 16px',
                borderBottom: '1px solid #F0EFE9'
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{sheetMeeting.title}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  {sheetMeeting.duration} мин · {sheetMeeting.hide_price ? 'По запросу' : (sheetMeeting.price > 0 ? `${sheetMeeting.price.toLocaleString('ru-RU')} ₽` : 'Бесплатно')}
                </div>
              </div>

              {/* Действия */}
              <div style={{ padding: '8px 0' }}>
                <a
                  href={bookingLink}
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
                    navigator.clipboard.writeText(bookingLink)
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
                    alert('Одноразовая ссылка — скоро будет доступна')
                    setOpenSheetId(null)
                  }}
                  style={sheetItemStyle}
                >
                  <Link2 size={18} />
                  <span style={{ flex: 1, textAlign: 'left' }}>Создать одноразовую</span>
                  <span style={menuSoonBadgeStyle}>Скоро</span>
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