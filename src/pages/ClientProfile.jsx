import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getClient, getClientPlans, deleteClient, deletePlan, calcAge, fmtDate, initials } from '../utils/storage.js'
import { savePlan } from '../utils/storage.js'
import { buildPlanFromIntake } from '../utils/planDefaults.js'

export default function ClientProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)

  const client = getClient(id)
  if (!client) return (
    <div className="dash-main" style={{ paddingTop: 40 }}>
      <div className="empty-state">
        <h3>Client not found</h3>
        <Link to="/" className="btn btn-primary">← Back to Clients</Link>
      </div>
    </div>
  )

  const plans = getClientPlans(id)
  const age = calcAge(client.dob)
  const intake = client.intake || {}

  function handleDeleteClient() {
    if (!confirm(`Delete ${client.firstName} ${client.lastName} and all their plans? This cannot be undone.`)) return
    deleteClient(id)
    navigate('/')
  }

  function handleDeletePlan(planId, e) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this plan?')) return
    deletePlan(planId)
    setRefresh(r => r + 1)
  }

  function handleCreatePlan() {
    const draft = buildPlanFromIntake(client, intake)
    const saved = savePlan({ ...draft, clientId: id })
    navigate(`/clients/${id}/plans/${saved.id}/edit`)
  }

  const bmi = intake.currentWeight && intake.heightIn
    ? ((intake.currentWeight / (parseInt(intake.heightFt || 5) * 12 + parseInt(intake.heightIn || 7)) ** 2) * 703).toFixed(1)
    : null

  return (
    <div>
      {/* Hero */}
      <div className="profile-hero">
        <div className="profile-hero-inner">
          <Link to="/" className="profile-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            All Clients
          </Link>
          <div className="profile-header">
            <div className="profile-avatar">{initials(`${client.firstName} ${client.lastName}`)}</div>
            <div className="profile-meta">
              <div className="profile-name">{client.firstName} {client.lastName}</div>
              <div className="profile-details">
                {age ? `Age ${age}` : ''}
                {age && client.dob ? ` · DOB ${fmtDate(client.dob)}` : ''}
                {client.phone ? ` · ${client.phone}` : ''}
                {client.email ? ` · ${client.email}` : ''}
              </div>
              {(intake.conditions || []).length > 0 && (
                <div className="client-tags" style={{ marginTop: 8 }}>
                  {(intake.conditions || []).map(c => <span key={c} className="client-tag">{c}</span>)}
                  {(intake.dietaryRestrictions || []).map(r => <span key={r} className="client-tag green">{r}</span>)}
                </div>
              )}
              <div className="profile-actions">
                <button onClick={handleCreatePlan} className="btn btn-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  New Plan
                </button>
                <Link to={`/clients/${id}/intake`} className="btn btn-ghost" style={{ color: 'rgba(255,255,255,.8)', borderColor: 'rgba(255,255,255,.3)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit Intake
                </Link>
                <button onClick={handleDeleteClient} className="btn btn-danger btn-sm">Delete Client</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-main">
        <div className="profile-grid" style={{ marginBottom: 32 }}>
          {/* Health Profile */}
          <div className="info-card">
            <div className="info-card-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <h3>Health Profile</h3>
            </div>
            <div className="info-card-body">
              <div className="info-row"><span className="info-label">Height</span><span className="info-value">{intake.heightFt ? `${intake.heightFt}'${intake.heightIn || 0}"` : '—'}</span></div>
              <div className="info-row"><span className="info-label">Current Weight</span><span className="info-value mono">{intake.currentWeight ? `${intake.currentWeight} lbs` : '—'}</span></div>
              <div className="info-row"><span className="info-label">Target Weight</span><span className="info-value mono">{intake.targetWeight ? `${intake.targetWeight} lbs` : '—'}</span></div>
              <div className="info-row"><span className="info-label">BMI</span><span className="info-value mono">{bmi || '—'}</span></div>
              <div className="info-row"><span className="info-label">Goal Timeline</span><span className="info-value">{intake.goalTimeline || '—'}</span></div>
              <div className="info-row"><span className="info-label">Primary Goal</span><span className="info-value">{intake.primaryGoal?.replace(/_/g,' ') || '—'}</span></div>
              <div className="info-row"><span className="info-label">Pain Level</span><span className="info-value mono">{intake.painLevel != null ? `${intake.painLevel}/10` : '—'}</span></div>
            </div>
          </div>

          {/* Lifestyle */}
          <div className="info-card">
            <div className="info-card-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <h3>Lifestyle & Schedule</h3>
            </div>
            <div className="info-card-body">
              <div className="info-row"><span className="info-label">Work Hours</span><span className="info-value">{intake.workStart && intake.workEnd ? `${intake.workStart} – ${intake.workEnd}` : '—'}</span></div>
              <div className="info-row"><span className="info-label">Training Time</span><span className="info-value mono">{intake.trainingTime || '—'}</span></div>
              <div className="info-row"><span className="info-label">Training Days/Wk</span><span className="info-value mono">{intake.trainingDaysPerWeek || '—'}</span></div>
              <div className="info-row"><span className="info-label">Eating Window</span><span className="info-value">{intake.eatingWindowStart && intake.eatingWindowEnd ? `${intake.eatingWindowStart} – ${intake.eatingWindowEnd}` : '—'}</span></div>
              <div className="info-row"><span className="info-label">Fasting Protocol</span><span className="info-value">{intake.fastingProtocol || '—'}</span></div>
              <div className="info-row"><span className="info-label">Sleep (hrs/night)</span><span className="info-value mono">{intake.sleepHours || '—'}</span></div>
              <div className="info-row"><span className="info-label">Activity Level</span><span className="info-value">{intake.activityLevel?.replace(/_/g,' ') || '—'}</span></div>
            </div>
          </div>

          {/* Nutrition */}
          <div className="info-card">
            <div className="info-card-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
              <h3>Nutrition Targets</h3>
            </div>
            <div className="info-card-body">
              <div className="info-row"><span className="info-label">Daily Calories</span><span className="info-value mono">{intake.dailyCaloriesMin && intake.dailyCaloriesMax ? `${intake.dailyCaloriesMin}–${intake.dailyCaloriesMax}` : intake.dailyCaloriesMin || '—'}</span></div>
              <div className="info-row"><span className="info-label">Protein</span><span className="info-value mono">{intake.proteinMin ? `${intake.proteinMin}–${intake.proteinMax || intake.proteinMin}g` : '—'}</span></div>
              <div className="info-row"><span className="info-label">Carbs</span><span className="info-value mono">{intake.carbMin ? `${intake.carbMin}–${intake.carbMax || intake.carbMin}g` : '—'}</span></div>
              <div className="info-row"><span className="info-label">Fat</span><span className="info-value mono">{intake.fatMin ? `${intake.fatMin}–${intake.fatMax || intake.fatMin}g` : '—'}</span></div>
              <div className="info-row"><span className="info-label">Restrictions</span><span className="info-value">{(intake.dietaryRestrictions || []).join(', ') || '—'}</span></div>
              <div className="info-row"><span className="info-label">Meals/Day</span><span className="info-value mono">{intake.mealsPerDay || '—'}</span></div>
            </div>
          </div>

          {/* Medical */}
          <div className="info-card">
            <div className="info-card-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              <h3>Medical History</h3>
            </div>
            <div className="info-card-body">
              {(intake.conditions || []).length > 0 ? (
                <div className="info-row" style={{ flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                  <span className="info-label">Conditions</span>
                  <div className="client-tags" style={{ marginTop: 0 }}>
                    {(intake.conditions || []).map(c => <span key={c} className="client-tag">{c}</span>)}
                  </div>
                </div>
              ) : <div className="info-row"><span className="info-label">Conditions</span><span className="info-value">None reported</span></div>}
              <div className="info-row"><span className="info-label">Medications</span><span className="info-value text-sm">{intake.medications || '—'}</span></div>
              <div className="info-row"><span className="info-label">Surgeries</span><span className="info-value text-sm">{intake.surgeries || '—'}</span></div>
              <div className="info-row"><span className="info-label">Allergies</span><span className="info-value">{intake.allergies || '—'}</span></div>
              <div className="info-row"><span className="info-label">Limitations</span><span className="info-value text-sm">{intake.fitnessLimitations || '—'}</span></div>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="section-head">
          <h2>Wellness Plans</h2>
          <button onClick={handleCreatePlan} className="btn btn-green btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Plan
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 0' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="40" height="40" style={{ color: 'var(--gray-300)', margin: '0 auto 12px' }}>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <p className="text-muted">No wellness plans yet. Create a plan to get started.</p>
          </div>
        ) : (
          <div className="plans-grid">
            {plans.map(plan => (
              <div key={plan.id} className="plan-card" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className={`plan-card-status ${plan.status}`}>{plan.status}</span>
                  <button
                    onClick={e => handleDeletePlan(plan.id, e)}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '3px 8px', fontSize: 12, color: 'var(--red-600)', borderColor: 'var(--red-100)' }}
                  >Delete</button>
                </div>
                <div className="plan-card-title">{plan.title}</div>
                <div className="plan-card-sub">{plan.heroSubtitle || 'Wellness Plan'}</div>
                {plan.macros && (
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--gray-500)', marginBottom: 12 }}>
                    <span className="text-mono">{plan.macros.calories?.min}–{plan.macros.calories?.max} cal</span>
                    <span className="text-mono">{plan.macros.protein?.min}–{plan.macros.protein?.max}g protein</span>
                  </div>
                )}
                <div className="plan-card-footer">
                  <Link to={`/clients/${id}/plans/${plan.id}`} className="btn btn-primary btn-sm">View Plan</Link>
                  <Link to={`/clients/${id}/plans/${plan.id}/daily`} className="btn btn-ghost btn-sm">Daily Guide</Link>
                  <Link to={`/clients/${id}/plans/${plan.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 10 }}>
                  Created {fmtDate(plan.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
