import { Routes, Route } from 'react-router-dom'
import Topbar from './components/Topbar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ClientProfile from './pages/ClientProfile.jsx'
import IntakeForm from './pages/IntakeForm.jsx'
import PlanView from './pages/PlanView.jsx'
import PlanEditor from './pages/PlanEditor.jsx'
import DailyGuide from './pages/DailyGuide.jsx'

export default function App() {
  return (
    <>
      <Topbar />
      <div className="page-wrap">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients/new" element={<IntakeForm />} />
          <Route path="/clients/:id" element={<ClientProfile />} />
          <Route path="/clients/:id/intake" element={<IntakeForm />} />
          <Route path="/clients/:id/plans/new" element={<PlanEditor />} />
          <Route path="/clients/:id/plans/:planId/edit" element={<PlanEditor />} />
          <Route path="/clients/:id/plans/:planId" element={<PlanView />} />
          <Route path="/clients/:id/plans/:planId/daily" element={<DailyGuide />} />
        </Routes>
      </div>
    </>
  )
}
