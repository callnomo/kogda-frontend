// kogda-frontend/src/pages/Settings.js
// Master-detail редизайн под iOS-стиль
// Версия от 14 мая 2026 — переписано с нуля

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import AppLayout from '../components/AppLayout'
import {
  User, Bell, CreditCard, Plug, Star, Lock,
  Mail, MessageCircle, Trash2, Eye, EyeOff, ChevronRight, ChevronLeft, X
} from 'lucide-react'

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000'

// ============ ДИЗАЙН-ТОКЕНЫ ============
const C = {
  bg: '#F5F4EE',
  card: '#FFFFFF',
  cardSoft: '#FAF9F3',
  border: '#E8E7E0',
  borderSoft: '#F0EFE9',
  text: '#111111',
  muted: '#888888',
  mutedLight: '#AAAAAA',
  lime: '#E8FF47',
  danger: '#DC2626',
  dangerBorder: '#FECACA',
}

// ============ РАЗДЕЛЫ ============
const SECTIONS = [
  { key: 'account',       label: 'Аккаунт',       icon: User },
  { key: 'notifications', label: 'Уведомления',   icon: Bell },
  { key: 'payments',      label: 'Оплата',        icon: CreditCard },
  { key: 'integrations',  label: 'Интеграции',    icon: Plug },
  { key: 'subscription',  label: 'Подписка',      icon: Star },
  { key: 'security',      label: 'Безопасность',  icon: Lock },
]

const BANKS = ['Сбербанк', 'Т-Банк', 'Альфа-Банк', 'ВТБ', 'Райффайзен', 'Газпромбанк']

// ============ ОБЩИЕ КОМПОНЕНТЫ (iOS-style) ============

// Группа: серый подзаголовок снаружи + бежевая карточка
function Group({ label, children, style = {} }) {
  return (
    <div style={{ marginBottom: 24, ...style }}>
      {label && (
        <div style={{
          fontSize: 13, fontWeight: 500, color: C.muted,
          marginBottom: 10, paddingLeft: 4,
        }}>{label}</div>
      )}
      <div style={{
        background: C.cardSoft,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}

// Row: одна строка iOS-формы. left | right
function Row({ left, right, sub, last = false, onClick, disabled = false, style = {} }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px',
        borderBottom: last ? 'none' : `1px solid ${C.borderSoft}`,
        cursor: onClick && !disabled ? 'pointer' : 'default',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {typeof left === 'string' ? (
          <div style={{ fontSize: 14, color: C.text }}>{left}</div>
        ) : left}
        {sub && (
          <div style={{ fontSize: 12, color: C.mutedLight, marginTop: 2 }}>{sub}</div>
        )}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  )
}

// Тумблер iOS (чёрный/серый)
function Toggle({ on, onClick, disabled = false }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: disabled ? '#E8E7E0' : (on ? '#111' : '#D8D6CC'),
        position: 'relative', flexShrink: 0,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: 8,
        background: '#FFFFFF',
        transition: 'left 0.2s',
      }} />
    </div>
  )
}

// Иконка-плашка (для интеграций/уведомлений)
function IconBadge({ children, bg = C.card, border = true, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: bg,
      border: border ? `1px solid ${C.border}` : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {children}
    </div>
  )
}

// Кнопка-action (справа на десктопе, по центру на мобайле)
function ActionRow({ children, isMobile }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: isMobile ? 'center' : 'flex-end',
      marginTop: 16,
    }}>
      {children}
    </div>
  )
}

// ============ ОСНОВНОЙ КОМПОНЕНТ ============

