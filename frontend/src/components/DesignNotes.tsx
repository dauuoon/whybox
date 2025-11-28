import { useState } from 'react'
import '../styles/designNotes.css'
import WorkArea from './WorkArea'
import LogoHeader from './LogoHeader'
import Toast from './Toast'

interface DesignNotesProps {
  onBack: () => void
  onSubmit: (notes: string) => void
}

export default function DesignNotes({
  onBack,
  onSubmit,
}: DesignNotesProps) {
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const handleSubmit = () => {
    setIsLoading(true)

    // 3초 로딩 후 완료
    setTimeout(() => {
      setIsLoading(false)
      setShowToast(true)
      
      // 토스트 알림 2초 후 사라짐
      setTimeout(() => {
        setShowToast(false)
        onSubmit(notes)
      }, 2000)
    }, 3000)
  }

  return (
    <WorkArea>
      {/* Logo Header */}
      <LogoHeader />

      {/* Divider */}
      <div className="design-notes-divider"></div>

      <div className="design-notes">
        {/* Text Input Section */}
        <div className="text-input-section">
          <label className="input-label">전달 사항</label>
          <textarea
            className="text-input"
            placeholder="디자인 전달 사항이 있다면 작성해 주세요."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Controls Section */}
        <div className="controls-section">
          {/* Left: Empty space */}
          <div></div>

          {/* Right: Navigation Buttons */}
          <div className="buttons-section">
            <button 
              className="nav-button prev-button" 
              onClick={onBack}
              disabled={isLoading}
            >
              이전
            </button>
            <button
              className={`nav-button submit-button ${
                isLoading ? 'loading' : ''
              }`}
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner"></span>
              ) : (
                '전송'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <Toast message="이미지 전송이 완료되었습니다." />
      )}
    </WorkArea>
  )
}
