import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { findCurrency, searchCurrencies, getPopularCurrencies, getCurrencyLabel } from '../currencies'

/**
 * CurrencyPicker — выбор валюты через оверлей (поверх всего, не сдвигает контент).
 *
 * Десктоп: dropdown под триггером (позиционируется через getBoundingClientRect)
 * Мобайл: bottom-sheet (выезжает снизу)
 *
 * Использование:
 *   <CurrencyPicker
 *     value={currency}
 *     onChange={(code) => setCurrency(code)}
 *     colors={{ ... }}
 *   />
 *
 * Сам рендерит триггер-строку "Валюта: ₽ RUB ⌄" + оверлей при клике.
 * Триггер можно кастомизировать через render-prop renderTrigger (необязательно).
 */
export default function CurrencyPicker({
  value,
  onChange,
  colors = {},
  triggerLabel = 'Валюта',
  renderTrigger = null, // (props: { value, label, isOpen, onClick }) => ReactNode
}) {
  const C = {
    text: colors.text || '#111',
    muted: colors.muted || '#888',
    mutedLight: colors.mutedLight || '#aaa',
    border: colors.border || '#E8E7E0',
    borderSoft: colors.borderSoft || '#F0EFE9',
    bg: colors.bg || '#F5F4EE',
    card: colors.card || '#FFFFFF',
    cardSoft: colors.cardSoft || '#FAF9F3',
  }

  const triggerRef = useRef(null)
  const overlayRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [position, setPosition] = useState({ top: 0, left: 0, width: 320 })

  // Мобайл?
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 700 : false)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const currentLabel = getCurrencyLabel(value)

  // Позиционирование dropdown на десктопе
  useLayoutEffect(() => {
    if (!isOpen || isMobile || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const dropdownWidth = Math.min(380, Math.max(280, rect.width))
    let left = rect.left
    // Если не помещается справа — сдвигаем влево
    if (left + dropdownWidth > window.innerWidth - 12) {
      left = window.innerWidth - dropdownWidth - 12
    }
    if (left < 12) left = 12
    setPosition({
      top: rect.bottom + window.scrollY + 6,
      left: left + window.scrollX,
      width: dropdownWidth,
    })
  }, [isOpen, isMobile])

  // Клик вне → закрытие
  useEffect(() => {
    if (!isOpen) return
    const onClick = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        overlayRef.current && !overlayRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  // Прокрутка / resize окна на десктопе — переcчёт позиции
  useEffect(() => {
    if (!isOpen || isMobile) return
    const reposition = () => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      const dropdownWidth = Math.min(380, Math.max(280, rect.width))
      let left = rect.left
      if (left + dropdownWidth > window.innerWidth - 12) {
        left = window.innerWidth - dropdownWidth - 12
      }
      if (left < 12) left = 12
      setPosition({
        top: rect.bottom + window.scrollY + 6,
        left: left + window.scrollX,
        width: dropdownWidth,
      })
    }
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [isOpen, isMobile])

  // На мобайле блокируем прокрутку body
  useEffect(() => {
    if (!isOpen || !isMobile) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen, isMobile])

  const handlePick = (code) => {
    onChange(code)
    setQuery('')
    setIsOpen(false)
  }

  const handleToggle = () => {
    setIsOpen(o => !o)
    if (isOpen) setQuery('')
  }

  const trimmedQuery = query.trim()
  const displayed = trimmedQuery ? searchCurrencies(trimmedQuery) : getPopularCurrencies()
  const showPopularHeader = !trimmedQuery && displayed.length > 0

  // Триггер-кнопка (если не передали кастомный)
  const defaultTrigger = (
    <div
      ref={triggerRef}
      onClick={handleToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '11px 14px',
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 14, color: C.text }}>{triggerLabel}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, color: C.muted }}>{currentLabel}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="#888" strokeWidth="2"
          style={{
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0)',
            transition: 'transform 0.15s',
          }}
        >
          <polyline points="9,18 15,12 9,6" />
        </svg>
      </div>
    </div>
  )

  // Если есть renderTrigger — используем его (он должен сам прокинуть ref на корневой DOM элемент)
  // Иначе используем дефолтный
  const trigger = renderTrigger
    ? renderTrigger({
        triggerRef,
        value,
        label: currentLabel,
        isOpen,
        onClick: handleToggle,
      })
    : defaultTrigger

  // Содержимое (общее для десктопа и мобайла)
  const pickerContent = (
    <div>
      {/* Поле поиска */}
      <div style={{ position: 'relative', padding: '0 14px 12px' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск: рубль, доллар, гривна, песо, KGS…"
          autoFocus
          style={{
            width: '100%',
            padding: '10px 14px 10px 38px',
            border: `1px solid ${C.border}`,
            borderRadius: 999,
            background: C.cardSoft,
            fontSize: 13,
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
            boxSizing: 'border-box',
          }}
        />
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke={C.muted} strokeWidth="2"
          style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(calc(-50% - 6px))' }}
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>

      {/* Подзаголовок ПОПУЛЯРНЫЕ */}
      {showPopularHeader && (
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          color: C.muted,
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          padding: '0 18px 6px',
        }}>
          Популярные
        </div>
      )}

      {/* Список */}
      {displayed.length > 0 && (
        <div style={{
          background: C.cardSoft,
          borderRadius: 10,
          overflow: 'hidden',
          margin: '0 14px',
          maxHeight: isMobile ? 'calc(80vh - 180px)' : 380,
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
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </div>
                </div>
                {active && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="3" style={{ flexShrink: 0, marginLeft: 12 }}>
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

  // Оверлей через Portal
  const overlay = isOpen && typeof document !== 'undefined' ? createPortal(
    isMobile ? (
      // Bottom-sheet на мобайле
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-end',
          background: 'rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.15s ease-out',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsOpen(false)
        }}
      >
        <div
          ref={overlayRef}
          style={{
            width: '100%',
            background: C.bg,
            borderRadius: '20px 20px 0 0',
            padding: '8px 0 max(20px, env(safe-area-inset-bottom))',
            maxHeight: '85vh',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
            animation: 'slideUp 0.2s ease-out',
          }}
        >
          {/* Ручка */}
          <div style={{
            width: 40, height: 4, background: '#ccc', borderRadius: 2,
            margin: '0 auto 12px',
          }} />

          {/* Заголовок */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 16px 14px',
          }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Валюта</span>
            <div
              onClick={() => setIsOpen(false)}
              style={{ cursor: 'pointer', padding: 4 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </div>

          {pickerContent}
        </div>
      </div>
    ) : (
      // Dropdown на десктопе
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          width: position.width,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
          padding: '14px 0',
          zIndex: 9999,
          animation: 'fadeIn 0.12s ease-out',
        }}
      >
        {pickerContent}
      </div>
    ),
    document.body
  ) : null

  return (
    <>
      {trigger}
      {overlay}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  )
}