import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPlan, getClient, fmtDate } from '../utils/storage.js'
import { DAYS } from '../utils/planDefaults.js'

export default function PlanView() {
  const { id, planId } = useParams()
  const [tocOpen, setTocOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrollVisible, setScrollVisible] = useState(false)
  const [activeSection, setActiveSection] = useState('s1')
  const searchRef = useRef(null)

  const plan = getPlan(planId)
  const client = getClient(id)

  useEffect(() => {
    const onScroll = () => {
      setScrollVisible(window.scrollY > 300)
      const sections = document.querySelectorAll('.plan-section[id]')
      let current = 's1'
      sections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 120) current = s.id
      })
      setActiveSection(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus()
  }, [searchOpen])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery('') }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!plan || !client) return (
    <div className="dash-main" style={{ paddingTop: 40 }}>
      <div className="empty-state"><h3>Plan not found</h3></div>
    </div>
  )

  const intake = client.intake || {}
  const macros = plan.macros || {}
  const sections = plan.sections || []
  const meals = plan.weeklyMeals || []
  const workouts = plan.weeklyWorkouts || []
  const supplements = plan.supplements || {}
  const phases = plan.phases || []
  const milestones = plan.milestones || []

  const heroTags = [
    ...(intake.conditions || []),
    ...(intake.dietaryRestrictions || []),
    intake.fastingProtocol && intake.fastingProtocol !== 'none' ? `${intake.fastingProtocol} Intermittent Fasting` : null,
    intake.workStart && intake.workEnd ? `Work: ${intake.workStart}–${intake.workEnd}` : null,
  ].filter(Boolean)

  const heroStats = [
    intake.currentWeight && intake.targetWeight ? { val: `${intake.currentWeight} → ${intake.targetWeight}`, lbl: 'Weight Target (lbs)' } : null,
    macros.calories ? { val: `${macros.calories.min}–${macros.calories.max}`, lbl: 'Daily Calories' } : null,
    macros.protein ? { val: `${macros.protein.min}–${macros.protein.max}g`, lbl: 'Daily Protein' } : null,
    intake.eatingWindowStart && intake.eatingWindowEnd ? { val: `${intake.eatingWindowStart}–${intake.eatingWindowEnd}`, lbl: 'Eating Window' } : null,
    intake.trainingTime ? { val: intake.trainingTime, lbl: 'Training Time' } : null,
  ].filter(Boolean)

  // Simple search: gather text content from the plan
  const searchResults = searchQuery.length > 1 ? getSearchResults(plan, sections, meals, workouts, searchQuery) : []

  function scrollToSection(id) {
    const el = document.getElementById(id)
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTocOpen(false) }
  }

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }}>
      {/* Plan Topbar */}
      <nav className="plan-topbar" id="planTopbar">
        <div className="plan-topbar-inner">
          <button className="plan-topbar-btn" onClick={() => setTocOpen(true)} aria-label="Table of contents">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="plan-topbar-title">{plan.title || `${client.firstName}'s Plan`}</div>
          <Link to={`/clients/${id}/plans/${planId}/daily`} className="plan-crossnav-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Daily Guide</span>
          </Link>
          <button className="plan-topbar-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>
      </nav>

      {/* Search Panel */}
      <div className={`plan-search-panel${searchOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) { setSearchOpen(false); setSearchQuery('') } }}>
        <div className="plan-search-container">
          <div className="plan-search-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              ref={searchRef}
              type="text"
              className="plan-search-input"
              placeholder="Search plan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
            <button className="plan-search-close" onClick={() => { setSearchOpen(false); setSearchQuery('') }}>ESC</button>
          </div>
          {searchQuery.length > 1 && <div className="plan-search-count">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</div>}
          <div className="plan-search-results">
            {searchQuery.length <= 1 ? (
              <div className="plan-search-empty">Type to search across the entire plan</div>
            ) : searchResults.length === 0 ? (
              <div className="plan-search-empty">No results for "{searchQuery}"</div>
            ) : searchResults.map((r, i) => (
              <div key={i} className="plan-search-result" onClick={() => { scrollToSection(r.sectionId); setSearchOpen(false); setSearchQuery('') }}>
                <div className="plan-search-result-section">{r.section}</div>
                <div className="plan-search-result-text" dangerouslySetInnerHTML={{ __html: highlight(r.text, searchQuery) }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOC Drawer */}
      <div className={`plan-toc-overlay${tocOpen ? ' open' : ''}`} onClick={() => setTocOpen(false)} />
      <aside className={`plan-toc-drawer${tocOpen ? ' open' : ''}`}>
        <div className="plan-toc-header">
          <h2>Contents</h2>
          <button className="plan-toc-close" onClick={() => setTocOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <Link
          to={`/clients/${id}/plans/${planId}/daily`}
          className="plan-toc-daily-link"
          onClick={() => setTocOpen(false)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Open Daily Guide →
        </Link>
        <Link
          to={`/clients/${id}`}
          className="plan-toc-back-link"
          onClick={() => setTocOpen(false)}
        >
          ← Back to Client Profile
        </Link>
        <nav className="plan-toc-body">
          {sections.map((s, i) => (
            <button
              key={s.id}
              className={`plan-toc-item${activeSection === s.id ? ' active' : ''}`}
              onClick={() => scrollToSection(s.id)}
            >
              <span className="plan-toc-num">0{i + 1}</span> {s.title}
            </button>
          ))}
          {meals.length > 0 && (
            <button className={`plan-toc-item${activeSection === 'nutrition' ? ' active' : ''}`} onClick={() => scrollToSection('nutrition')}>
              Nutrition Plan
            </button>
          )}
          {workouts.some(w => w.exercises?.length) && (
            <button className={`plan-toc-item${activeSection === 'fitness' ? ' active' : ''}`} onClick={() => scrollToSection('fitness')}>
              Fitness Program
            </button>
          )}
          {(supplements.foundational?.length || supplements.targeted?.length) && (
            <button className={`plan-toc-item${activeSection === 'supplements' ? ' active' : ''}`} onClick={() => scrollToSection('supplements')}>
              Supplements
            </button>
          )}
        </nav>
      </aside>

      {/* Scroll to top */}
      <button
        className={`plan-scroll-top${scrollVisible ? ' visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
      </button>

      {/* Hero */}
      <header className="plan-hero">
        <div className="plan-hero-content">
          <div className="plan-hero-label">Personalized Wellness Plan</div>
          <h1>{plan.title || `${client.firstName} ${client.lastName}'s Wellness Plan`}</h1>
          {plan.heroSubtitle && <div className="plan-hero-subtitle">{plan.heroSubtitle}</div>}
          {heroTags.length > 0 && (
            <div className="plan-hero-tags">
              {heroTags.map((t, i) => <span key={i} className="plan-hero-tag">{t}</span>)}
            </div>
          )}
          {heroStats.length > 0 && (
            <div className="plan-hero-stats">
              {heroStats.map((s, i) => (
                <div key={i} className="plan-hero-stat">
                  <div className="plan-hero-stat-value">{s.val}</div>
                  <div className="plan-hero-stat-label">{s.lbl}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="plan-main">
        {/* Sections */}
        {sections.map((section, si) => (
          <div key={section.id} className="plan-section" id={section.id}>
            <div className="plan-section-number">Section {String(si + 1).padStart(2, '0')}</div>
            <h2 className="plan-section-title">{section.title}</h2>

            {section.assessment && (
              <div className="plan-box blue">
                <div className="plan-box-title">Starting Point</div>
                <div className="plan-box-body">{section.assessment}</div>
              </div>
            )}

            {section.paragraphs?.map((p, pi) => (
              <p key={pi}>{p}</p>
            ))}

            {section.boxes?.map((box, bi) => (
              <div key={bi} className={`plan-box ${box.color || 'blue'}`}>
                <div className="plan-box-title">{box.title}</div>
                <div className="plan-box-body">{box.body}</div>
              </div>
            ))}

            {section.lists?.map((list, li) => (
              <div key={li}>
                {list.heading && <h3 className="plan-subsection-title">{list.heading}</h3>}
                <ul className="plan-content-list">
                  {list.items.map((item, ii) => <li key={ii}>{item}</li>)}
                </ul>
              </div>
            ))}

            {section.table && (
              <div className="plan-table-wrap">
                <table className="plan-table">
                  <thead>
                    <tr>{section.table.headers.map((h, hi) => <th key={hi}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row, ri) => (
                      <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {/* Phases */}
        {phases.length > 0 && (
          <div className="plan-section" id="phases">
            <div className="plan-section-number">Progression</div>
            <h2 className="plan-section-title">Phase Progression</h2>
            {phases.map((phase, pi) => (
              <div key={pi} className="plan-phase-box">
                <div className="plan-phase-title">{phase.title}</div>
                <ul>
                  {(phase.bullets || []).map((b, bi) => <li key={bi}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Nutrition */}
        {meals.length > 0 && (
          <div className="plan-section" id="nutrition">
            <div className="plan-section-number">Nutrition</div>
            <h2 className="plan-section-title">Seven-Day Meal Plan</h2>

            {macros.calories && (
              <div className="plan-table-wrap">
                <table className="plan-table">
                  <thead><tr><th>Macronutrient</th><th>Daily Target</th></tr></thead>
                  <tbody>
                    <tr><td>Calories</td><td>{macros.calories.min}–{macros.calories.max}</td></tr>
                    <tr><td>Protein</td><td>{macros.protein?.min}–{macros.protein?.max}g</td></tr>
                    <tr><td>Carbohydrates</td><td>{macros.carbs?.min}–{macros.carbs?.max}g</td></tr>
                    <tr><td>Fat</td><td>{macros.fat?.min}–{macros.fat?.max}g</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {meals.map((dayMeals, di) => {
              if (!dayMeals || !dayMeals.length) return null
              const workout = workouts[di]
              return (
                <div key={di}>
                  <div className="plan-day-header">
                    <span className="plan-day-header-title">Day {di + 1} — {DAYS[di]}</span>
                    {workout?.name && <span className="plan-day-header-sub">{workout.name}</span>}
                  </div>
                  {dayMeals.map((meal, mi) => (
                    <div key={mi} className="plan-meal-card">
                      <div className="plan-meal-card-header">
                        <span className="plan-meal-card-label">Meal {mi + 1}: {meal.name}</span>
                        {meal.time && <span className="plan-meal-card-time">{meal.time}</span>}
                      </div>
                      <div className="plan-meal-card-body">
                        <ul>
                          {(meal.items || []).map((item, ii) => <li key={ii}>{item}</li>)}
                        </ul>
                        {(meal.protein || meal.carbs || meal.fat || meal.calories) && (
                          <div className="plan-meal-card-macros">
                            {meal.protein ? `Protein: ${meal.protein}g` : ''}
                            {meal.carbs ? ` | Carbs: ${meal.carbs}g` : ''}
                            {meal.fat ? ` | Fat: ${meal.fat}g` : ''}
                            {meal.calories ? ` | ~${meal.calories} cal` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {dayMeals.totalCalories && (
                    <div className="plan-meal-day-totals">
                      Day {di + 1} Totals: <span>{dayMeals.totalCalories}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Fitness */}
        {workouts.some(w => w.exercises?.length) && (
          <div className="plan-section" id="fitness">
            <div className="plan-section-number">Fitness</div>
            <h2 className="plan-section-title">Fitness Program</h2>

            {intake.trainingTime && (
              <div className="plan-box green">
                <div className="plan-box-title">Training Window: {intake.trainingTime} (Fasted)</div>
                <div className="plan-box-body">
                  {intake.trainingDaysPerWeek} days per week. {intake.activityLevel ? `Activity level: ${intake.activityLevel.replace(/_/g,' ')}.` : ''} All sessions designed to protect joints while building strength and cardiovascular fitness.
                </div>
              </div>
            )}

            <div className="plan-table-wrap">
              <table className="plan-table">
                <thead><tr><th>Day</th><th>Focus</th><th>Duration</th></tr></thead>
                <tbody>
                  {workouts.map((w, wi) => (
                    <tr key={wi}>
                      <td>{DAYS[wi]}</td>
                      <td>{w.name || '—'}</td>
                      <td>{w.duration || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {workouts.map((w, wi) => {
              if (!w.exercises?.length) return null
              return (
                <div key={wi}>
                  <h3 className="plan-subsection-title">{DAYS[wi]}: {w.name}</h3>
                  <ul className="plan-content-list">
                    {w.exercises.map((ex, ei) => (
                      <li key={ei}><strong>{ex.name}</strong>{ex.sets ? ` — ${ex.sets}` : ''}</li>
                    ))}
                  </ul>
                  {w.note && (
                    <div className="plan-box blue">
                      <div className="plan-box-body">{w.note}</div>
                    </div>
                  )}
                  {w.tip && (
                    <div className="plan-box green">
                      <div className="plan-box-title">Tip</div>
                      <div className="plan-box-body">{w.tip}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Supplements */}
        {(supplements.foundational?.length > 0 || supplements.targeted?.length > 0) && (
          <div className="plan-section" id="supplements">
            <div className="plan-section-number">Supplements</div>
            <h2 className="plan-section-title">Supplement Protocol</h2>

            {supplements.foundational?.length > 0 && (
              <>
                <h3 className="plan-subsection-title">Foundational (Daily)</h3>
                <div className="plan-table-wrap">
                  <table className="plan-table">
                    <thead><tr><th>Supplement</th><th>Dose</th><th>Purpose & Timing</th></tr></thead>
                    <tbody>
                      {supplements.foundational.map((s, si) => (
                        <tr key={si}>
                          <td>{s.name}</td>
                          <td>{s.dose || '—'}</td>
                          <td>{s.purpose || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {supplements.targeted?.length > 0 && (
              <>
                <h3 className="plan-subsection-title">Targeted</h3>
                <div className="plan-table-wrap">
                  <table className="plan-table">
                    <thead><tr><th>Supplement</th><th>Dose</th><th>Purpose & Timing</th></tr></thead>
                    <tbody>
                      {supplements.targeted.map((s, si) => (
                        <tr key={si}>
                          <td>{s.name}</td>
                          <td>{s.dose || '—'}</td>
                          <td>{s.purpose || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {supplements.avoid?.length > 0 && (
              <>
                <h3 className="plan-subsection-title">Avoid</h3>
                <ul className="plan-content-list">
                  {supplements.avoid.map((s, si) => <li key={si}>{s}</li>)}
                </ul>
              </>
            )}
          </div>
        )}

        {/* Milestones */}
        {milestones.length > 0 && (
          <div className="plan-section" id="milestones">
            <div className="plan-section-number">Progress</div>
            <h2 className="plan-section-title">Milestones & Checkpoints</h2>
            <div className="plan-table-wrap">
              <table className="plan-table">
                <thead><tr><th>Timeline</th><th>Goal</th><th>Metric</th></tr></thead>
                <tbody>
                  {milestones.map((m, mi) => (
                    <tr key={mi}>
                      <td>{m.week}</td>
                      <td>{m.goal}</td>
                      <td>{m.metric || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Additional notes */}
        {plan.notes && (
          <div className="plan-section" id="notes">
            <div className="plan-section-number">Notes</div>
            <h2 className="plan-section-title">Additional Notes</h2>
            <p>{plan.notes}</p>
          </div>
        )}

        <div className="plan-footer">
          <p>Created {fmtDate(plan.createdAt)} · {client.firstName} {client.lastName}</p>
          <p style={{ marginTop: 4 }}>
            <Link to={`/clients/${id}/plans/${planId}/edit`} style={{ color: 'var(--blue-600)' }}>Edit Plan</Link>
            {' · '}
            <Link to={`/clients/${id}`} style={{ color: 'var(--blue-600)' }}>Back to Profile</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

function highlight(text, query) {
  if (!query) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>')
}

function getSearchResults(plan, sections, meals, workouts, query) {
  const results = []
  const q = query.toLowerCase()

  sections.forEach((s) => {
    const texts = [
      s.assessment,
      ...(s.paragraphs || []),
      ...(s.boxes?.map(b => `${b.title} ${b.body}`) || []),
      ...(s.lists?.flatMap(l => l.items) || []),
    ].filter(Boolean)
    texts.forEach(t => {
      if (t.toLowerCase().includes(q)) {
        results.push({ sectionId: s.id, section: s.title, text: t.slice(0, 120) })
      }
    })
  })

  meals.forEach((dayMeals, di) => {
    if (!dayMeals) return
    dayMeals.forEach(meal => {
      (meal.items || []).forEach(item => {
        if (item.toLowerCase().includes(q)) {
          results.push({ sectionId: 'nutrition', section: `Day ${di + 1} – ${meal.name}`, text: item })
        }
      })
    })
  })

  return results.slice(0, 20)
}
