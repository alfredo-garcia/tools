import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import {
  Layout,
  AppShell,
  SettingsPage,
  IconCalendar,
  IconTarget,
  IconCheckSquare,
  IconCircle,
  IconSettings,
  IconChartBar,
  IconSearch,
  IconMagicBall,
  IconCart,
  IconBook,
  IconChefHat,
} from '@tools/shared'
import { PlannerApiProvider } from './contexts/PlannerApiContext'
import { PlannerPage } from './pages/PlannerPage'
import { TasksList } from './pages/TasksList'
import { TaskDetail } from './pages/TaskDetail'
import { HabitsList } from './pages/HabitsList'
import { HabitDetail } from './pages/HabitDetail'
import { ObjectivesList } from './pages/ObjectivesList'
import { ObjectiveDetail } from './pages/ObjectiveDetail'
import { KeyResultsList } from './pages/KeyResultsList'
import { KeyResultDetail } from './pages/KeyResultDetail'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { MealsPage } from './pages/MealsPage'
import { ShoppingPage } from './pages/ShoppingPage'
import { RecipesList } from './pages/RecipesList'
import { RecipeDetail } from './pages/RecipeDetail'
import { SearchPage } from './pages/SearchPage'
import { DiscoveryPage } from './pages/DiscoveryPage'
import { AnalysisOKRPage } from './pages/AnalysisOKRPage'
import { AnalysisTasksPage } from './pages/AnalysisTasksPage'
import { AnalysisHabitsPage } from './pages/AnalysisHabitsPage'

const navItems = [
  { to: '/', label: 'Planner', Icon: IconCalendar, aria: 'Weekly planner' },
  { to: '/search', label: 'Search', Icon: IconSearch, aria: 'Search' },
  { to: '/discovery', label: 'Discovery', Icon: IconMagicBall, aria: 'Discovery ideas', inMore: true },
  { to: '/tasks', label: 'Tasks', Icon: IconCheckSquare, aria: 'Tasks' },
  { to: '/objectives', label: 'OKRs', Icon: IconTarget, aria: 'Objectives and Key Results', inMore: true },
  { to: '/meals', label: 'Meals', Icon: IconChefHat, aria: 'Meals planner', inMore: true },
  { to: '/shopping', label: 'Shopping', Icon: IconCart, aria: 'Shopping list', inMore: true },
  { to: '/recipes', label: 'Recipes', Icon: IconBook, aria: 'Recipes', inMore: true },
  { to: '/habits', label: 'Habits', Icon: IconCircle, aria: 'Habits', inMore: true },
  { to: '/analytics', label: 'Analytics', Icon: IconChartBar, aria: 'Analytics', inMore: true },
  { to: '/settings', label: 'Settings', Icon: IconSettings, aria: 'Settings', inMore: true },
]

export default function App() {
  return (
    <Layout>
      <PlannerApiProvider>
        <BrowserRouter>
          <AppShell navItems={navItems} title="Planner" storageKeyPrefix="planner-web">
            <Routes>
              <Route path="/" element={<PlannerPage />} />
              <Route path="/planner" element={<Navigate to="/" replace />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/objectives" element={<ObjectivesList />} />
              <Route path="/objectives/:id" element={<ObjectiveDetail />} />
              <Route path="/key-results" element={<KeyResultsList />} />
              <Route path="/key-results/:id" element={<KeyResultDetail />} />
              <Route path="/tasks" element={<TasksList />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />
              <Route path="/habits" element={<HabitsList />} />
              <Route path="/habits/:id" element={<HabitDetail />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/discovery" element={<DiscoveryPage />} />
              <Route path="/meals" element={<MealsPage />} />
              <Route path="/shopping" element={<ShoppingPage />} />
              <Route path="/recipes" element={<RecipesList />} />
              <Route path="/recipes/:id" element={<RecipeDetail />} />
              <Route path="/analysis/okr" element={<AnalysisOKRPage />} />
              <Route path="/analysis/tasks" element={<AnalysisTasksPage />} />
              <Route path="/analysis/habits" element={<AnalysisHabitsPage />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </PlannerApiProvider>
    </Layout>
  )
}
