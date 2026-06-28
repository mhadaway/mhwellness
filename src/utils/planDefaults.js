const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const DAY_ABBR = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export { DAYS, DAY_ABBR }

// Returns array of 7 arrays, each containing 4 meal objects
export function defaultWeeklyMeals() {
  return DAYS.map(() => [
    { name: 'Breakfast',      time: '8:00 AM',  items: [], protein: '', carbs: '', fat: '', calories: '' },
    { name: 'Lunch',          time: '12:30 PM', items: [], protein: '', carbs: '', fat: '', calories: '' },
    { name: 'Afternoon Fuel', time: '4:00 PM',  items: [], protein: '', carbs: '', fat: '', calories: '' },
    { name: 'Dinner',         time: '7:00 PM',  items: [], protein: '', carbs: '', fat: '', calories: '' },
  ])
}

// Returns array of 7 workout objects (one per day)
export function defaultWeeklyWorkouts() {
  const defaults = [
    { name: 'Upper Body A',           time: '6:30–7:30 AM', duration: '55 min' },
    { name: 'Zone 2 Cardio + Core',   time: '6:15–7:00 AM', duration: '45 min' },
    { name: 'Lower Body',             time: '6:30–7:30 AM', duration: '55 min' },
    { name: 'Mobility & Recovery',    time: '6:30–7:05 AM', duration: '35 min' },
    { name: 'Upper Body B',           time: '6:30–7:30 AM', duration: '55 min' },
    { name: 'Zone 2 Cardio + Balance',time: '6:15–7:00 AM', duration: '45 min' },
    { name: 'Rest Day',               time: 'Flexible',      duration: '20–30 min' },
  ]
  return defaults.map(d => ({ ...d, exercises: [], note: '', tip: '' }))
}

// Returns array of 7 arrays of schedule row objects { time, event, type }
// type: '' | 'highlight' | 'workout-row' | 'fast-row'
export function defaultDailySchedules(eatingStart = '8:00 AM', eatingEnd = '8:00 PM', trainingTime = '6:30 AM') {
  const t = (s) => s.replace(':00','').replace(' AM','a').replace(' PM','p')
  const endT = t(eatingEnd)
  const trainT = t(trainingTime)

  return DAYS.map((day, i) => {
    const isWeekend = i >= 5
    const rows = [
      { time: '6:00a', event: 'Wake. Water + sea salt + lemon. Morning medication.', type: '' },
      { time: '6:15a', event: 'Brief warmup. Black coffee OK.', type: '' },
      { time: trainT,  event: `<strong>${i === 3 ? 'Mobility session' : i === 6 ? 'Gentle walk or rest' : i === 1 || i === 5 ? 'Zone 2 cardio' : 'Training session'}</strong> — ${i === 3 ? '35 min' : i === 6 ? '20–30 min' : i === 1 || i === 5 ? '45 min' : '55 min'}`, type: 'workout-row' },
    ]
    if (!isWeekend) {
      rows.push({ time: t(eatingStart), event: '<strong>Meal 1</strong> — Post-workout breakfast + morning supplements', type: 'highlight' })
      rows.push({ time: '9:00a', event: '<strong>Start work</strong>', type: '' })
      rows.push({ time: '12:30p', event: '<strong>Meal 2</strong> — Lunch at work', type: 'highlight' })
      rows.push({ time: '4:00p',  event: '<strong>Meal 3</strong> — Afternoon fuel', type: 'highlight' })
      rows.push({ time: '6:00p',  event: '<strong>End work</strong>', type: '' })
      rows.push({ time: '7:00p',  event: '<strong>Meal 4</strong> — Dinner at home', type: 'highlight' })
    } else {
      rows.push({ time: t(eatingStart), event: '<strong>Meal 1</strong> — Breakfast + morning supplements', type: 'highlight' })
      rows.push({ time: '12:30p', event: '<strong>Meal 2</strong> — Lunch', type: 'highlight' })
      rows.push({ time: '4:00p',  event: '<strong>Meal 3</strong> — Afternoon fuel', type: 'highlight' })
      rows.push({ time: '7:00p',  event: '<strong>Meal 4</strong> — Dinner', type: 'highlight' })
    }
    rows.push({ time: endT, event: `<strong>Window closes</strong> — ${i === 6 ? '12' : '12'}-hour fast begins`, type: 'fast-row' })
    rows.push({ time: '9:30p', event: 'Magnesium glycinate', type: '' })
    rows.push({ time: '10:00p', event: 'Lights out', type: '' })
    return rows
  })
}

