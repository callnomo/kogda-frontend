import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { User, Bell, CreditCard, Plug, ChevronRight, Settings as SettingsIcon, Clock, BookOpen, Lock, Eye, EyeOff, Trash2, Camera } from 'lucide-react'

const API = process.env.REACT_APP_API_URL || 'https://kogda-backend-production.up.railway.app'

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

const labelStyle = { fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }

const primaryBtn = (saved) => ({
  background: saved ? '#22C55E' : '#111', color: '#fff',
  border: 'none', padding: '13px 28px', borderRadius: 10,
  fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background 0.3s'
})

// ---- Small components ----
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

const TABS = [
  { id: 'profile', label: 'Профиль', icon: User },
  { id: 'notifications', label: 'Уведомления', icon: Bell },
  { id: 'payments', label: 'Оплата', icon: CreditCard },
  { id: 'integrations', label: 'Интеграции', icon: Plug },
  { id: 'security', label: 'Безопасность', icon: Lock },
]

const SECTION_TITLES = {
  profile: 'Профиль',
  notifications: 'Уведомления',
  payments: 'Способы оплаты',
  integrations: 'Интеграции',
  security: 'Безопасность',
}

const BANKS = ['Сбербанк', 'Т-Банк', 'Альфа-Банк', 'ВТБ', 'Райффайзен', 'Газпромбанк']

// ============ SECTIONS (вынесены наружу — фикс бага со слетающим курсором) ============

function ProfileSection({ form, setForm, profileSaved, saveProfile, avatarLoading, uploadAvatar, removeAvatar }) {
  const fileInputRef = useRef(null)

  return (
    <form onSubmit={saveProfile}>
      {/* Аватарка */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Фото профиля</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {form.avatar ? (
            <img
              src={form.avatar}
              alt="Аватар"
              style={{ width: 72, height: 72, borderRadius: 36, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: 36, background: '#E8FF47',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, color: '#111'
            }}>
              {(form.name || '?').charAt(0).toUpperCase()}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadAvatar(file)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              style={{
                background: '#111', color: '#fff', border: 'none',
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: avatarLoading ? 'wait' : 'pointer',
                opacity: avatarLoading ? 0.6 : 1,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Camera size={14} />
              {avatarLoading ? 'Загружаем...' : form.avatar ? 'Заменить' : 'Загрузить'}
            </button>
            {form.avatar && !avatarLoading && (
              <button
                type="button"
                onClick={removeAvatar}
                style={{
                  background: 'transparent', color: '#888', border: 'none',
                  padding: '4px 0', fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', textAlign: 'left'
                }}
              >
                Удалить
              </button>
            )}
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>
          JPG или PNG, до 5 МБ
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Имя</label>
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Никнейм (для ссылки)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, color: '#888', whiteSpace: 'nowrap' }}>app.kogda.app/</span>
          <input value={form.slug}
            onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
            placeholder="anna-sokolova" style={{ ...inp, flex: 1 }} />
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>О себе</label>
        <input
          value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })}
          placeholder="Психолог, КПТ, 5 лет практики..."
          maxLength={150}
          style={inp}
        />
        <div style={{ fontSize: 12, color: '#aaa', marginTop: 6, textAlign: 'right' }}>
          {form.bio.length}/150
        </div>
      </div>
      <button type="submit" style={primaryBtn(profileSaved)}>
        {profileSaved ? '✓ Сохранено' : 'Сохранить'}
      </button>
    </form>
  )
}

