import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import MatrixRain from './components/MatrixRain'
import PasswordGate from './components/PasswordGate'
import PortfolioPage from './pages/PortfolioPage'
import DashboardPage from './pages/DashboardPage'
import NotesPage from './pages/NotesPage'
import TasksPage from './pages/TasksPage'
import HabitsPage from './pages/HabitsPage'
import PomodoroPage from './pages/PomodoroPage'
import IdeaBankPage from './pages/IdeaBankPage'
import MoneyPage from './pages/MoneyPage'
import SmokingPage from './pages/SmokingPage'

export default function App() {
  const [showFlicker, setShowFlicker] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowFlicker(false), 32)
    return () => clearTimeout(timer)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public portfolio */}
        <Route path="/" element={<PortfolioPage />} />

        {/* Private app — password gated */}
        <Route
          path="/app"
          element={
            <PasswordGate>
              <>
                {showFlicker && <div className="crt-flash" />}
                <MatrixRain />
                <Layout />
              </>
            </PasswordGate>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="notes/:noteId" element={<NotesPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="pomodoro" element={<PomodoroPage />} />
          <Route path="ideas" element={<IdeaBankPage />} />
          <Route path="money" element={<MoneyPage />} />
          <Route path="smoking" element={<SmokingPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
