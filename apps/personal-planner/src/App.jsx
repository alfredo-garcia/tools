import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout, AppShell, SettingsPage, IconCalendar, IconTarget, IconCheckSquare, IconCircle, IconSettings, IconChartBar, IconSearch, IconMagicBall } from '@tools/shared'
import { PlannerApiProvider } from './contexts/PlannerApiContext'
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
import { Search } from './pages/Search'
import { DiscoveryList } from './pages/DiscoveryList'

const navItems = [
  { to: '/', label: 'Planner', Icon: IconCalendar, aria: 'Weekly planner' },
  { to: '/search', label: 'Search', Icon: IconSearch, aria: 'Search' },
  { to: '/discovery', label: 'Discovery', Icon: IconMagicBall, aria: 'Discovery ideas' },
  { to: '/tasks', label: 'Tasks', Icon: IconCheckSquare, aria: 'Tasks' },
  { to: '/objectives', label: 'OKRs', Icon: IconTarget, aria: 'Objectives and Key Results', inMore: true },
  { to: '/habits', label: 'Habits', Icon: IconCircle, aria: 'Habits', inMore: true },
  { to: '/analytics', label: 'Analytics', Icon: IconChartBar, aria: 'Analytics', inMore: true },
  { to: '/settings', label: 'Settings', Icon: IconSettings, aria: 'Settings', inMore: true },
]

function App() {
  return (
    <Layout>
      <PlannerApiProvider>
        <BrowserRouter>
          <AppShell navItems={navItems} title="Mosco Planner">
          <Routes>
            <Route path="/" element={<PlannerPage />} />
            <Route path="/planner" element={<Navigate to="/" replace />} />
            <Route path="/analytics" element={<Dashboard />} />
            <Route path="/settings" element={<SettingsPage />} />
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
            <Route path="/search" element={<Search />} />
            <Route path="/discovery" element={<DiscoveryList />} />
          </Routes>
          </AppShell>
        </BrowserRouter>
      </PlannerApiProvider>
    </Layout>
  )
}

export default App
