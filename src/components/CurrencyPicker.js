import { useState, useRef, useEffect } from 'react'
import { CURRENCIES, findCurrency, searchCurrencies, isValidCustomCurrencyCode, normalizeCustomCurrencyCode } from '../currencies'

/**
 * Универсальный CurrencyPicker — выбор валюты с поиском (русский/английский) и "Другая".
 *
 * Props:
 *   value: текущий код валюты (например 'RUB', 'USD', 'UAH' или 'KGS' для custom)
 *   onChange: (code) => void
 *   colors: { text, muted, mutedLight, border, borderSoft } — цвета из родительского C-объекта
 *   placeholder: подсказка в поиске
 *   compact: если true — без подсказки и поле поиска уже
 */
export default function CurrencyPicker({ value, onChange, colors = {}, placeholder = 'Поиск: гривна, $, EUR...', compact = false }) {
  const C = {
    text: colors.text || '#111',
    muted: colors.muted || '#888',
    mutedLight: colors.mutedLight || '#aaa',
    border: colors.border || '#E8E7E0',
    borderSoft: colors.borderSoft || '#F0EFE9',
  }

  const [query, setQuery] = useState('')
  // value='OTHER' это устаревший код из старой версии — не считаем за custom
  const isLegacyOther = value === 'OTHER'
  // Если value не в списке и не OTHER — значит это custom код типа KGS/UAH
  const valueInList = findCurrency(value)
  const initiallyCustom = !!value && !valueInList && !isLegacyOther

  const [showCustomInput, setShowCustomInput] = useState(initiallyCustom)
  const [customCode, setCustomCode] = useState(initiallyCustom ? value : '')
  const [customError, setCustomError] = useState('')
  const customInputRef = useRef(null)

  // При выборе «Другая» — автофокус на input
  useEffect(() => {
    if (showCustomInput && customInputRef.current) {
      customInputRef.current.focus()
    }
  }, [showCustomInput])

  const filtered = searchCurrencies(query)

  const handleSelectCurrency = (code) => {
    setShowCustomInput(false)
    setCustomCode('')
    setCustomError('')
    onChange(code)
  }

  const handleOpenCustom = () => {
    setShowCustomInput(true)
  }

  // Умный onChange для input "Другая":
  // 1. Пользователь печатает — мы переводим в UPPERCASE
  // 2. Если ввёл что-то типа "рубль", "евро", "гривна" — ищем в aliases
  //    и если нашли — заменяем на стандартный код
  const handleCustomChange = (rawValue) => {
    const upper = String(rawValue).toUpperCase()
    setCustomCode(upper)
    setCustomError('')

    // Пробуем найти по алиасам (case-insensitive)
    const lower = String(rawValue).trim().toLowerCase()
    if (lower.length >= 2) {
      const match = CURRENCIES.find(c =>
        c.code.toLowerCase() === lower ||
        c.aliases.some(a => a.toLowerCase() === lower)
      )
      if (match) {
        // Нашли! Подменяем на стандартный код и сразу применяем
        setShowCustomInput(false)
        setCustomCode('')
        onChange(match.code)
        return
      }
    }
  }

  const handleCustomBlur = () => {
    const normalized = normalizeCustomCurrencyCode(customCode)
    if (!normalized) {
      // Пусто — закрываем без изменений
      setShowCustomInput(false)
      setCustomError('')
      return
    }
    // Если совпало с готовой валютой — используем её, не сохраняем как custom
    if (findCurrency(normalized)) {
      handleSelectCurrency(normalized)
      return
    }
    if (!isValidCustomCurrencyCode(normalized)) {
      setCustomError('Введи 2-5 латинских букв (например, UAH) или по-русски: рубль, евро…')
      return
    }
    setCustomError('')
    onChange(normalized)
  }

  const handleCustomKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.target.blur()
    }
  }

  const isCustomActive = initiallyCustom || (showCustomInput && customCode)

  return (
    <div>
      {/* Поле поиска */}
      {!compact && (
        <div style={{
          position: 'relative',
          padding: '0 12px 10px',
        }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '9px 14px 9px 36px',
              border: `1px solid ${C.border}`,
              borderRadius: 999,
              background: '#fff',
              fontSize: 13,
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
              boxSizing: 'border-box',
            }}
          />
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={C.muted} strokeWidth="2"
            style={{ position: 'absolute', left: 24, top: 11 }}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      )}

      {/* Список валют */}
      <div style={{
        background: '#fff',
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        margin: '0 12px',
      }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: '14px',
            fontSize: 13,
            color: C.muted,
            textAlign: 'center',
          }}>
            Не нашли? Нажми «Другая» внизу.
          </div>
        ) : (
          filtered.map((c, i) => {
            const active = value === c.code
            return (
              <div
                key={c.code}
                onClick={() => handleSelectCurrency(c.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  borderBottom: i === filtered.length - 1 ? 'none' : `1px solid ${C.borderSoft}`,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span style={{ fontSize: 14, color: C.text }}>{c.label}</span>
                {active && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* "Другая" - раскрывающаяся опция */}
      <div style={{ margin: '8px 12px 0' }}>
        <div style={{
          background: '#fff',
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          <div
            onClick={handleOpenCustom}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <span style={{ fontSize: 14, color: C.text }}>
              Другая валюта
              {initiallyCustom && (
                <span style={{ color: C.muted, fontSize: 13, marginLeft: 8 }}>
                  ({value})
                </span>
              )}
            </span>
            {isCustomActive && !showCustomInput && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
          {showCustomInput && (
            <div style={{
              padding: '10px 14px 14px',
              borderTop: `1px solid ${C.borderSoft}`,
            }}>
              <input
                ref={customInputRef}
                type="text"
                value={customCode}
                onChange={e => handleCustomChange(e.target.value)}
                onBlur={handleCustomBlur}
                onKeyDown={handleCustomKeyDown}
                placeholder="UAH, MXN, KGS или по-русски..."
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${customError ? '#DC2626' : C.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  boxSizing: 'border-box',
                }}
              />
              {customError && (
                <div style={{ fontSize: 12, color: '#DC2626', marginTop: 6 }}>
                  {customError}
                </div>
              )}
              {!customError && (
                <div style={{ fontSize: 12, color: C.mutedLight, marginTop: 6 }}>
                  Распознаём «рубль», «гривна», «евро» — или вводи код ISO 4217 (UAH, KGS…)
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!compact && (
        <div style={{
          fontSize: 12, color: C.mutedLight,
          margin: '12px 16px 0', lineHeight: 1.4,
        }}>
          Можно искать на русском (гривна, евро, бат…) или вводить код.
        </div>
      )}
    </div>
  )
}