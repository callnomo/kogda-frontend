import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { User, Bell, CreditCard, Plug, ChevronRight, Settings as SettingsIcon, Clock, BookOpen } from 'lucide-react'

const API = 'https://kogda-backend-production.up.railway.app'

// ---- Shared styles ----
const card = {
  background: '#fff',
  borderRadius: 20,
  padding: '28px',
  border: '1px solid #E8E7E0',
}

const inp = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #E0E0D8', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', background: '#fff'
}

const label = { fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }

const primaryBtn = (saved) => ({
  background: saved ? '#22C55E' : '#111', color: '#fff',
  border: 'none', padding: '13px 28px', borderRadius: 10,
  fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background 0.3s'
})

// ---- Components ----
const NavItem = ({ icon: Icon, label: text, to, active }) => (
  <Link to={to} style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', borderRadius: 10, textDecoration: 'none',
    background: active ? '#E8FF47' : 'transparent',
    color: '#111', fontSize: 14, fontWeight: active ? 700 : 500,
  }}>
    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
    {text}
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
      position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'left 0.2s'
    }} />
  </div>
)

const Row = ({ icon, label: text, subtitle, right, muted }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 0', borderBottom: '1px solid #F0EFE9'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F7F6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, opacity: muted ? 0.5 : 1 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: muted ? '#aaa' : '#111' }}>{text}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#aaa', marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
    {right}
  </div>
)

const TABS = [
  { id: 'profile', label: 'Профиль', icon: User },
  { id: 'notifications', label: 'Уведомления', icon: Bell },
  { id: 'payments', label: 'Оплата', icon: CreditCard },
  { id: 'integrations', label: 'Интеграции', icon: Plug },
]

const SECTION_TITLES = {
  profile: 'Профиль',
  notifications: 'Уведомления',
  payments: 'Способы оплаты',
  integrations: 'Интеграции',
}

