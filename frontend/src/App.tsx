import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { AuthGuard } from '@/components/auth/AuthGuard'
import Dashboard from '@/pages/Dashboard'
import Tickets from '@/pages/Tickets'
import LandingPage from '@/pages/LandingPage'
import Auth from '@/pages/Auth'
import TicketDetail from '@/pages/TicketDetail'
import Teams from '@/pages/Teams'
import KnowledgeBase from '@/pages/KnowledgeBase'
import Priorities from '@/pages/Priorities'
import Customers from '@/pages/Customers'
import Settings from '@/pages/Settings'
import Profile from '@/pages/Profile'
import ResetPassword from '@/pages/ResetPassword'

import { MotiaStreamProvider } from '@motiadev/stream-client-react'
import { useAuth } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'

import { API_BASE_URL } from '@/lib/api'
const WS_URL = API_BASE_URL.replace(/^http/, 'ws')

function MotiaStreamWrapper({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const token = session?.access_token

  return (
    <MotiaStreamProvider address={WS_URL} protocols={token ? [token] : undefined}>
      {children}
    </MotiaStreamProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <MotiaStreamWrapper>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/dashboard"
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/tickets"
              element={
                <AuthGuard>
                  <Tickets />
                </AuthGuard>
              }
            />
            <Route
              path="/teams"
              element={
                <AuthGuard>
                  <Teams />
                </AuthGuard>
              }
            />
            <Route
              path="/customers"
              element={
                <AuthGuard>
                  <Customers />
                </AuthGuard>
              }
            />
            <Route
              path="/knowledge-base"
              element={
                <AuthGuard>
                  <KnowledgeBase />
                </AuthGuard>
              }
            />
            <Route
              path="/priority"
              element={
                <AuthGuard>
                  <Priorities />
                </AuthGuard>
              }
            />
            <Route
              path="/settings"
              element={
                <AuthGuard>
                  <Settings />
                </AuthGuard>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              }
            />
            <Route
              path="/tickets/:id"
              element={
                <AuthGuard>
                  <TicketDetail />
                </AuthGuard>
              }
            />
          </Routes>
        </Router>
      </MotiaStreamWrapper>
    </AuthProvider>
  )
}

export default App
