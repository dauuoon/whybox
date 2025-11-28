import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface UserInfo {
  id: string
  name: string
  experience: string
  jobTitle: string
  role?: 'admin' | 'user'
}

interface AuthContextType {
  isLoggedIn: boolean
  userInfo: UserInfo | null
  login: (userInfo: UserInfo) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 앱 로드 시 localStorage에서 로그인 정보 복원
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('userInfo')
    if (savedUserInfo) {
      try {
        const user = JSON.parse(savedUserInfo)
        setIsLoggedIn(true)
        setUserInfo(user)
      } catch (error) {
        console.error('Failed to restore login info:', error)
        localStorage.removeItem('userInfo')
      }
    }
    setIsLoading(false)
  }, [])

  const login = (info: UserInfo) => {
    setIsLoggedIn(true)
    setUserInfo(info)
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  const logout = () => {
    setIsLoggedIn(false)
    setUserInfo(null)
    localStorage.removeItem('userInfo')
  }

  if (isLoading) {
    return <div>로딩중...</div>
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, userInfo, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
