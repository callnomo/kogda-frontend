import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { User, Clock, BookOpen, Settings as SettingsIcon, Bell, Mail, MessageCircle, CreditCard, Plug, ChevronRight } from 'lucide-react'

const API = 'https://kogda-backend-production.up.railway.app'

const NavItem = ({ icon: Icon, label, href, active }) => (
  <Link to={href} style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', borderRadius: 10, textDecoration: 'none',
    background: active ? '#E8FF47' : 'transparent',
    color: '#111', fontSize: 14, fontWeight: active ? 700 : 500,
  }}>
    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
    {label}
  </Link>
)

const Toggle = ({ value, onChange, disabled }) => (
  <div onClick={() => !disabled && onChange(!value)} style={{
    width: 44, height: 24, borderRadius: 12,
    background: disabled ? '#E0E0D8' : value ? '#111' : '#E0E0D8',
    cursor: disabled ? 'default' : 'pointer', position: 'relative', flexShrink: 0,
    transition: 'background 0.2s', opacity: disabled ? 0.5 : 1
  }}>
    <div style={{
      width: 18, height: 18, borderRadius: 9, background: '#fff',
      position: 'absolute', top: 3,
      left: value ? 23 : 3,
      transition: 'left 0.2s'
    }} />
  </div>
)

const inp = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #E0E0D8', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', background: '#fff'
}

