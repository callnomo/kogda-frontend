// kogda-frontend/src/pages/Profile.js
// Страница профиля — публичное лицо коуча
// Создано 16 мая 2026 — с нуля, дизайн согласован

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import AppLayout from '../components/AppLayout'
import { ExternalLink, Pencil, Trash2, Plus, X, Globe } from 'lucide-react'

const API = process.env.REACT_APP_API_URL || 'https://kogda-backend-production.up.railway.app'

// ============ ДИЗАЙН-ТОКЕНЫ (как в Settings.js) ============
const C = {
  bg: '#F5F4EE',
  card: '#FFFFFF',
  cardSoft: '#FAF9F3',
  border: '#E8E7E0',
  borderSoft: '#F0EFE9',
  text: '#111111',
  muted: '#888888',
  mutedLight: '#AAAAAA',
  lime: '#E8FF47',
  danger: '#DC2626',
}

const BIO_MAX = 150

// Типы соцсетей: ключ → подпись + плейсхолдер + иконка (simpleicons CDN,
// тот же паттерн что в Settings.js → Интеграции; цвет = фирменный бренда)
const SOCIAL_TYPES = [
  { key: 'telegram',  label: 'Telegram',  placeholder: 't.me/username',          icon: 'https://cdn.simpleicons.org/telegram/229ED9' },
  { key: 'instagram', label: 'Instagram', placeholder: 'instagram.com/username', icon: 'https://cdn.simpleicons.org/instagram/E4405F' },
  { key: 'x',         label: 'X',         placeholder: 'x.com/username',         icon: 'https://cdn.simpleicons.org/x/000000' },
  { key: 'vk',        label: 'VK',        placeholder: 'vk.com/username',        icon: 'https://cdn.simpleicons.org/vk/0077FF' },
  { key: 'tiktok',    label: 'TikTok',    placeholder: 'tiktok.com/@username',   icon: 'https://cdn.simpleicons.org/tiktok/000000' },
  { key: 'youtube',   label: 'YouTube',   placeholder: 'youtube.com/@channel',   icon: 'https://cdn.simpleicons.org/youtube/FF0000' },
  { key: 'facebook',  label: 'Facebook',  placeholder: 'facebook.com/username',  icon: 'https://cdn.simpleicons.org/facebook/0866FF' },
  { key: 'website',   label: 'Сайт',      placeholder: 'example.com',            icon: null },
  { key: 'other',     label: 'Другое',    placeholder: 'любая ссылка',           icon: null },
]

const socialMeta = (type) =>
  SOCIAL_TYPES.find(s => s.key === type) || SOCIAL_TYPES[SOCIAL_TYPES.length - 1]
const socialLabel = (type) => socialMeta(type).label
const socialPlaceholder = (type) => socialMeta(type).placeholder

// Иконка сети: фирменный логотип или глобус-заглушка для «Сайт»
function SocialIcon({ type, size = 20 }) {
  const m = socialMeta(type)
  if (m.icon) {
    return (
      <img
        src={m.icon}
        alt={m.label}
        style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
      />
    )
  }
  // «Сайт» — простой глобус (lucide), фирменного бренда нет
  return <Globe size={size} color="#555" />
}

// ============ ОСНОВНОЙ КОМПОНЕНТ ============

