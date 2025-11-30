import '../styles/designDetail.css'
import WorkArea from './WorkArea'
import LogoHeader from './LogoHeader'
import { useState, useRef, useEffect } from 'react'
import { API_BASE_URL } from '../api/config'
import { useAuth } from '../context/AuthContext'

// 날짜를 YYYY.MM.DD 형식으로 변환
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
  } catch {
    return dateString
  }
}

interface Pin {
  id: string
  x: number
  y: number
  text: string
  comments?: Array<{
    id: string
    author?: string
    text: string
    timestamp?: string
    created_at?: string
    admin_feedback?: string
    adminFeedback?: {
      text: string
      timestamp: string
    }
  }>
}

interface DesignDetailProps {
  historyItem: {
    id: string
    imageUrl: string
    category: string
    date: string
    status: '질문생성중' | '질문생성완료' | '답변전송완료' | '최종피드백완료'
    notes?: string
    pins?: Pin[]
    questionCreatedAt?: string
    answerSubmittedAt?: string
    finalFeedbackCompletedAt?: string
    feedback?: string
  }
  onBack: () => void
}

interface Question {
  id: string
  text: string
  answer?: string
}

export default function DesignDetail({ historyItem, onBack }: DesignDetailProps) {
  const { userInfo } = useAuth()
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 })
  const [canvasScale, setCanvasScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null)
  const [clickedPinId, setClickedPinId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openMenuCommentId, setOpenMenuCommentId] = useState<string | null>(null)
  const [isSendingAnswers, setIsSendingAnswers] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const bgImageRef = useRef<HTMLDivElement>(null)

  // 휠 이벤트 핸들러 (passive: false로 등록)
  useEffect(() => {
    const handleWheelEvent = (e: WheelEvent) => {
      if (bgImageRef.current && bgImageRef.current.contains(e.target as Node)) {
        e.preventDefault()
        const newScale = canvasScale + (e.deltaY > 0 ? -0.1 : 0.1)
        setCanvasScale(Math.max(0.5, Math.min(3, newScale)))
      }
    }

    document.addEventListener('wheel', handleWheelEvent, { passive: false })
    return () => {
      document.removeEventListener('wheel', handleWheelEvent)
    }
  }, [canvasScale])

  // 핀 내용을 questions으로 변환
  const questions: Question[] = historyItem.pins?.map(pin => ({
    id: pin.id,
    text: pin.text,
    answer: pin.comments?.[0]?.text,
  })) || []
  const refreshComments = async (pinId: string) => {
    try {
      // 백엔드에서 핀의 댓글 새로고침
      const response = await fetch(`${API_BASE_URL}/pins`)
      if (!response.ok) throw new Error(`API Error: ${response.status}`)
      
      const allPins = await response.json()
      const updatedPin = allPins.find((p: any) => p.id === pinId)
      
      if (updatedPin) {
        const pin = historyItem.pins?.find(p => p.id === pinId)
        if (pin) {
          pin.comments = updatedPin.comments || []
        }
      }
    } catch (error) {
      console.error('❌ 댓글 새로고침 실패:', error)
    }
  }

  const handleAddComment = async (pinId: string) => {
    if (!commentText.trim() || isSubmitting) return

    setIsSubmitting(true)
    const tempCommentText = commentText
    
    try {
      // 로컬에서 먼저 업데이트 (UI 반응성)
      const pin = historyItem.pins?.find(p => p.id === pinId)
      if (pin) {
        if (!pin.comments) pin.comments = []
        const newComment = {
          id: Date.now().toString(),
          author: userInfo?.name || '사용자',
          text: tempCommentText,
          timestamp: new Date().toLocaleString('ko-KR'),
        }
        pin.comments.push(newComment)
        setCommentText('')
        
        // 백엔드에 답변 저장
        try {
          console.log('📝 답변 저장 요청:', { designId: historyItem.id, pinId, text: tempCommentText })
          const response = await fetch(`${API_BASE_URL}/designs/${historyItem.id}/pins/${pinId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              author: userInfo?.name || '사용자',
              text: tempCommentText,
              timestamp: new Date().toISOString()
            })
          })
          
          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`)
          }
          
          const savedComment = await response.json()
          console.log('✅ 답변 저장 완료:', savedComment)
          
          // 백엔드에서 저장된 댓글 즉시 새로고침 (부모 새로고침 대기 안함)
          await refreshComments(pinId)
          
          // 상태 강제 갱신 (React에게 다시 렌더링하도록)
          const updatedPin = historyItem.pins?.find(p => p.id === pinId)
          if (updatedPin && updatedPin.comments) {
            updatedPin.comments = [...updatedPin.comments]
          }
        } catch (error) {
          console.error('❌ 답변 저장 실패:', error)
          alert('답변 저장에 실패했습니다.')
        }
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = (commentId: string) => {
    const pin = getSelectedPin()
    if (pin && pin.comments) {
      pin.comments = pin.comments.filter(c => c.id !== commentId)
      setOpenMenuCommentId(null)
    }
  }

  const getSelectedPin = () => {
    return historyItem.pins?.find(p => p.id === clickedPinId) || null
  }

  const handleSendAnswers = async () => {
    const allAnswersProvided = historyItem.pins?.every(pin => 
      pin.comments && pin.comments.length > 0
    )
    
    if (!allAnswersProvided) return

    setIsSendingAnswers(true)
    
    // 2초 대기
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 현재 날짜 기록
    const now = new Date()
    const answerSubmittedAt = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
    
    // 모든 답변을 관리자로 전송 (여기서는 상태 업데이트로 시뮬레이션)
    console.log('Answers sent as admin:', {
      designId: historyItem.id,
      answerSubmittedAt: answerSubmittedAt,
      answers: historyItem.pins?.map(pin => ({
        pinId: pin.id,
        question: pin.text,
        answer: pin.comments?.find(c => c.author === (userInfo?.name || '사용자'))?.text || ''
      }))
    })
    
    // 상태를 '답변전송완료'로 변경 및 답변 전송 날짜 기록
    historyItem.status = '답변전송완료'
    historyItem.answerSubmittedAt = answerSubmittedAt
    
    // 백엔드에 상태 변경 요청
    try {
      console.log('🔷 상태 변경 요청:', { status: '답변전송완료', answerSubmittedAt })
      const response = await fetch(`${API_BASE_URL}/designs/${historyItem.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: '답변전송완료',
          answerSubmittedAt: answerSubmittedAt
        })
      })
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }
      const updatedItem = await response.json()
      console.log('✅ 상태 변경 완료:', updatedItem)
      
      // 2초 대기 후 목록으로 돌아가서 새로고침되도록
      await new Promise(resolve => setTimeout(resolve, 2000))
      onBack()
    } catch (error) {
      console.error('❌ 상태 변경 실패:', error)
      // 실패 시 상태 복원
      historyItem.status = '질문생성완료'
      delete historyItem.answerSubmittedAt
    }
    
    setIsSendingAnswers(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    // 캔버스 이동량 계산
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    setCanvasPosition({
      x: canvasPosition.x + deltaX,
      y: canvasPosition.y + deltaY,
    })
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <>
      {/* Background Image Container */}
      <div
        className={`design-detail-bg ${isDragging ? 'dragging' : ''}`}
        ref={bgImageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ touchAction: 'none' }}
      >
          {/* Canvas wrapper - 캔버스 전체를 줌/팬 */}
        <div
          className={`canvas-wrapper`}
          style={{
            transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${canvasScale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {/* Actual Background Image */}
          <div
            className="bg-image"
            style={{
              backgroundImage: `url(${historyItem.imageUrl})`,
            }}
          />          {/* Pins on Canvas */}
          {historyItem.pins && historyItem.pins.map((pin) => (
            <div
              key={pin.id}
              className="pin-container"
              onMouseEnter={() => setHoveredPinId(pin.id)}
              onMouseLeave={() => setHoveredPinId(null)}
              onClick={() => setClickedPinId(clickedPinId === pin.id ? null : pin.id)}
              style={{
                position: 'absolute',
                left: `${pin.x}%`,
                top: `${pin.y}%`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'auto',
              }}
            >
              <img 
                src={hoveredPinId === pin.id ? '/assets/pin_hover.svg' : '/assets/pin.svg'} 
                alt="핀" 
                className="pin-icon" 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Comment Modal */}
      {clickedPinId && getSelectedPin() && (
        <div className="comment-modal">
          <div className="comment-modal-content">
            {/* Modal Header */}
            <div className="modal-header">
              <h3 className="modal-title">질문 박스</h3>
              <button onClick={() => {
                setClickedPinId(null)
                setCommentText('')
              }} className="modal-close-btn">✕</button>
            </div>

            {/* Selected Question */}
            {getSelectedPin() && (
              <div className="selected-question-box">
                <p className="selected-question-text">Q. {getSelectedPin()?.text}</p>
              </div>
            )}

            {/* Comments List */}
            <div className="comments-list">
              {getSelectedPin()?.comments && getSelectedPin()!.comments!.length > 0 ? (
                getSelectedPin()!.comments!.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <div className="comment-avatar" style={{
                        backgroundImage: `url(${comment.author === (userInfo?.name || '사용자') ? 'src/assets/profile_a.png' : 'src/assets/pin_img.png'})`,
                      }} />
                      <div className="comment-info">
                        <span className="comment-author-name">{comment.author || '사용자'}</span>
                        <span className="comment-timestamp">{formatDate(comment.timestamp || comment.created_at || new Date().toISOString())}</span>
                      </div>
                      <div className="comment-menu-wrapper">
                        {historyItem.status === '질문생성완료' && (
                          <>
                            <button 
                              onClick={() => setOpenMenuCommentId(openMenuCommentId === comment.id ? null : comment.id)}
                              className="comment-menu-btn">⋮</button>
                            {openMenuCommentId === comment.id && (
                              <div className="comment-menu">
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="comment-delete-btn">삭제</button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                    
                    {/* Admin Feedback on Comment */}
                    {(comment.adminFeedback || comment.admin_feedback) && (
                      <div className="comment-admin-feedback-display">
                        <div className="admin-feedback-header">
                          <span className="admin-feedback-label">문장 정교화✨</span>
                        </div>
                        <p className="admin-feedback-text">
                          {typeof comment.adminFeedback === 'string' 
                            ? comment.adminFeedback 
                            : comment.adminFeedback?.text || comment.admin_feedback}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-answers-text">
                  답변이 없습니다.
                </p>
              )}
            </div>

            {/* Comment Input */}
            {historyItem.status === '질문생성완료' && (
              <div className="comment-input-group">
                <div className="comment-avatar-sender" />
                <input
                  type="text"
                  placeholder="답변을 입력하세요."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && clickedPinId && !isSubmitting) {
                      handleAddComment(clickedPinId)
                    }
                  }}
                  disabled={isSubmitting}
                  className="comment-input-field"
                />
                <button
                  onClick={() => clickedPinId && !isSubmitting && handleAddComment(clickedPinId)}
                  disabled={isSubmitting}
                  className="comment-send-btn">
                  {isSubmitting ? (
                    <>
                      <div className="comment-spinner" />
                    </>
                  ) : (
                    <img src="/assets/send.svg" alt="전송" />
                  )}
                </button>
              </div>
            )}


          </div>
        </div>
      )}

      {/* Work Area */}
      <WorkArea>
        <div className="design-detail-content">
          {/* Logo Header */}
          <LogoHeader />

          {/* Divider */}
          <div className="design-detail-divider"></div>

          {/* Back Button and Category */}
          <div className="design-detail-header">
            <button className="back-button" onClick={onBack}>
              <img src="/assets/btn_back.svg" alt="뒤로" />
            </button>
            <h2 className="design-category">{historyItem.category}</h2>
            {historyItem.status === '최종피드백완료' && historyItem.feedback && (
              <button 
                onClick={() => setShowFeedbackModal(true)}
                className="feedback-summary-button"
              >
                피드백 요약
              </button>
            )}
          </div>

          {/* Status Display */}
          <div className="status-display">
            <div className="status-steps">
              <div className={`status-step ${historyItem.status === '질문생성중' ? 'active' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-label">질문 생성중</div>
                <div className="step-date">{formatDate(historyItem.date)}</div>
              </div>
              <div className={`status-step ${historyItem.status === '질문생성완료' ? 'active' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-label">질문 생성 완료</div>
                {historyItem.questionCreatedAt && <div className="step-date">{formatDate(historyItem.questionCreatedAt)}</div>}
              </div>
              <div className={`status-step ${historyItem.status === '답변전송완료' ? 'active' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-label">답변 전송 완료</div>
                {historyItem.answerSubmittedAt && <div className="step-date">{formatDate(historyItem.answerSubmittedAt)}</div>}
              </div>
              <div className={`status-step ${historyItem.status === '최종피드백완료' ? 'active' : ''}`}>
                <div className="step-number">4</div>
                <div className="step-label">최종 피드백 완료</div>
                {historyItem.finalFeedbackCompletedAt && <div className="step-date">{formatDate(historyItem.finalFeedbackCompletedAt)}</div>}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="notes-section">
            <p className="notes-content">{historyItem.notes || '전달 한 내용이 없습니다.'}</p>
          </div>

          {/* Questions Section */}
          <div className="questions-section">
            <h3 className="notes-title" style={{ marginBottom: '10px' }}>질문 내역</h3>
            {questions.length === 0 ? (
              <div className="no-questions">
                <p className="no-questions-text">···질문 생성중입니다···</p>
                <p className="contact-text">
                  관련하여 문의가 있다면,{' '}
                  <a href="https://open.kakao.com/o/sv6VztYh" target="_blank" rel="noopener noreferrer" className="contact-link">
                    연구책임자
                  </a>
                  에게 문의해 주세요.
                </p>
              </div>
            ) : (
              questions.map((q) => (
                <div 
                  key={q.id} 
                  className="question-item" 
                  onClick={() => setClickedPinId(q.id)}
                  onMouseEnter={() => setHoveredPinId(q.id)}
                  onMouseLeave={() => setHoveredPinId(null)}
                  style={{
                    backgroundColor: hoveredPinId === q.id ? 'rgba(253, 137, 95, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    borderColor: hoveredPinId === q.id ? 'rgba(253, 137, 95, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div className="question-item-content">
                    <div className="question-item-avatar" />
                    <div className="question-item-text-wrapper">
                      <p className="question-text">Q. {q.text}</p>
                      {q.answer && <p className="answer-text">{q.answer}</p>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Status-based Fixed Button at bottom right */}
          {/* 2번 상태: 전송 버튼 (조건부 활성화) */}
          {historyItem.status === '질문생성완료' && (
            <div className="status-button-wrapper">
              <button
                onClick={handleSendAnswers}
                disabled={isSendingAnswers || !historyItem.pins?.every(pin => 
                  pin.comments && pin.comments.length > 0
                )}
                className={`status-button ${
                  historyItem.pins?.every(pin => 
                    pin.comments && pin.comments.length > 0
                  ) && !isSendingAnswers ? 'status-button-send' : ''
                }`}>
                {isSendingAnswers ? (
                  <>
                    <div className="spinner" />
                    전송중...
                  </>
                ) : (
                  '전송'
                )}
              </button>
            </div>
          )}

          {/* 3번 상태: 전송 완료 버튼 (비활성화) */}
          {historyItem.status === '답변전송완료' && (
            <div className="status-button-wrapper">
              <button
                disabled
                className="status-button">
                전송 완료
              </button>
            </div>
          )}

          {/* 4번 상태: 최종 완료 버튼 (비활성화) */}
          {historyItem.status === '최종피드백완료' && (
            <div className="status-button-wrapper">
              <button
                disabled
                className="status-button">
                최종 피드백 완료
              </button>
            </div>
          )}
        </div>
      </WorkArea>

      {/* Feedback Summary Modal */}
      {showFeedbackModal && historyItem.feedback && (
        <div className="feedback-modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="feedback-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="feedback-modal-header">
              <h3 className="feedback-modal-title">피드백 요약 📄</h3>
              <button 
                onClick={() => setShowFeedbackModal(false)}
                className="feedback-modal-close-btn"
              >
                ✕
              </button>
            </div>
            <div className="feedback-modal-body">
              <p className="feedback-modal-text">{historyItem.feedback}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
