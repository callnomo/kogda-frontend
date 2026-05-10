import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  CalendarClock,
  Layers,
  User,
  Settings as SettingsIcon,
  Crown,
  LogOut,
  X
} from 'lucide-react'

const API = process.env.REACT_APP_API_URL || 'https://kogda-backend-production.up.railway.app'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Кабинет', icon: LayoutDashboard },
  { to: '/calendar', label: 'Календарь', icon: CalendarDays },
  { to: '/bookings', label: 'Записи', icon: ClipboardList, hasBadge: true },
  { to: '/schedule', label: 'Расписание', icon: CalendarClock, partialFill: true },
  { to: '/services', label: 'Услуги', icon: Layers },
  { to: '/profile', label: 'Профиль', icon: User },
  { to: '/premium', label: 'Премиум', icon: Crown },
  { to: '/settings', label: 'Настройки', icon: SettingsIcon }
]

const MOBILE_NAV_ITEMS = [
  { to: '/dashboard', label: 'Кабинет', icon: LayoutDashboard },
  { to: '/calendar', label: 'Календарь', icon: CalendarDays },
  { to: '/bookings', label: 'Записи', icon: ClipboardList, hasBadge: true },
  { to: '/schedule', label: 'Расписание', icon: CalendarClock, partialFill: true },
  { to: '/services', label: 'Услуги', icon: Layers }
]

const DRAWER_TOP = [
  { to: '/profile', label: 'Профиль', icon: User },
  { to: '/premium', label: 'Премиум', icon: Crown },
  { to: '/settings', label: 'Настройки', icon: SettingsIcon }
]

const ICON_STYLES = `
  .nav-icon-partial path:not(:last-child),
  .nav-icon-partial circle:not(:last-child),
  .nav-icon-partial rect:not(:last-child),
  .nav-icon-partial line:not(:last-child) {
    fill: #E8FF47;
  }
  .nav-icon-full {
    fill: #E8FF47;
  }
`

const SIDEBAR_WIDTH = 180
const RIGHT_COLUMN_WIDTH = 320

