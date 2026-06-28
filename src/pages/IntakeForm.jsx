import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getClient, saveClient } from '../utils/storage.js'

const STEPS = ['Personal Info', 'Medical History', 'Nutrition & Diet', 'Fitness & Activity', 'Goals & Notes']
const STEP_LABELS = ['Personal', 'Medical', 'Nutrition', 'Fitness', 'Goals']

const CONDITIONS = [
  'Arthritis (Osteoarthritis)', 'Psoriatic Arthritis', 'Rheumatoid Arthritis',
  'Hip Replacement', 'Knee Replacement', 'Shoulder Replacement',
  'Diabetes (Type 1)', 'Diabetes (Type 2)', 'Pre-Diabetes',
  'Hypertension', 'Cardiovascular Disease', 'Atrial Fibrillation',
  'Osteoporosis / Osteopenia', 'Fibromyalgia', 'Chronic Back Pain',
  'GERD / Acid Reflux', 'EoE (Eosinophilic Esophagitis)', 'IBS / IBD',
  'Autoimmune Condition', 'Meralgia Paresthetica', 'Neuropathy',
  'Sleep Apnea', 'Anxiety / Depression', 'Thyroid Disorder',
  'Cancer (current/history)', 'COPD / Asthma', 'Kidney Disease',
]

const RESTRICTIONS = [
  'Dairy-free', 'Gluten-free', 'Vegetarian', 'Vegan',
  'Nut-free', 'Soy-free', 'Low FODMAP', 'Shellfish-free',
  'Egg-free', 'Low-sodium', 'Low-carb / Keto', 'Paleo',
]

const ACTIVITIES = [
  'Resistance / Weight Training', 'Zone 2 Cardio', 'Swimming', 'Walking / Hiking',
  'Cycling (Stationary)', 'Cycling (Outdoor)', 'Yoga / Pilates', 'Group Fitness Classes',
  'Rowing', 'Elliptical Trainer', 'Water Aerobics', 'Stretching / Mobility',
]

const GOALS = [
  'Reduce inflammation', 'Improve sleep quality', 'Reduce joint pain',
  'Build / preserve muscle', 'Improve cardiovascular health', 'Improve flexibility / mobility',
  'Reduce fatigue', 'Improve energy levels', 'Better stress management',
  'Manage chronic condition', 'Post-surgery rehabilitation', 'Balance / fall prevention',
  'Reduce medication dependence', 'Improve digestive health', 'Improve bone density',
]

const FASTING_OPTIONS = [
  { value: 'none', label: 'No Fasting Protocol' },
  { value: '12/12', label: '12/12 — 12-hour eating window' },
  { value: '14/10', label: '14/10 — 10-hour eating window' },
  { value: '16/8', label: '16/8 — 8-hour eating window' },
  { value: 'custom', label: 'Custom (specify below)' },
]

const TRAINING_TIMES = [
  '5:00 AM', '5:30 AM', '6:00 AM', '6:15 AM', '6:30 AM', '7:00 AM', '7:30 AM',
  '8:00 AM', 'Morning (flexible)', 'Noon', 'Afternoon (flexible)', '5:00 PM', '6:00 PM', 'Evening (flexible)',
]

function CheckList({ options, selected, onChange, className = '' }) {
  function toggle(val) {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val])
  }
  return (
    <div className={`checkbox-group ${className}`}>
      {options.map(opt => (
        <label key={opt} className={`checkbox-item ${selected.includes(opt) ? 'checked' : ''}`}>
          <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
          <span className="checkbox-icon">
            {selected.includes(opt) && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg>}
          </span>
          {opt}
        </label>
      ))}
    </div>
  )
}

function PainScale({ value, onChange }) {
  return (
    <div className="pain-scale">
      {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
        <button
          key={n} type="button"
          className={`pain-btn ${n >= 7 ? 'pain-high' : n >= 4 ? 'pain-med' : ''} ${value === n ? 'selected' : ''}`}
          onClick={() => onChange(n)}
        >{n}</button>
      ))}
    </div>
  )
}