export default function Settings() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768)
  const [section, setSection] = useState('account')
  const [mobileShowDetail, setMobileShowDetail] = useState(false)

  // === STATE ВСЕХ ФОРМ ===
  const [user, setUser] = useState({ name: '', email: '', avatar: '' })

  const [account, setAccount] = useState({
    timezone: 'Asia/Bangkok',
    language: 'ru',
    currency: 'RUB',
  })

  const [notifications, setNotifications] = useState({
    notify_telegram: false,
    notify_email: true,
    notify_whatsapp: false,
    notify_max: false,
  })

  const [telegramConnected, setTelegramConnected] = useState(false)
  const [telegramLink, setTelegramLink] = useState(null)

  const [payments, setPayments] = useState({
    payment_sbp: false, payment_tinkoff: false, payment_sber: false,
    payment_kaspi: false, payment_paypal: false, payment_wise: false,
    payment_usdt: false, payment_bank: false, payment_other: '',
  })
  const [selectedBanks, setSelectedBanks] = useState([])

  const [passwordForm, setPasswordForm] = useState({ current: '', next: '' })
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNextPwd, setShowNextPwd] = useState(false)
  const [pwdSaved, setPwdSaved] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  // Удаление аккаунта
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [bookingsWarning, setBookingsWarning] = useState(null)

  // === EFFECTS ===
  useEffect(() => {
    loadSettings()
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Polling Telegram при открытой модалке
  useEffect(() => {
    if (!telegramLink || telegramConnected) return
    const token = localStorage.getItem('token')
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/settings`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.data.telegram_chat_id) {
          setTelegramConnected(true)
          setTelegramLink(null)
        }
      } catch {}
    }, 3000)
    return () => clearInterval(interval)
  }, [telegramLink, telegramConnected])

  // === API ===
  const loadSettings = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API}/settings`, { headers: { Authorization: `Bearer ${token}` } })
      setUser({
        name: res.data.name || '',
        email: res.data.email || '',
        avatar: res.data.avatar || '',
      })
      setTelegramConnected(!!res.data.telegram_chat_id)
      setNotifications({
        notify_telegram: res.data.notify_telegram ?? false,
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

  // Автосохранение уведомлений
  const saveNotifications = async (next) => {
    setNotifications(next)
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/settings/notifications`, next, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (err) { console.error(err) }
  }

  // Автосохранение оплаты
  const savePayments = async (next) => {
    setPayments(next)
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/settings/payments`, next, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (err) { console.error(err) }
  }

  const toggleBank = (bank) => {
    setSelectedBanks(prev =>
      prev.includes(bank) ? prev.filter(b => b !== bank) : [...prev, bank]
    )
  }

  // Telegram подключение
  const connectTelegram = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.post(`${API}/settings/telegram/token`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTelegramLink(res.data.link)
    } catch (err) {
      alert('Не удалось получить ссылку')
    }
  }

  // Смена пароля
  const changePassword = async (e) => {
    e.preventDefault()
    setPwdError('')
    setPwdLoading(true)
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API}/auth/change-password`, {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.next,
      }, { headers: { Authorization: `Bearer ${token}` } })
      setPwdSaved(true)
      setPasswordForm({ current: '', next: '' })
      setTimeout(() => setPwdSaved(false), 3000)
    } catch (err) {
      setPwdError(err.response?.data?.error || 'Ошибка смены пароля')
    }
    setPwdLoading(false)
  }

  // Удаление аккаунта
  const submitDelete = async (forceConfirm = false) => {
    setDeleteError('')
    setDeleteLoading(true)
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API}/auth/delete-account`, {
        password: deletePassword,
        force: forceConfirm,
      }, { headers: { Authorization: `Bearer ${token}` } })
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      alert('Аккаунт помечен на удаление. 30 дней чтобы передумать — войди снова.')
      window.location.href = '/login'
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.error === 'has_future_bookings') {
        setBookingsWarning({ count: err.response.data.bookings_count || 0 })
        setDeleteLoading(false)
        return
      }
      setDeleteError(err.response?.data?.error || 'Ошибка удаления')
    }
    setDeleteLoading(false)
  }

  const closeDeleteFlow = () => {
    setShowDeleteModal(false)
    setDeletePassword('')
    setDeleteError('')
    setBookingsWarning(null)
  }

  // === РЕНДЕР СЕКЦИИ ===
  const renderSection = () => {
    const common = { isMobile }
    switch (section) {
      case 'account':
        return <AccountSection user={user} account={account} setAccount={setAccount} {...common} />
      case 'notifications':
        return <NotificationsSection
          notifications={notifications}
          setNotifications={saveNotifications}
          telegramConnected={telegramConnected}
          connectTelegram={connectTelegram}
          {...common}
        />
      case 'payments':
        return <PaymentsSection
          payments={payments}
          setPayments={savePayments}
          selectedBanks={selectedBanks}
          toggleBank={toggleBank}
          {...common}
        />
      case 'integrations':
        return <IntegrationsSection
          telegramConnected={telegramConnected}
          connectTelegram={connectTelegram}
          {...common}
        />
      case 'subscription':
        return <SubscriptionSection {...common} />
      case 'security':
        return <SecuritySection
          user={user}
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          showCurrentPwd={showCurrentPwd} setShowCurrentPwd={setShowCurrentPwd}
          showNextPwd={showNextPwd} setShowNextPwd={setShowNextPwd}
          pwdSaved={pwdSaved} pwdError={pwdError} pwdLoading={pwdLoading}
          changePassword={changePassword}
          setShowDeleteModal={setShowDeleteModal}
          {...common}
        />
      default:
        return null
    }
  }

  // === ПРЕВЬЮ ДЛЯ САЙДБАРА ===
  const previews = {
    account: account.timezone?.split('/').pop() || '—',
    notifications: [
      notifications.notify_email && 'Email',
      notifications.notify_telegram && 'Telegram',
    ].filter(Boolean).join(', ') || 'Выключены',
    payments: (() => {
      const count = Object.entries(payments).filter(([k, v]) =>
        k.startsWith('payment_') && k !== 'payment_other' && v === true
      ).length
      return count > 0 ? `${count} способа` : 'Не настроены'
    })(),
    integrations: [
      telegramConnected && 'Telegram',
      'Jitsi',
    ].filter(Boolean).join(', '),
    subscription: 'Free',
    security: 'Пароль · Аккаунт',
  }

  // ========================================
  // === МОБАЙЛ: список или fullscreen ===
  // ========================================
  if (isMobile) {
    return (
      <AppLayout>
        {!mobileShowDetail ? (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 20px' }}>Настройки</h2>
            <div style={{
              background: C.cardSoft,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              {SECTIONS.map((s, i) => {
                const Icon = s.icon
                return (
                  <div
                    key={s.key}
                    onClick={() => { setSection(s.key); setMobileShowDetail(true) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px',
                      borderBottom: i === SECTIONS.length - 1 ? 'none' : `1px solid ${C.borderSoft}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: C.card, border: `1px solid ${C.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={14} color={C.text} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{s.label}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{previews[s.key]}</div>
                    </div>
                    <ChevronRight size={18} color={C.mutedLight} />
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <div
              onClick={() => setMobileShowDetail(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                cursor: 'pointer', marginBottom: 16,
                fontSize: 14, color: C.text,
              }}
            >
              <ChevronLeft size={18} />
              <span style={{ color: C.muted }}>Настройки</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 20px' }}>
              {SECTIONS.find(s => s.key === section)?.label}
            </h2>
            {renderSection()}
          </>
        )}

        {/* Модалки */}
        {telegramLink && (
          <TelegramConnectModal
            telegramLink={telegramLink}
            onClose={() => setTelegramLink(null)}
          />
        )}
        {showDeleteModal && (
          <DeleteAccountModal
            password={deletePassword}
            setPassword={setDeletePassword}
            error={deleteError}
            loading={deleteLoading}
            bookingsWarning={bookingsWarning}
            onSubmit={submitDelete}
            onClose={closeDeleteFlow}
          />
        )}
      </AppLayout>
    )
  }

  // ========================================
  // === ДЕСКТОП: master-detail ===
  // ========================================
  return (
    <AppLayout>
      <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 24px' }}>Настройки</h2>

      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        minHeight: 520,
      }}>
        {/* Сайдбар */}
        <div style={{
          background: C.cardSoft,
          padding: '10px 8px',
          borderRight: `1px solid ${C.border}`,
        }}>
          {SECTIONS.map(s => {
            const active = section === s.key
            return (
              <div
                key={s.key}
                onClick={() => setSection(s.key)}
                style={{
                  padding: '10px 12px',
                  paddingLeft: active ? 9 : 12,
                  marginBottom: 2,
                  background: active ? C.card : 'transparent',
                  borderLeft: active ? `3px solid ${C.lime}` : 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  color: C.text,
                }}>{s.label}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                  {previews[s.key]}
                </div>
              </div>
            )
          })}
        </div>

        {/* Контент */}
        <div style={{ padding: '24px 28px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: C.text }}>
            {SECTIONS.find(s => s.key === section)?.label}
          </div>
          {renderSection()}
        </div>
      </div>

      {/* Модалки */}
      {telegramLink && (
        <TelegramConnectModal
          telegramLink={telegramLink}
          onClose={() => setTelegramLink(null)}
        />
      )}
      {showDeleteModal && (
        <DeleteAccountModal
          password={deletePassword}
          setPassword={setDeletePassword}
          error={deleteError}
          loading={deleteLoading}
          bookingsWarning={bookingsWarning}
          onSubmit={submitDelete}
          onClose={closeDeleteFlow}
        />
      )}
    </AppLayout>
  )
}

// ============ ЗАГЛУШКИ СЕКЦИЙ (заполнятся следующими шагами) ============

function AccountSection({ user, account, setAccount, isMobile }) {
  // Список часовых поясов — основные мировые + СНГ
  const TIMEZONES = [
    'Europe/Moscow', 'Europe/Kiev', 'Europe/Minsk',
    'Asia/Almaty', 'Asia/Tashkent', 'Asia/Yerevan', 'Asia/Tbilisi',
    'Asia/Bangkok', 'Asia/Dubai', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Singapore',
    'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Lisbon',
    'America/New_York', 'America/Los_Angeles', 'America/Mexico_City',
    'UTC',
  ]

  return (
    <>
      <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px' }}>
        Личные настройки аккаунта. Имя, фото и описание — на странице Профиль.
      </p>

      <Group label="Основное">
        {/* Email — инфо */}
        <Row
          left="Email"
          right={<span style={{ fontSize: 14, color: C.muted }}>{user.email || '—'}</span>}
        />
        {/* Часовой пояс */}
        <Row
          left="Часовой пояс"
          right={
            <select
              value={account.timezone}
              onChange={e => setAccount({ ...account, timezone: e.target.value })}
              style={{
                border: 'none', background: 'transparent',
                fontSize: 14, color: C.text, cursor: 'pointer',
                appearance: 'none', paddingRight: 18, textAlign: 'right',
                fontFamily: 'Inter, sans-serif',
                backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'9,18 15,12 9,6\'/></svg>")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right center',
              }}
            >
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          }
        />
        {/* Язык */}
        <Row
          left="Язык"
          sub="Скоро английский"
          right={<span style={{ fontSize: 14, color: C.muted }}>RU</span>}
          disabled
        />
        {/* Валюта */}
        <Row
          last
          left="Валюта"
          sub="Скоро"
          right={<span style={{ fontSize: 14, color: C.muted }}>₽</span>}
          disabled
        />
      </Group>
    </>
  )
}
function NotificationsSection({ notifications, setNotifications, telegramConnected, connectTelegram, isMobile }) {
  const iconSize = isMobile ? 28 : 32

  const items = [
    {
      key: 'notify_telegram',
      label: 'Telegram',
      sub: 'Уведомления о новых записях',
      icon: <IconBadge size={iconSize} bg="#2AABEE" border={false}>
        <svg width={iconSize * 0.55} height={iconSize * 0.55} viewBox="0 0 24 24" fill="#fff">
          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
        </svg>
      </IconBadge>,
      onChange: () => {
        if (!telegramConnected) {
          connectTelegram()
          return
        }
        setNotifications({ ...notifications, notify_telegram: !notifications.notify_telegram })
      },
      value: notifications.notify_telegram,
      disabled: false,
    },
    {
      key: 'notify_email',
      label: 'Email',
      sub: 'Уведомления на почту',
      icon: <IconBadge size={iconSize} bg="#666" border={false}>
        <Mail size={iconSize * 0.5} color="#fff" />
      </IconBadge>,
      onChange: () => setNotifications({ ...notifications, notify_email: !notifications.notify_email }),
      value: notifications.notify_email,
      disabled: false,
    },
    {
      key: 'notify_whatsapp',
      label: 'WhatsApp',
      sub: 'Скоро',
      icon: <IconBadge size={iconSize} bg="#E8E7E0" border={false}>
        <MessageCircle size={iconSize * 0.5} color="#BBB" />
      </IconBadge>,
      value: false,
      disabled: true,
    },
    {
      key: 'notify_max',
      label: 'Макс',
      sub: 'Скоро',
      icon: <IconBadge size={iconSize} bg="#E8E7E0" border={false}>
        <span style={{ fontSize: iconSize * 0.5, fontWeight: 700, color: '#BBB' }}>М</span>
      </IconBadge>,
      value: false,
      disabled: true,
    },
  ]

  return (
    <>
      <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px' }}>
        Получай уведомления о новых записях, переносах и отменах.
      </p>

      <Group>
        {items.map((it, i) => (
          <Row
            key={it.key}
            last={i === items.length - 1}
            left={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {it.icon}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: it.disabled ? C.muted : C.text }}>
                    {it.label}
                  </div>
                  <div style={{ fontSize: 12, color: it.disabled ? C.mutedLight : C.mutedLight, marginTop: 1 }}>
                    {it.sub}
                  </div>
                </div>
              </div>
            }
            right={<Toggle on={it.value} onClick={it.onChange} disabled={it.disabled} />}
          />
        ))}
      </Group>
    </>
  )
}
function PaymentsSection({ payments, setPayments, selectedBanks, toggleBank, isMobile }) {
  const groups = [
    {
      label: 'Россия',
      items: [
        { key: 'payment_sbp', label: 'СБП', sub: 'Быстрые переводы по номеру телефона' },
        { key: 'payment_tinkoff', label: 'Российская карта / банк', sub: 'Сбер, Т-Банк, Альфа, ВТБ и др.' },
      ],
    },
    {
      label: 'Международные',
      items: [
        { key: 'payment_paypal', label: 'PayPal' },
        { key: 'payment_wise', label: 'Wise' },
        { key: 'payment_sber', label: 'Revolut' },
        { key: 'payment_bank', label: 'Банковский перевод', sub: 'IBAN / SWIFT' },
      ],
    },
    {
      label: 'Крипто',
      items: [
        { key: 'payment_usdt', label: 'USDT', sub: 'Криптовалюта' },
      ],
    },
  ]

  const togglePayment = (key) => {
    setPayments({ ...payments, [key]: !payments[key] })
  }

  return (
    <>
      <p style={{ fontSize: 13, color: C.muted, margin: '0 0 12px' }}>
        Выбери способы, которыми ты принимаешь оплату напрямую. Клиент увидит их при бронировании.
      </p>
      <div style={{
        background: C.cardSoft,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 12, color: C.muted,
        marginBottom: 24,
        lineHeight: 1.5,
      }}>
        🔒 Kogda не принимает платежи и не хранит реквизиты. Детали оплаты ты согласуешь с клиентом напрямую.
      </div>

      {groups.map(group => (
        <Group key={group.label} label={group.label}>
          {group.items.map((it, i) => (
            <Row
              key={it.key}
              last={i === group.items.length - 1}
              left={
                <div>
                  <div style={{ fontSize: 14, color: C.text }}>{it.label}</div>
                  {it.sub && (
                    <div style={{ fontSize: 12, color: C.mutedLight, marginTop: 1 }}>{it.sub}</div>
                  )}
                </div>
              }
              right={
                <Toggle on={!!payments[it.key]} onClick={() => togglePayment(it.key)} />
              }
            />
          ))}
        </Group>
      ))}

      {/* Подгруппа банков — появляется когда выбрана "Российская карта / банк" */}
      {payments.payment_tinkoff && (
        <Group label="Уточни банк, если хочешь">
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 12, color: C.mutedLight, marginBottom: 12 }}>
              Это поможет клиенту понять, удобно ли ему оплатить.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {BANKS.map(bank => {
                const sel = selectedBanks.includes(bank)
                return (
                  <div
                    key={bank}
                    onClick={() => toggleBank(bank)}
                    style={{
                      padding: '6px 14px', borderRadius: 100,
                      cursor: 'pointer', fontSize: 13,
                      border: `1.5px solid ${sel ? C.text : '#E0E0D8'}`,
                      background: sel ? C.text : C.card,
                      color: sel ? C.card : C.text,
                      fontWeight: sel ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {bank}
                  </div>
                )
              })}
            </div>
          </div>
        </Group>
      )}

      {/* Свой способ */}
      <Group label="Свой способ">
        <div style={{ padding: '12px 14px' }}>
          <input
            value={payments.payment_other || ''}
            onChange={e => setPayments({ ...payments, payment_other: e.target.value })}
            placeholder="Например: Kaspi, Zelle, Venmo, Pix, наличные…"
            style={{
              width: '100%',
              border: 'none', outline: 'none',
              background: 'transparent',
              fontSize: 14, fontFamily: 'Inter, sans-serif',
              color: C.text,
            }}
          />
        </div>
      </Group>
    </>
  )
}
function IntegrationsSection({ telegramConnected, connectTelegram, isMobile }) {
  const iconSize = isMobile ? 28 : 32

  // Иконка-компонент (отрисованные SVG-плашки)
  const renderIcon = (kind, disabled = false) => {
    const s = iconSize
    if (kind === 'telegram') return (
      <IconBadge size={s} bg="#2AABEE" border={false}>
        <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24" fill="#fff">
          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
        </svg>
      </IconBadge>
    )
    if (kind === 'gcal') return (
      <IconBadge size={s} bg={C.card}>
        <div style={{
          width: s * 0.65, height: s * 0.6, borderRadius: 3,
          background: '#4285F4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: s * 0.28, fontWeight: 700, color: '#fff',
        }}>31</div>
      </IconBadge>
    )
    if (kind === 'apple') return (
      <IconBadge size={s} bg={C.card}>
        <span style={{ fontSize: s * 0.55, color: disabled ? '#AAA' : '#111' }}>􀎫</span>
      </IconBadge>
    )
    if (kind === 'yandex-cal') return (
      <IconBadge size={s} bg="#FC3F1D" border={false}>
        <span style={{ fontSize: s * 0.4, fontWeight: 700, color: '#fff' }}>23</span>
      </IconBadge>
    )
    if (kind === 'jitsi') return (
      <IconBadge size={s} bg={C.card}>
        <span style={{ fontSize: s * 0.55, fontWeight: 700, color: '#1976D2' }}>J</span>
      </IconBadge>
    )
    if (kind === 'zoom') return (
      <IconBadge size={s} bg="#2D8CFF" border={false}>
        <span style={{ fontSize: s * 0.3, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>zoom</span>
      </IconBadge>
    )
    if (kind === 'meet') return (
      <IconBadge size={s} bg={C.card}>
        <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24">
          <rect x="3" y="7" width="13" height="10" rx="1.5" fill="#00897B"/>
          <polygon points="16,9 21,7 21,17 16,15" fill="#FBC02D"/>
        </svg>
      </IconBadge>
    )
    if (kind === 'telemost') return (
      <IconBadge size={s} bg="#5C5C5C" border={false}>
        <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24">
          <circle cx="9" cy="12" r="4" fill="#fff"/>
          <circle cx="16" cy="12" r="2" fill="#7CFF00"/>
        </svg>
      </IconBadge>
    )
    return null
  }

  // Универсальная строка интеграции
  const IntegrationRow = ({ icon, label, sub, value, onChange, disabled = false, last = false }) => (
    <Row
      last={last}
      left={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {icon}
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: disabled ? C.muted : C.text }}>{label}</div>
            <div style={{ fontSize: 12, color: C.mutedLight, marginTop: 1 }}>{sub}</div>
          </div>
        </div>
      }
      right={<Toggle on={value} onClick={onChange} disabled={disabled} />}
    />
  )

  return (
    <>
      <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px' }}>
        Подключи внешние сервисы для уведомлений, календарей и видеовстреч.
      </p>

      <Group label="Уведомления">
        <IntegrationRow
          last
          icon={renderIcon('telegram')}
          label="Telegram бот"
          sub="Уведомления о новых записях"
          value={telegramConnected}
          onChange={() => { if (!telegramConnected) connectTelegram() }}
        />
      </Group>

      <Group label="Календари">
        <IntegrationRow
          icon={renderIcon('gcal', true)}
          label="Google Calendar"
          sub="Синхронизация встреч · Скоро"
          value={false}
          disabled
        />
        <IntegrationRow
          icon={renderIcon('apple', true)}
          label="Apple Calendar"
          sub="Синхронизация встреч · Скоро"
          value={false}
          disabled
        />
        <IntegrationRow
          last
          icon={renderIcon('yandex-cal', true)}
          label="Яндекс Календарь"
          sub="Синхронизация встреч · Скоро"
          value={false}
          disabled
        />
      </Group>

      <Group label="Видеовстречи">
        <IntegrationRow
          icon={renderIcon('jitsi')}
          label="Jitsi"
          sub="Автоматические ссылки — используется"
          value={true}
          onChange={() => {}}
        />
        <IntegrationRow
          icon={renderIcon('zoom', true)}
          label="Zoom"
          sub="Автоматические ссылки · Скоро"
          value={false}
          disabled
        />
        <IntegrationRow
          icon={renderIcon('meet', true)}
          label="Google Meet"
          sub="Автоматические ссылки · Скоро"
          value={false}
          disabled
        />
        <IntegrationRow
          last
          icon={renderIcon('telemost', true)}
          label="Яндекс Телемост"
          sub="Автоматические ссылки · Скоро"
          value={false}
          disabled
        />
      </Group>
    </>
  )
}
function SubscriptionSection({ isMobile }) {
  // Текущий тариф (заглушка) — пока всегда Free
  const currentTier = 'free'

  const tiers = [
    { key: 'free',    label: 'Free',    sub: 'Базовый функционал' },
    { key: 'pro',     label: 'Pro',     sub: 'Свой никнейм · 990 ₽/мес' },
    { key: 'premium', label: 'Premium', sub: 'Свой домен · 2990 ₽/мес' },
  ]

  const onSelect = (key) => {
    if (key === currentTier) return
    window.location.href = '/premium'
  }

  return (
    <>
      <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px' }}>
        Выбери план kogDA. Тарифы пока в разработке — функционал может меняться.
      </p>

      <Group label="Текущий тариф">
        {tiers.map((t, i) => {
          const active = t.key === currentTier
          return (
            <Row
              key={t.key}
              last={i === tiers.length - 1}
              onClick={() => onSelect(t.key)}
              left={
                <div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    color: C.text,
                  }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: C.mutedLight, marginTop: 1 }}>{t.sub}</div>
                </div>
              }
              right={<Toggle on={active} onClick={() => onSelect(t.key)} />}
            />
          )
        })}
      </Group>

      <div style={{ fontSize: 12, color: C.muted, paddingLeft: 4, lineHeight: 1.6 }}>
        Сейчас включён <span style={{ color: C.text, fontWeight: 600 }}>Free</span>.
        Тап на другой тариф откроет страницу выбора плана.
      </div>
    </>
  )
}
function SecuritySection({
  user,
  passwordForm, setPasswordForm,
  showCurrentPwd, setShowCurrentPwd,
  showNextPwd, setShowNextPwd,
  pwdSaved, pwdError, pwdLoading, changePassword,
  setShowDeleteModal,
  isMobile,
}) {
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    background: C.card,
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    color: C.text,
  }

  return (
    <>
      <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px' }}>
        Управляй паролем и удалением аккаунта.
      </p>

      {/* === EMAIL === */}
      <Group label="Аккаунт">
        <Row
          last
          left={
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>Email</div>
              <div style={{ fontSize: 14, color: C.text }}>{user.email || '—'}</div>
            </div>
          }
          right={
            <button
              onClick={() => alert('Скоро')}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13, fontWeight: 500, color: C.text,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Изменить
            </button>
          }
        />
      </Group>

      {/* === ПАРОЛЬ === */}
      <Group label="Пароль">
        <div style={{ padding: '16px' }}>
          {pwdError && (
            <div style={{
              background: '#FEE2E2', color: C.danger,
              padding: '10px 14px', borderRadius: 8,
              marginBottom: 12, fontSize: 13,
            }}>{pwdError}</div>
          )}
          {pwdSaved && (
            <div style={{
              background: '#DCFCE7', color: '#16A34A',
              padding: '10px 14px', borderRadius: 8,
              marginBottom: 12, fontSize: 13,
            }}>✓ Пароль изменён</div>
          )}

          <form onSubmit={changePassword}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>
                Текущий пароль
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPwd ? 'text' : 'password'}
                  value={passwordForm.current}
                  onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  required
                  autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPwd(s => !s)}
                  aria-label={showCurrentPwd ? 'Скрыть' : 'Показать'}
                  style={{
                    position: 'absolute', right: 8, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    padding: 8, color: C.muted,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>
                Новый пароль
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNextPwd ? 'text' : 'password'}
                  value={passwordForm.next}
                  onChange={e => setPasswordForm({ ...passwordForm, next: e.target.value })}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowNextPwd(s => !s)}
                  aria-label={showNextPwd ? 'Скрыть' : 'Показать'}
                  style={{
                    position: 'absolute', right: 8, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    padding: 8, color: C.muted,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showNextPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: isMobile ? 'center' : 'flex-end',
            }}>
              <button
                type="submit"
                disabled={pwdLoading}
                style={{
                  background: C.text, color: C.card,
                  border: 'none', borderRadius: 8,
                  padding: '10px 20px',
                  fontSize: 13, fontWeight: 600,
                  cursor: pwdLoading ? 'default' : 'pointer',
                  opacity: pwdLoading ? 0.6 : 1,
                  fontFamily: 'Inter, sans-serif',
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                {pwdLoading ? 'Сохраняю…' : 'Сменить пароль'}
              </button>
            </div>
          </form>
        </div>
      </Group>

      {/* === ОПАСНАЯ ЗОНА === */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 13, fontWeight: 500, color: C.danger,
          marginBottom: 10, paddingLeft: 4,
        }}>Опасная зона</div>
        <div style={{
          background: C.cardSoft,
          border: `1px solid ${C.dangerBorder}`,
          borderRadius: 12,
          padding: '16px',
        }}>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 14 }}>
            Удаление аккаунта отложенное: 30 дней на передумать.
            Просто войди снова — аккаунт восстановится. Через 30 дней все данные удалятся навсегда.
          </div>
          <div style={{
            display: 'flex',
            justifyContent: isMobile ? 'center' : 'flex-end',
          }}>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                background: 'transparent',
                color: C.danger,
                border: `1.5px solid ${C.dangerBorder}`,
                borderRadius: 8,
                padding: '9px 18px',
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'Inter, sans-serif',
                width: isMobile ? '100%' : 'auto',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={14} />
              Удалить аккаунт
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ============ МОДАЛКИ ============

function TelegramConnectModal({ telegramLink, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.card, borderRadius: 16,
          padding: '32px 28px 24px', maxWidth: 440, width: '100%',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#E8F4FB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#229ED9">
              <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
            </svg>
          </div>
        </div>

        <div style={{
          fontSize: 20, fontWeight: 700, textAlign: 'center',
          marginBottom: 8, color: C.text,
        }}>
          Подключить Telegram
        </div>
        <div style={{
          fontSize: 14, color: '#666', textAlign: 'center',
          lineHeight: 1.5, marginBottom: 24,
        }}>
          Бот будет присылать тебе уведомления о новых записях.
        </div>

        {/* Шаги */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: C.cardSoft,
              border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, color: C.text,
              flexShrink: 0,
            }}>1</div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5, paddingTop: 2 }}>
              Открой бота kogDA в Telegram
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: C.cardSoft,
              border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, color: C.text,
              flexShrink: 0,
            }}>2</div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5, paddingTop: 2 }}>
              Нажми START — окно закроется автоматически
            </div>
          </div>
        </div>

        <a
          href={telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block', textAlign: 'center',
            background: '#229ED9', color: '#fff',
            borderRadius: 10, padding: '12px',
            fontSize: 14, fontWeight: 600,
            textDecoration: 'none', marginBottom: 10,
          }}
        >
          Открыть бота
        </a>
        <button
          onClick={onClose}
          style={{
            width: '100%', background: 'transparent',
            border: 'none', cursor: 'pointer',
            padding: '10px', fontSize: 13, color: C.muted,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Отмена
        </button>
      </div>
    </div>
  )
}