export function defaultSupplements() {
  return {
    foundational: [
      { name: 'Omega-3 Fish Oil',     dose: '2–3g EPA/DHA',          purpose: 'Anti-inflammatory, CV, joint health. With Meal 1.' },
      { name: 'Vitamin D3 + K2',      dose: '4,000–5,000 IU + 200mcg', purpose: 'Bone density, immune function. With Meal 1.' },
      { name: 'Magnesium Glycinate',  dose: '400–600mg',              purpose: 'Sleep, muscle, nerve health. 1–2 hrs before bed.' },
      { name: 'Creatine Monohydrate', dose: '5g daily',               purpose: 'Muscle preservation, neuroprotective. Any meal.' },
    ],
    targeted: [],
    avoid: [],
  }
}

export function buildPlanFromIntake(client, intake) {
  const weightDiff = (parseInt(intake.currentWeight) || 0) - (parseInt(intake.targetWeight) || 0)
  const weeks = parseInt(intake.goalTimeline) || 26
  const weeklyLoss = weightDiff > 0 ? (weightDiff / weeks).toFixed(2) : 0
  const deficit = Math.round(weeklyLoss * 3500 / 7)

  const eatingStart = intake.eatingWindowStart || '8:00 AM'
  const eatingEnd   = intake.eatingWindowEnd   || '8:00 PM'
  const protocol    = intake.fastingProtocol   || '12/12'

  return {
    title: `${client?.firstName ? client.firstName + ' ' : ''}Wellness Plan — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    status: 'draft',
    heroSubtitle: buildSubtitle(intake),

    macros: {
      calories: { min: parseInt(intake.dailyCaloriesMin) || 1750, max: parseInt(intake.dailyCaloriesMax) || 1850 },
      protein:  { min: parseInt(intake.proteinMin)  || 150, max: parseInt(intake.proteinMax)  || 160 },
      carbs:    { min: parseInt(intake.carbMin)     || 130, max: parseInt(intake.carbMax)     || 150 },
      fat:      { min: parseInt(intake.fatMin)      || 55,  max: parseInt(intake.fatMax)      || 65  },
    },

    // Plan sections (pre-populated from intake data)
    sections: [
      {
        id: 's1',
        title: 'Baseline Assessment & Medical Considerations',
        assessment: buildAssessmentText(client, intake, weeklyLoss, deficit),
        paragraphs: [],
        boxes: (intake.conditions || []).length > 0 ? [
          { color: 'red', title: 'Medical Conditions', body: (intake.conditions || []).join(', ') + (intake.medications ? `. Medications: ${intake.medications}` : '') },
        ] : [],
        lists: [],
      },
      {
        id: 's2',
        title: 'Weight & Body Composition Strategy',
        assessment: '',
        paragraphs: [
          weightDiff > 0
            ? `Current weight: ${intake.currentWeight} lbs. Target: ${intake.targetWeight} lbs (${weightDiff}-lb reduction over ${weeks} weeks at ~${weeklyLoss} lbs/week). Required daily deficit: ~${deficit} calories.`
            : 'Set your weight and body composition targets in the Overview tab.',
        ],
        boxes: [],
        lists: [],
        table: {
          headers: ['Variable', 'Value', 'Notes'],
          rows: [
            ['Starting weight', `${intake.currentWeight || '—'} lbs`, 'Current body weight'],
            ['Target weight', `${intake.targetWeight || '—'} lbs`, `${weightDiff || '—'}-lb reduction`],
            ['Timeline', `${weeks} weeks`, `~${weeklyLoss} lbs/week`],
            ['Daily calories', `${intake.dailyCaloriesMin || 1750}–${intake.dailyCaloriesMax || 1850}`, '~' + deficit + ' cal/day deficit'],
            ['Daily protein', `${intake.proteinMin || 150}–${intake.proteinMax || 160}g`, 'Muscle preservation'],
          ],
        },
      },
      {
        id: 's3',
        title: protocol !== 'none' ? `${protocol} Intermittent Fasting Protocol` : 'Nutrition Timing',
        assessment: '',
        paragraphs: [],
        boxes: [
          {
            color: 'green',
            title: 'Daily Eating Window',
            body: `Eating window: ${eatingStart} to ${eatingEnd}. Fasting window: ${eatingEnd} to ${eatingStart}. ${intake.mealsPerDay || 4} meals per day.`,
          },
        ],
        lists: [],
      },
    ],

    // Phase progression
    phases: [
      {
        title: 'Phase 1: Foundation (Weeks 1–8)',
        bullets: [
          'Goal: Establish all habits. Lose 5–7 lbs.',
          `Calories: ${intake.dailyCaloriesMax || 1850}/day (gentler deficit while adapting).`,
          'Training: Learn movements with moderate weight. Build consistency.',
        ],
      },
      {
        title: 'Phase 2: Acceleration (Weeks 9–18)',
        bullets: [
          'Goal: Maximize fat loss while strength increases. Lose 8–10 lbs.',
          `Calories: ${intake.dailyCaloriesMin || 1750}–${(parseInt(intake.dailyCaloriesMin) || 1750) + 50}/day.`,
          'Training: Progressive overload in full effect. Increase weights.',
        ],
      },
      {
        title: 'Phase 3: Refinement (Weeks 19–26)',
        bullets: [
          `Goal: Reach ${intake.targetWeight || 'target'} lbs. Transition toward maintenance.`,
          'Training: Peak strength phase. Heaviest weights of the program.',
          'Begin reverse dieting in final 2 weeks to prevent metabolic rebound.',
        ],
      },
    ],

    // Milestones
    milestones: buildMilestones(intake, weeklyLoss, weeks),

    notes: intake.additionalNotes || '',

    // Weekly data (filled in by PT)
    weeklyMeals: defaultWeeklyMeals(),
    weeklyWorkouts: defaultWeeklyWorkouts(),
    dailySchedules: defaultDailySchedules(eatingStart, eatingEnd, intake.trainingTime || '6:30 AM'),
    supplements: defaultSupplements(),

    clientId: client?.id,
  }
}

function buildSubtitle(intake) {
  const parts = []
  if ((parseInt(intake.proteinMin) || 150) >= 130) parts.push('High-Protein')
  if (intake.fastingProtocol && intake.fastingProtocol !== 'none') parts.push(`${intake.fastingProtocol} Intermittent Fasting`)
  if ((intake.dietaryRestrictions || []).includes('Dairy-free')) parts.push('Dairy-Free')
  if (intake.primaryGoal === 'weight_loss') parts.push('Fat Loss')
  else if (intake.primaryGoal === 'muscle_gain') parts.push('Muscle Building')
  else if (intake.primaryGoal === 'rehabilitation') parts.push('Rehabilitation')
  return parts.join(' · ') || 'Personalized Wellness Plan'
}

function buildAssessmentText(client, intake, weeklyLoss, deficit) {
  const name = [client?.firstName, client?.lastName].filter(Boolean).join(' ')
  const totalIn = parseInt(intake.heightFt || 5) * 12 + parseInt(intake.heightIn || 7)
  const bmi = intake.currentWeight && totalIn
    ? ((intake.currentWeight / (totalIn ** 2)) * 703).toFixed(1) : '—'
  return `Client: ${name || '—'}. Current weight: ${intake.currentWeight || '—'} lbs. Height: ${intake.heightFt ? `${intake.heightFt}'${intake.heightIn || 0}"` : '—'}. BMI: ~${bmi}. Target weight: ${intake.targetWeight || '—'} lbs. Timeline: ${intake.goalTimeline || '26 weeks'}. Required weekly loss: ~${weeklyLoss} lbs/week. Daily caloric deficit: ~${deficit} calories. Medical conditions: ${(intake.conditions || []).join(', ') || 'None reported'}. Medications: ${intake.medications || 'None reported'}. Dietary restrictions: ${(intake.dietaryRestrictions || []).join(', ') || 'None'}.`
}

function buildMilestones(intake, weeklyLoss, totalWeeks) {
  const start = parseInt(intake.currentWeight) || 0
  const target = parseInt(intake.targetWeight) || 0
  const loss = start - target
  if (!loss || loss <= 0 || !start) return []
  const checkpoints = [4, 8, 12, 18, totalWeeks].filter(w => w <= totalWeeks)
  return [
    { week: 'Start', goal: `${start} lbs`, metric: 'Baseline photos, measurements, blood work' },
    ...checkpoints.map(w => {
      const proj = Math.max(target, Math.round(start - weeklyLoss * w))
      return { week: `Week ${w}`, goal: `${proj} lbs`, metric: `~${start - proj} lbs lost` }
    }),
  ]
}