const TABS = [
  { id: 'profile', label: 'Профиль', icon: User },
  { id: 'notifications', label: 'Уведомления', icon: Bell },
  { id: 'payments', label: 'Оплата', icon: CreditCard },
  { id: 'integrations', label: 'Интеграции', icon: Plug },
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [mobileSection, setMobileSection] = useState(null) // null = hub, string = section
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  const [form, setForm] = useState({ name: '', bio: '', slug: '' })
  const [saved, setSaved] = useState(false)

  const [notifications, setNotifications] = useState({
    notify_telegram: true, notify_email: true,
    notify_whatsapp: false, notify_max: false,
    whatsapp_phone: '', max_phone: ''
  })
  const [notifSaved, setNotifSaved] = useState(false)
  const [telegramLink, setTelegramLink] = useState(null)
  const [telegramConnected, setTelegramConnected] = useState(false)
  const [loading, setLoading] = useState(false)

  const [payments, setPayments] = useState({
    payment_sbp: false, payment_tinkoff: false, payment_sber: false,
    payment_kaspi: false, payment_paypal: false, payment_wise: false,
    payment_usdt: false, payment_bank: false, payment_other: ''
  })
  const [paymentSaved, setPaymentSaved] = useState(false)

  useEffect(() => {
    loadSettings()
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadSettings = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API}/settings`, { headers: { Authorization: `Bearer ${token}` } })
      setForm({ name: res.data.name || '', bio: res.data.bio || '', slug: res.data.slug || '' })
      setTelegramConnected(!!res.data.telegram_chat_id)
      setNotifications({
        notify_telegram: res.data.notify_telegram ?? true,
        notify_email: res.data.notify_email ?? true,
        notify_whatsapp: res.data.notify_whatsapp ?? false,
        notify_max: res.data.notify_max ?? false,
        whatsapp_phone: res.data.whatsapp_phone || '',
        max_phone: res.data.max_phone || ''
      })
      setPayments({
        payment_sbp: res.data.payment_sbp ?? false,
        payment_tinkoff: res.data.payment_tinkoff ?? false,
        payment_sber: res.data.payment_sber ?? false,
        payment_kaspi: res.data.payment_kaspi ?? false,
        payment_paypal: res.data.payment_paypal ?? false,
        payment_wise: res.data.payment_wise ?? false,
        payment_usdt: res.data.payment_usdt ?? false,
        payment_bank: res.data.payment_bank ?? false,
        payment_other: res.data.payment_other || ''
      })
    } catch (err) { console.error(err) }
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      const res = await axios.patch(`${API}/settings/profile`, form, { headers: { Authorization: `Bearer ${token}` } })
      localStorage.setItem('user', JSON.stringify(res.data))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) { alert(err.response?.data?.error || 'Ошибка сохранения') }
  }

  const saveNotifications = async () => {
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/settings/notifications`, notifications, { headers: { Authorization: `Bearer ${token}` } })
      setNotifSaved(true)
      setTimeout(() => setNotifSaved(false), 3000)
    } catch (err) { console.error(err) }
  }

  const savePayments = async () => {
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/settings/payments`, payments, { headers: { Authorization: `Bearer ${token}` } })
      setPaymentSaved(true)
      setTimeout(() => setPaymentSaved(false), 3000)
    } catch (err) { console.error(err) }
  }

  const connectTelegram = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const res = await axios.post(`${API}/settings/telegram-token`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setTelegramLink(`https://t.me/kogdaapp_bot?start=${res.data.token}`)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  // ---- Sections ----

  const ProfileSection = () => (
    <div>
      <form onSubmit={saveProfile}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Имя</label>
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inp} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Никнейм (для ссылки)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, color: '#888', whiteSpace: 'nowrap' }}>app.kogda.app/</span>
            <input value={form.slug} onChange={e => setForm({...form, slug: e.target.value.toLowerCase().replace(/\s/g,'-')})}
              placeholder="anna-sokolova" style={{ ...inp, flex: 1 }} />
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>О себе</label>
          <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})}
            placeholder="Психолог, КПТ, 5 лет практики..."
            style={{ ...inp, minHeight: 100, resize: 'vertical' }} />
        </div>
        <button type="submit" style={{
          background: saved ? '#22C55E' : '#111', color: '#fff',
          border: 'none', padding: '13px 28px', borderRadius: 10,
          fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background 0.3s'
        }}>
          {saved ? '✓ Сохранено!' : 'Сохранить профиль'}
        </button>
      </form>
    </div>
  )

  const NotificationsSection = () => (
    <div>
      {/* Telegram connect */}
      <div style={{ background: '#F7F6F1', borderRadius: 14, padding: '18px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#229ED9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✈️</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Telegram бот</div>
              <div style={{ fontSize: 12, color: '#888' }}>Уведомления о новых записях</div>
            </div>
          </div>
          {telegramConnected ? (
            <div style={{ background: '#DCFCE7', color: '#16A34A', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>✓ Подключён</div>
          ) : (
            <button onClick={connectTelegram} disabled={loading} style={{
              background: '#229ED9', color: '#fff', border: 'none',
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}>
              {loading ? '...' : 'Подключить'}
            </button>
          )}
        </div>
        {telegramLink && !telegramConnected && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#FFF7ED', borderRadius: 8, fontSize: 13, color: '#92400E' }}>
            Нажми кнопку и нажми START в Telegram →{' '}
            <a href={telegramLink} target="_blank" rel="noreferrer" style={{ color: '#229ED9', fontWeight: 700 }}>Открыть бота</a>
          </div>
        )}
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {[
          { key: 'notify_telegram', icon: '✈️', label: 'Telegram', desc: 'Мгновенные уведомления в бот', disabled: false },
          { key: 'notify_email', icon: '✉️', label: 'Email', desc: 'Уведомления на почту', disabled: false },
          { key: 'notify_whatsapp', icon: '💬', label: 'WhatsApp', desc: 'Скоро', disabled: true },
          { key: 'notify_max', icon: '💬', label: 'Макс', desc: 'Скоро', disabled: true },
        ].map(item => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: item.disabled ? '#aaa' : '#111' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: '#aaa' }}>{item.desc}</div>
              </div>
            </div>
            <Toggle value={notifications[item.key]} onChange={v => setNotifications({...notifications, [item.key]: v})} disabled={item.disabled} />
          </div>
        ))}
      </div>

      <button onClick={saveNotifications} style={{
        background: notifSaved ? '#22C55E' : '#111', color: '#fff',
        border: 'none', padding: '13px 28px', borderRadius: 10,
        fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background 0.3s'
      }}>
        {notifSaved ? '✓ Сохранено!' : 'Сохранить'}
      </button>
    </div>
  )

  const PaymentsSection = () => (
    <div>
      <div style={{ background: '#F7F6F1', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#888', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        🔒 kogDA не принимает платежи и не хранит реквизиты. Детали оплаты вы согласуете с клиентом напрямую.
      </div>

      {[
        { group: 'Популярные', items: [
          { key: 'payment_bank', label: 'Перевод на карту', icon: '💳' },
          { key: 'payment_paypal', label: 'PayPal', icon: '🅿️' },
          { key: 'payment_wise', label: 'Wise', icon: '🌍' },
        ]},
        { group: 'Россия', items: [
          { key: 'payment_sbp', label: 'СБП', icon: '⚡' },
          { key: 'payment_sber', label: 'Сбербанк', icon: '🟢' },
          { key: 'payment_tinkoff', label: 'Т-Банк', icon: '🟡' },
        ]},
        { group: 'Казахстан', items: [
          { key: 'payment_kaspi', label: 'Kaspi', icon: '🔴' },
        ]},
        { group: 'Крипто', items: [
          { key: 'payment_usdt', label: 'USDT', icon: '🔶' },
        ]},
      ].map(group => (
        <div key={group.group} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{group.group}</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 8 }}>
            {group.items.map(p => {
              const sel = payments[p.key]
              return (
                <div key={p.key} onClick={() => setPayments({...payments, [p.key]: !payments[p.key]})}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                    border: `1.5px solid ${sel ? '#111' : '#E8E7E0'}`,
                    background: sel ? '#F7F6F1' : '#fff',
                    transition: 'all 0.15s'
                  }}>
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{p.label}</span>
                  {sel && <div style={{ width: 18, height: 18, borderRadius: 9, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>
                  </div>}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Другое</div>
        <input value={payments.payment_other} onChange={e => setPayments({...payments, payment_other: e.target.value})}
          placeholder="Revolut, Stripe, наличные, другой способ..." style={inp} />
      </div>

      <button onClick={savePayments} style={{
        background: paymentSaved ? '#22C55E' : '#111', color: '#fff',
        border: 'none', padding: '13px 28px', borderRadius: 10,
        fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background 0.3s'
      }}>
        {paymentSaved ? '✓ Сохранено!' : 'Сохранить способы оплаты'}
      </button>
    </div>
  )

  const IntegrationsSection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { icon: '📅', label: 'Google Calendar', desc: 'Синхронизация встреч', soon: true },
        { icon: '🍎', label: 'Apple Calendar', desc: 'Синхронизация встреч', soon: true },
        { icon: '📹', label: 'Zoom', desc: 'Автоматические ссылки на встречи', soon: true },
        { icon: '🟢', label: 'Google Meet', desc: 'Автоматические ссылки на встречи', soon: true },
      ].map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#F7F6F1', borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#aaa' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#aaa' }}>{item.desc}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#aaa', background: '#E8E7E0', padding: '4px 10px', borderRadius: 100 }}>Скоро</div>
        </div>
      ))}
    </div>
  )

  const sectionContent = {
    profile: <ProfileSection />,
    notifications: <NotificationsSection />,
    payments: <PaymentsSection />,
    integrations: <IntegrationsSection />,
  }

  const sectionTitles = {
    profile: 'Профиль',
    notifications: 'Уведомления',
    payments: 'Оплата',
    integrations: 'Интеграции',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8E7E0', padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'Syne, sans-serif' }}>
          kog<span style={{ background: '#E8FF47', padding: '0 6px', borderRadius: 6 }}>DA</span>
        </h1>
        <button onClick={() => { localStorage.clear(); window.location.href = '/login' }}
          style={{ background: 'transparent', border: '1.5px solid #E0E0D8', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
          Выйти
        </button>
      </div>

      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto', padding: '40px 24px', gap: 32 }}>
        {/* Left nav */}
        {!isMobile && (
          <div style={{ width: 200, flexShrink: 0 }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <NavItem icon={User} label="Мой кабинет" href="/dashboard" active={false} />
              <NavItem icon={Clock} label="Расписание" href="/schedule" active={false} />
              <NavItem icon={BookOpen} label="Записи" href="/bookings" active={false} />
              <NavItem icon={SettingsIcon} label="Настройки" href="/settings" active={true} />
            </nav>
          </div>
        )}

        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px' }}>Настройки</h2>
          </div>

          {/* MOBILE: Hub или раздел */}
          {isMobile ? (
            mobileSection ? (
              <div>
                <button onClick={() => setMobileSection(null)} style={{
                  background: 'transparent', border: 'none', padding: '0 0 20px', fontSize: 14,
                  fontWeight: 600, color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                }}>
                  ← Настройки
                </button>
                <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #E8E7E0' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 24px' }}>{sectionTitles[mobileSection]}</h3>
                  {sectionContent[mobileSection]}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TABS.map(tab => (
                  <div key={tab.id} onClick={() => setMobileSection(tab.id)}
                    style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #E8E7E0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F7F6F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <tab.icon size={18} color="#111" />
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{tab.label}</span>
                    </div>
                    <ChevronRight size={18} color="#aaa" />
                  </div>
                ))}
              </div>
            )
          ) : (
            /* DESKTOP: вкладки */
            <div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#fff', borderRadius: 14, padding: 6, border: '1px solid #E8E7E0', width: 'fit-content' }}>
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                    padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: activeTab === tab.id ? '#111' : 'transparent',
                    color: activeTab === tab.id ? '#fff' : '#888',
                    fontSize: 14, fontWeight: activeTab === tab.id ? 700 : 500,
                    transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7
                  }}>
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: 20, padding: '28px', border: '1px solid #E8E7E0' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 24px' }}>{sectionTitles[activeTab]}</h3>
                {sectionContent[activeTab]}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}