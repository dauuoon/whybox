import '../styles/logoHeader.css'
import { useAuth } from '../context/AuthContext'

export default function LogoHeader() {
  const { isLoggedIn, logout } = useAuth()

  return (
    <div className="logo-header">
      <div className="logo-header-left">
        <img src="/src/assets/logo.png" alt="Why Box Logo" className="logo-header-logo" />
      </div>
      {isLoggedIn && (
        <button className="logo-header-logout" onClick={logout}>
          로그아웃
        </button>
      )}
    </div>
  )
}
