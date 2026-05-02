import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import BookingPage from './pages/BookingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/:slug" element={<BookingPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App