export default function IntakeForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const existingClient = id ? getClient(id) : null
  const isEdit = !!existingClient

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Client basic info
  const [basic, setBasic] = useState({
    firstName: existingClient?.firstName || '',
    lastName:  existingClient?.lastName  || '',
    dob:       existingClient?.dob       || '',
    phone:     existingClient?.phone     || '',
    email:     existingClient?.email     || '',
  })

  // Intake data
  const ex = existingClient?.intake || {}
  const [intake, setIntake] = useState({
    // Personal / Physical
    heightFt: ex.heightFt || '',
    heightIn: ex.heightIn || '0',
    currentWeight: ex.currentWeight || '',
    targetWeight: ex.targetWeight || '',
    goalTimeline: ex.goalTimeline || '26 weeks',

    // Medical
    conditions: ex.conditions || [],
    conditionsOther: ex.conditionsOther || '',
    medications: ex.medications || '',
    surgeries: ex.surgeries || '',
    allergies: ex.allergies || '',
    doctorClearance: ex.doctorClearance || 'yes',
    painLevel: ex.painLevel ?? null,
    painAreas: ex.painAreas || '',

    // Nutrition
    dietaryRestrictions: ex.dietaryRestrictions || [],
    foodAllergies: ex.foodAllergies || '',
    foodsToAvoid: ex.foodsToAvoid || '',
    mealsPerDay: ex.mealsPerDay || '4',
    fastingProtocol: ex.fastingProtocol || '12/12',
    eatingWindowStart: ex.eatingWindowStart || '8:00 AM',
    eatingWindowEnd: ex.eatingWindowEnd || '8:00 PM',
    dailyCaloriesMin: ex.dailyCaloriesMin || '',
    dailyCaloriesMax: ex.dailyCaloriesMax || '',
    proteinMin: ex.proteinMin || '',
    proteinMax: ex.proteinMax || '',
    carbMin: ex.carbMin || '',
    carbMax: ex.carbMax || '',
    fatMin: ex.fatMin || '',
    fatMax: ex.fatMax || '',
    currentSupplements: ex.currentSupplements || '',

    // Fitness
    workStart: ex.workStart || '9:00 AM',
    workEnd: ex.workEnd || '6:00 PM',
    sleepHours: ex.sleepHours || '7',
    stressLevel: ex.stressLevel || '5',
    activityLevel: ex.activityLevel || 'lightly_active',
    trainingTime: ex.trainingTime || '6:30 AM',
    trainingDaysPerWeek: ex.trainingDaysPerWeek || '5',
    preferredActivities: ex.preferredActivities || [],
    fitnessLimitations: ex.fitnessLimitations || '',
    equipmentAccess: ex.equipmentAccess || 'gym',
    trainingExperience: ex.trainingExperience || 'intermediate',
    currentRoutine: ex.currentRoutine || '',

    // Goals
    primaryGoal: ex.primaryGoal || 'weight_loss',
    secondaryGoals: ex.secondaryGoals || [],
    additionalNotes: ex.additionalNotes || '',
  })

  function up(field, val) { setIntake(p => ({ ...p, [field]: val })) }
  function upBasic(field, val) { setBasic(p => ({ ...p, [field]: val })) }

  async function handleSubmit() {
    setSaving(true)
    const clientData = {
      ...(existingClient || {}),
      ...basic,
      intake,
    }
    const saved = saveClient(clientData)
    navigate(`/clients/${saved.id}`)
  }

  const canNext = () => {
    if (step === 0) return basic.firstName.trim() && basic.lastName.trim()
    return true
  }

  return (
    <div className="intake-wrap">
      <div className="intake-header">
        {isEdit ? (
          <Link to={`/clients/${id}`} className="profile-back" style={{ marginBottom: 12, display: 'inline-flex' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Client
          </Link>
        ) : (
          <Link to="/" className="profile-back" style={{ marginBottom: 12, display: 'inline-flex' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </Link>
        )}
        <h1>{isEdit ? 'Edit Intake Form' : 'New Client Intake'}</h1>
        <p>Complete the wellness intake form. All fields help build a more accurate plan.</p>
      </div>

      {/* Step progress */}
      <div className="step-progress">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`step-prog-item ${i < step ? 'done' : i === step ? 'active' : ''}`}
            onClick={() => i < step && setStep(i)}
            style={{ cursor: i < step ? 'pointer' : 'default' }}
          >
            <div className="step-prog-dot">
              {i < step
                ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
                : i + 1}
            </div>
            <div className="step-prog-label">{STEP_LABELS[i]}</div>
          </div>
        ))}
      </div>

      {/* Step content */}
      <form onSubmit={e => e.preventDefault()}>
        {step === 0 && <StepPersonal basic={basic} upBasic={upBasic} intake={intake} up={up} />}
        {step === 1 && <StepMedical intake={intake} up={up} />}
        {step === 2 && <StepNutrition intake={intake} up={up} />}
        {step === 3 && <StepFitness intake={intake} up={up} />}
        {step === 4 && <StepGoals intake={intake} up={up} basic={basic} />}

        {/* Nav */}
        <div className="form-nav">
          {step > 0
            ? <button type="button" className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Previous</button>
            : <div />}
          {step < STEPS.length - 1
            ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={!canNext()}
                onClick={() => setStep(s => s + 1)}
              >Next →</button>
            )
            : (
              <button
                type="button"
                className="btn btn-green"
                disabled={saving || !basic.firstName}
                onClick={handleSubmit}
              >
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save & View Client'}
              </button>
            )}
        </div>
      </form>
    </div>
  )
}