export default function Profile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  // Поля профиля
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [cover, setCover] = useState('')
  const [socials, setSocials] = useState([]) // [{ type, url }]

  // Ошибка слага (никнейм занят)
  const [slugError, setSlugError] = useState('')

  // Открыт ли popover выбора сети (под кнопкой «Добавить ссылку»)
  const [socialPickerOpen, setSocialPickerOpen] = useState(false)

  // refs для файловых инпутов
  const avatarInputRef = useRef(null)
  const coverInputRef = useRef(null)

  useEffect(() => {
    loadProfile()
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // === API ===
  const loadProfile = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setName(res.data.name || '')
      setSlug(res.data.slug || '')
      setBio(res.data.bio || '')
      setAvatar(res.data.avatar || '')
      setCover(res.data.cover || '')
      const s = res.data.socials
      setSocials(Array.isArray(s) ? s : [])
    } catch (err) {
      console.error('Load profile error:', err)
    }
    setLoading(false)
  }

  // Флеш «сохранено»
  const flashSaved = () => {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }

  // Сохранить текстовые поля (имя / bio / slug / socials) — onBlur
  const saveProfile = async (patch) => {
    const token = localStorage.getItem('token')
    setSaving(true)
    setSlugError('')
    try {
      const res = await axios.patch(`${API}/settings/profile`, patch, {
        headers: { Authorization: `Bearer ${token}` },
      })
      // Сервер вернул актуальные значения
      if (res.data.slug !== undefined) setSlug(res.data.slug)
      if (Array.isArray(res.data.socials)) setSocials(res.data.socials)
      flashSaved()
    } catch (err) {
      const msg = err.response?.data?.error
      if (msg && msg.toLowerCase().includes('никнейм')) {
        setSlugError(msg)
      } else {
        console.error('Save profile error:', err)
      }
    }
    setSaving(false)
  }

  // Загрузка аватара
  const onAvatarPick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const token = localStorage.getItem('token')
    const fd = new FormData()
    fd.append('avatar', file)
    setSaving(true)
    try {
      const res = await axios.post(`${API}/settings/avatar`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAvatar(res.data.avatar)
      flashSaved()
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка загрузки фото')
    }
    setSaving(false)
    e.target.value = ''
  }

  // Загрузка обложки
  const onCoverPick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const token = localStorage.getItem('token')
    const fd = new FormData()
    fd.append('cover', file)
    setSaving(true)
    try {
      const res = await axios.post(`${API}/settings/cover`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCover(res.data.cover)
      flashSaved()
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка загрузки обложки')
    }
    setSaving(false)
    e.target.value = ''
  }

  const removeCover = async () => {
    const token = localStorage.getItem('token')
    setSaving(true)
    try {
      await axios.delete(`${API}/settings/cover`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCover('')
      flashSaved()
    } catch (err) {
      console.error('Remove cover error:', err)
    }
    setSaving(false)
  }

  // === Соцсети ===

  // Нормализация ссылки: режем опасное, добиваем https.
  // Защита от javascript:/data: (XSS) + бытовое удобство (юзер пишет без https).
  const normalizeUrl = (raw) => {
    let u = (raw || '').trim()
    if (!u) return ''
    // выкидываем опасные схемы целиком
    if (/^\s*(javascript|data|vbscript):/i.test(u)) return ''
    // если схемы нет — добавляем https://
    if (!/^https?:\/\//i.test(u)) {
      u = 'https://' + u.replace(/^\/+/, '')
    }
    return u
  }

  // Тапнули иконку сети в списке → добавить строку этой сети
  const addSocialOfType = (typeKey) => {
    const next = [...socials, { type: typeKey, url: '' }]
    setSocials(next)
    setSocialPickerOpen(false)
  }

  const updateSocial = (idx, patch) => {
    const next = socials.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    setSocials(next)
  }

  const removeSocial = (idx) => {
    const next = socials.filter((_, i) => i !== idx)
    setSocials(next)
    const cleaned = next
      .map(s => ({ type: s.type, url: normalizeUrl(s.url) }))
      .filter(s => s.url)
    saveProfile({ socials: cleaned })
  }

  // Сохранить соцсети целиком (onBlur поля) — с нормализацией
  const saveSocials = () => {
    const cleaned = socials
      .map(s => ({ type: s.type, url: normalizeUrl(s.url) }))
      .filter(s => s.url)
    // подтянем нормализованные значения обратно в инпут
    setSocials(prev => prev.map(s => ({ ...s, url: normalizeUrl(s.url) || s.url })))
    saveProfile({ socials: cleaned })
  }

  // Какие сети ещё не добавлены (для списка выбора)
  const availableTypes = SOCIAL_TYPES.filter(
    t => !socials.some(s => s.type === t.key) || t.key === 'other'
  )

  // Открыть публичную страницу (предпросмотр)
  const openPreview = () => {
    if (!slug) return
    window.open(`${window.location.origin}/${slug}`, '_blank', 'noopener')
  }

  // ============ СТИЛИ ============
  const labelStyle = {
    fontSize: 13, fontWeight: 500, color: C.muted,
    marginBottom: 8, paddingLeft: 4,
  }
  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    background: C.card,
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    color: C.text,
    boxSizing: 'border-box',
  }
  const iconBtnStyle = {
    width: 38, height: 38,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent',
    border: `1.5px solid ${C.border}`,
    borderRadius: 9,
    cursor: slug ? 'pointer' : 'not-allowed',
    color: C.text,
    opacity: slug ? 1 : 0.4,
  }

  // Карандаш-кнопка (общий для аватара/обложки)
  const PencilBtn = ({ onClick, title, style = {} }) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        position: 'absolute',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        border: 'none',
        ...style,
      }}
    >
      <Pencil size={style._iconSize || 14} color={style._iconColor || '#fff'} />
    </button>
  )

  // ============ ПРЕВЬЮ-КАРТОЧКА (как видит клиент) ============
  const PreviewCard = () => {
    const coverH = isMobile ? 120 : 150
    const avaSize = isMobile ? 76 : 92
    return (
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 24,
      }}>
        {/* Обложка */}
        <div style={{
          position: 'relative',
          height: coverH,
          background: cover
            ? `center / cover no-repeat url("${cover}")`
            : 'linear-gradient(135deg, #2B2A28 0%, #4A4640 55%, #6E665A 100%)',
        }}>
          {/* карандаш обложки */}
          <PencilBtn
            onClick={() => coverInputRef.current?.click()}
            title="Изменить обложку"
            style={{
              top: 12, right: 12,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.22)',
              backdropFilter: 'blur(4px)',
              _iconSize: 15,
            }}
          />
          {cover && (
            <button
              onClick={removeCover}
              title="Удалить обложку"
              style={{
                position: 'absolute', top: 12, right: 52,
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.22)',
                backdropFilter: 'blur(4px)',
                border: 'none', cursor: 'pointer',
              }}
            >
              <Trash2 size={14} color="#fff" />
            </button>
          )}
        </div>

        {/* Аватар + текст */}
        <div style={{ padding: '0 24px 22px' }}>
          <div style={{
            position: 'relative',
            width: avaSize, height: avaSize,
            marginTop: -avaSize / 2,
            marginBottom: 12,
          }}>
            <div style={{
              width: avaSize, height: avaSize,
              borderRadius: '50%',
              border: `4px solid ${C.card}`,
              background: avatar
                ? `center / cover no-repeat url("${avatar}")`
                : C.lime,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}>
              {!avatar && (
                <span style={{
                  fontSize: avaSize * 0.4, fontWeight: 800, color: C.text,
                }}>
                  {(name || '?').trim().charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* карандаш аватара */}
            <PencilBtn
              onClick={() => avatarInputRef.current?.click()}
              title="Изменить фото"
              style={{
                bottom: 0, right: 0,
                width: 28, height: 28, borderRadius: '50%',
                background: C.text,
                border: `2.5px solid ${C.card}`,
                _iconSize: 12,
                _iconColor: C.lime,
              }}
            />
          </div>

          <div style={{ fontSize: isMobile ? 19 : 22, fontWeight: 800, color: C.text }}>
            {name || 'Ваше имя'}
          </div>
          {bio && (
            <div style={{
              fontSize: 13.5, color: '#555', marginTop: 6, lineHeight: 1.5,
            }}>
              {bio}
            </div>
          )}

          {/* соцсети-превью */}
          {socials.filter(s => s.url).length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {socials.filter(s => s.url).map((s, i) => (
                <div key={i} style={{
                  fontSize: 12, fontWeight: 600, color: '#555',
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 999,
                  padding: '6px 12px',
                }}>
                  {socialLabel(s.type)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>
          Загрузка…
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      {/* скрытые файловые инпуты */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={onAvatarPick}
        style={{ display: 'none' }}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        onChange={onCoverPick}
        style={{ display: 'none' }}
      />

      {/* Единый контейнер ограниченной ширины — слева, без растяжения */}
      <div style={{ maxWidth: isMobile ? '100%' : 640 }}>

        {/* Шапка: заголовок + кнопка предпросмотра на одной строке */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12,
          marginBottom: 6,
        }}>
          <h2 style={{
            fontSize: isMobile ? 22 : 26, fontWeight: 800, margin: 0,
          }}>Профиль</h2>
          <button
            onClick={openPreview}
            title="Предпросмотр"
            style={iconBtnStyle}
          >
            <ExternalLink size={18} />
          </button>
        </div>

        {/* флеш «сохранено» */}
        <div style={{ height: 20, marginBottom: 8 }}>
          {savedFlash && (
            <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 500 }}>
              ✓ Сохранено
            </span>
          )}
        </div>

        <PreviewCard />

        {/* Имя */}
        <div style={{ marginBottom: 20 }}>
          <div style={labelStyle}>Имя</div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => saveProfile({ name })}
            placeholder="Как вас зовут"
            style={inputStyle}
          />
        </div>

        {/* Никнейм / ссылка */}
        <div style={{ marginBottom: 20 }}>
          <div style={labelStyle}>Никнейм</div>
          <div style={{
            display: 'flex', alignItems: 'center',
            border: `1px solid ${slugError ? C.danger : C.border}`,
            borderRadius: 10,
            background: C.card,
            overflow: 'hidden',
          }}>
            <span style={{
              fontSize: 14, color: C.muted,
              padding: '12px 0 12px 14px', whiteSpace: 'nowrap',
            }}>
              kogda.app/
            </span>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              onBlur={() => slug && saveProfile({ slug })}
              placeholder="username"
              style={{
                flex: 1, border: 'none', outline: 'none',
                padding: '12px 14px 12px 0',
                fontSize: 14, fontFamily: 'Inter, sans-serif',
                color: C.text, background: 'transparent',
              }}
            />
          </div>
          {slugError && (
            <div style={{ fontSize: 12, color: C.danger, marginTop: 6, paddingLeft: 4 }}>
              {slugError}
            </div>
          )}
        </div>

        {/* Био */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'baseline', marginBottom: 8, paddingLeft: 4, paddingRight: 4,
          }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>
              О себе
            </span>
            <span style={{
              fontSize: 12,
              color: bio.length > BIO_MAX ? C.danger : C.mutedLight,
            }}>
              {bio.length} / {BIO_MAX}
            </span>
          </div>
          <input
            value={bio}
            onChange={e => setBio(e.target.value.slice(0, BIO_MAX))}
            onBlur={() => saveProfile({ bio })}
            placeholder="Психолог. Тревога, выгорание, кризисы выбора."
            style={inputStyle}
          />
        </div>

        {/* Соцсети */}
        <div style={{ marginBottom: 20 }}>
          <div style={labelStyle}>Соцсети</div>
          <div style={{
            background: C.cardSoft,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 14,
          }}>
            {socials.length === 0 && (
              <div style={{
                fontSize: 13, color: C.mutedLight,
                padding: '2px 2px 12px',
              }}>
                Пока пусто
              </div>
            )}

            {socials.map((s, idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '8px 10px',
                marginBottom: 10,
              }}>
                {/* Иконка сети — фиксирована (выбрана при добавлении) */}
                <div style={{
                  width: 36, height: 36, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: C.cardSoft,
                  border: `1px solid ${C.border}`,
                  borderRadius: 9,
                }}>
                  <SocialIcon type={s.type} size={20} />
                </div>

                <input
                  value={s.url}
                  onChange={e => updateSocial(idx, { url: e.target.value })}
                  onBlur={saveSocials}
                  placeholder={socialPlaceholder(s.type)}
                  style={{
                    flex: 1, minWidth: 0,
                    border: 'none', outline: 'none',
                    padding: '6px 2px',
                    fontSize: 14,
                    fontFamily: 'Inter, sans-serif',
                    color: C.text,
                    background: 'transparent',
                  }}
                />

                <button
                  onClick={() => removeSocial(idx)}
                  title="Удалить"
                  style={{
                    width: 30, height: 30, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', color: C.mutedLight,
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {/* Кнопка + popover со списком всех доступных сетей */}
            <div style={{ position: 'relative', marginTop: 4 }}>
              <button
                onClick={() => setSocialPickerOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 9,
                  padding: '9px 16px',
                  fontSize: 13, fontWeight: 600, color: C.text,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <Plus size={15} />
                Добавить ссылку
              </button>

              {socialPickerOpen && (
                <>
                  {/* клик мимо — закрыть */}
                  <div
                    onClick={() => setSocialPickerOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)', left: 0,
                    zIndex: 50,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                    padding: 6,
                    minWidth: 220,
                    maxHeight: 320,
                    overflowY: 'auto',
                  }}>
                    {availableTypes.length === 0 && (
                      <div style={{
                        fontSize: 13, color: C.mutedLight,
                        padding: '10px 12px',
                      }}>
                        Все сети уже добавлены
                      </div>
                    )}
                    {availableTypes.map(t => (
                      <div
                        key={t.key}
                        onClick={() => addSocialOfType(t.key)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px',
                          borderRadius: 8,
                          cursor: 'pointer',
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = C.cardSoft }}
                        onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <div style={{
                          width: 22, height: 22, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <SocialIcon type={t.key} size={20} />
                        </div>
                        <span style={{ flex: 1, fontSize: 14, color: C.text }}>
                          {t.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{
          fontSize: 11, color: C.mutedLight,
          paddingLeft: 4, marginBottom: 24,
        }}>
          Изменения сохраняются автоматически
        </div>
      </div>
    </AppLayout>
  )
}