import { useState } from 'react'
import { findCurrency, searchCurrencies, getPopularCurrencies } from '../currencies'

/**
 * CurrencyPicker — выбор валюты из 180 валют ISO 4217 + крипто.
 *
 * UX:
 *   - По умолчанию: поле поиска + заголовок "ПОПУЛЯРНЫЕ" + 5 валют (RUB, USD, EUR, UAH, KZT)
 *   - При вводе: фильтр по всем 180 валютам через searchCurrencies (русские алиасы)
 *   - Каждая строка: символ+код сверху, полное имя мелким серым снизу
 *   - При выборе → onSelected() автоматически сворачивает родителя
 *   - Если ничего не найдено → пустота, без сообщений
 *
 * Props:
 *   value: текущий код валюты ('RUB', 'USD', ...)
 *   onChange: (code) => void — родитель применяет
 *   onSelected: () => void — родитель сворачивает picker
 *   colors: { text, muted, mutedLight, border, borderSoft }
 *   placeholder: подсказка в поле поиска
 */
export default function CurrencyPicker({
  value,
  onChange,
  onSelected,
  colors = {},
  placeholder = 'Поиск: рубль, доллар, гривна, песо, KGS…',
}) {
  const C = {
    text: colors.text || '#111',
    muted: colors.muted || '#888',
    mutedLight: colors.mutedLight || '#aaa',
    border: colors.border || '#E8E7E0',
    borderSoft: colors.borderSoft || '#F0EFE9',
  }

  const [query, setQuery] = useState('')

  const handlePick = (code) => {
    setQuery('')
    onChange(code)
    if (onSelected) onSelected()
  }

  const trimmedQuery = query.trim()
  // По умолчанию — популярные. С поиском — результат фильтра.
  const displayed = trimmedQuery ? searchCurrencies(trimmedQuery) : getPopularCurrencies()
  const showPopularHeader = !trimmedQuery && displayed.length > 0

  return (
    <div>
      {/* Поле поиска */}
      <div style={{
        position: 'relative',
        padding: '0 12px 10px',
      }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus
          style={{
            width: '100%',
            padding: '11px 14px 11px 40px',
            border: `1px solid ${C.border}`,
            borderRadius: 999,
            background: '#fff',
            fontSize: 14,
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
            boxSizing: 'border-box',
          }}
        />
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={C.muted} strokeWidth="2"
          style={{ position: 'absolute', left: 26, top: '50%', transform: 'translateY(-50%)' }}
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>

      {/* Подзаголовок "ПОПУЛЯРНЫЕ" — только когда поиск пустой */}
      {showPopularHeader && (
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.muted,
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          padding: '4px 18px 8px',
        }}>
          Популярные
        </div>
      )}

      {/* Список валют */}
      {displayed.length > 0 && (
        <div style={{
          background: '#fff',
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          overflow: 'hidden',
          margin: '0 12px',
          maxHeight: 420,
          overflowY: 'auto',
        }}>
          {displayed.map((c, i) => {
            const active = value === c.code
            return (
              <div
                key={c.code}
                onClick={() => handlePick(c.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderBottom: i === displayed.length - 1 ? 'none' : `1px solid ${C.borderSoft}`,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, color: C.text, lineHeight: 1.3 }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </div>
                </div>
                {active && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="3" style={{ flexShrink: 0, marginLeft: 12 }}>
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}