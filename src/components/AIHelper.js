import { useState, useRef, useEffect } from 'react'
import { Sparkles, X as XIcon, ArrowUp } from 'lucide-react'

const SUGGESTED_QUESTIONS = [
  'Как настроить буфер между записями?',
  'Как поделиться ссылкой с клиентом?',
  'Как добавить новую услугу?'
]

const STUB_REPLY = 'Я ещё учусь и скоро смогу отвечать по-настоящему. А пока — попробуй найти ответ в разделе «Помощь» или напиши на support@kogda.app.'

export default function AIHelper() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      from: 'ai',
      text: 'Привет! Я Кога — твой ассистент. Помогу разобраться с kogDA. Что подсказать?'
    }
  ])
  const [input, setInput] = useState('')
  const messagesRef = useRef(null)

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

  // Свёрнутая кнопка-триггер
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '8px 14px',
          background: '#fff',
          border: '1px solid #E0E0D8',
          borderRadius: 100,
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
          color: '#888',
          textAlign: 'left'
        }}
      >
        <Sparkles size={14} fill="#E8FF47" stroke="#111" strokeWidth={1.2} />
        Спроси Когу
      </button>
    )
  }

  // Развёрнутый чат — overlay поверх правой колонки
  return (
    <>
      {/* Кнопка-триггер остаётся видимой как «занятое место» */}
      <div style={{
        height: 36,
        visibility: 'hidden'
      }} />

      {/* Overlay чата — прибит к правой колонке */}
      <div style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        right: 'calc(50vw - 640px)',
        width: 320,
        background: '#F7F6F1',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 24px 20px 24px',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} fill="#E8FF47" stroke="#111" strokeWidth={1.2} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Кога</div>
              <div style={{ fontSize: 11, color: '#888' }}>твой ассистент</div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
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

        {/* Messages */}
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
                background: m.from === 'user' ? '#E8FF47' : '#fff',
                border: m.from === 'user' ? 'none' : '1px solid #E8E7E0',
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

          {/* Suggested questions — только в самом начале (после приветствия) */}
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

        {/* Input */}
        <form onSubmit={handleSubmit} style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#fff',
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
      </div>
    </>
  )
}