import { useEffect, useState } from 'react'

export default function MobileWarning() {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const checkWidth = () => {
      setIsActive(window.innerWidth < 1000)
    }

    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  return (
    <div className={`mobile-warning-popup ${isActive ? 'active' : ''}`}>
      <div className="mobile-warning-content">
        <h2>알림</h2>
        <p>해당 사이트는 PC에서 접속할 수 있습니다.</p>
      </div>
    </div>
  )
}