/* ── Step 1: Personal Info ── */
function StepPersonal({ basic, upBasic, intake, up }) {
  return (
    <>
      <div className="form-section">
        <div className="form-section-title">Contact Information</div>
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">First Name <span>*</span></label>
            <input className="form-input" value={basic.firstName} onChange={e => upBasic('firstName', e.target.value)} placeholder="First name" />
          </div>
          <div className="form-field">
            <label className="form-label">Last Name <span>*</span></label>
            <input className="form-input" value={basic.lastName} onChange={e => upBasic('lastName', e.target.value)} placeholder="Last name" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Date of Birth</label>
            <input type="date" className="form-input" value={basic.dob} onChange={e => upBasic('dob', e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Phone</label>
            <input className="form-input" value={basic.phone} onChange={e => upBasic('phone', e.target.value)} placeholder="(555) 000-0000" />
          </div>
        </div>
        <div className="form-row single">
          <div className="form-field">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={basic.email} onChange={e => upBasic('email', e.target.value)} placeholder="client@email.com" />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Physical Measurements</div>
        <div className="form-row triple">
          <div className="form-field">
            <label className="form-label">Height (ft)</label>
            <input type="number" className="form-input" value={intake.heightFt} onChange={e => up('heightFt', e.target.value)} placeholder="5" min="3" max="8" />
          </div>
          <div className="form-field">
            <label className="form-label">Height (in)</label>
            <input type="number" className="form-input" value={intake.heightIn} onChange={e => up('heightIn', e.target.value)} placeholder="7" min="0" max="11" />
          </div>
          <div className="form-field">
            <label className="form-label">Current Weight <span>(lbs)</span></label>
            <input type="number" className="form-input" value={intake.currentWeight} onChange={e => up('currentWeight', e.target.value)} placeholder="175" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Target Weight <span>(lbs)</span></label>
            <input type="number" className="form-input" value={intake.targetWeight} onChange={e => up('targetWeight', e.target.value)} placeholder="155" />
          </div>
          <div className="form-field">
            <label className="form-label">Goal Timeline</label>
            <select className="form-select" value={intake.goalTimeline} onChange={e => up('goalTimeline', e.target.value)}>
              <option>12 weeks</option>
              <option>16 weeks</option>
              <option>26 weeks</option>
              <option>6 months</option>
              <option>12 months</option>
              <option>Ongoing / Maintenance</option>
            </select>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Step 2: Medical History ── */
function StepMedical({ intake, up }) {
  return (
    <>
      <div className="form-section">
        <div className="form-section-title">Medical Conditions</div>
        <CheckList options={CONDITIONS} selected={intake.conditions} onChange={v => up('conditions', v)} />
        <div className="form-row single" style={{ marginTop: 12 }}>
          <div className="form-field">
            <label className="form-label">Other Conditions <span>(specify)</span></label>
            <input className="form-input" value={intake.conditionsOther} onChange={e => up('conditionsOther', e.target.value)} placeholder="Any conditions not listed above…" />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Medications & Treatments</div>
        <div className="form-row single">
          <div className="form-field">
            <label className="form-label">Current Medications</label>
            <textarea className="form-textarea" value={intake.medications} onChange={e => up('medications', e.target.value)} placeholder="List current medications, dosages, and frequency…" rows={3} />
          </div>
        </div>
        <div className="form-row single">
          <div className="form-field">
            <label className="form-label">Recent Surgeries / Procedures</label>
            <textarea className="form-textarea" value={intake.surgeries} onChange={e => up('surgeries', e.target.value)} placeholder="List any recent surgeries, procedures, or relevant medical history…" rows={3} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Known Allergies</label>
            <input className="form-input" value={intake.allergies} onChange={e => up('allergies', e.target.value)} placeholder="e.g., penicillin, NSAIDs…" />
          </div>
          <div className="form-field">
            <label className="form-label">Doctor Clearance for Exercise</label>
            <select className="form-select" value={intake.doctorClearance} onChange={e => up('doctorClearance', e.target.value)}>
              <option value="yes">Yes — cleared for exercise</option>
              <option value="no">No — not yet cleared</option>
              <option value="partial">Partial — with restrictions</option>
              <option value="unknown">Unknown / Not asked</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Pain Assessment</div>
        <div className="form-field" style={{ marginBottom: 16 }}>
          <label className="form-label">Current Pain Level <span>(0 = none, 10 = severe)</span></label>
          <div style={{ marginTop: 8 }}>
            <PainScale value={intake.painLevel} onChange={v => up('painLevel', v)} />
          </div>
        </div>
        <div className="form-row single">
          <div className="form-field">
            <label className="form-label">Pain Location(s) and Description</label>
            <textarea className="form-textarea" value={intake.painAreas} onChange={e => up('painAreas', e.target.value)} placeholder="Describe location, quality, and triggers of pain (e.g., right hip — burning with prolonged sitting)…" rows={3} />
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Step 3: Nutrition ── */
function StepNutrition({ intake, up }) {
  return (
    <>
      <div className="form-section">
        <div className="form-section-title">Dietary Restrictions & Allergies</div>
        <CheckList options={RESTRICTIONS} selected={intake.dietaryRestrictions} onChange={v => up('dietaryRestrictions', v)} />
        <div className="form-row single" style={{ marginTop: 12 }}>
          <div className="form-field">
            <label className="form-label">Food Allergies <span>(not intolerances)</span></label>
            <input className="form-input" value={intake.foodAllergies} onChange={e => up('foodAllergies', e.target.value)} placeholder="e.g., tree nuts, shellfish…" />
          </div>
        </div>
        <div className="form-row single">
          <div className="form-field">
            <label className="form-label">Foods to Avoid <span>(triggers, dislikes, intolerances)</span></label>
            <textarea className="form-textarea" value={intake.foodsToAvoid} onChange={e => up('foodsToAvoid', e.target.value)} placeholder="Foods that cause symptoms or that the client avoids for any reason…" rows={2} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Eating Pattern</div>
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Meals Per Day</label>
            <select className="form-select" value={intake.mealsPerDay} onChange={e => up('mealsPerDay', e.target.value)}>
              <option value="3">3 meals/day</option>
              <option value="4">4 meals/day</option>
              <option value="5">5 meals/day</option>
              <option value="6">5–6 meals/day (grazing)</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Fasting Protocol</label>
            <select className="form-select" value={intake.fastingProtocol} onChange={e => up('fastingProtocol', e.target.value)}>
              {FASTING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Eating Window Start</label>
            <input className="form-input" value={intake.eatingWindowStart} onChange={e => up('eatingWindowStart', e.target.value)} placeholder="8:00 AM" />
            <p className="form-hint">e.g., 7:00 AM, 8:00 AM, 10:00 AM</p>
          </div>
          <div className="form-field">
            <label className="form-label">Eating Window End</label>
            <input className="form-input" value={intake.eatingWindowEnd} onChange={e => up('eatingWindowEnd', e.target.value)} placeholder="8:00 PM" />
            <p className="form-hint">e.g., 7:00 PM, 8:00 PM</p>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Daily Calorie & Macro Targets</div>
        <p className="form-hint" style={{ marginBottom: 12 }}>Leave blank if targets have not been established — they can be calculated from intake data.</p>
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Calories Min <span>(kcal/day)</span></label>
            <input type="number" className="form-input" value={intake.dailyCaloriesMin} onChange={e => up('dailyCaloriesMin', e.target.value)} placeholder="1750" />
          </div>
          <div className="form-field">
            <label className="form-label">Calories Max <span>(kcal/day)</span></label>
            <input type="number" className="form-input" value={intake.dailyCaloriesMax} onChange={e => up('dailyCaloriesMax', e.target.value)} placeholder="1850" />
          </div>
        </div>
        <div className="form-row triple">
          <div className="form-field">
            <label className="form-label">Protein <span>(g/day)</span></label>
            <input type="number" className="form-input" value={intake.proteinMin} onChange={e => up('proteinMin', e.target.value)} placeholder="150" />
            <input type="number" className="form-input" style={{ marginTop: 6 }} value={intake.proteinMax} onChange={e => up('proteinMax', e.target.value)} placeholder="max 160" />
          </div>
          <div className="form-field">
            <label className="form-label">Carbs <span>(g/day)</span></label>
            <input type="number" className="form-input" value={intake.carbMin} onChange={e => up('carbMin', e.target.value)} placeholder="130" />
            <input type="number" className="form-input" style={{ marginTop: 6 }} value={intake.carbMax} onChange={e => up('carbMax', e.target.value)} placeholder="max 150" />
          </div>
          <div className="form-field">
            <label className="form-label">Fat <span>(g/day)</span></label>
            <input type="number" className="form-input" value={intake.fatMin} onChange={e => up('fatMin', e.target.value)} placeholder="55" />
            <input type="number" className="form-input" style={{ marginTop: 6 }} value={intake.fatMax} onChange={e => up('fatMax', e.target.value)} placeholder="max 65" />
          </div>
        </div>
        <div className="form-row single">
          <div className="form-field">
            <label className="form-label">Current Supplements</label>
            <textarea className="form-textarea" value={intake.currentSupplements} onChange={e => up('currentSupplements', e.target.value)} placeholder="List current supplements and dosages…" rows={3} />
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Step 4: Fitness ── */
function StepFitness({ intake, up }) {
  return (
    <>
      <div className="form-section">
        <div className="form-section-title">Work & Lifestyle Schedule</div>
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Work Day Start</label>
            <input className="form-input" value={intake.workStart} onChange={e => up('workStart', e.target.value)} placeholder="9:00 AM" />
          </div>
          <div className="form-field">
            <label className="form-label">Work Day End</label>
            <input className="form-input" value={intake.workEnd} onChange={e => up('workEnd', e.target.value)} placeholder="6:00 PM" />
          </div>
        </div>
        <div className="form-row triple">
          <div className="form-field">
            <label className="form-label">Sleep (hrs/night)</label>
            <select className="form-select" value={intake.sleepHours} onChange={e => up('sleepHours', e.target.value)}>
              {['4','5','6','7','8','9','10'].map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Stress Level <span>(1–10)</span></label>
            <select className="form-select" value={intake.stressLevel} onChange={e => up('stressLevel', e.target.value)}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Activity Level</label>
            <select className="form-select" value={intake.activityLevel} onChange={e => up('activityLevel', e.target.value)}>
              <option value="sedentary">Sedentary (desk job)</option>
              <option value="lightly_active">Lightly Active (1–2 days/wk)</option>
              <option value="moderately_active">Moderately Active (3–4 days/wk)</option>
              <option value="very_active">Very Active (5+ days/wk)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Training Preferences</div>
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Preferred Training Time</label>
            <select className="form-select" value={intake.trainingTime} onChange={e => up('trainingTime', e.target.value)}>
              {TRAINING_TIMES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Training Days Per Week</label>
            <select className="form-select" value={intake.trainingDaysPerWeek} onChange={e => up('trainingDaysPerWeek', e.target.value)}>
              {['2','3','4','5','6'].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="form-field" style={{ marginBottom: 14 }}>
          <label className="form-label">Preferred Activities</label>
          <div style={{ marginTop: 8 }}>
            <CheckList options={ACTIVITIES} selected={intake.preferredActivities} onChange={v => up('preferredActivities', v)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Equipment Access</label>
            <select className="form-select" value={intake.equipmentAccess} onChange={e => up('equipmentAccess', e.target.value)}>
              <option value="gym">Full Gym</option>
              <option value="home_gym">Home Gym</option>
              <option value="limited">Limited Equipment</option>
              <option value="none">No Equipment</option>
              <option value="pool">Pool / Aquatic Center</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Training Experience</label>
            <select className="form-select" value={intake.trainingExperience} onChange={e => up('trainingExperience', e.target.value)}>
              <option value="beginner">Beginner (0–1 year)</option>
              <option value="intermediate">Intermediate (1–3 years)</option>
              <option value="advanced">Advanced (3+ years)</option>
            </select>
          </div>
        </div>
        <div className="form-row single">
          <div className="form-field">
            <label className="form-label">Exercise Limitations / Restrictions</label>
            <textarea className="form-textarea" value={intake.fitnessLimitations} onChange={e => up('fitnessLimitations', e.target.value)} placeholder="Describe any movement restrictions, pain with specific exercises, joint limitations, post-surgical precautions, etc.…" rows={3} />
          </div>
        </div>
        <div className="form-row single">
          <div className="form-field">
            <label className="form-label">Current Exercise Routine</label>
            <textarea className="form-textarea" value={intake.currentRoutine} onChange={e => up('currentRoutine', e.target.value)} placeholder="Describe what the client currently does for exercise, if anything…" rows={3} />
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Step 5: Goals ── */
function StepGoals({ intake, up, basic }) {
  return (
    <>
      <div className="form-section">
        <div className="form-section-title">Primary Goal</div>
        <div className="form-row single">
          <div className="form-field">
            <select className="form-select" value={intake.primaryGoal} onChange={e => up('primaryGoal', e.target.value)}>
              <option value="weight_loss">Weight Loss / Fat Reduction</option>
              <option value="muscle_gain">Muscle Gain / Body Recomposition</option>
              <option value="rehabilitation">Post-Injury / Post-Surgery Rehabilitation</option>
              <option value="pain_management">Chronic Pain Management</option>
              <option value="general_wellness">General Wellness & Longevity</option>
              <option value="sports_performance">Sports Performance</option>
              <option value="maintenance">Weight / Health Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Secondary Goals</div>
        <CheckList options={GOALS} selected={intake.secondaryGoals} onChange={v => up('secondaryGoals', v)} />
      </div>

      <div className="form-section">
        <div className="form-section-title">Additional Notes</div>
        <div className="form-row single">
          <div className="form-field">
            <label className="form-label">Notes for the Therapist <span>(anything else relevant)</span></label>
            <textarea className="form-textarea" value={intake.additionalNotes} onChange={e => up('additionalNotes', e.target.value)} placeholder="Any additional context, client-specific concerns, questions, or information that should inform the plan…" rows={5} />
          </div>
        </div>
      </div>

      {/* Review summary */}
      <div className="plan-box blue">
        <div className="plan-box-title">Review Summary</div>
        <div className="plan-box-body">
          <strong>{basic.firstName} {basic.lastName}</strong> — {intake.primaryGoal?.replace(/_/g, ' ')}<br />
          {intake.currentWeight && intake.targetWeight && (
            <span>Weight goal: {intake.currentWeight} → {intake.targetWeight} lbs over {intake.goalTimeline}. </span>
          )}
          {intake.conditions?.length > 0 && (
            <span>Conditions: {intake.conditions.slice(0,3).join(', ')}{intake.conditions.length > 3 ? ` +${intake.conditions.length - 3} more` : ''}. </span>
          )}
          {intake.dietaryRestrictions?.length > 0 && (
            <span>Diet: {intake.dietaryRestrictions.join(', ')}. </span>
          )}
          {intake.fastingProtocol !== 'none' && (
            <span>Fasting: {intake.fastingProtocol} ({intake.eatingWindowStart} – {intake.eatingWindowEnd}). </span>
          )}
        </div>
      </div>
    </>
  )
}
