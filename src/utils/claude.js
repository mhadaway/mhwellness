const API_KEY_KEY = 'mhwellness_api_key'

export const getApiKey = () => localStorage.getItem(API_KEY_KEY) || ''
export const setApiKey = k =>
  k ? localStorage.setItem(API_KEY_KEY, k.trim()) : localStorage.removeItem(API_KEY_KEY)

export async function callClaude(system, prompt, maxTokens = 8192) {
  const key = getApiKey()
  if (!key) throw new Error('No API key configured.')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message || `API error ${res.status}`)
  }
  const { content } = await res.json()
  return content?.[0]?.text || ''
}

export function buildGeneratePrompt(client, intake) {
  const name        = [client?.firstName, client?.lastName].filter(Boolean).join(' ') || 'Client'
  const eatStart    = intake.eatingWindowStart || '8:00 AM'
  const eatEnd      = intake.eatingWindowEnd   || '8:00 PM'
  const hasFasting  = intake.fastingProtocol && intake.fastingProtocol !== 'none'
  const fastTitle   = hasFasting ? `${intake.fastingProtocol} Intermittent Fasting` : 'Nutrition Timing'
  const conditions  = (intake.conditions || []).join(', ') || 'none'
  const restrictions = (intake.dietaryRestrictions || []).join(', ') || 'none'
  const limitations = intake.fitnessLimitations || 'none'

  return `Generate a personalized 7-day wellness plan. Return ONLY a valid JSON object — no markdown, no code fences, no text outside the JSON.

CLIENT
Name: ${name}
Height: ${intake.heightFt ? `${intake.heightFt}'${intake.heightIn || 0}"` : 'not provided'} | Weight: ${intake.currentWeight || '?'} → ${intake.targetWeight || '?'} lbs in ${intake.goalTimeline || '26 weeks'}
Goal: ${(intake.primaryGoal || 'weight_loss').replace(/_/g, ' ')}
Conditions: ${conditions} | Medications: ${intake.medications || 'none'} | Limitations: ${limitations}
Diet restrictions: ${restrictions} | ${intake.mealsPerDay || 4} meals/day
Fasting: ${intake.fastingProtocol || '12/12'} — eating window ${eatStart}–${eatEnd}
Target macros: ${intake.dailyCaloriesMin || 1750}–${intake.dailyCaloriesMax || 1850} kcal | Protein ${intake.proteinMin || 150}–${intake.proteinMax || 160}g | Carbs ${intake.carbMin || 130}–${intake.carbMax || 150}g | Fat ${intake.fatMin || 55}–${intake.fatMax || 65}g
Training: ${intake.trainingTime || '6:30 AM'} | ${intake.trainingDaysPerWeek || 5}x/week | ${intake.trainingExperience || 'intermediate'} | ${intake.equipmentAccess || 'full gym'}

REQUIRED JSON STRUCTURE:
{
  "sections": [
    {
      "id": "s1",
      "title": "Baseline Assessment & Medical Considerations",
      "assessment": "<2-3 sentence professional clinical summary of this client's baseline and key plan considerations>",
      "paragraphs": [],
      "boxes": [{"color": "red", "title": "Medical Considerations", "body": "<how the listed conditions and medications affect exercise and nutrition in this plan>"}],
      "lists": []
    },
    {
      "id": "s2",
      "title": "Weight & Body Composition Strategy",
      "assessment": "",
      "paragraphs": ["<paragraph explaining the strategy and scientific rationale>"],
      "boxes": [],
      "lists": [{"heading": "Core Principles", "items": ["<principle 1>", "<principle 2>", "<principle 3>", "<principle 4>"]}],
      "table": {"headers": ["Variable", "Value", "Notes"], "rows": [["Starting weight", "${intake.currentWeight || '?'} lbs", "Baseline"], ["Target weight", "${intake.targetWeight || '?'} lbs", "Goal"], ["Timeline", "${intake.goalTimeline || '26 weeks'}", "Duration"], ["Approach", "<brief description>", "<rationale>"]]}
    },
    {
      "id": "s3",
      "title": "${fastTitle}",
      "assessment": "",
      "paragraphs": ["<explain nutrition timing and benefits for this specific client>"],
      "boxes": [{"color": "green", "title": "Daily Eating Window", "body": "Eating: ${eatStart}–${eatEnd}. ${intake.mealsPerDay || 4} structured meals per day. <rationale specific to client goals>"}],
      "lists": []
    }
  ],
  "weeklyMeals": [
    [<Monday: 4 meal objects with different foods each day>],
    [<Tuesday: 4 meals>],
    [<Wednesday: 4 meals>],
    [<Thursday: 4 meals>],
    [<Friday: 4 meals>],
    [<Saturday: 4 meals, slightly more relaxed>],
    [<Sunday: 4 meals>]
  ],
  "weeklyWorkouts": [
    {"name": "Upper Body A", "time": "${intake.trainingTime || '6:30–7:30 AM'}", "duration": "55 min", "exercises": [<5-6 upper body exercises>], "note": "<form/technique cue>", "tip": "<daily motivational tip>"},
    {"name": "Zone 2 Cardio + Core", "time": "${intake.trainingTime || '6:15–7:00 AM'}", "duration": "45 min", "exercises": [<cardio entry + 3-4 core movements>], "note": "<heart rate guidance>", "tip": ""},
    {"name": "Lower Body", "time": "${intake.trainingTime || '6:30–7:30 AM'}", "duration": "55 min", "exercises": [<5-6 lower body exercises>], "note": "", "tip": ""},
    {"name": "Mobility & Recovery", "time": "${intake.trainingTime || '6:30–7:05 AM'}", "duration": "35 min", "exercises": [<4-5 mobility and stretch movements>], "note": "", "tip": ""},
    {"name": "Upper Body B", "time": "${intake.trainingTime || '6:30–7:30 AM'}", "duration": "55 min", "exercises": [<5-6 different upper body exercises from Monday>], "note": "", "tip": ""},
    {"name": "Zone 2 Cardio + Balance", "time": "${intake.trainingTime || '6:15–7:00 AM'}", "duration": "45 min", "exercises": [<cardio + 3 balance/stability exercises>], "note": "", "tip": ""},
    {"name": "Rest Day", "time": "Flexible", "duration": "20–30 min", "exercises": [{"name": "Gentle walk or light activity", "sets": "20–30 min"}], "note": "Active rest only. No structured training.", "tip": "<recovery tip>"}
  ],
  "supplements": {
    "foundational": [
      {"name": "Omega-3 Fish Oil", "dose": "2–3g EPA/DHA", "purpose": "Anti-inflammatory, cardiovascular and joint health. Take with Meal 1."},
      {"name": "Vitamin D3 + K2", "dose": "4,000–5,000 IU D3 + 200mcg K2", "purpose": "Bone density, immune function. Take with Meal 1."},
      {"name": "Magnesium Glycinate", "dose": "400–600mg", "purpose": "Sleep quality, muscle recovery, nerve health. Take 1–2 hrs before bed."},
      {"name": "Creatine Monohydrate", "dose": "5g daily", "purpose": "Muscle preservation, neuroprotective benefits. Take with any meal."}
    ],
    "targeted": [<1-3 supplements specifically addressing: ${conditions}>],
    "avoid": []
  }
}

Meal object format: {"name": "Meal Name", "time": "H:MM AM/PM", "items": ["specific food + portion", "another food + portion"], "protein": "35", "carbs": "42", "fat": "14", "calories": "430"}
Exercise object format: {"name": "Exercise Name", "sets": "3×10-12 reps"}

Requirements:
- All 7 days must use different foods — significant variety across the week
- Use specific portions: "4oz grilled chicken breast", "½ cup cooked quinoa", "1 tbsp olive oil"
- Daily macro totals should approximate target ranges (calories, protein, carbs, fat)
- Strictly respect dietary restrictions: ${restrictions}
- Modify or replace exercises that would aggravate limitations: ${limitations}
- Targeted supplements must address the specific conditions: ${conditions}`
}
