import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import WorkspaceSetupPage from './pages/WorkspaceSetupPage'
import HomePage from './pages/HomePage'
import MonthlyPage from './pages/MonthlyPage'
import ExpensesPage from './pages/ExpensesPage'
import ExpenseFormPage from './pages/ExpenseFormPage'
import ExpenseDetailPage from './pages/ExpenseDetailPage'
import CategoriesPage from './pages/CategoriesPage'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <span className="muted">กำลังโหลด…</span>
      </main>
    )
  }

  // Not logged in → only login / signup
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Logged in but no workspace yet → force workspace setup
  if (!user.workspaceId) {
    return (
      <Routes>
        <Route path="*" element={<WorkspaceSetupPage />} />
      </Routes>
    )
  }

  // Logged in + has workspace → the app
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/monthly" element={<MonthlyPage />} />
      <Route path="/expenses" element={<ExpensesPage />} />
      <Route path="/expenses/new" element={<ExpenseFormPage />} />
      <Route path="/expenses/:id" element={<ExpenseDetailPage />} />
      <Route path="/expenses/:id/edit" element={<ExpenseFormPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
