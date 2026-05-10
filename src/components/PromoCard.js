import { useState, useEffect } from 'react'
import { Crown, X as XIcon, Globe, Tag, Code, CalendarSync } from 'lucide-react'

const FEATURES = [
  {
    id: 'custom_domain',
    icon: Globe,
    title: 'Свой домен',
    subtitle: 'mary.com/booking — без брендинга kogDA, профессиональнее для клиентов'
  },
  {
    id: 'vip_color',
    icon: Tag,
    title: 'Цвет услуги VIP',
    subtitle: 'Выдели важные услуги цветом — клиенты сразу увидят что это особенное'
  },
  {
    id: 'embed_widget',
    icon: Code,
    title: 'Виджет записи на свой сайт',
    subtitle: 'Встрой kogDA прямо на свой сайт — Tilda, Wix, WordPress, Notion'
  },
  {
    id: 'calendar_sync',
    icon: CalendarSync,
    title: 'Синхронизация календаря',
    subtitle: 'Двусторонняя синхронизация с Google и Apple'
  }
]

const STORAGE_KEY_SHOWN = 'kogda_promo_shown'
const STORAGE_KEY_DISMISSED = 'kogda_promo_dismissed_until'
const DISMISS_DAYS = 7
const ROTATE_INTERVAL_MS = 60 * 1000

const ctaStyle = {
  display: 'inline-block',
  marginTop: 16,
  background: '#E8FF47',
  color: '#111',
  padding: '9px 18px',
  borderRadius: 100,
  fontSize: 12,
  fontWeight: 700,
  textDecoration: 'none'
}

function pickFeature() {
  const shown = JSON.parse(localStorage.getItem(STORAGE_KEY_SHOWN) || '[]')
  let candidates = FEATURES.filter(f => !shown.includes(f.id))
  if (candidates.length === 0) {
    localStorage.setItem(STORAGE_KEY_SHOWN, '[]')
    candidates = FEATURES
  }
  const picked = candidates[Math.floor(Math.random() * candidates.length)]
  const newShown = [...shown.filter(id => id !== picked.id), picked.id]
  localStorage.setItem(STORAGE_KEY_SHOWN, JSON.stringify(newShown))
  return picked
}

export default function PromoCard() {
  const [feature, setFeature] = useState(null)
  const [hidden, setHidden] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const dismissedUntil = localStorage.getItem(STORAGE_KEY_DISMISSED)
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      setHidden(true)
      return
    }

    setFeature(pickFeature())

    const interval = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setFeature(pickFeature())
        setFading(false)
      }, 300)
    }, ROTATE_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [])

  const handleClose = () => {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000
    localStorage.setItem(STORAGE_KEY_DISMISSED, String(until))
    setHidden(true)
  }

  if (hidden || !feature) return null

  const Icon = feature.icon

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      border: '1.5px solid #E8FF47',
      borderLeft: '4px solid #E8FF47',
      padding: '18px 22px 20px',
      paddingLeft: 19,
      position: 'relative',
      overflow: 'hidden',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.3s ease'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{
            background: '#F0EFE9',
            color: '#888',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 0.5,
            padding: '3px 8px',
            borderRadius: 100
          }}>
            РЕКЛАМА
          </span>
          <span style={{
            background: '#111',
            color: '#E8FF47',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 0.5,
            padding: '3px 8px',
            borderRadius: 100,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <Crown size={9} fill="#E8FF47" stroke="#E8FF47" />
            kogDA PREMIUM
          </span>
        </div>
        <button
          onClick={handleClose}
          aria-label="Скрыть"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: '#aaa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <XIcon size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: '#111',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon size={20} color="#E8FF47" strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#111',
            marginBottom: 4
          }}>
            {feature.title}
          </div>
          <div style={{
            fontSize: 13,
            color: '#666',
            lineHeight: 1.4
          }}>
            {feature.subtitle}
          </div>
        </div>
      </div>

      <a href="/premium" style={ctaStyle}>Узнать подробнее</a>
    </div>
  )
}