export default function AppLayout({ children, rightColumn }) {
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isNarrow, setIsNarrow] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) setUser(JSON.parse(u))

    const onResize = () => {
      const w = window.innerWidth
      setIsMobile(w < 700)
      setIsNarrow(w >= 700 && w < 1200)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const loadPendingCount = async () => {
      const token = localStorage.getItem('token')
      if (!token) return
      try {
        const res = await axios.get(`${API}/bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const pending = res.data.filter(b =>
          b.status === 'pending' || b.status === 'reschedule_requested'
        )
        setPendingCount(pending.length)
      } catch (err) {}
    }

    loadPendingCount()
    const interval = setInterval(loadPendingCount, 30000)
    return () => clearInterval(interval)
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  const initials = user?.name
    ? user.name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const planLabel = user?.plan || 'Бесплатный'

  const isActive = (to) => {
    if (to === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/'
    return location.pathname.startsWith(to)
  }

  const getIconClassName = (item, active) => {
    if (!active) return ''
    return item.partialFill ? 'nav-icon-partial' : 'nav-icon-full'
  }

  const renderAvatarPopover = (closeMenu) => (
    <>
      <div style={{
        background: '#F7F6F1', padding: '20px 16px',
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: '#D3D1C7', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 600, color: '#444'
        }}>{initials}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{user?.name || 'Гость'}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{planLabel}</div>
        </div>
      </div>
      <div style={{ borderTop: '0.5px solid #E5E5E0' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', background: 'transparent',
            border: 'none', cursor: 'pointer', width: '100%',
            color: '#DC2626', fontSize: 14, fontWeight: 500, textAlign: 'left',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          <LogOut size={18} strokeWidth={1.8} />
          Выйти
        </button>
      </div>
    </>
  )

  const renderMobileDrawerMenu = (closeMenu) => (
    <>
      <div style={{
        background: '#F7F6F1', padding: '20px 16px',
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: '#D3D1C7', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 600, color: '#444'
        }}>{initials}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{user?.name || 'Гость'}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{planLabel}</div>
        </div>
      </div>
      <div style={{ borderTop: '0.5px solid #E5E5E0' }}>
        {DRAWER_TOP.map(item => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={closeMenu}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', textDecoration: 'none',
                color: '#111', fontSize: 15, fontWeight: 600
              }}
            >
              <Icon size={20} strokeWidth={1.8} color="#444" />
              {item.label}
            </Link>
          )
        })}
      </div>
      <div style={{ borderTop: '0.5px solid #E5E5E0' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', background: 'transparent',
            border: 'none', cursor: 'pointer', width: '100%',
            color: '#DC2626', fontSize: 14, fontWeight: 500, textAlign: 'left',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          <LogOut size={18} strokeWidth={1.8} />
          Выйти
        </button>
      </div>
    </>
  )

  const renderHeader = () => (
    <div style={{
      background: '#F7F6F1', borderBottom: '0.5px solid #E5E5E0',
      padding: '12px 16px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 10
    }}>
      <button
        onClick={() => setDrawerOpen(true)}
        style={{
          background: 'transparent', border: 'none', padding: 0,
          cursor: 'pointer'
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: '#D3D1C7', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600, color: '#444'
        }}>{initials}</div>
      </button>

      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 18, fontWeight: 800, color: '#111'
      }}>
        kog<span style={{ background: '#E8FF47', padding: '0 5px', borderRadius: 4 }}>DA</span>
      </div>

      <div style={{ width: 32, height: 32 }} />
    </div>
  )

  const renderSidebar = () => {
    const collapsed = isNarrow
    const width = collapsed ? 64 : SIDEBAR_WIDTH

    return (
      <div style={{
        width,
        flexShrink: 0,
        background: 'transparent',
        display: 'flex', flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 5,
        padding: '20px 0'
      }}>
        <div style={{
          padding: collapsed ? '0 0 16px' : '0 14px 16px',
          display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start',
          alignItems: 'center'
        }}>
          {collapsed ? (
            <div style={{
              fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 800,
              color: '#111', background: '#E8FF47',
              padding: '4px 8px', borderRadius: 4
            }}>DA</div>
          ) : (
            <div style={{
              fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#111'
            }}>
              kog<span style={{ background: '#E8FF47', padding: '0 6px', borderRadius: 4 }}>DA</span>
            </div>
          )}
        </div>

        <nav style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = isActive(item.to)
            const showTooltip = collapsed && hoveredItem === item.to
            const showBadge = item.hasBadge && pendingCount > 0

            return (
              <div key={item.to} style={{ position: 'relative' }}>
                <Link
                  to={item.to}
                  onMouseEnter={() => setHoveredItem(item.to)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    gap: collapsed ? 0 : 12,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '10px 0' : '10px 14px',
                    borderRadius: 10, textDecoration: 'none',
                    background: 'transparent',
                    color: active ? '#111' : '#666',
                    fontSize: 15,
                    fontWeight: active ? 700 : 500,
                    transition: 'background 0.15s',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => { if (!active) e.currentTarget.style.background = '#EAE8DD' }}
                  onMouseOut={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2 : 1.8}
                    fill="none"
                    color={active ? '#111' : '#666'}
                    className={getIconClassName(item, active)}
                  />
                  {!collapsed && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      {item.label}
                      {showBadge && (
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: '#111',
                          border: '2px solid #E8FF47',
                          display: 'inline-block',
                          flexShrink: 0
                        }} />
                      )}
                    </span>
                  )}
                  {collapsed && showBadge && (
                    <span style={{
                      position: 'absolute',
                      top: 6,
                      right: 14,
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: '#111',
                      border: '2px solid #E8FF47'
                    }} />
                  )}
                </Link>
                {showTooltip && (
                  <div style={{
                    position: 'absolute', left: 'calc(100% + 8px)', top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#111', color: '#fff',
                    padding: '6px 12px', borderRadius: 6,
                    fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                    zIndex: 100, pointerEvents: 'none'
                  }}>
                    {item.label}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div style={{
          padding: collapsed ? '8px 0 0' : '8px 4px 0',
          position: 'relative'
        }}>
          <button
            onClick={() => setPopoverOpen(!popoverOpen)}
            style={{
              display: 'flex', alignItems: 'center',
              gap: collapsed ? 0 : 10,
              width: '100%', padding: collapsed ? 4 : '6px 10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: 'transparent', border: 'none',
              cursor: 'pointer', borderRadius: 10,
              fontFamily: 'Inter, sans-serif'
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#D3D1C7', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, color: '#444',
              flexShrink: 0
            }}>{initials}</div>
            {!collapsed && (
              <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: '#111',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>{user?.name || 'Гость'}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{planLabel}</div>
              </div>
            )}
          </button>

          {popoverOpen && (
            <>
              <div
                onClick={() => setPopoverOpen(false)}
                style={{
                  position: 'fixed', inset: 0, zIndex: 50
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: collapsed ? 8 : 12,
                width: 240,
                background: '#fff',
                borderRadius: 12,
                border: '0.5px solid #E5E5E0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                zIndex: 60, overflow: 'hidden'
              }}>
                {renderAvatarPopover(() => setPopoverOpen(false))}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  const renderBottomNav = () => (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#FFFFFF', borderTop: '0.5px solid #E5E5E0',
      display: 'flex', justifyContent: 'space-around',
      padding: '10px 0 14px',
      zIndex: 10
    }}>
      {MOBILE_NAV_ITEMS.map(item => {
        const Icon = item.icon
        const active = isActive(item.to)
        const showBadge = item.hasBadge && pendingCount > 0
        return (
          <Link
            key={item.to}
            to={item.to}
            style={{
              display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none',
              flex: 1
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative'
            }}>
              <Icon
                size={22}
                strokeWidth={active ? 2 : 1.8}
                fill="none"
                color="#111"
                className={getIconClassName(item, active)}
              />
              {showBadge && (
                <div style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: '#111',
                  border: '2px solid #E8FF47'
                }} />
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )

  const renderDrawer = () => {
    if (!drawerOpen) return null
    return (
      <>
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)', zIndex: 100
          }}
        />
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: 280, background: '#fff', zIndex: 101,
          overflowY: 'auto'
        }}>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'absolute', top: 12, right: 12,
              background: 'transparent', border: 'none',
              padding: 4, cursor: 'pointer', zIndex: 1
            }}
          >
            <X size={20} color="#666" />
          </button>
          {renderMobileDrawerMenu(() => setDrawerOpen(false))}
        </div>
      </>
    )
  }

  if (isMobile) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F7F6F1',
        fontFamily: 'Inter, sans-serif',
        paddingBottom: 70
      }}>
        <style>{ICON_STYLES}</style>
        {renderHeader()}
        <main>{children}</main>
        {renderBottomNav()}
        {renderDrawer()}
      </div>
    )
  }

  const hasRightColumn = !!rightColumn

  return (
    <div style={{
      minHeight: '100vh', background: '#F7F6F1',
      fontFamily: 'Inter, sans-serif'
    }}>
      <style>{ICON_STYLES}</style>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'flex-start',
        minHeight: '100vh',
        position: 'relative'
      }}>
        {/* Left divider */}
        <div style={{
          position: 'absolute',
          left: SIDEBAR_WIDTH,
          top: 0,
          bottom: 0,
          width: 1,
          background: 'rgba(17, 17, 17, 0.15)',
          pointerEvents: 'none'
        }} />

        {/* Right divider — рендерится только если есть третья колонка */}
        {hasRightColumn && (
          <div style={{
            position: 'fixed',
            right: 'calc(50vw - 640px + 320px + 24px)',
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(17, 17, 17, 0.15)',
            pointerEvents: 'none',
            zIndex: 1
          }} />
        )}

        {renderSidebar()}

        <main style={{
          flex: 1,
          padding: '24px 24px 24px 24px',
          minWidth: 0
        }}>
          {children}
        </main>

        {hasRightColumn && (
          <aside style={{
            width: RIGHT_COLUMN_WIDTH,
            flexShrink: 0,
            padding: '62px 24px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24
          }}>
            {rightColumn}
          </aside>
        )}
      </div>
    </div>
  )
}