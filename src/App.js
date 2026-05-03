import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import BookingPage from './pages/BookingPage'
import Settings from './pages/Settings'
import Bookings from './pages/Bookings'
import ClientBooking from './pages/ClientBooking'

function App() {
  return (
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
        <Route path="/:slug" element={<BookingPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App