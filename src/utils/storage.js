const CLIENTS_KEY = 'mhwellness_clients'
const PLANS_KEY   = 'mhwellness_plans'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ─── CLIENTS ───
export function getClients() {
  try { return JSON.parse(localStorage.getItem(CLIENTS_KEY)) || [] } catch { return [] }
}
export function getClient(id) {
  return getClients().find(c => c.id === id) || null
}
export function saveClient(client) {
  const clients = getClients()
  const idx = clients.findIndex(c => c.id === client.id)
  if (idx >= 0) clients[idx] = { ...client, updatedAt: new Date().toISOString() }
  else clients.unshift({ ...client, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients))
  return clients.find(c => c.id === (client.id || clients[0].id))
}
export function deleteClient(id) {
  const clients = getClients().filter(c => c.id !== id)
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients))
  const plans = getPlans().filter(p => p.clientId !== id)
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans))
}

// ─── PLANS ───
export function getPlans() {
  try { return JSON.parse(localStorage.getItem(PLANS_KEY)) || [] } catch { return [] }
}
export function getClientPlans(clientId) {
  return getPlans().filter(p => p.clientId === clientId)
}
export function getPlan(id) {
  return getPlans().find(p => p.id === id) || null
}
export function savePlan(plan) {
  const plans = getPlans()
  const idx = plans.findIndex(p => p.id === plan.id)
  if (idx >= 0) plans[idx] = { ...plan, updatedAt: new Date().toISOString() }
  else plans.unshift({ ...plan, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans))
  return plans.find(p => p.id === (plan.id || plans[0].id))
}
export function deletePlan(id) {
  const plans = getPlans().filter(p => p.id !== id)
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans))
}

// ─── HELPERS ───
export function calcAge(dob) {
  if (!dob) return ''
  const d = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--
  return age
}
export function calcBMI(weightLbs, heightIn) {
  if (!weightLbs || !heightIn) return null
  return ((weightLbs / (heightIn * heightIn)) * 703).toFixed(1)
}
export function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
export function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