function NotificationsSection({ notifications, setNotifications, notifSaved, saveNotifications }) {
  const NotifIcon = ({ name }) => {
    const s = { width: 24, height: 24, flexShrink: 0, objectFit: 'contain' }
    const urls = {
      telegram: 'https://cdn.simpleicons.org/telegram/229ED9',
      email: null,
      whatsapp: 'https://cdn.simpleicons.org/whatsapp/25D366',
      max: null,
    }
    if (urls[name]) return <img src={urls[name]} alt={name} style={s} />
    if (name === 'email') return <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#888"/></svg>
    return <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" fill="none" stroke="#ccc" strokeWidth="1.5"/><path d="M8 12h8M12 8v8" stroke="#ccc" strokeWidth="1.5"/></svg>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        {[
          { key: 'notify_telegram', icon: 'telegram', label: 'Telegram', subtitle: 'Уведомления о новых записях' },
          { key: 'notify_email', icon: 'email', label: 'Email', subtitle: 'Уведомления на почту' },
          { key: 'notify_whatsapp', icon: 'whatsapp', label: 'WhatsApp', subtitle: 'Скоро', disabled: true },
          { key: 'notify_max', icon: 'max', label: 'Макс', subtitle: 'Скоро', disabled: true },
        ].map((item, i, arr) => (
          <div key={item.key} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 0',
            borderBottom: i < arr.length - 1 ? '1px solid #F0EFE9' : 'none',
            opacity: item.disabled ? 0.5 : 1
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <NotifIcon name={item.icon} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>{item.subtitle}</div>
              </div>
            </div>
            <Toggle value={notifications[item.key]} onChange={v => setNotifications({ ...notifications, [item.key]: v })} disabled={item.disabled} />
          </div>
        ))}
      </div>
      <button onClick={saveNotifications} style={primaryBtn(notifSaved)}>
        {notifSaved ? '✓ Сохранено' : 'Сохранить'}
      </button>
    </div>
  )
}

