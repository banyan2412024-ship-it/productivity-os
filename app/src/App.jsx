import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import DashboardPage from './pages/DashboardPage'
import NotesPage from './pages/NotesPage'
import TasksPage from './pages/TasksPage'
import HabitsPage from './pages/HabitsPage'
import PomodoroPage from './pages/PomodoroPage'
import IdeaBankPage from './pages/IdeaBankPage'
import MoneyPage from './pages/MoneyPage'
import SmokingPage from './pages/SmokingPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/notes/:noteId" element={<NotesPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/pomodoro" element={<PomodoroPage />} />
          <Route path="/ideas" element={<IdeaBankPage />} />
          <Route path="/money" element={<MoneyPage />} />
          <Route path="/smoking" element={<SmokingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