function DeleteAccountModal({
  password, setPassword, error, loading, bookingsWarning, onSubmit, onClose,
}) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.card, borderRadius: 16,
          padding: '28px 28px 24px', maxWidth: 480, width: '100%',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Заголовок */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: '#FEE2E2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trash2 size={20} color={C.danger} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
            Удалить аккаунт?
          </div>
        </div>

        {/* === ШАГ 2: есть будущие записи === */}
        {bookingsWarning ? (
          <>
            <div style={{
              background: '#FEF3C7', borderRadius: 10,
              padding: '12px 14px', fontSize: 13, color: '#92400E',
              lineHeight: 1.5, marginBottom: 16,
            }}>
              У тебя {bookingsWarning.count > 0 ? `${bookingsWarning.count} ` : ''}будущих записей.
              Если удалить — они автоматически отменятся, и клиенты получат письма об отмене.
            </div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 20 }}>
              Аккаунт уйдёт в отложенное удаление на 30 дней. Если передумаешь — войди снова, и всё восстановится. Но клиенты уже получат письма.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, background: C.card,
                  border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: '11px', fontSize: 13, fontWeight: 500,
                  color: C.text, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Отмена
              </button>
              <button
                onClick={() => onSubmit(true)}
                disabled={loading}
                style={{
                  flex: 1, background: C.danger, color: '#fff',
                  border: 'none', borderRadius: 8,
                  padding: '11px', fontSize: 13, fontWeight: 600,
                  cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {loading ? 'Удаляю…' : 'Удалить всё равно'}
              </button>
            </div>
          </>
        ) : (
          /* === ШАГ 1: ввод пароля === */
          <>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 16 }}>
              Удаление отложенное: 30 дней чтобы передумать. Просто войди снова — аккаунт восстановится.
              Через 30 дней все данные удалятся навсегда.
            </div>

            {error && (
              <div style={{
                background: '#FEE2E2', color: C.danger,
                padding: '10px 14px', borderRadius: 8,
                marginBottom: 12, fontSize: 13,
              }}>{error}</div>
            )}

            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>
              Подтверди паролем
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Текущий пароль"
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${C.border}`,
                borderRadius: 8, fontSize: 14,
                fontFamily: 'Inter, sans-serif',
                outline: 'none', color: C.text,
                marginBottom: 16,
              }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, background: C.card,
                  border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: '11px', fontSize: 13, fontWeight: 500,
                  color: C.text, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Отмена
              </button>
              <button
                onClick={() => onSubmit(false)}
                disabled={loading || !password}
                style={{
                  flex: 1, background: C.danger, color: '#fff',
                  border: 'none', borderRadius: 8,
                  padding: '11px', fontSize: 13, fontWeight: 600,
                  cursor: loading || !password ? 'default' : 'pointer',
                  opacity: loading || !password ? 0.6 : 1,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {loading ? 'Удаляю…' : 'Удалить'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}