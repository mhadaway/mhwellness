import { Link, useLocation } from 'react-router-dom'

export default function Topbar() {
  const loc = useLocation()
  // Hide app topbar on plan view / daily guide pages (they have their own topbars)
  const isPlanPage = /\/plans\/[^/]+(\/daily)?$/.test(loc.pathname) && !/\/edit$/.test(loc.pathname)
  if (isPlanPage) return null

  return (
    <nav className="app-topbar">
      <div className="app-topbar-inner">
        <Link to="/" className="app-logo">
          MH Wellness
          <span>PT Client Management</span>
        </Link>
        <div className="topbar-spacer" />
        <div className="topbar-nav">
          <Link to="/" className={loc.pathname === '/' ? 'active' : ''}>Clients</Link>
        </div>
      </div>
    </nav>
  )
}
