import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getClients, getClientPlans, calcAge, fmtDate, initials } from '../utils/storage.js'

export default function Dashboard() {
  const [query, setQuery] = useState('')
  const clients = getClients()
  const totalPlans = clients.reduce((n, c) => n + getClientPlans(c.id).length, 0)
  const active = clients.filter(c => {
    const plans = getClientPlans(c.id)
    return plans.some(p => p.status === 'active')
  }).length

  const filtered = clients.filter(c => {
    if (!query) return true
    const q = query.toLowerCase()
    const name = `${c.firstName} ${c.lastName}`.toLowerCase()
    return name.includes(q) || (c.email || '').toLowerCase().includes(q)
  })

  return (
    <div>
      {/* Hero */}
      <div className="dash-hero">
        <div className="dash-hero-inner">
          <div className="dash-hero-label">Physical Therapy Practice</div>
          <h1>Client Management</h1>
          <div className="dash-hero-sub">Create and manage personalized wellness plans for your clients.</div>
          <div className="dash-stats-row">
            <div className="dash-stat">
              <div className="dash-stat-val">{clients.length}</div>
              <div className="dash-stat-lbl">Total Clients</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-val">{totalPlans}</div>
              <div className="dash-stat-lbl">Wellness Plans</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-val">{active}</div>
              <div className="dash-stat-lbl">Active Plans</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-main">
        {/* Toolbar */}
        <div className="dash-toolbar">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search clients by name or email…"
            />
          </div>
          <Link to="/clients/new" className="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Client
          </Link>
        </div>

        {/* Client grid */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {query ? (
              <>
                <h3>No clients match "{query}"</h3>
                <p>Try a different name or clear your search.</p>
                <button className="btn btn-ghost" onClick={() => setQuery('')}>Clear Search</button>
              </>
            ) : (
              <>
                <h3>No clients yet</h3>
                <p>Add your first client to start creating wellness plans.</p>
                <Link to="/clients/new" className="btn btn-primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add First Client
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="client-grid">
            {filtered.map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ClientCard({ client }) {
  const age = calcAge(client.dob)
  const plans = getClientPlans(client.id)
  const conditions = (client.intake?.conditions || []).slice(0, 3)
  const restrictions = (client.intake?.dietaryRestrictions || []).slice(0, 2)
  const lastPlan = plans[0]

  return (
    <Link to={`/clients/${client.id}`} className="client-card">
      <div className="client-card-top">
        <div className="client-avatar">{initials(`${client.firstName} ${client.lastName}`)}</div>
        <div>
          <div className="client-card-name">{client.firstName} {client.lastName}</div>
          <div className="client-card-age">
            {age ? `Age ${age}` : ''}
            {age && client.email ? ' · ' : ''}
            {client.email || ''}
          </div>
        </div>
      </div>
      {(conditions.length > 0 || restrictions.length > 0) && (
        <div className="client-tags">
          {conditions.map(c => <span key={c} className="client-tag">{c}</span>)}
          {restrictions.map(r => <span key={r} className="client-tag green">{r}</span>)}
        </div>
      )}
      <div className="client-card-footer">
        <span>{lastPlan ? `Last plan: ${fmtDate(lastPlan.createdAt)}` : 'No plans yet'}</span>
        <span className="plan-count">{plans.length} plan{plans.length !== 1 ? 's' : ''}</span>
      </div>
    </Link>
  )
}
