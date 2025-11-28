import '../styles/rightSidebar.css'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function RightSidebar() {
  const { isLoggedIn, userInfo } = useAuth()
  const [showFloatingMenu, setShowFloatingMenu] = useState(false)

  return (
    <div className="right-sidebar">
      {/* Profile Section */}
      <div className="right-sidebar-profile">
        <img 
          src={isLoggedIn ? 'src/assets/profile_a.png' : 'src/assets/profile_b.png'} 
          alt="Profile" 
          className="right-sidebar-profile-img"
        />
        <p className="right-sidebar-profile-text">
          {isLoggedIn && userInfo ? (
            userInfo.name
          ) : (
            <>
              <span className="right-sidebar-login-text">로그인</span>
              이 필요합니다.
            </>
          )}
        </p>
      </div>

      {/* Divider */}
      <div className="right-sidebar-divider"></div>

      {/* Info Section */}
      <div className="right-sidebar-info">
        <span>Info</span>
      </div>

      {/* Divider */}
      <div className="right-sidebar-divider"></div>

      {/* User Details Section (Only when logged in) */}
      {isLoggedIn && userInfo && (
        <div className="right-sidebar-details">
          <div className="right-sidebar-detail-row">
            <span className="detail-label">아이디</span>
            
            <span className="detail-value">{userInfo.id}</span>
          </div>
          <div className="right-sidebar-detail-row">
            <span className="detail-label">이름</span>
            
            <span className="detail-value">{userInfo.name}</span>
          </div>
          <div className="right-sidebar-detail-row">
            <span className="detail-label">직무경력</span>
  
            <span className="detail-value">{userInfo.experience}</span>
          </div>
          <div className="right-sidebar-detail-row">
            <span className="detail-label">주요직무</span>
           
            <span className="detail-value">{userInfo.jobTitle}</span>
          </div>
        </div>
      )}

      {/* Customer Service Floating Button */}
      <div className="floating-button-container">
        <button 
          className="floating-main-btn"
          onClick={() => setShowFloatingMenu(!showFloatingMenu)}
          title="고객 센터"
        >
          <img src="/src/assets/help.svg" alt="도움말" className="floating-btn-icon" />
        </button>

        {showFloatingMenu && (
          <div className="floating-menu">
            <a 
              href="https://open.kakao.com/o/sv6VztYh" 
              target="_blank" 
              rel="noopener noreferrer"
              className="floating-menu-btn floating-menu-btn-chat"
              title="문의하기"
            >
              💬
            </a>
            <a 
              href="https://www.notion.so/dauuoon/AI-275030b02c9b8068a847d15cac40dddf?source=copy_link" 
              target="_blank" 
              rel="noopener noreferrer"
              className="floating-menu-btn floating-menu-btn-guide"
              title="가이드"
            >
              📖
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
