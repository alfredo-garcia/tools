import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout, AppShell, SettingsPage, IconHome, IconCalendar, IconTarget, IconCheckSquare, IconCircle, IconSettings } from '@tools/shared'
import { Dashboard } from './pages/Dashboard'
import { PlannerPage } from './pages/PlannerPage'
import { ObjectivesList } from './pages/ObjectivesList'
import { ObjectiveDetail } from './pages/ObjectiveDetail'
import { KeyResultsList } from './pages/KeyResultsList'
import { KeyResultDetail } from './pages/KeyResultDetail'
import { TasksList } from './pages/TasksList'
import { TaskDetail } from './pages/TaskDetail'
import { HabitsList } from './pages/HabitsList'
import { HabitDetail } from './pages/HabitDetail'
import { AnalysisOKR } from './pages/AnalysisOKR'
import { AnalysisTasks } from './pages/AnalysisTasks'
import { AnalysisHabits } from './pages/AnalysisHabits'

const navItems = [
  { to: '/', label: 'Home', Icon: IconHome, aria: 'Dashboard' },
  { to: '/planner', label: 'Planner', Icon: IconCalendar, aria: 'Planner semanal' },
  { to: '/objectives', label: 'OKRs', Icon: IconTarget, aria: 'Objetivos y Key Results' },
  { to: '/tasks', label: 'Tasks', Icon: IconCheckSquare, aria: 'Tareas' },
  { to: '/habits', label: 'Habits', Icon: IconCircle, aria: 'Hábitos' },
  { to: '/settings', label: 'Settings', Icon: IconSettings, aria: 'Ajustes' },
]

function App() {
  return (
    <Layout>
      <BrowserRouter>
        <AppShell navItems={navItems} title="Mosco Planner">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/settings" element={<SettingsPage backTo="/" backLabel="← Volver al inicio" />} />
            <Route path="/objectives" element={<ObjectivesList />} />
            <Route path="/objectives/:id" element={<ObjectiveDetail />} />
            <Route path="/key-results" element={<KeyResultsList />} />
            <Route path="/key-results/:id" element={<KeyResultDetail />} />
            <Route path="/tasks" element={<TasksList />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/habits" element={<HabitsList />} />
            <Route path="/habits/:id" element={<HabitDetail />} />
            <Route path="/analysis/okr" element={<AnalysisOKR />} />
            <Route path="/analysis/tasks" element={<AnalysisTasks />} />
            <Route path="/analysis/habits" element={<AnalysisHabits />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </Layout>
  )
}

export default App
