export default function Footer() {
  const linkStyle = {
    color: '#999',
    fontSize: 11,
    textDecoration: 'none',
    fontFamily: 'Inter, sans-serif'
  }

  return (
    <div style={{
      paddingTop: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
        <a href="/terms" style={linkStyle}>Условия</a>
        <span style={{ color: '#ccc', fontSize: 11 }}>·</span>
        <a href="/privacy" style={linkStyle}>Конфиденциальность</a>
      </div>
      <div style={{ fontSize: 11, color: '#999' }}>
        © 2026 kogDA · <a href="https://veneracode.com" target="_blank" rel="noreferrer" style={linkStyle}>Venera Code</a>
      </div>
    </div>
  )
}