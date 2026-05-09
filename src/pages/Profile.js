import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const navigate = useNavigate()

  useEffect(() => {
    // Временно: пока нет отдельной страницы профиля,
    // редиректим на настройки где сейчас редактируется профиль
    navigate('/settings', { replace: true })
  }, [navigate])

  return null
}