function PaymentCard({ p, payments, setPayments }) {
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

function PaymentsSection({ payments, setPayments, selectedBanks, toggleBank, paymentSaved, savePayments, isMobile }) {
  return (
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
            {group.items.map(p => <PaymentCard key={p.key} p={p} payments={payments} setPayments={setPayments} />)}
          </div>

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
}

function IntegrationsSection({ telegramConnected, telegramLink, connectTelegram }) {
  const Icon = ({ name }) => {
    const s = { width: 28, height: 28, flexShrink: 0, objectFit: 'contain', borderRadius: 6 }
    const urls = {
      telegram: 'https://cdn.simpleicons.org/telegram/229ED9',
      google: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg',
      apple: 'https://cdn.simpleicons.org/apple/000000',
      yandex: '/icons/yandex-calendar.png',
      zoom: 'https://cdn.simpleicons.org/zoom/2D8CFF',
      meet: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg',
      telemost: '/icons/yandex-telemost.png',
      jitsi: 'https://cdn.simpleicons.org/jitsi/1d76ba',
    }
    if (urls[name]) return <img src={urls[name]} alt={name} style={s} />
    return <svg width="28" height="28" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="11" fill="#E8FF47"/><text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="900" fill="#111">kD</text></svg>
  }

  const rows = [
    { key: 'telegram', label: 'Telegram бот', desc: 'Уведомления о новых записях' },
    { key: 'google', label: 'Google Calendar', desc: 'Синхронизация встреч' },
    { key: 'apple', label: 'Apple Calendar', desc: 'Синхронизация встреч' },
    { key: 'yandex', label: 'Яндекс Календарь', desc: 'Синхронизация встреч' },
    { key: 'jitsi', label: 'Jitsi', desc: 'Автоматические ссылки на видеовстречи — уже используется' },
    { key: 'zoom', label: 'Zoom', desc: 'Автоматические ссылки на встречи' },
    { key: 'meet', label: 'Google Meet', desc: 'Автоматические ссылки на встречи' },
    { key: 'telemost', label: 'Яндекс Телемост', desc: 'Автоматические ссылки на встречи' },
    { key: 'kogda', label: 'kogDA Video', desc: 'Собственная видеосвязь Kogda', premium: true },
  ]

  return (
    <div>
      {rows.map((item, i) => {
        const isTelegram = item.key === 'telegram'
        const isJitsi = item.key === 'jitsi'
        const muted = !isTelegram && !isJitsi && !item.premium
        return (
          <div key={item.key} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 0',
            borderBottom: i < rows.length - 1 ? '1px solid #F0EFE9' : 'none',
            opacity: muted ? 0.5 : 1
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name={item.key} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>{item.desc}</div>
              </div>
            </div>
            {isTelegram && (
              <Toggle value={telegramConnected} onChange={() => {
                if (!telegramConnected) connectTelegram()
              }} disabled={false} />
            )}
            {isJitsi && (
              <Toggle value={true} onChange={() => {}} disabled={false} />
            )}
            {!isTelegram && !isJitsi && (
              <Toggle value={false} onChange={() => {}} disabled={true} />
            )}
          </div>
        )
      })}
      {telegramLink && !telegramConnected && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#FFF7ED', borderRadius: 8, fontSize: 13, color: '#92400E' }}>
          Нажми START в Telegram →{' '}
          <a href={telegramLink} target="_blank" rel="noreferrer" style={{ color: '#229ED9', fontWeight: 700 }}>Открыть бота</a>
        </div>
      )}
    </div>
  )
}

function SecuritySection({
  passwordForm, setPasswordForm,
  showCurrentPwd, setShowCurrentPwd,
  showNextPwd, setShowNextPwd,
  pwdSaved, pwdError, pwdLoading, changePassword
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Сменить пароль</h3>
        <p style={{ color: '#888', fontSize: 13, margin: '0 0 20px' }}>Введи текущий и новый пароль.</p>

        <form onSubmit={changePassword}>
          {pwdError && (
            <div style={{
              background: '#FEE2E2', color: '#DC2626', padding: '10px 14px',
              borderRadius: 8, marginBottom: 12, fontSize: 13
            }}>{pwdError}</div>
          )}

          {pwdSaved && (
            <div style={{
              background: '#DCFCE7', color: '#16A34A', padding: '10px 14px',
              borderRadius: 8, marginBottom: 12, fontSize: 13
            }}>✓ Пароль изменён</div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Текущий пароль</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrentPwd ? 'text' : 'password'}
                value={passwordForm.current}
                onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                required
                autoComplete="current-password"
                style={{ ...inp, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPwd(s => !s)}
                aria-label={showCurrentPwd ? 'Скрыть' : 'Показать'}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: 8, display: 'flex', alignItems: 'center', color: '#888'
                }}
              >
                {showCurrentPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Новый пароль</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNextPwd ? 'text' : 'password'}
                value={passwordForm.next}
                onChange={e => setPasswordForm({ ...passwordForm, next: e.target.value })}
                required
                minLength={6}
                autoComplete="new-password"
                style={{ ...inp, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowNextPwd(s => !s)}
                aria-label={showNextPwd ? 'Скрыть' : 'Показать'}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: 8, display: 'flex', alignItems: 'center', color: '#888'
                }}
              >
                {showNextPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={pwdLoading} style={{
            ...primaryBtn(false),
            opacity: pwdLoading ? 0.6 : 1,
            cursor: pwdLoading ? 'wait' : 'pointer'
          }}>
            {pwdLoading ? 'Сохраняем...' : 'Сменить пароль'}
          </button>
        </form>
      </div>
    </div>
  )
}

function DangerSection({ setShowDeleteModal }) {
  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#DC2626' }}>Опасная зона</h3>
      <p style={{ color: '#888', fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
        Удаление аккаунта отложенное: у тебя будет 30 дней чтобы передумать.
        Просто войди снова в течение этого срока, и аккаунт восстановится.
        Через 30 дней все данные удалятся навсегда.
      </p>
      <button
        onClick={() => setShowDeleteModal(true)}
        style={{
          background: 'transparent', color: '#DC2626', border: '1.5px solid #FECACA',
          padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
        }}
      >
        <Trash2 size={14} />
        Удалить аккаунт
      </button>
    </div>
  )
}

// ============ MAIN COMPONENT ============

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [mobileSection, setMobileSection] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // Profile
  const [form, setForm] = useState({ name: '', bio: '', slug: '', avatar: '' })
  const [profileSaved, setProfileSaved] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)

  // Notifications
  const [notifications, setNotifications] = useState({
    notify_telegram: true, notify_email: true,
    notify_whatsapp: false, notify_max: false,
  })
  const [notifSaved, setNotifSaved] = useState(false)
  const [telegramConnected, setTelegramConnected] = useState(false)
  const [telegramLink, setTelegramLink] = useState(null)

  // Payments
  const [payments, setPayments] = useState({
    payment_sbp: false,
    payment_tinkoff: false,
    payment_sber: false,
    payment_kaspi: false,
    payment_paypal: false,
    payment_wise: false,
    payment_usdt: false,
    payment_bank: false,
    payment_other: '',
  })
  const [selectedBanks, setSelectedBanks] = useState([])
  const [paymentSaved, setPaymentSaved] = useState(false)

  // Security
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '' })
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNextPwd, setShowNextPwd] = useState(false)
  const [pwdSaved, setPwdSaved] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

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
      setForm({
        name: res.data.name || '',
        bio: res.data.bio || '',
        slug: res.data.slug || '',
        avatar: res.data.avatar || '',
      })
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
      const res = await axios.patch(`${API}/settings/profile`, {
        name: form.name, bio: form.bio, slug: form.slug
      }, { headers: { Authorization: `Bearer ${token}` } })
      localStorage.setItem('user', JSON.stringify(res.data))
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch (err) { alert(err.response?.data?.error || 'Ошибка сохранения') }
  }

  const uploadAvatar = async (file) => {
    setAvatarLoading(true)
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('avatar', file)
    try {
      const res = await axios.post(`${API}/settings/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      })
      setForm(f => ({ ...f, avatar: res.data.avatar }))
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка загрузки фото')
    }
    setAvatarLoading(false)
  }

  const removeAvatar = async () => {
    if (!window.confirm('Удалить фото профиля?')) return
    setAvatarLoading(true)
    const token = localStorage.getItem('token')
    try {
      await axios.delete(`${API}/settings/avatar`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setForm(f => ({ ...f, avatar: '' }))
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка удаления')
    }
    setAvatarLoading(false)
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
    const token = localStorage.getItem('token')
    try {
      const res = await axios.post(`${API}/settings/telegram-token`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setTelegramLink(`https://t.me/kogdaapp_bot?start=${res.data.token}`)
    } catch (err) { console.error(err) }
  }

  const toggleBank = (bank) => {
    setSelectedBanks(prev =>
      prev.includes(bank) ? prev.filter(b => b !== bank) : [...prev, bank]
    )
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setPwdError('')
    if (passwordForm.next.length < 6) {
      setPwdError('Новый пароль должен быть минимум 6 символов')
      return
    }
    setPwdLoading(true)
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`${API}/auth/change-password`, {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.next
      }, { headers: { Authorization: `Bearer ${token}` } })
      setPwdSaved(true)
      setPasswordForm({ current: '', next: '' })
      setTimeout(() => setPwdSaved(false), 3000)
    } catch (err) {
      setPwdError(err.response?.data?.error || 'Ошибка смены пароля')
    }
    setPwdLoading(false)
  }

  const deleteAccount = async () => {
    setDeleteError('')
    setDeleteLoading(true)
    const token = localStorage.getItem('token')
    try {
      await axios.delete(`${API}/auth/delete-account`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password: deletePassword }
      })
      localStorage.clear()
      alert('Аккаунт помечен на удаление. У тебя 30 дней чтобы передумать — просто войди снова.')
      window.location.href = '/login'
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Ошибка удаления')
    }
    setDeleteLoading(false)
  }

  const renderSection = (key) => {
    if (key === 'profile') return <ProfileSection
      form={form} setForm={setForm}
      profileSaved={profileSaved} saveProfile={saveProfile}
      avatarLoading={avatarLoading}
      uploadAvatar={uploadAvatar} removeAvatar={removeAvatar}
    />
    if (key === 'notifications') return <NotificationsSection notifications={notifications} setNotifications={setNotifications} notifSaved={notifSaved} saveNotifications={saveNotifications} />
    if (key === 'payments') return <PaymentsSection payments={payments} setPayments={setPayments} selectedBanks={selectedBanks} toggleBank={toggleBank} paymentSaved={paymentSaved} savePayments={savePayments} isMobile={isMobile} />
    if (key === 'integrations') return <IntegrationsSection telegramConnected={telegramConnected} telegramLink={telegramLink} connectTelegram={connectTelegram} />
    if (key === 'security') return <SecuritySection
      passwordForm={passwordForm} setPasswordForm={setPasswordForm}
      showCurrentPwd={showCurrentPwd} setShowCurrentPwd={setShowCurrentPwd}
      showNextPwd={showNextPwd} setShowNextPwd={setShowNextPwd}
      pwdSaved={pwdSaved} pwdError={pwdError} pwdLoading={pwdLoading} changePassword={changePassword}
    />
    return null
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #E8E7E0', padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="https://kogda.app/kogda-logo.png" alt="kogDA" style={{ height: 28, width: 'auto', display: 'block' }} />
        <button onClick={() => { localStorage.clear(); window.location.href = '/login' }}
          style={{ background: 'transparent', border: '1.5px solid #E0E0D8', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
          Выйти
        </button>
      </div>

      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto', padding: '40px 24px', gap: 32 }}>
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

          {isMobile ? (
            mobileSection ? (
              <div>
                <button onClick={() => setMobileSection(null)} style={{ background: 'transparent', border: 'none', padding: '0 0 20px', fontSize: 14, fontWeight: 600, color: '#888', cursor: 'pointer' }}>
                  ← Настройки
                </button>
                <div style={card}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 24px' }}>{SECTION_TITLES[mobileSection]}</h3>
                  {renderSection(mobileSection)}
                </div>
                {mobileSection === 'security' && (
                  <div style={{ ...card, marginTop: 16 }}>
                    <DangerSection setShowDeleteModal={setShowDeleteModal} />
                  </div>
                )}
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
            <div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', borderRadius: 14, padding: 6, border: '1px solid #E8E7E0', width: 'fit-content', flexWrap: 'wrap' }}>
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
                {renderSection(activeTab)}
              </div>

              {activeTab === 'security' && (
                <div style={{ ...card, marginTop: 16, borderColor: '#FECACA' }}>
                  <DangerSection setShowDeleteModal={setShowDeleteModal} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 20
        }} onClick={() => setShowDeleteModal(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 16, padding: 32,
              maxWidth: 420, width: '100%'
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Удалить аккаунт?</h3>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              Аккаунт будет помечен на удаление. У тебя <b style={{ color: '#111' }}>30 дней</b> чтобы передумать —
              просто войди снова, и он восстановится. Через 30 дней все данные сотрутся навсегда.
            </p>

            {deleteError && (
              <div style={{
                background: '#FEE2E2', color: '#DC2626', padding: '10px 14px',
                borderRadius: 8, marginBottom: 12, fontSize: 13
              }}>{deleteError}</div>
            )}

            <label style={{ ...labelStyle, marginBottom: 6 }}>Введи пароль для подтверждения</label>
            <input
              type="password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              style={inp}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError('') }}
                style={{
                  flex: 1, background: 'transparent', border: '1.5px solid #E0E0D8',
                  padding: '11px', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Отмена
              </button>
              <button
                onClick={deleteAccount}
                disabled={!deletePassword || deleteLoading}
                style={{
                  flex: 1, background: '#DC2626', color: '#fff', border: 'none',
                  padding: '11px', borderRadius: 9, fontSize: 14, fontWeight: 700,
                  cursor: (deletePassword && !deleteLoading) ? 'pointer' : 'not-allowed',
                  opacity: (deletePassword && !deleteLoading) ? 1 : 0.5
                }}
              >
                {deleteLoading ? 'Удаляем...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}