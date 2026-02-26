import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AppShell } from './components/AppShell'
import { Dashboard } from './pages/Dashboard'
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

function App() {
  return (
    <Layout>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
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
