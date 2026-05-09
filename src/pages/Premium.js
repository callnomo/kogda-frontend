import { Crown } from 'lucide-react'
import AppLayout from '../components/AppLayout'

export default function Premium() {
  return (
    <AppLayout>
      <div style={{
        maxWidth: 600,
        margin: '60px auto 0',
        textAlign: 'center',
        padding: '0 24px'
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: '#E8FF47',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <Crown size={36} color="#111" strokeWidth={1.8} />
        </div>

        <h1 style={{
          fontSize: 32, fontWeight: 800, margin: '0 0 12px',
          fontFamily: 'Syne, sans-serif'
        }}>
          Скоро тарифы
        </h1>

        <p style={{
          fontSize: 16, color: '#666', lineHeight: 1.6,
          margin: '0 0 24px'
        }}>
          Сейчас все возможности kogDA доступны бесплатно. Когда мы запустим тарифы, ты узнаешь первой.
        </p>

        <p style={{
          fontSize: 14, color: '#888', lineHeight: 1.6
        }}>
          В планах три тарифа:<br />
          <strong style={{ color: '#111' }}>Бесплатный</strong> · <strong style={{ color: '#111' }}>Стандарт</strong> · <strong style={{ color: '#111' }}>Премиум</strong>
        </p>
      </div>
    </AppLayout>
  )
}