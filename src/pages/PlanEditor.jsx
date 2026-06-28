import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getPlan, getClient, savePlan } from '../utils/storage.js'
import { DAYS, buildPlanFromIntake } from '../utils/planDefaults.js'

const TABS = ['Overview', 'Nutrition', 'Fitness', 'Supplements', 'Daily Guide']

export default function PlanEditor() {
  const { id, planId } = useParams()
  const navigate = useNavigate()
  const client = getClient(id)
  const existing = planId ? getPlan(planId) : null
  const intake = client?.intake || {}

  const [tab, setTab] = useState(0)
  const [saved, setSaved] = useState(false)

  const initPlan = existing || buildPlanFromIntake(client || {}, intake)
  const [plan, setPlan] = useState({ ...initPlan, clientId: id })

  if (!client) return (
    <div className="dash-main" style={{ paddingTop: 40 }}>
      <div className="empty-state"><h3>Client not found</h3><Link to="/" className="btn btn-primary">← Back</Link></div>
    </div>
  )

  function update(field, value) {
    setPlan(p => ({ ...p, [field]: value }))
    setSaved(false)
  }

  function handleSave() {
    const saved_plan = savePlan(plan)
    setPlan(p => ({ ...p, id: saved_plan.id }))
    setSaved(true)
    if (!planId) navigate(`/clients/${id}/plans/${saved_plan.id}/edit`, { replace: true })
  }

  function updateMeal(dayIdx, mealIdx, field, value) {
    const meals = (plan.weeklyMeals || []).map((d, di) =>
      di === dayIdx ? (d || []).map((m, mi) =>
        mi === mealIdx ? { ...m, [field]: value } : m
      ) : d
    )
    update('weeklyMeals', meals)
  }

  function updateMealItem(dayIdx, mealIdx, itemIdx, value) {
    const meals = (plan.weeklyMeals || []).map((d, di) =>
      di === dayIdx ? (d || []).map((m, mi) =>
        mi === mealIdx ? { ...m, items: (m.items || []).map((it, ii) => ii === itemIdx ? value : it) } : m
      ) : d
    )
    update('weeklyMeals', meals)
  }

  function addMealItem(dayIdx, mealIdx) {
    const meals = (plan.weeklyMeals || []).map((d, di) =>
      di === dayIdx ? (d || []).map((m, mi) =>
        mi === mealIdx ? { ...m, items: [...(m.items || []), ''] } : m
      ) : d
    )
    update('weeklyMeals', meals)
  }

  function removeMealItem(dayIdx, mealIdx, itemIdx) {
    const meals = (plan.weeklyMeals || []).map((d, di) =>
      di === dayIdx ? (d || []).map((m, mi) =>
        mi === mealIdx ? { ...m, items: (m.items || []).filter((_, ii) => ii !== itemIdx) } : m
      ) : d
    )
    update('weeklyMeals', meals)
  }

  function updateWorkout(dayIdx, field, value) {
    const workouts = (plan.weeklyWorkouts || []).map((w, wi) =>
      wi === dayIdx ? { ...w, [field]: value } : w
    )
    update('weeklyWorkouts', workouts)
  }

  function updateExercise(dayIdx, exIdx, field, value) {
    const workouts = (plan.weeklyWorkouts || []).map((w, wi) =>
      wi === dayIdx ? {
        ...w,
        exercises: (w.exercises || []).map((ex, ei) => ei === exIdx ? { ...ex, [field]: value } : ex)
      } : w
    )
    update('weeklyWorkouts', workouts)
  }

  function addExercise(dayIdx) {
    const workouts = (plan.weeklyWorkouts || []).map((w, wi) =>
      wi === dayIdx ? { ...w, exercises: [...(w.exercises || []), { name: '', sets: '' }] } : w
    )
    update('weeklyWorkouts', workouts)
  }

  function removeExercise(dayIdx, exIdx) {
    const workouts = (plan.weeklyWorkouts || []).map((w, wi) =>
      wi === dayIdx ? { ...w, exercises: (w.exercises || []).filter((_, ei) => ei !== exIdx) } : w
    )
    update('weeklyWorkouts', workouts)
  }

  function updateSupp(category, idx, field, value) {
    const supps = { ...plan.supplements }
    supps[category] = (supps[category] || []).map((s, si) => si === idx ? { ...s, [field]: value } : s)
    update('supplements', supps)
  }

  function addSupp(category) {
    const supps = { ...plan.supplements }
    supps[category] = [...(supps[category] || []), { name: '', dose: '', purpose: '' }]
    update('supplements', supps)
  }

  function removeSupp(category, idx) {
    const supps = { ...plan.supplements }
    supps[category] = (supps[category] || []).filter((_, si) => si !== idx)
    update('supplements', supps)
  }

  function updateScheduleRow(dayIdx, rowIdx, field, value) {
    const schedules = (plan.dailySchedules || []).map((d, di) =>
      di === dayIdx ? (d || []).map((r, ri) => ri === rowIdx ? { ...r, [field]: value } : r) : d
    )
    update('dailySchedules', schedules)
  }

  function addScheduleRow(dayIdx) {
    const schedules = (plan.dailySchedules || []).map((d, di) =>
      di === dayIdx ? [...(d || []), { time: '', event: '', type: '' }] : d
    )
    update('dailySchedules', schedules)
  }

  function removeScheduleRow(dayIdx, rowIdx) {
    const schedules = (plan.dailySchedules || []).map((d, di) =>
      di === dayIdx ? (d || []).filter((_, ri) => ri !== rowIdx) : d
    )
    update('dailySchedules', schedules)
  }

  return (
    <div className="editor-wrap">
      {/* Editor Header */}
      <div className="editor-header">
        <div className="editor-header-inner">
          <Link to={`/clients/${id}`} className="editor-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            {client.firstName} {client.lastName}
          </Link>
          <div className="editor-title">
            {existing ? 'Edit Plan' : 'New Plan'}
          </div>
          <div className="editor-header-actions">
            {saved && <span className="editor-saved-badge">Saved</span>}
            {planId && (
              <>
                <Link to={`/clients/${id}/plans/${planId}`} className="btn btn-ghost btn-sm">View Plan</Link>
                <Link to={`/clients/${id}/plans/${planId}/daily`} className="btn btn-ghost btn-sm">Daily Guide</Link>
              </>
            )}
            <button onClick={handleSave} className="btn btn-primary btn-sm">Save Plan</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="editor-tabs">
        {TABS.map((t, ti) => (
          <button key={ti} className={`editor-tab${tab === ti ? ' active' : ''}`} onClick={() => setTab(ti)}>{t}</button>
        ))}
      </div>

      <div className="editor-body">
        {/* ── Overview Tab ── */}
        {tab === 0 && (
          <div className="editor-section">
            <h3 className="editor-section-title">Plan Overview</h3>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Plan Title</label>
                <input className="form-input" value={plan.title || ''} onChange={e => update('title', e.target.value)} placeholder="e.g. Longevity & Wellness Plan" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Hero Subtitle</label>
                <input className="form-input" value={plan.heroSubtitle || ''} onChange={e => update('heroSubtitle', e.target.value)} placeholder="e.g. High-Protein · 16/8 Fasting · Anti-Inflammatory" />
              </div>
            </div>
            <div className="form-row cols-2">
              <div className="form-field">
                <label className="form-label">Status</label>
                <select className="form-select" value={plan.status || 'draft'} onChange={e => update('status', e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <h3 className="editor-section-title" style={{ marginTop: 32 }}>Calorie & Macro Targets</h3>
            <div className="form-row cols-2">
              <div className="form-field">
                <label className="form-label">Calories Min</label>
                <input className="form-input" type="number" value={plan.macros?.calories?.min || ''} onChange={e => update('macros', { ...plan.macros, calories: { ...plan.macros?.calories, min: e.target.value } })} placeholder="1750" />
              </div>
              <div className="form-field">
                <label className="form-label">Calories Max</label>
                <input className="form-input" type="number" value={plan.macros?.calories?.max || ''} onChange={e => update('macros', { ...plan.macros, calories: { ...plan.macros?.calories, max: e.target.value } })} placeholder="1850" />
              </div>
            </div>
            <div className="form-row cols-3">
              <div className="form-field">
                <label className="form-label">Protein (g) Min</label>
                <input className="form-input" type="number" value={plan.macros?.protein?.min || ''} onChange={e => update('macros', { ...plan.macros, protein: { ...plan.macros?.protein, min: e.target.value } })} />
              </div>
              <div className="form-field">
                <label className="form-label">Carbs (g) Min</label>
                <input className="form-input" type="number" value={plan.macros?.carbs?.min || ''} onChange={e => update('macros', { ...plan.macros, carbs: { ...plan.macros?.carbs, min: e.target.value } })} />
              </div>
              <div className="form-field">
                <label className="form-label">Fat (g) Min</label>
                <input className="form-input" type="number" value={plan.macros?.fat?.min || ''} onChange={e => update('macros', { ...plan.macros, fat: { ...plan.macros?.fat, min: e.target.value } })} />
              </div>
            </div>
            <div className="form-row cols-3">
              <div className="form-field">
                <label className="form-label">Protein (g) Max</label>
                <input className="form-input" type="number" value={plan.macros?.protein?.max || ''} onChange={e => update('macros', { ...plan.macros, protein: { ...plan.macros?.protein, max: e.target.value } })} />
              </div>
              <div className="form-field">
                <label className="form-label">Carbs (g) Max</label>
                <input className="form-input" type="number" value={plan.macros?.carbs?.max || ''} onChange={e => update('macros', { ...plan.macros, carbs: { ...plan.macros?.carbs, max: e.target.value } })} />
              </div>
              <div className="form-field">
                <label className="form-label">Fat (g) Max</label>
                <input className="form-input" type="number" value={plan.macros?.fat?.max || ''} onChange={e => update('macros', { ...plan.macros, fat: { ...plan.macros?.fat, max: e.target.value } })} />
              </div>
            </div>

            <h3 className="editor-section-title" style={{ marginTop: 32 }}>Sections</h3>
            <p className="editor-hint">Each section appears as a numbered section in the full plan view.</p>
            {(plan.sections || []).map((section, si) => (
              <div key={si} className="editor-card">
                <div className="editor-card-head">
                  <span className="editor-card-label">Section {si + 1}</span>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red-600)' }} onClick={() => update('sections', plan.sections.filter((_, i) => i !== si))}>Remove</button>
                </div>
                <div className="form-field">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={section.title || ''} onChange={e => update('sections', plan.sections.map((s, i) => i === si ? { ...s, title: e.target.value } : s))} placeholder="Section title..." />
                </div>
                <div className="form-field" style={{ marginTop: 8 }}>
                  <label className="form-label">Content (one paragraph per line)</label>
                  <textarea
                    className="form-textarea"
                    rows={5}
                    value={(section.paragraphs || []).join('\n')}
                    onChange={e => update('sections', plan.sections.map((s, i) => i === si ? { ...s, paragraphs: e.target.value.split('\n') } : s))}
                    placeholder="Enter section content..."
                  />
                </div>
                <div className="form-field" style={{ marginTop: 8 }}>
                  <label className="form-label">Assessment / Key Info Box</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={section.assessment || ''}
                    onChange={e => update('sections', plan.sections.map((s, i) => i === si ? { ...s, assessment: e.target.value } : s))}
                    placeholder="Optional blue info box content..."
                  />
                </div>
              </div>
            ))}
            <button className="btn btn-ghost" onClick={() => update('sections', [...(plan.sections || []), { id: `s${(plan.sections || []).length + 1}`, title: '', paragraphs: [], assessment: '' }])}>
              + Add Section
            </button>

            <h3 className="editor-section-title" style={{ marginTop: 32 }}>Additional Notes</h3>
            <textarea
              className="form-textarea"
              rows={4}
              value={plan.notes || ''}
              onChange={e => update('notes', e.target.value)}
              placeholder="Any additional notes for this plan..."
            />
          </div>
        )}

        {/* ── Nutrition Tab ── */}
        {tab === 1 && (
          <div className="editor-section">
            <h3 className="editor-section-title">7-Day Meal Plan</h3>
            <p className="editor-hint">Edit meals for each day. Each meal has a name, time, items, and macros.</p>
            {DAYS.map((day, di) => {
              const dayMeals = (plan.weeklyMeals || [])[di] || []
              return (
                <div key={di} className="editor-day-block">
                  <div className="editor-day-header">Day {di + 1} — {day}</div>
                  {dayMeals.map((meal, mi) => (
                    <div key={mi} className="editor-card">
                      <div className="editor-card-head">
                        <span className="editor-card-label">{meal.name || `Meal ${mi + 1}`}</span>
                      </div>
                      <div className="form-row cols-2">
                        <div className="form-field">
                          <label className="form-label">Meal Name</label>
                          <input className="form-input" value={meal.name || ''} onChange={e => updateMeal(di, mi, 'name', e.target.value)} placeholder="e.g. Breakfast" />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Time</label>
                          <input className="form-input" value={meal.time || ''} onChange={e => updateMeal(di, mi, 'time', e.target.value)} placeholder="e.g. 8:00 AM" />
                        </div>
                      </div>
                      <div className="form-field" style={{ marginTop: 8 }}>
                        <label className="form-label">Food Items</label>
                        {(meal.items || []).map((item, ii) => (
                          <div key={ii} className="meal-item-row">
                            <input
                              className="form-input"
                              value={item}
                              onChange={e => updateMealItem(di, mi, ii, e.target.value)}
                              placeholder="Food item..."
                            />
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red-600)', padding: '6px 10px', flexShrink: 0 }} onClick={() => removeMealItem(di, mi, ii)}>×</button>
                          </div>
                        ))}
                        <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => addMealItem(di, mi)}>+ Add Item</button>
                      </div>
                      <div className="form-row cols-4" style={{ marginTop: 8 }}>
                        <div className="form-field">
                          <label className="form-label">Protein (g)</label>
                          <input className="form-input" type="number" value={meal.protein || ''} onChange={e => updateMeal(di, mi, 'protein', e.target.value)} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Carbs (g)</label>
                          <input className="form-input" type="number" value={meal.carbs || ''} onChange={e => updateMeal(di, mi, 'carbs', e.target.value)} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Fat (g)</label>
                          <input className="form-input" type="number" value={meal.fat || ''} onChange={e => updateMeal(di, mi, 'fat', e.target.value)} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Calories</label>
                          <input className="form-input" type="number" value={meal.calories || ''} onChange={e => updateMeal(di, mi, 'calories', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Fitness Tab ── */}
        {tab === 2 && (
          <div className="editor-section">
            <h3 className="editor-section-title">7-Day Workout Plan</h3>
            {DAYS.map((day, di) => {
              const workout = (plan.weeklyWorkouts || [])[di] || {}
              return (
                <div key={di} className="editor-day-block">
                  <div className="editor-day-header">Day {di + 1} — {day}</div>
                  <div className="form-row cols-2">
                    <div className="form-field">
                      <label className="form-label">Session Name</label>
                      <input className="form-input" value={workout.name || ''} onChange={e => updateWorkout(di, 'name', e.target.value)} placeholder="e.g. Upper Body A" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Duration</label>
                      <input className="form-input" value={workout.duration || ''} onChange={e => updateWorkout(di, 'duration', e.target.value)} placeholder="e.g. 55 min" />
                    </div>
                  </div>
                  <div className="form-row cols-2">
                    <div className="form-field">
                      <label className="form-label">Start Time</label>
                      <input className="form-input" value={workout.time || ''} onChange={e => updateWorkout(di, 'time', e.target.value)} placeholder="e.g. 6:30 AM" />
                    </div>
                  </div>
                  <div className="form-field" style={{ marginTop: 8 }}>
                    <label className="form-label">Exercises</label>
                    {(workout.exercises || []).map((ex, ei) => (
                      <div key={ei} className="exercise-slot">
                        <input className="form-input" value={ex.name || ''} onChange={e => updateExercise(di, ei, 'name', e.target.value)} placeholder="Exercise name..." style={{ flex: 2 }} />
                        <input className="form-input" value={ex.sets || ''} onChange={e => updateExercise(di, ei, 'sets', e.target.value)} placeholder="Sets/reps..." style={{ flex: 1 }} />
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red-600)', flexShrink: 0 }} onClick={() => removeExercise(di, ei)}>×</button>
                      </div>
                    ))}
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => addExercise(di)}>+ Add Exercise</button>
                  </div>
                  <div className="form-field" style={{ marginTop: 8 }}>
                    <label className="form-label">Workout Note</label>
                    <textarea className="form-textarea" rows={2} value={workout.note || ''} onChange={e => updateWorkout(di, 'note', e.target.value)} placeholder="Training notes..." />
                  </div>
                  <div className="form-field" style={{ marginTop: 8 }}>
                    <label className="form-label">Daily Tip</label>
                    <textarea className="form-textarea" rows={2} value={workout.tip || ''} onChange={e => updateWorkout(di, 'tip', e.target.value)} placeholder="Daily guide tip..." />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Supplements Tab ── */}
        {tab === 3 && (
          <div className="editor-section">
            <h3 className="editor-section-title">Supplement Protocol</h3>

            {['foundational', 'targeted'].map(category => (
              <div key={category}>
                <h4 className="editor-subsection-title">{category === 'foundational' ? 'Foundational (Daily)' : 'Targeted'}</h4>
                <div className="plan-table-wrap">
                  <table className="supp-table">
                    <thead>
                      <tr><th>Supplement</th><th>Dose</th><th>Purpose / Timing</th><th></th></tr>
                    </thead>
                    <tbody>
                      {((plan.supplements || {})[category] || []).map((s, si) => (
                        <tr key={si}>
                          <td><input className="form-input" value={s.name || ''} onChange={e => updateSupp(category, si, 'name', e.target.value)} placeholder="Name..." /></td>
                          <td><input className="form-input" value={s.dose || ''} onChange={e => updateSupp(category, si, 'dose', e.target.value)} placeholder="Dose..." /></td>
                          <td><input className="form-input" value={s.purpose || ''} onChange={e => updateSupp(category, si, 'purpose', e.target.value)} placeholder="Purpose / timing..." /></td>
                          <td><button className="btn btn-ghost btn-sm" style={{ color: 'var(--red-600)' }} onClick={() => removeSupp(category, si)}>×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => addSupp(category)}>+ Add Supplement</button>
              </div>
            ))}

            <h4 className="editor-subsection-title" style={{ marginTop: 24 }}>Avoid List</h4>
            {((plan.supplements || {}).avoid || []).map((s, si) => (
              <div key={si} className="meal-item-row">
                <input className="form-input" value={s} onChange={e => {
                  const avoid = [...(plan.supplements?.avoid || [])]
                  avoid[si] = e.target.value
                  update('supplements', { ...plan.supplements, avoid })
                }} placeholder="Supplement to avoid..." />
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red-600)', flexShrink: 0 }} onClick={() => update('supplements', { ...plan.supplements, avoid: (plan.supplements?.avoid || []).filter((_, i) => i !== si) })}>×</button>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => update('supplements', { ...plan.supplements, avoid: [...(plan.supplements?.avoid || []), ''] })}>+ Add to Avoid List</button>
          </div>
        )}

        {/* ── Daily Guide Tab ── */}
        {tab === 4 && (
          <div className="editor-section">
            <h3 className="editor-section-title">Daily Schedules</h3>
            <p className="editor-hint">These timeline events appear in the Daily Guide view for each day.</p>
            {DAYS.map((day, di) => {
              const schedule = (plan.dailySchedules || [])[di] || []
              return (
                <div key={di} className="editor-day-block">
                  <div className="editor-day-header">Day {di + 1} — {day}</div>
                  {schedule.map((row, ri) => (
                    <div key={ri} className="exercise-slot">
                      <input className="form-input" value={row.time || ''} onChange={e => updateScheduleRow(di, ri, 'time', e.target.value)} placeholder="Time..." style={{ flex: '0 0 90px' }} />
                      <input className="form-input" value={row.event || ''} onChange={e => updateScheduleRow(di, ri, 'event', e.target.value)} placeholder="Event description..." style={{ flex: 3 }} />
                      <select className="form-select" value={row.type || ''} onChange={e => updateScheduleRow(di, ri, 'type', e.target.value)} style={{ flex: '0 0 130px' }}>
                        <option value="">Normal</option>
                        <option value="highlight">Meal (green)</option>
                        <option value="workout-row">Workout (amber)</option>
                        <option value="fast-row">Fast (blue)</option>
                      </select>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red-600)', flexShrink: 0 }} onClick={() => removeScheduleRow(di, ri)}>×</button>
                    </div>
                  ))}
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => addScheduleRow(di)}>+ Add Event</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sticky save bar */}
      <div className="editor-save-bar">
        <span style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          {saved ? '✓ All changes saved' : 'Unsaved changes'}
        </span>
        <button onClick={handleSave} className="btn btn-primary">Save Plan</button>
      </div>
    </div>
  )
}
