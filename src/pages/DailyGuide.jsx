import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPlan, getClient } from '../utils/storage.js'
import { DAYS, DAY_ABBR } from '../utils/planDefaults.js'

export default function DailyGuide() {
  const { id, planId } = useParams()
  const [activeDay, setActiveDay] = useState(0)
  const touchStartX = useRef(null)

  const plan = getPlan(planId)
  const client = getClient(id)

  useEffect(() => {
    const today = new Date().getDay()
    // JS: 0=Sun,1=Mon,...,6=Sat → our 0=Mon
    const dayIdx = today === 0 ? 6 : today - 1
    setActiveDay(dayIdx)
  }, [])

  // Swipe support
  useEffect(() => {
    const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
    const onTouchEnd = (e) => {
      if (touchStartX.current === null) return
      const dx = e.changedTouches[0].clientX - touchStartX.current
      if (Math.abs(dx) > 50) {
        setActiveDay(d => dx < 0 ? Math.min(6, d + 1) : Math.max(0, d - 1))
      }
      touchStartX.current = null
    }
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  if (!plan || !client) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div className="empty-state"><h3>Plan not found</h3></div>
    </div>
  )

  const meals = (plan.weeklyMeals || [])[activeDay] || []
  const workout = (plan.weeklyWorkouts || [])[activeDay] || {}
  const schedule = (plan.dailySchedules || [])[activeDay] || []
  const supplements = plan.supplements || {}
  const macros = plan.macros || {}

  const allSupps = [
    ...(supplements.foundational || []),
    ...(supplements.targeted || []),
  ]

  const dayTotals = {
    calories: meals.reduce((sum, m) => sum + (parseInt(m.calories) || 0), 0) || (macros.calories?.min),
    protein: meals.reduce((sum, m) => sum + (parseInt(m.protein) || 0), 0) || (macros.protein?.min),
    carbs: meals.reduce((sum, m) => sum + (parseInt(m.carbs) || 0), 0) || (macros.carbs?.min),
    fat: meals.reduce((sum, m) => sum + (parseInt(m.fat) || 0), 0) || (macros.fat?.min),
  }

  return (
    <div style={{ background: 'var(--gray-100)', minHeight: '100dvh' }}>
      {/* Navbar */}
      <nav className="dg-navbar">
        <div className="dg-nav-inner">
          <Link to={`/clients/${id}/plans/${planId}`} className="dg-crossnav-btn" title="Open Full Plan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <span>Full Plan</span>
          </Link>
          <div className="dg-day-tabs">
            {DAYS.map((day, di) => (
              <button
                key={di}
                className={`dg-tab${activeDay === di ? ' active' : ''}`}
                onClick={() => setActiveDay(di)}
              >
                <span className="dg-tab-letter">{DAY_ABBR[di]}</span>
                <span className="dg-tab-num">{di + 1}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="dg-container">
        <DayContent
          day={activeDay}
          dayName={DAYS[activeDay]}
          workout={workout}
          meals={meals}
          schedule={schedule}
          supplements={allSupps}
          dayTotals={dayTotals}
          plan={plan}
        />
        <div className="dg-swipe-hint">Swipe left or right to change days</div>
      </div>
    </div>
  )
}

function DayContent({ day, dayName, workout, meals, schedule, supplements, dayTotals, plan }) {
  return (
    <div>
      {/* Day Hero */}
      <div className="dg-hero">
        <div className="dg-hero-label">Day {day + 1}</div>
        <h1>{dayName}</h1>
        <div className="dg-hero-type">{workout.name || 'Rest Day'}</div>
        <div className="dg-day-stats">
          <div className="dg-day-stat">
            <div className="dg-day-stat-val">{dayTotals.calories ? dayTotals.calories.toLocaleString() : '—'}</div>
            <div className="dg-day-stat-lbl">Calories</div>
          </div>
          <div className="dg-day-stat">
            <div className="dg-day-stat-val">{dayTotals.protein ? `${dayTotals.protein}g` : '—'}</div>
            <div className="dg-day-stat-lbl">Protein</div>
          </div>
          <div className="dg-day-stat">
            <div className="dg-day-stat-val">{dayTotals.carbs ? `${dayTotals.carbs}g` : '—'}</div>
            <div className="dg-day-stat-lbl">Carbs</div>
          </div>
          <div className="dg-day-stat">
            <div className="dg-day-stat-val">{dayTotals.fat ? `${dayTotals.fat}g` : '—'}</div>
            <div className="dg-day-stat-lbl">Fat</div>
          </div>
        </div>
      </div>

      {/* Daily Timeline */}
      {schedule.length > 0 && (
        <div className="dg-timeline">
          <div className="dg-tl-title">Daily Schedule</div>
          {schedule.map((row, ri) => (
            <div key={ri} className={`dg-tl-row${row.type ? ` ${row.type}` : ''}`}>
              <div className="dg-tl-time">{row.time}</div>
              <div className="dg-tl-event" dangerouslySetInnerHTML={{ __html: row.event }} />
            </div>
          ))}
        </div>
      )}

      {/* Workout Card */}
      {workout.exercises?.length > 0 && (
        <div className="dg-workout-card">
          <div className="dg-workout-header">
            <div className="dg-workout-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6.5 6.5L17.5 17.5M6.5 17.5L17.5 6.5"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div className="dg-workout-header-text">
              <h3>{workout.name}</h3>
              <span>{workout.time && `${workout.time} · `}{workout.duration}</span>
            </div>
          </div>
          <div className="dg-workout-body">
            {workout.exercises.map((ex, ei) => (
              <div key={ei} className="dg-exercise-item">
                <span className="dg-exercise-name">{ex.name}</span>
                <span className="dg-exercise-sets">{ex.sets}</span>
              </div>
            ))}
            {workout.note && <div className="dg-workout-note">{workout.note}</div>}
          </div>
        </div>
      )}

      {/* Meal Cards */}
      {meals.map((meal, mi) => (
        <div key={mi} className="dg-meal-card">
          <div className="dg-meal-header">
            <div className="dg-meal-label">
              <div className="dg-meal-num">{mi + 1}</div>
              <div className="dg-meal-name">{meal.name}</div>
            </div>
            {meal.time && <div className="dg-meal-time">{meal.time}</div>}
          </div>
          <div className="dg-meal-items">
            {(meal.items || []).map((item, ii) => (
              <div key={ii} className="dg-meal-item">{item}</div>
            ))}
          </div>
          <div className="dg-meal-macros">
            <div className="dg-macro"><div className="dg-macro-val">{meal.protein || '—'}g</div><div className="dg-macro-lbl">Protein</div></div>
            <div className="dg-macro"><div className="dg-macro-val">{meal.carbs || '—'}g</div><div className="dg-macro-lbl">Carbs</div></div>
            <div className="dg-macro"><div className="dg-macro-val">{meal.fat || '—'}g</div><div className="dg-macro-lbl">Fat</div></div>
            <div className="dg-macro"><div className="dg-macro-val">{meal.calories || '—'}</div><div className="dg-macro-lbl">Cal</div></div>
          </div>
        </div>
      ))}

      {/* Supplements */}
      {supplements.length > 0 && (
        <div className="dg-supps-card">
          <div className="dg-supps-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            <h3>Supplements</h3>
          </div>
          {supplements.map((s, si) => (
            <div key={si} className="dg-supp-row">
              <span className="dg-supp-name">{s.name}{s.dose ? ` (${s.dose})` : ''}</span>
              <span className="dg-supp-when">{s.timing || s.purpose?.split('.')[0] || '—'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Day Totals */}
      <div className="dg-day-totals">
        <h3>{dayName} Totals</h3>
        <div className="dg-totals-grid">
          <div className="dg-total-item">
            <div className="dg-total-val">{dayTotals.calories ? dayTotals.calories.toLocaleString() : '—'}</div>
            <div className="dg-total-lbl">Calories</div>
          </div>
          <div className="dg-total-item">
            <div className="dg-total-val">{dayTotals.protein ? `${dayTotals.protein}g` : '—'}</div>
            <div className="dg-total-lbl">Protein</div>
          </div>
          <div className="dg-total-item">
            <div className="dg-total-val">{dayTotals.carbs ? `${dayTotals.carbs}g` : '—'}</div>
            <div className="dg-total-lbl">Carbs</div>
          </div>
          <div className="dg-total-item">
            <div className="dg-total-val">{dayTotals.fat ? `${dayTotals.fat}g` : '—'}</div>
            <div className="dg-total-lbl">Fat</div>
          </div>
        </div>
      </div>

      {/* Tip */}
      {workout.tip && (
        <div className="dg-tip-box">
          <div className="dg-tip-title">{dayName} Tip</div>
          <p>{workout.tip}</p>
        </div>
      )}
    </div>
  )
}
