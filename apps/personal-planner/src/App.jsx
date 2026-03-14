import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout, AppShell, SettingsPage, IconCalendar, IconTarget, IconCheckSquare, IconCircle, IconSettings, IconChartBar, IconSearch, IconMagicBall, IconCart, IconBook, IconUtensils, IconChefHat } from '@tools/shared'
import { PlannerApiProvider } from './contexts/PlannerApiContext'
import { usePastDueTasks } from './hooks/usePastDueTasks'
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
import { ShoppingPage } from './pages/ShoppingPage'
import { RecipesList } from './pages/RecipesList'
import { RecipeDetail } from './pages/RecipeDetail'
import { MealsPage } from './pages/MealsPage'
import { ConnectionStatus } from './components/ConnectionStatus'
import { CalendarConnections } from './components/CalendarConnections'

const baseNavItems = [
  { to: '/', label: 'Planner', Icon: IconCalendar, aria: 'Weekly planner' },
  { to: '/search', label: 'Search', Icon: IconSearch, aria: 'Search' },
  { to: '/discovery', label: 'Discovery', Icon: IconMagicBall, aria: 'Discovery ideas' },
  { to: '/tasks', label: 'Tasks', Icon: IconCheckSquare, aria: 'Tasks' },
  { to: '/objectives', label: 'OKRs', Icon: IconTarget, aria: 'Objectives and Key Results', inMore: true },
  { to: '/meals', label: 'Meals', Icon: IconChefHat, aria: 'Meals planner', inMore: true},
  { to: '/shopping', label: 'Shopping', Icon: IconCart, aria: 'Shopping list', inMore: true},
  { to: '/recipes', label: 'Recipes', Icon: IconBook, aria: 'Recipes', inMore: true},
  { to: '/habits', label: 'Habits', Icon: IconCircle, aria: 'Habits', inMore: true },
  { to: '/analytics', label: 'Analytics', Icon: IconChartBar, aria: 'Analytics', inMore: true },
  { to: '/settings', label: 'Settings', Icon: IconSettings, aria: 'Settings', inMore: true },
]

function PlannerShell({ children }) {
  const { hasPastDue } = usePastDueTasks()
  const navItems = baseNavItems.map((item) =>
    item.to === '/tasks' ? { ...item, badge: hasPastDue } : item
  )
  return (
    <AppShell navItems={navItems} title="Mosco Planner" storageKeyPrefix="mosco-planner">
      <ConnectionStatus />
      {children}
    </AppShell>
  )
}

function App() {
  return (
    <Layout>
      <PlannerApiProvider>
        <BrowserRouter>
          <PlannerShell>
          <Routes>
            <Route path="/" element={<PlannerPage />} />
            <Route path="/planner" element={<Navigate to="/" replace />} />
            <Route path="/analytics" element={<Dashboard />} />
            <Route path="/settings" element={<SettingsPage><CalendarConnections /></SettingsPage>} />
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
            <Route path="/shopping" element={<ShoppingPage />} />
            <Route path="/meals" element={<MealsPage />} />
            <Route path="/recipes" element={<RecipesList />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            <Route path="/discovery" element={<DiscoveryList />} />
          </Routes>
          </PlannerShell>
        </BrowserRouter>
      </PlannerApiProvider>
    </Layout>
  )
}

export default App
