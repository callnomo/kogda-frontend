import { CalendarDays } from 'lucide-react'
import AppLayout from '../components/AppLayout'

export default function Calendar() {
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
          <CalendarDays size={36} color="#111" strokeWidth={1.8} />
        </div>

        <h1 style={{
          fontSize: 32, fontWeight: 800, margin: '0 0 12px',
          fontFamily: 'Syne, sans-serif'
        }}>
          Скоро календарь
        </h1>

        <p style={{
          fontSize: 16, color: '#666', lineHeight: 1.6,
          margin: 0
        }}>
          Здесь будет красивый календарь с видами День / Неделя / Месяц и синхронизацией с Google и Apple Calendar.
        </p>
      </div>
    </AppLayout>
  )
}