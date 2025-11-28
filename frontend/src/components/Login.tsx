import { useState } from 'react'
import '../styles/login.css'
import Toast from './Toast'
import WorkArea from './WorkArea'
import LogoHeader from './LogoHeader'
import { useAuth } from '../context/AuthContext'

const API_BASE_URL = '/api'

export default function Login() {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const { login } = useAuth()

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '')
    setId(value)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setPassword(value)
  }

  const handleLogin = async () => {
    if (!id || !password) return
    
    setIsLoading(true)
    try {
      console.log('🔐 로그인 시도:', { id, password })
      
      // 관리자 로그인 시도
      const adminRes = await fetch(`${API_BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: id, password })
      })
      
      if (adminRes.ok) {
        const adminData = await adminRes.json()
        console.log('✅ 관리자 로그인 성공:', adminData)
        login({
          id: adminData.user.id,
          name: adminData.user.username,
          experience: '관리자',
          jobTitle: '관리자',
          role: 'admin'
        })
        setToastMessage('로그인을 성공했습니다.')
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2000)
        setId('')
        setPassword('')
        return
      }
      
      // 사용자 로그인 시도
      const userRes = await fetch(`${API_BASE_URL}/auth/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: id, password })
      })
      
      if (userRes.ok) {
        const userData = await userRes.json()
        console.log('✅ 사용자 로그인 성공:', userData)
        login({
          id: userData.user.username,
          name: userData.user.name,
          experience: userData.user.experience,
          jobTitle: userData.user.jobTitle,
          role: 'user'
        })
        setToastMessage('로그인을 성공했습니다.')
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2000)
        setId('')
        setPassword('')
        return
      }
      
      // 둘 다 실패한 경우
      setToastMessage('아이디 또는 비밀번호가 올바르지 않습니다.')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
      console.log('❌ 로그인 실패: 잘못된 인증정보')
    } catch (error) {
      console.error('❌ 로그인 오류:', error)
      setToastMessage('로그인 중 오류가 발생했습니다.')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && id && password && !isLoading) {
      handleLogin()
    }
  }

  return (
    <div>
      {showToast && <Toast message={toastMessage} />}
      <WorkArea>
        {/* Logo Header */}
        <LogoHeader />

        {/* Divider */}
        <div className="login-divider"></div>

        {/* Form Container */}
        <div className="login-form-container">

          {/* ID Input */}
          <input
            type="text"
            className="login-input"
            placeholder="아이디를 입력하세요."
            value={id}
            onChange={handleIdChange}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />

          {/* Password Input */}
          <input
            type="password"
            className="login-input login-input-password"
            placeholder="비밀번호를 입력하세요."
            value={password}
            onChange={handlePasswordChange}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />

          {/* Login Button */}
          <button
            className="login-button"
            onClick={handleLogin}
            disabled={!id || !password || isLoading}
          >
            {isLoading ? (
              <span className="spinner"></span>
            ) : (
              '로그인'
            )}
          </button>

          {/* Guide Text */}
          <div className="login-guide">
            회원정보는{' '}
            <a href="https://open.kakao.com/o/sv6VztYh" target="_blank" rel="noopener noreferrer" className="login-guide-link">
              연구책임자
            </a>
            에게 문의하세요
          </div>
        </div>
      </WorkArea>
    </div>
  )
}