const BANKS = ['Сбербанк', 'Т-Банк', 'Альфа-Банк', 'ВТБ', 'Райффайзен', 'Газпромбанк']

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [mobileSection, setMobileSection] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // Profile
  const [form, setForm] = useState({ name: '', bio: '', slug: '' })
  const [profileSaved, setProfileSaved] = useState(false)

  // Notifications
  const [notifications, setNotifications] = useState({
    notify_telegram: true, notify_email: true,
    notify_whatsapp: false, notify_max: false,
  })
  const [notifSaved, setNotifSaved] = useState(false)
  const [telegramConnected, setTelegramConnected] = useState(false)
  const [telegramLink, setTelegramLink] = useState(null)
  const [telegramLoading, setTelegramLoading] = useState(false)

  // Payments
  const [payments, setPayments] = useState({
    payment_sbp: false,
    payment_tinkoff: false,  // = Российская карта / банк
    payment_sber: false,     // = Revolut
    payment_kaspi: false,    // не используем в UI
    payment_paypal: false,
    payment_wise: false,
    payment_usdt: false,
    payment_bank: false,
    payment_other: '',
  })
  const [selectedBanks, setSelectedBanks] = useState([])
  const [paymentSaved, setPaymentSaved] = useState(false)

  useEffect(() => {
    loadSettings()
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
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
      })
      const other = typeof res.data.payment_other === 'string' ? res.data.payment_other : ''
      setPayments({
        payment_sbp: res.data.payment_sbp ?? false,
        payment_tinkoff: res.data.payment_tinkoff ?? false,
        payment_sber: res.data.payment_sber ?? false,
        payment_kaspi: res.data.payment_kaspi ?? false,
        payment_paypal: res.data.payment_paypal ?? false,
        payment_wise: res.data.payment_wise ?? false,
        payment_usdt: res.data.payment_usdt ?? false,
        payment_bank: res.data.payment_bank ?? false,
        payment_other: other,
      })
    } catch (err) { console.error(err) }
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      const res = await axios.patch(`${API}/settings/profile`, form, { headers: { Authorization: `Bearer ${token}` } })
      localStorage.setItem('user', JSON.stringify(res.data))
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
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
    setTelegramLoading(true)
    const token = localStorage.getItem('token')
    try {
      const res = await axios.post(`${API}/settings/telegram-token`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setTelegramLink(`https://t.me/kogdaapp_bot?start=${res.data.token}`)
    } catch (err) { console.error(err) }
    setTelegramLoading(false)
  }

  const toggleBank = (bank) => {
    setSelectedBanks(prev =>
      prev.includes(bank) ? prev.filter(b => b !== bank) : [...prev, bank]
    )
  }

  const PaymentCard = ({ p }) => {
    const sel = payments[p.key]
    return (
      <div onClick={() => setPayments({ ...payments, [p.key]: !sel })}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
          border: `1.5px solid ${sel ? '#111' : '#E8E7E0'}`,
          background: sel ? '#F7F6F1' : '#fff', transition: 'all 0.15s'
        }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{p.label}</div>
          {p.desc && <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{p.desc}</div>}
        </div>
        <div style={{
          width: 20, height: 20, borderRadius: 10, flexShrink: 0,
          background: sel ? '#111' : '#fff',
          border: `2px solid ${sel ? '#111' : '#E0E0D8'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {sel && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
        </div>
      </div>
    )
  }

  // ---- Sections ----

  const ProfileSection = () => (
    <form onSubmit={saveProfile}>
      <div style={{ marginBottom: 16 }}>
        <label style={label}>Имя</label>
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={label}>Никнейм (для ссылки)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, color: '#888', whiteSpace: 'nowrap' }}>app.kogda.app/</span>
          <input value={form.slug}
            onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
            placeholder="anna-sokolova" style={{ ...inp, flex: 1 }} />
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={label}>О себе</label>
        <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
          placeholder="Психолог, КПТ, 5 лет практики..."
          style={{ ...inp, minHeight: 100, resize: 'vertical' }} />
      </div>
      <button type="submit" style={primaryBtn(profileSaved)}>
        {profileSaved ? '✓ Сохранено' : 'Сохранить'}
      </button>
    </form>
  )

  const NotificationsSection = () => (
    <div>
      <div style={{ marginBottom: 24 }}>
        {[
          { key: 'notify_telegram', icon: '✈️', label: 'Telegram', subtitle: 'Уведомления о новых записях' },
          { key: 'notify_email', icon: '✉️', label: 'Email', subtitle: 'Уведомления на почту' },
          { key: 'notify_whatsapp', icon: '💬', label: 'WhatsApp', subtitle: 'Скоро', disabled: true },
          { key: 'notify_max', icon: '💬', label: 'Макс', subtitle: 'Скоро', disabled: true },
        ].map((item) => (
          <Row key={item.key}
            icon={item.icon}
            label={item.label}
            subtitle={item.subtitle}
            muted={item.disabled}
            right={<Toggle value={notifications[item.key]} onChange={v => setNotifications({ ...notifications, [item.key]: v })} disabled={item.disabled} />}
          />
        ))}
      </div>
      <button onClick={saveNotifications} style={primaryBtn(notifSaved)}>
        {notifSaved ? '✓ Сохранено' : 'Сохранить'}
      </button>
    </div>
  )

  const PaymentsSection = () => (
    <div>
      <p style={{ fontSize: 13, color: '#888', margin: '0 0 14px' }}>
        Выберите способы, которыми вы принимаете оплату напрямую. Клиент увидит их при бронировании.
      </p>
      <div style={{ background: '#F7F6F1', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#888', marginBottom: 24 }}>
        🔒 Kogda не принимает платежи и не хранит реквизиты. Детали оплаты вы согласуете с клиентом напрямую.
      </div>

      {[
        {
          group: 'РОССИЯ', items: [
            { key: 'payment_sbp', label: 'СБП', desc: 'Быстрые переводы по номеру телефона' },
            { key: 'payment_tinkoff', label: 'Российская карта / банк', desc: 'Сбер, Т-Банк, Альфа, ВТБ и др.' },
          ]
        },
        {
          group: 'МЕЖДУНАРОДНЫЕ', items: [
            { key: 'payment_paypal', label: 'PayPal', desc: '' },
            { key: 'payment_wise', label: 'Wise', desc: '' },
            { key: 'payment_sber', label: 'Revolut', desc: '' },
            { key: 'payment_bank', label: 'Банковский перевод', desc: 'IBAN / SWIFT' },
          ]
        },
        {
          group: 'КРИПТО', items: [
            { key: 'payment_usdt', label: 'USDT', desc: 'Крипто' },
          ]
        },
      ].map(group => (
        <div key={group.group} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: 1, marginBottom: 8 }}>{group.group}</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
            {group.items.map(p => <PaymentCard key={p.key} p={p} />)}
          </div>

          {/* Bank chips — раскрывается если выбрана Российская карта */}
          {group.group === 'РОССИЯ' && payments.payment_tinkoff && (
            <div style={{ marginTop: 8, padding: '14px 16px', background: '#F7F6F1', borderRadius: 12, border: '1px solid #E8E7E0' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Уточните банк, если хотите</div>
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>Это поможет клиенту понять, удобно ли ему оплатить.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {BANKS.map(bank => {
                  const sel = selectedBanks.includes(bank)
                  return (
                    <div key={bank} onClick={() => toggleBank(bank)} style={{
                      padding: '6px 14px', borderRadius: 100, cursor: 'pointer', fontSize: 13,
                      border: `1.5px solid ${sel ? '#111' : '#E0E0D8'}`,
                      background: sel ? '#111' : '#fff',
                      color: sel ? '#fff' : '#111',
                      fontWeight: sel ? 600 : 400, transition: 'all 0.15s'
                    }}>{bank}</div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Не нашли нужный способ?</div>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>Добавьте свой способ вручную.</div>
        <input
          value={payments.payment_other || ''}
          onChange={e => setPayments({ ...payments, payment_other: e.target.value })}
          placeholder="Например: Kaspi, Zelle, Venmo, Pix, UPI, PromptPay, Stripe, наличные..."
          style={inp}
        />
      </div>

      <button onClick={savePayments} style={primaryBtn(paymentSaved)}>
        {paymentSaved ? '✓ Сохранено' : 'Сохранить'}
      </button>
    </div>
  )

  const IntegrationsSection = () => {
    const TelegramIcon = () => (
      <svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#229ED9"/><path d="M6 11.5l10-4.5-3 11-3.5-3.5-2 2v-3l7-6.5-8 4.5L6 11.5z" fill="white"/></svg>
    )
    const GoogleIcon = () => (
      <svg width="24" height="24" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
    )
    const AppleIcon = () => (
      <svg width="24" height="24" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill="#000"/></svg>
    )
    const YandexIcon = () => (
      <svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FC3F1D"/><path d="M13.8 6H12.1C10.2 6 9 7 9 8.8c0 1.6.8 2.4 2.2 3.4L12.4 13 9 18h2.1l3.2-4.8-1.2-.9c-1.1-.8-1.6-1.4-1.6-2.6 0-1 .6-1.7 1.9-1.7h1V18H16V6h-2.2z" fill="white"/></svg>
    )
    const ZoomIcon = () => (
      <svg width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#2D8CFF"/><path d="M4 8.5C4 7.7 4.7 7 5.5 7h8c.8 0 1.5.7 1.5 1.5v7c0 .8-.7 1.5-1.5 1.5h-8C4.7 17 4 16.3 4 15.5v-7zm11 1.8l4-2.8v7l-4-2.8V10.3z" fill="white"/></svg>
    )
    const MeetIcon = () => (
      <svg width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#00BFA5"/><path d="M4 8h9v8H4z" fill="white" rx="1"/><path d="M13 10l6-4v12l-6-4v-4z" fill="#00897B"/></svg>
    )
    const KogdaIcon = () => (
      <svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#E8FF47"/><text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="900" fill="#111">kD</text></svg>
    )

    const integrations = [
      { icon: <GoogleIcon />, label: 'Google Calendar', desc: 'Синхронизация встреч', badge: 'Скоро' },
      { icon: <AppleIcon />, label: 'Apple Calendar', desc: 'Синхронизация встреч', badge: 'Скоро' },
      { icon: <YandexIcon />, label: 'Яндекс Календарь', desc: 'Синхронизация встреч', badge: 'Скоро' },
      { icon: <ZoomIcon />, label: 'Zoom', desc: 'Автоматические ссылки на встречи', badge: 'Скоро' },
      { icon: <MeetIcon />, label: 'Google Meet', desc: 'Автоматические ссылки на встречи', badge: 'Скоро' },
      { icon: <YandexIcon />, label: 'Яндекс Телемост', desc: 'Автоматические ссылки на встречи', badge: 'Скоро' },
      { icon: <KogdaIcon />, label: 'kogDA Video', desc: 'Встроенная видеосвязь', badge: 'Премиум', premium: true },
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Telegram */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#F7F6F1', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <TelegramIcon />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Telegram бот</div>
              <div style={{ fontSize: 12, color: '#888' }}>Уведомления о новых записях</div>
            </div>
          </div>
          {telegramConnected
            ? <div style={{ background: '#DCFCE7', color: '#16A34A', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>✓ Подключён</div>
            : <button onClick={connectTelegram} disabled={telegramLoading} style={{ background: '#229ED9', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {telegramLoading ? '...' : 'Подключить'}
              </button>
          }
        </div>
        {telegramLink && !telegramConnected && (
          <div style={{ padding: '10px 14px', background: '#FFF7ED', borderRadius: 8, fontSize: 13, color: '#92400E' }}>
            Нажми START в Telegram →{' '}
            <a href={telegramLink} target="_blank" rel="noreferrer" style={{ color: '#229ED9', fontWeight: 700 }}>Открыть бота</a>
          </div>
        )}

        {/* Other integrations */}
        {integrations.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#F7F6F1', borderRadius: 12, opacity: item.premium ? 1 : 0.65 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {item.icon}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{item.desc}</div>
              </div>
            </div>
            <div style={{
              fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 100, flexShrink: 0,
              background: item.premium ? '#E8FF47' : '#E8E7E0',
              color: item.premium ? '#111' : '#aaa'
            }}>{item.badge}</div>
          </div>
        ))}
      </div>
    )
  }

  const sectionContent = {
    profile: <ProfileSection />,
    notifications: <NotificationsSection />,
    payments: <PaymentsSection />,
    integrations: <IntegrationsSection />,
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
              <NavItem icon={User} label="Мой кабинет" to="/dashboard" active={false} />
              <NavItem icon={Clock} label="Расписание" to="/schedule" active={false} />
              <NavItem icon={BookOpen} label="Записи" to="/bookings" active={false} />
              <NavItem icon={SettingsIcon} label="Настройки" to="/settings" active={true} />
            </nav>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 24px' }}>Настройки</h2>

          {/* MOBILE HUB */}
          {isMobile ? (
            mobileSection ? (
              <div>
                <button onClick={() => setMobileSection(null)} style={{ background: 'transparent', border: 'none', padding: '0 0 20px', fontSize: 14, fontWeight: 600, color: '#888', cursor: 'pointer' }}>
                  ← Настройки
                </button>
                <div style={card}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 24px' }}>{SECTION_TITLES[mobileSection]}</h3>
                  {sectionContent[mobileSection]}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TABS.map(tab => (
                  <div key={tab.id} onClick={() => setMobileSection(tab.id)}
                    style={{ ...card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px' }}>
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
            /* DESKTOP TABS */
            <div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', borderRadius: 14, padding: 6, border: '1px solid #E8E7E0', width: 'fit-content' }}>
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                    padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: activeTab === tab.id ? '#111' : 'transparent',
                    color: activeTab === tab.id ? '#fff' : '#555',
                    fontSize: 14, fontWeight: activeTab === tab.id ? 700 : 500,
                    transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7
                  }}>
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={card}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 24px' }}>{SECTION_TITLES[activeTab]}</h3>
                {sectionContent[activeTab]}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}