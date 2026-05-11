import { useState, useRef, useEffect } from 'react'
import { X as XIcon, ArrowUp, HelpCircle } from 'lucide-react'

const SUGGESTED_QUESTIONS = [
  'Как настроить буфер между записями?',
  'Как поделиться ссылкой с клиентом?',
  'Как добавить новую услугу?'
]

const STUB_REPLY = 'Я ещё учусь и скоро смогу отвечать по-настоящему. А пока — попробуй найти ответ в разделе «Помощь» или напиши на support@kogda.app.'

const BOTTOM_NAV_HEIGHT = 64

const aiBadge = {
  background: '#111',
  color: '#E8FF47',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 0.5,
  padding: '3px 7px',
  borderRadius: 100
}

/**
 * AIHelper можно использовать двумя способами:
 *
 * 1. Uncontrolled (десктоп, в rightColumn) — без пропсов:
 *    <AIHelper />
 *    Имеет свою кнопку-pill, своё состояние open/closed.
 *
 * 2. Controlled (мобайл, из AppLayout) — с пропсами:
 *    <AIHelper isOpen={aiOpen} onClose={() => setAiOpen(false)} />
 *    Не рисует свою кнопку. Открывается/закрывается извне.
 *    Кнопка триггера живёт в header AppLayout (иконка "?").
 */
export default function AIHelper({ isOpen, onClose }) {
  const controlled = typeof isOpen === 'boolean'

  const [internalOpen, setInternalOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [messages, setMessages] = useState([
    {
      from: 'ai',
      text: 'Привет! Я твой ассистент. Помогу разобраться с kogDA. Что подсказать?'
    }
  ])
  const [input, setInput] = useState('')
  const messagesRef = useRef(null)

  const open = controlled ? isOpen : internalOpen
  const closeChat = () => {
    if (controlled) {
      onClose && onClose()
    } else {
      setInternalOpen(false)
    }
  }

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages, open])

  const sendMessage = (text) => {
    if (!text.trim()) return
    setMessages(prev => [
      ...prev,
      { from: 'user', text: text.trim() },
      { from: 'ai', text: STUB_REPLY }
    ])
    setInput('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const renderChatBody = () => (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Ассистент</div>
        </div>
        <button
          onClick={closeChat}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: '#888',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <XIcon size={18} />
        </button>
      </div>

      <div
        ref={messagesRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          paddingBottom: 12
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: m.from === 'user' ? '#E8FF47' : '#F7F6F1',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 13,
              color: '#111',
              lineHeight: 1.5
            }}
          >
            {m.text}
          </div>
        ))}

        {messages.length === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                style={{
                  background: '#F7F6F1',
                  border: '1px solid #E0E0D8',
                  borderRadius: 100,
                  padding: '7px 12px',
                  fontSize: 12,
                  color: '#666',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#F7F6F1',
        border: '1px solid #E0E0D8',
        borderRadius: 100,
        padding: '6px 6px 6px 14px'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Спроси что-нибудь..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 13,
            color: '#111',
            fontFamily: 'Inter, sans-serif',
            minWidth: 0
          }}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: input.trim() ? '#111' : '#E0E0D8',
            color: input.trim() ? '#E8FF47' : '#888',
            border: 'none',
            cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s'
          }}
        >
          <ArrowUp size={14} />
        </button>
      </form>
    </>
  )

  // ============== МОБАЙЛ ==============
  // На мобайле AIHelper всегда controlled — кнопка триггера живёт в header AppLayout.
  // Если closed — ничего не рендерим (нет своего FAB).
  if (isMobile) {
    if (!open) return null

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: BOTTOM_NAV_HEIGHT,
        background: '#fff',
        borderLeft: '4px solid #E8FF47',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 22px',
        boxSizing: 'border-box',
        zIndex: 30
      }}>
        {renderChatBody()}
      </div>
    )
  }

  // ============== ДЕСКТОП ==============
  // На десктопе AIHelper uncontrolled — рисует свою pill-кнопку и сам управляет состоянием.
  if (!open) {
    return (
      <button
        onClick={() => controlled ? null : setInternalOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          width: '100%',
          padding: '8px 14px',
          background: '#fff',
          border: '1px solid #E0E0D8',
          borderRadius: 100,
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
          color: '#666',
          textAlign: 'left'
        }}
      >
        <span>Ассистент</span>
        <HelpCircle size={18} strokeWidth={1.6} color="#666" />
      </button>
    )
  }

  return (
    <>
      <div style={{ height: 36, visibility: 'hidden' }} />

      <div style={{
        position: 'absolute',
        top: 24,
        left: 24,
        right: 24,
        height: 'calc(100vh - 48px)',
        background: '#fff',
        border: '1px solid #E8E7E0',
        borderLeft: '4px solid #E8FF47',
        borderRadius: 14,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 22px',
        boxSizing: 'border-box',
        boxShadow: '0 8px 32px rgba(17, 17, 17, 0.08)',
        zIndex: 30
      }}>
        {renderChatBody()}
      </div>
    </>
  )
}