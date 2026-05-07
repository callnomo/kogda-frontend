import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import BookingPage from './pages/BookingPage'
import Settings from './pages/Settings'
import Bookings from './pages/Bookings'
import ClientBooking from './pages/ClientBooking'

function FallbackError() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'Inter, sans-serif',
      background: '#FAFAF5',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: '#111' }}>
        Что-то пошло не так
      </h1>
      <p style={{ fontSize: 15, color: '#666', maxWidth: 320, margin: '0 0 24px', lineHeight: 1.5 }}>
        Мы уже знаем об ошибке и скоро всё починим. Попробуйте обновить страницу.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '12px 24px',
          borderRadius: 10,
          background: '#111',
          color: '#fff',
          border: 'none',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        Обновить страницу
      </button>
    </div>
  )
}

function DebugSentry() {
  throw new Error('Тестовая ошибка фронта для Sentry!')
}

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<FallbackError />}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/booking/:token" element={<ClientBooking />} />
          <Route path="/debug-sentry" element={<DebugSentry />} />
          <Route path="/:slug" element={<BookingPage />} />
        </Routes>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  )
}

export default App