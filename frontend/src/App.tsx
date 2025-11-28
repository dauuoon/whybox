import { useEffect, useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import LeftSidebar from './components/LeftSidebar'
import RightSidebar from './components/RightSidebar'
import MobileWarning from './components/MobileWarning'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import AdminPanel from './components/AdminPanel'
import { useAuth } from './context/AuthContext'

function AppContent() {
  const [isMobile, setIsMobile] = useState(false)
  const { isLoggedIn, userInfo, logout } = useAuth()
  const isAdmin = isLoggedIn && userInfo?.role === 'admin'

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 1160)
    }

    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  return (
    <div>
      {!isMobile && !isAdmin && <LeftSidebar />}
      {!isMobile && !isAdmin && <RightSidebar />}
      {isMobile && <MobileWarning />}
      <div className="main-content">
        {isLoggedIn ? (
          isAdmin ? (
            <AdminPanel onLogout={logout} />
          ) : (
            <Dashboard />
          )
        ) : (
          <Login />
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
