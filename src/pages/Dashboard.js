import { useState, useEffect } from 'react'
import axios from 'axios'
import { Calendar, Clock, BarChart2, Settings, Link2, CheckCircle, Plus, Copy, Trash2, ExternalLink } from 'lucide-react'

const API = 'https://kogda-backend-production.up.railway.app'

const NavItem = ({ icon: Icon, label, href, active }) => (
  <a href={href} style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', borderRadius: 10, textDecoration: 'none',
    background: active ? '#E8FF47' : 'transparent',
    color: '#111', fontSize: 14, fontWeight: active ? 700 : 500,
    transition: 'background 0.15s'
  }}>
    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
    {label}
  </a>
)

export default function Dashboard() {
  const [meetings, setMeetings] = useState([])
  const [user, setUser] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', duration: 60, price: 0 })
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { window.location.href = '/login'; return }
    setUser(JSON.parse(u))
    loadMeetings()
  }, [])

  const loadMeetings = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API}/meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMeetings(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const createMeeting = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API}/meetings`, form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShowForm(false)
      setForm({ title: '', description: '', duration: 60, price: 0 })
      loadMeetings()
    } catch (err) {
      console.error(err)
    }
  }

  const deleteMeeting = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await axios.delete(`${API}/meetings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadMeetings()
    } catch (err) {
      console.error(err)
    }
  }

  const copyLink = (id, slug) => {
    navigator.clipboard.writeText(`https://app.kogda.app/${slug}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!user) return null

  const bookingLink = `https://app.kogda.app/${user.slug}`

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 9,
    border: '1.5px solid #E0E0D8', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'Inter, sans-serif'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E8E7E0',
        padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'Syne, sans-serif' }}>
          kog<span style={{ background: '#E8FF47', padding: '0 6px', borderRadius: 6 }}>DA</span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href={bookingLink} target="_blank" rel="noreferrer"
            style={{
              background: '#F0EFE9', padding: '8px 16px', borderRadius: 100,
              fontSize: 13, fontWeight: 600, textDecoration: 'none', color: '#111',
              display: 'flex', alignItems: 'center', gap: 6
            }}>
            <ExternalLink size={13} />
            {bookingLink}
          </a>
          <button onClick={() => { localStorage.clear(); window.location.href = '/login' }}
            style={{
              background: 'transparent', border: '1.5px solid #E0E0D8',
              padding: '8px 16px', borderRadius: 100, fontSize: 13,
              fontWeight: 600, cursor: 'pointer'
            }}>
            Выйти
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto', padding: '40px 24px', gap: 32 }}>
        {/* Sidebar */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <NavItem icon={Calendar} label="Встречи" href="/dashboard" active={true} />
            <NavItem icon={Clock} label="Расписание" href="/schedule" active={false} />
            <NavItem icon={BarChart2} label="Брони" href="/bookings" active={false} />
            <NavItem icon={Settings} label="Настройки" href="/settings" active={false} />
          </nav>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Привет, {user.name}!</h2>
            <p style={{ color: '#888', marginTop: 6, fontSize: 15 }}>Управляй своими встречами и расписанием</p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Типов встреч', value: meetings.length, icon: <Calendar size={20} color="#888" /> },
              { label: 'Твоя ссылка', value: `app.kogda.app/${user.slug}`, icon: <Link2 size={20} color="#888" />, small: true },
              { label: 'Статус', value: 'Активен', icon: <CheckCircle size={20} color="#22C55E" /> }
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #E8E7E0' }}>
                <div style={{ marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: s.small ? 13 : 24, fontWeight: 800, color: '#111' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Link block */}
          <div style={{
            background: '#fff', borderRadius: 16, padding: '20px 24px',
            border: '1px solid #E8E7E0', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Твоя ссылка для клиентов</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{bookingLink}</div>
            </div>
            <button
              onClick={() => copyLink('main', user.slug)}
              style={{
                background: copiedId === 'main' ? '#22C55E' : '#E8FF47',
                color: copiedId === 'main' ? '#fff' : '#111',
                border: 'none', padding: '10px 20px', borderRadius: 100,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}
            >
              <Copy size={14} />
              {copiedId === 'main' ? 'Скопировано!' : 'Скопировать'}
            </button>
          </div>

          {/* Onboarding */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #E8E7E0', marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 14, color: '#888', letterSpacing: 1.5, textTransform: 'uppercase' }}>НАЧАЛО РАБОТЫ</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { done: meetings.length > 0, label: 'Создай тип встречи', href: null },
                { done: false, label: 'Настрой расписание', href: '/schedule' },
                { done: false, label: 'Подключи Telegram', href: '/settings' },
                { done: false, label: 'Поделись ссылкой с клиентами', href: null },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                    background: step.done ? '#22C55E' : '#E8E7E0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#fff', fontWeight: 700
                  }}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  {step.href
                    ? <a href={step.href} style={{ fontSize: 14, color: '#111', fontWeight: 600 }}>{step.label}</a>
                    : <span style={{ fontSize: 14, color: step.done ? '#aaa' : '#111', fontWeight: step.done ? 400 : 600, textDecoration: step.done ? 'line-through' : 'none' }}>{step.label}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Meeting Types */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Типы встреч</h3>
            <button onClick={() => setShowForm(!showForm)} style={{
              background: '#E8FF47', color: '#111', border: 'none',
              padding: '10px 22px', borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              <Plus size={15} />
              Создать встречу
            </button>
          </div>

          {showForm && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #E8E7E0', marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Новый тип встречи</h4>
              <form onSubmit={createMeeting}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Название</label>
                    <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="Первичная консультация" required style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Длительность (мин)</label>
                    <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Описание</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Расскажи клиенту что будет на встрече..."
                    style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Цена (руб)</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="0 - бесплатно" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" style={{ background: '#111', color: '#F7F6F1', border: 'none', padding: '11px 26px', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Создать</button>
                  <button type="button" onClick={() => setShowForm(false)} style={{ background: 'transparent', border: '1.5px solid #E0E0D8', padding: '11px 26px', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Отмена</button>
                </div>
              </form>
            </div>
          )}

          {meetings.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '40px', border: '1px solid #E8E7E0', textAlign: 'center' }}>
              <Calendar size={36} color="#ccc" style={{ marginBottom: 12 }} />
              <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>Пока нет типов встреч</h4>
              <p style={{ color: '#888', fontSize: 14 }}>Создай первый тип встречи и поделись ссылкой с клиентами</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {meetings.map(m => (
                <div key={m.id} style={{
                  background: '#fff', borderRadius: 14, padding: '20px 24px',
                  border: '1px solid #E8E7E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, background: '#F0EFE9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Calendar size={20} color="#888" />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{m.title}</div>
                      <div style={{ fontSize: 13, color: '#888', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock size={12} />
                        {m.duration} мин · {m.price > 0 ? `${m.price} руб` : 'Бесплатно'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => copyLink(m.id, user.slug)}
                      style={{
                        background: copiedId === m.id ? '#22C55E' : '#E8FF47',
                        color: copiedId === m.id ? '#fff' : '#111',
                        border: 'none', padding: '8px 14px', borderRadius: 100,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                        transition: 'all 0.2s'
                      }}>
                      <Copy size={12} />
                      {copiedId === m.id ? 'Скопировано!' : 'Скопировать'}
                    </button>
                    <button onClick={() => deleteMeeting(m.id)}
                      style={{
                        background: 'transparent', border: '1.5px solid #FFE0E0',
                        color: '#DC2626', padding: '8px 14px', borderRadius: 100,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5
                      }}>
                      <Trash2 size={12} />
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}