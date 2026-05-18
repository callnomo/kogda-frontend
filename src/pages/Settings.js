// kogda-frontend/src/pages/Settings.js
// Master-detail редизайн под iOS-стиль
// Версия от 14 мая 2026 — переписано с нуля
// 18 мая 2026 — заголовок страницы приведён к стандарту (h1 28/800/Inter, как Записи)

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import AppLayout from '../components/AppLayout'
import CurrencyPicker from '../components/CurrencyPicker'
import { getCurrencyLabel } from '../currencies'
import {
  User, Bell, CreditCard, Plug, Star, Lock,
  Mail, MessageCircle, Trash2, Eye, EyeOff, ChevronRight, ChevronLeft, X,
  Laptop, Smartphone, Monitor, Tablet, HelpCircle
} from 'lucide-react'

const API = process.env.REACT_APP_API_URL || 'https://kogda-backend-production.up.railway.app'

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

// Лейбл с info-иконкой и тултипом при hover/tap.
// Триггер — вся строка (слова + иконка).
// Иконка — настоящая курсивная буква (Georgia italic), не SVG-линия.
// Тултип рендерится через Portal в body, чтобы его не обрезала
// карточка Group с overflow:hidden.
function LabelWithTip({ label, tip }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const ref = useRef(null)

  // Пересчёт позиции тултипа по координатам лейбла
  const recalc = () => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setCoords({
      top: r.bottom + window.scrollY + 8,
      left: r.left + window.scrollX,
    })
  }

  useEffect(() => {
    if (!open) return
    recalc()
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onScrollResize = () => recalc()
    document.addEventListener('mousedown', onClick)
    document.addEventListener('touchstart', onClick)
    window.addEventListener('scroll', onScrollResize, true)
    window.addEventListener('resize', onScrollResize)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('touchstart', onClick)
      window.removeEventListener('scroll', onScrollResize, true)
      window.removeEventListener('resize', onScrollResize)
    }
  }, [open])

  return (
    <div
      ref={ref}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, position: 'relative' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => {
        e.stopPropagation()
        setOpen(o => !o)
      }}
    >
      <span style={{ fontSize: 14, color: C.text }}>{label}</span>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 16, height: 16, borderRadius: '50%',
        border: '1.4px solid #A8A69B', flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic', fontSize: 11, fontWeight: 600,
          color: '#8A887D', lineHeight: 1,
          transform: 'translateY(-0.5px)',
        }}>i</span>
      </span>
      {open && (
        <div style={{
          position: 'fixed',
          top: coords.top - window.scrollY,
          left: coords.left - window.scrollX,
          background: '#F0EFE9', color: '#444',
          padding: '10px 14px', borderRadius: 10,
          fontSize: 13, lineHeight: 1.5,
          width: 'min(280px, calc(100vw - 40px))',
          zIndex: 9999,
          boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
          border: '1px solid #E0E0D8',
          textTransform: 'none', letterSpacing: 0, fontWeight: 400,
          whiteSpace: 'normal',
        }}>
          {tip}
          <div style={{
            position: 'absolute',
            top: -7, left: 16,
            width: 12, height: 12,
            background: '#F0EFE9',
            borderLeft: '1px solid #E0E0D8',
            borderTop: '1px solid #E0E0D8',
            transform: 'rotate(45deg)',
          }} />
        </div>
      )}
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
  // Начальная секция: либо из ?section= в URL, либо 'account' по умолчанию
  const getInitialSection = () => {
    if (typeof window === 'undefined') return 'account'
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('section')
    const valid = SECTIONS.some(s => s.key === fromUrl)
    return valid ? fromUrl : 'account'
  }
  const [section, setSection] = useState(getInitialSection)
  const [mobileShowDetail, setMobileShowDetail] = useState(() => {
    if (typeof window === 'undefined') return false
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('section')
    return SECTIONS.some(s => s.key === fromUrl)
  })

  // === STATE ВСЕХ ФОРМ ===
  const [user, setUser] = useState({ name: '', email: '', avatar: '' })

  const [account, setAccount] = useState({
    timezone: 'Asia/Bangkok',
    language: 'ru',
    default_currency: 'USD',
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
    payment_sbp: false, payment_tinkoff: false,
    payment_paypal: false, payment_wise: false,
    payment_usdt: false, payment_bank: false,
    payment_other: '',
  })

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

  // Смена email
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailChangeSaved, setEmailChangeSaved] = useState(false)

  // Активные устройства
  const [devices, setDevices] = useState([])
  const [devicesLoading, setDevicesLoading] = useState(false)
  const [deviceRevokeTarget, setDeviceRevokeTarget] = useState(null) // null | { type: 'single', device } | { type: 'all', count }
  const [devicesRevokedToast, setDevicesRevokedToast] = useState('')

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
      setAccount(a => ({
        ...a,
        default_currency: res.data.default_currency || 'USD',
      }))
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

  // Автосохранение общих настроек аккаунта (валюта)
  const saveAccount = async (next) => {
    setAccount(next)
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/settings/account`, {
        default_currency: next.default_currency,
      }, {
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

  // Обновление email после успешной смены
  const onEmailChanged = (newEmail) => {
    setUser(u => ({ ...u, email: newEmail }))
    // Обновляем user в localStorage
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        const parsed = JSON.parse(stored)
        parsed.email = newEmail
        localStorage.setItem('user', JSON.stringify(parsed))
      }
    } catch {}
    setShowEmailModal(false)
    setEmailChangeSaved(true)
    setTimeout(() => setEmailChangeSaved(false), 5000)
  }

  // Загрузка активных устройств
  const loadDevices = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    setDevicesLoading(true)
    try {
      const res = await axios.get(`${API}/auth/devices`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      })
      setDevices(res.data.devices || [])
    } catch (err) {
      console.error('Load devices error:', err)
    }
    setDevicesLoading(false)
  }

  // Загружаем устройства при первом открытии секции "Безопасность"
  useEffect(() => {
    if (section === 'security') loadDevices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section])

  // Колбэк после успешного удаления устройства(в)
  const onDevicesRevoked = (result) => {
    setDeviceRevokeTarget(null)
    // Если удалили текущее — нас выкидывает
    if (result.was_current) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return
    }
    // Обновляем список
    loadDevices()
    // Показываем тост
    if (result.revoked_count !== undefined) {
      setDevicesRevokedToast(`Выход выполнен с ${result.revoked_count} устройств`)
    } else {
      setDevicesRevokedToast('Устройство удалено')
    }
    setTimeout(() => setDevicesRevokedToast(''), 4000)
  }

  // === РЕНДЕР СЕКЦИИ ===
  const renderSection = () => {
    const common = { isMobile }
    switch (section) {
      case 'account':
        return <AccountSection user={user} account={account} setAccount={saveAccount} {...common} />
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
          setShowEmailModal={setShowEmailModal}
          emailChangeSaved={emailChangeSaved}
          devices={devices}
          devicesLoading={devicesLoading}
          setDeviceRevokeTarget={setDeviceRevokeTarget}
          devicesRevokedToast={devicesRevokedToast}
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
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 28px', fontFamily: 'Inter, sans-serif' }}>Настройки</h1>
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
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 24px' }}>
              {section === 'payments' ? 'Способы оплаты' : SECTIONS.find(s => s.key === section)?.label}
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
        {showEmailModal && (
          <EmailChangeModal
            currentEmail={user.email}
            onSuccess={onEmailChanged}
            onClose={() => setShowEmailModal(false)}
          />
        )}
        {deviceRevokeTarget && (
          <DeviceRevokeModal
            target={deviceRevokeTarget}
            onSuccess={onDevicesRevoked}
            onClose={() => setDeviceRevokeTarget(null)}
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
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 28px', fontFamily: 'Inter, sans-serif' }}>Настройки</h1>

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
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: C.text }}>
            {section === 'payments' ? 'Способы оплаты' : SECTIONS.find(s => s.key === section)?.label}
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
      {showEmailModal && (
        <EmailChangeModal
          currentEmail={user.email}
          onSuccess={onEmailChanged}
          onClose={() => setShowEmailModal(false)}
        />
      )}
      {deviceRevokeTarget && (
        <DeviceRevokeModal
          target={deviceRevokeTarget}
          onSuccess={onDevicesRevoked}
          onClose={() => setDeviceRevokeTarget(null)}
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

  const currentLabel = getCurrencyLabel(account.default_currency) // например "₽ RUB" или "KGS" для custom

  return (
    <>
      <Group>
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
          right={<span style={{ fontSize: 14, color: C.muted }}>RU</span>}
          disabled
        />
        {/* Валюта — открывает оверлей */}
        <CurrencyPicker
          value={account.default_currency}
          onChange={(code) => setAccount({ ...account, default_currency: code })}
          colors={{
            text: C.text,
            muted: C.muted,
            mutedLight: C.mutedLight,
            border: C.border,
            borderSoft: C.borderSoft,
            bg: C.bg,
            card: C.card,
            cardSoft: C.cardSoft,
          }}
          renderTrigger={({ triggerRef, label, isOpen, onClick }) => (
            <div ref={triggerRef}>
              <Row
                last
                left={<LabelWithTip label="Валюта" tip="Валюта по умолчанию. У каждой услуги можно выбрать свою." />}
                onClick={onClick}
                right={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, color: C.muted }}>{label}</span>
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="#888" strokeWidth="2"
                      style={{
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0)',
                        transition: 'transform 0.15s',
                      }}
                    >
                      <polyline points="9,18 15,12 9,6" />
                    </svg>
                  </div>
                }
              />
            </div>
          )}
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
function PaymentsSection({ payments, setPayments, isMobile }) {
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

  // Оригинальные логотипы через CDN и локальные файлы
  const renderIcon = (kind) => {
    const s = iconSize
    const imgStyle = { width: s, height: s, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }
    const urls = {
      telegram: 'https://cdn.simpleicons.org/telegram/229ED9',
      gcal: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg',
      apple: 'https://cdn.simpleicons.org/apple/000000',
      'yandex-cal': '/icons/yandex-calendar.png',
      jitsi: 'https://cdn.simpleicons.org/jitsi/1d76ba',
      zoom: 'https://cdn.simpleicons.org/zoom/2D8CFF',
      meet: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg',
      telemost: '/icons/yandex-telemost.png',
    }
    return <img src={urls[kind]} alt={kind} style={imgStyle} />
  }

  // Универсальная строка интеграции
  const IntegrationRow = ({ icon, label, value, onChange, disabled = false, last = false }) => (
    <Row
      last={last}
      left={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {icon}
          <div style={{ fontSize: 14, fontWeight: 500, color: disabled ? C.muted : C.text }}>{label}</div>
        </div>
      }
      right={<Toggle on={value} onClick={onChange} disabled={disabled} />}
    />
  )

  return (
    <>
      <Group label="Уведомления">
        <IntegrationRow
          last
          icon={renderIcon('telegram')}
          label="Telegram бот"
          value={telegramConnected}
          onChange={() => { if (!telegramConnected) connectTelegram() }}
        />
      </Group>

      <Group label="Календари">
        <IntegrationRow
          icon={renderIcon('gcal', true)}
          label="Google Calendar"
          value={false}
          disabled
        />
        <IntegrationRow
          icon={renderIcon('apple', true)}
          label="Apple Calendar"
          value={false}
          disabled
        />
        <IntegrationRow
          last
          icon={renderIcon('yandex-cal', true)}
          label="Яндекс Календарь"
          value={false}
          disabled
        />
      </Group>

      <Group label="Видеовстречи">
        <IntegrationRow
          icon={renderIcon('jitsi')}
          label="Jitsi"
          value={true}
          onChange={() => {}}
        />
        <IntegrationRow
          icon={renderIcon('zoom', true)}
          label="Zoom"
          value={false}
          disabled
        />
        <IntegrationRow
          icon={renderIcon('meet', true)}
          label="Google Meet"
          value={false}
          disabled
        />
        <IntegrationRow
          last
          icon={renderIcon('telemost', true)}
          label="Яндекс Телемост"
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
    { key: 'free',    label: 'Free' },
    { key: 'pro',     label: 'Pro' },
    { key: 'premium', label: 'Premium' },
  ]

  const onSelect = (key) => {
    if (key === currentTier) return
    window.location.href = '/premium'
  }

  return (
    <Group>
      {tiers.map((t, i) => {
        const active = t.key === currentTier
        return (
          <Row
            key={t.key}
            last={i === tiers.length - 1}
            onClick={() => onSelect(t.key)}
            left={
              <div style={{
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: C.text,
              }}>{t.label}</div>
            }
            right={<Toggle on={active} onClick={() => onSelect(t.key)} />}
          />
        )
      })}
    </Group>
  )
}
function SecuritySection({
  user,
  passwordForm, setPasswordForm,
  showCurrentPwd, setShowCurrentPwd,
  showNextPwd, setShowNextPwd,
  pwdSaved, pwdError, pwdLoading, changePassword,
  setShowDeleteModal,
  setShowEmailModal,
  emailChangeSaved,
  devices, devicesLoading,
  setDeviceRevokeTarget,
  devicesRevokedToast,
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
      {emailChangeSaved && (
        <div style={{
          background: '#DCFCE7', color: '#16A34A',
          padding: '12px 16px', borderRadius: 10,
          marginBottom: 16, fontSize: 13, fontWeight: 500,
        }}>
          ✓ Email изменён. Используй новый адрес для входа.
        </div>
      )}

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
              onClick={() => setShowEmailModal(true)}
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

      {/* === АКТИВНЫЕ УСТРОЙСТВА === */}
      {devicesRevokedToast && (
        <div style={{
          background: '#DCFCE7', color: '#16A34A',
          padding: '12px 16px', borderRadius: 10,
          marginBottom: 16, fontSize: 13, fontWeight: 500,
        }}>
          ✓ {devicesRevokedToast}
        </div>
      )}

      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, marginTop: 24 }}>
        Активные устройства
      </div>
      <div style={{
        background: C.cardSoft,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
      }}>
        {devicesLoading && devices.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: C.muted }}>
            Загрузка…
          </div>
        ) : devices.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: C.muted }}>
            Нет активных устройств
          </div>
        ) : (
          devices.map((d, i) => (
            <DeviceRow
              key={d.id}
              device={d}
              last={i === devices.length - 1}
              onRevoke={() => setDeviceRevokeTarget({ type: 'single', device: d })}
            />
          ))
        )}
      </div>

      {devices.filter(d => !d.is_current).length > 0 && (
        <div style={{ textAlign: 'right', marginBottom: 24 }}>
          <button
            onClick={() => setDeviceRevokeTarget({
              type: 'all',
              count: devices.filter(d => !d.is_current).length,
            })}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: 13, fontWeight: 500, color: C.danger,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Выйти со всех других устройств
          </button>
        </div>
      )}

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
            Через 30 дней твой аккаунт и вся информация будут удалены навсегда, и ты не сможешь их восстановить. Чтобы отменить удаление аккаунта, войди в аккаунт в течение 30 дней.
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

// ============ МОДАЛКА СМЕНЫ EMAIL ============

function EmailChangeModal({ currentEmail, onSuccess, onClose }) {
  const [step, setStep] = useState('request') // 'request' | 'verify'
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const codeRefs = useRef([])
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Esc → закрыть (с отменой запроса на бэке если был)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [step])

  // Cooldown тикалка
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const handleClose = async () => {
    // Если на шаге verify — отменяем запрос на бэке
    if (step === 'verify') {
      const token = localStorage.getItem('token')
      try {
        await axios.delete(`${API}/auth/cancel-email-change`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } catch {}
    }
    onClose()
  }

  const requestCode = async (e) => {
    e?.preventDefault()
    setError('')
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API}/auth/request-email-change`, {
        newEmail: newEmail.trim().toLowerCase(),
        currentPassword: password,
      }, { headers: { Authorization: `Bearer ${token}` } })
      setStep('verify')
      setResendCooldown(60)
      setTimeout(() => codeRefs.current[0]?.focus(), 50)
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка. Попробуй ещё раз.')
    }
    setLoading(false)
  }

  const verifyCode = async (codeStr) => {
    setError('')
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const res = await axios.post(`${API}/auth/verify-email-change`, {
        code: codeStr,
      }, { headers: { Authorization: `Bearer ${token}` } })
      onSuccess(res.data.new_email)
    } catch (err) {
      const data = err.response?.data
      if (data?.expired) {
        setError(data.error || 'Запроси код заново')
        setStep('request')
        setCode(['', '', '', '', '', ''])
        setPassword('')
      } else {
        setError(data?.error || 'Неверный код')
        setCode(['', '', '', '', '', ''])
        setTimeout(() => codeRefs.current[0]?.focus(), 50)
      }
    }
    setLoading(false)
  }

  const resendCode = async () => {
    if (resendCooldown > 0) return
    setError('')
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      // На бэке тот же endpoint — но нам нужен пароль которого у нас уже нет
      // Поэтому возвращаем на первый шаг
      setStep('request')
      setCode(['', '', '', '', '', ''])
      setLoading(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка отправки')
      setLoading(false)
    }
  }

  const handleCodeChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 1)
    const newCode = [...code]
    newCode[index] = cleaned
    setCode(newCode)
    setError('')
    if (cleaned && index < 5) {
      codeRefs.current[index + 1]?.focus()
    }
    if (newCode.every(c => c) && newCode.join('').length === 6) {
      verifyCode(newCode.join(''))
    }
  }

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const newCode = pasted.split('')
      setCode(newCode)
      verifyCode(pasted)
    }
  }

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
    boxSizing: 'border-box',
  }

  const codeBoxStyle = (filled) => ({
    width: 40, height: 50,
    borderRadius: 8,
    border: `1.5px solid ${filled ? C.text : C.border}`,
    fontSize: 22, fontWeight: 700,
    textAlign: 'center', outline: 'none',
    background: C.card, fontFamily: 'inherit',
    color: C.text,
    boxSizing: 'border-box',
  })

  return (
    <div
      onClick={handleClose}
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
          padding: '28px 28px 24px', maxWidth: 440, width: '100%',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Иконка */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#FAF9F3', border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mail size={26} color={C.text} />
          </div>
        </div>

        <div style={{
          fontSize: 20, fontWeight: 700, textAlign: 'center',
          marginBottom: 8, color: C.text,
        }}>
          {step === 'request' ? 'Сменить email' : 'Введи код'}
        </div>
        <div style={{
          fontSize: 13, color: C.muted, textAlign: 'center',
          lineHeight: 1.5, marginBottom: 24,
        }}>
          {step === 'request' ? (
            <>Текущий email: <b style={{ color: C.text }}>{currentEmail}</b></>
          ) : (
            <>Код отправлен на <b style={{ color: C.text }}>{newEmail}</b></>
          )}
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2', color: C.danger,
            padding: '10px 14px', borderRadius: 8,
            marginBottom: 16, fontSize: 13,
          }}>{error}</div>
        )}

        {/* ШАГ 1: запрос кода */}
        {step === 'request' && (
          <form onSubmit={requestCode}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>
                Новый email
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                placeholder="новый@email.com"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>
                Текущий пароль
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Скрыть' : 'Показать'}
                  style={{
                    position: 'absolute', right: 8, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    padding: 8, color: C.muted,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleClose}
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
                type="submit"
                disabled={loading || !newEmail || !password}
                style={{
                  flex: 1, background: C.text, color: C.card,
                  border: 'none', borderRadius: 8,
                  padding: '11px', fontSize: 13, fontWeight: 600,
                  cursor: (loading || !newEmail || !password) ? 'default' : 'pointer',
                  opacity: (loading || !newEmail || !password) ? 0.6 : 1,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {loading ? 'Отправляем…' : 'Получить код'}
              </button>
            </div>
          </form>
        )}

        {/* ШАГ 2: ввод кода */}
        {step === 'verify' && (
          <div>
            <div style={{
              display: 'flex', gap: 6, justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => codeRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(i, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(i, e)}
                  onPaste={i === 0 ? handleCodePaste : undefined}
                  disabled={loading}
                  style={codeBoxStyle(!!digit)}
                />
              ))}
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              {resendCooldown > 0 ? (
                <p style={{ fontSize: 13, color: C.mutedLight, margin: 0 }}>
                  Отправить новый код через {resendCooldown}с
                </p>
              ) : (
                <button
                  onClick={resendCode}
                  disabled={loading}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: C.text, fontWeight: 600,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Отправить код заново
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  setStep('request')
                  setCode(['', '', '', '', '', ''])
                  setError('')
                }}
                style={{
                  flex: 1, background: C.card,
                  border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: '11px', fontSize: 13, fontWeight: 500,
                  color: C.text, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Изменить email
              </button>
              <button
                onClick={handleClose}
                style={{
                  flex: 1, background: 'transparent',
                  border: 'none',
                  padding: '11px', fontSize: 13, fontWeight: 500,
                  color: C.muted, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============ DEVICE ROW (карточка устройства) ============

function getDeviceIcon(label) {
  if (!label) return HelpCircle
  const l = label.toLowerCase()
  // Tablet проверяем ДО смартфонов, иначе iPad попадёт в Smartphone
  if (l.includes('ipad') || l.includes('tablet')) return Tablet
  if (l.includes('iphone') || l.includes('android')) return Smartphone
  if (l.includes('mac')) return Laptop
  if (l.includes('windows') || l.includes('linux')) return Monitor
  return HelpCircle
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'только что'
  if (diffMin < 60) return `${diffMin} мин назад`
  if (diffHr < 24) return `${diffHr} ч назад`
  if (diffDay === 1) return 'вчера'
  if (diffDay < 7) return `${diffDay} дн назад`
  if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7)
    return `${weeks} нед назад`
  }
  const months = Math.floor(diffDay / 30)
  return `${months} мес назад`
}

function DeviceRow({ device, last, onRevoke }) {
  const Icon = getDeviceIcon(device.device_label)
  const locationStr = device.last_city
    ? `${device.last_city}${device.last_country ? ', ' + device.last_country : ''}`
    : 'Локация неизвестна'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${C.border}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: C.card, border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={18} color={C.text} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, color: C.text }}>
            {device.device_label || 'Неизвестное устройство'}
          </span>
          {device.is_current && (
            <span style={{
              fontSize: 11, fontWeight: 500,
              color: '#555',
              background: C.lime,
              padding: '2px 8px',
              borderRadius: 4,
            }}>
              Этот девайс
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: C.muted }}>
          {locationStr} · {formatRelativeTime(device.last_used_at)}
        </div>
      </div>
      {!device.is_current && (
        <button
          onClick={onRevoke}
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13, fontWeight: 500, color: C.text,
            cursor: 'pointer',
            flexShrink: 0,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Выйти
        </button>
      )}
    </div>
  )
}

// ============ DEVICE REVOKE MODAL ============

function DeviceRevokeModal({ target, onSuccess, onClose }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const isAll = target.type === 'all'

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setError('')
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      let res
      if (isAll) {
        res = await axios.delete(`${API}/auth/devices`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { password },
          withCredentials: true,
        })
      } else {
        res = await axios.delete(`${API}/auth/devices/${target.device.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { password },
          withCredentials: true,
        })
      }
      onSuccess(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка. Попробуй ещё раз.')
    }
    setLoading(false)
  }

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
    boxSizing: 'border-box',
  }

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
          padding: '28px 28px 24px', maxWidth: 420, width: '100%',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#FAF9F3', border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={26} color={C.text} />
          </div>
        </div>

        <div style={{
          fontSize: 20, fontWeight: 700, textAlign: 'center',
          marginBottom: 8, color: C.text,
        }}>
          {isAll ? 'Выйти со всех устройств?' : 'Выйти из устройства?'}
        </div>
        <div style={{
          fontSize: 13, color: C.muted, textAlign: 'center',
          lineHeight: 1.5, marginBottom: 24,
        }}>
          {isAll ? (
            <>Выйдем с <b style={{ color: C.text }}>{target.count}</b> {target.count === 1 ? 'устройства' : 'устройств'} кроме текущего.</>
          ) : (
            <>
              <b style={{ color: C.text }}>{target.device.device_label}</b>
              <br />
              {target.device.last_city
                ? `${target.device.last_city}${target.device.last_country ? ', ' + target.device.last_country : ''}`
                : 'Локация неизвестна'}
            </>
          )}
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2', color: C.danger,
            padding: '10px 14px', borderRadius: 8,
            marginBottom: 16, fontSize: 13,
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>
              Подтверди паролем
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Скрыть' : 'Показать'}
                style={{
                  position: 'absolute', right: 8, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: 8, color: C.muted,
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
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
              type="submit"
              disabled={loading || !password}
              style={{
                flex: 1, background: C.danger, color: '#fff',
                border: 'none', borderRadius: 8,
                padding: '11px', fontSize: 13, fontWeight: 600,
                cursor: (loading || !password) ? 'default' : 'pointer',
                opacity: (loading || !password) ? 0.6 : 1,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {loading ? 'Выходим…' : 'Выйти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}