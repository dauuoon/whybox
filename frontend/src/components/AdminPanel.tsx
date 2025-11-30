import '../styles/adminPanel.css'
import LogoHeader from './LogoHeader'
import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../api/config'

interface Pin {
  id: string
  x: number
  y: number
  text: string
  comments?: Array<{
    id: string
    author: string
    text: string
    timestamp: string
    adminFeedback?: {
      text: string
      timestamp: string
    }
  }>
}

interface Design {
  id: string
  imageUrl: string
  category: string
  date: string
  status: '질문생성중' | '질문생성완료' | '답변전송완료' | '최종피드백완료'
  notes?: string
  feedback?: string
  pins?: Pin[]
  createdAt?: string
  userName?: string
  userId?: string
  questionCreatedAt?: string
  answerSubmittedAt?: string
  finalFeedbackCompletedAt?: string
}

interface AdminPanelProps {
  onLogout: () => void
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [designs, setDesigns] = useState<Design[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null)
  const [newPinText, setNewPinText] = useState('')
  const [newPinX, setNewPinX] = useState(50)
  const [newPinY, setNewPinY] = useState(50)
  const [showPinForm, setShowPinForm] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [commentFeedbacks, setCommentFeedbacks] = useState<Record<string, string>>({}) // commentId -> feedbackText
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null) // 편집 중인 comment ID
  
  // 계정 관리 상태
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [accountTab, setAccountTab] = useState<'admin' | 'user'>('admin') // 관리자/사용자 탭
  const [admins, setAdmins] = useState<Array<{id: string, username: string, email: string, createdAt: string}>>([])
  const [users, setUsers] = useState<Array<{id: string, username: string, name: string, experience: string, jobTitle: string, createdAt: string}>>([])
  const [newAdminUsername, setNewAdminUsername] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newUserUsername, setNewUserUsername] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserExperience, setNewUserExperience] = useState('')
  const [newUserJobTitle, setNewUserJobTitle] = useState('')
  
  // 계정 수정 관련 상태
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [editingAccountType, setEditingAccountType] = useState<'admin' | 'user' | null>(null)
  const [editAdminUsername, setEditAdminUsername] = useState('')
  const [editAdminPassword, setEditAdminPassword] = useState('')
  const [editAdminEmail, setEditAdminEmail] = useState('')
  const [editUserUsername, setEditUserUsername] = useState('')
  const [editUserPassword, setEditUserPassword] = useState('')
  const [editUserName, setEditUserName] = useState('')
  const [editUserExperience, setEditUserExperience] = useState('')
  const [editUserJobTitle, setEditUserJobTitle] = useState('')

  // 백엔드에서 디자인 조회
  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        console.log('🔷 관리자: 모든 디자인 조회 시작...')
        const response = await fetch(`${API_BASE_URL}/designs`)
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }
        const newData = await response.json()
        console.log('✅ 관리자: 모든 디자인 조회 완료:', newData)
        
        // 현재 선택된 디자인이 있으면, 새로고침된 데이터에서 로컬 수정사항 병합
        setDesigns(prevDesigns => {
          const mergedData = newData.map((newDesign: any) => {
            // 현재 선택된 디자인이면 로컬 상태 유지
            if (selectedDesignId === newDesign.id) {
              const prevDesign = prevDesigns.find(d => d.id === newDesign.id)
              if (prevDesign && prevDesign.pins) {
                // 기존 로컬 상태 유지 (피드백 등)
                return prevDesign
              }
            }
            return newDesign
          })
          return mergedData
        })
      } catch (error) {
        console.error('❌ 디자인 조회 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDesigns()

    // 10초마다 디자인 새로고침 (사용자의 답변 실시간 확인)
    const interval = setInterval(fetchDesigns, 10000)
    
    return () => clearInterval(interval)
  }, [selectedDesignId])

  // 계정 목록 조회
  const fetchAccounts = async () => {
    try {
      const adminRes = await fetch(`${API_BASE_URL}/admins`)
      const adminData = await adminRes.json()
      setAdmins(adminData)
      
      const userRes = await fetch(`${API_BASE_URL}/users`)
      const userData = await userRes.json()
      // jobtitle을 jobTitle로 변환
      const transformedUsers = userData.map((user: any) => ({
        ...user,
        jobTitle: user.jobtitle || user.jobTitle || ''
      }))
      setUsers(transformedUsers)
    } catch (error) {
      console.error('❌ 계정 조회 실패:', error)
    }
  }

  const selectedDesign = selectedDesignId ? designs.find(d => d.id === selectedDesignId) : null

  // 특정 설계만 새로고침
  const refreshSingleDesign = async (designId: string | number) => {
    try {
      console.log('🔷 관리자: 특정 디자인 새로고침:', designId)
      const response = await fetch(`${API_BASE_URL}/designs`)
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }
      const allDesigns = await response.json()
      const updatedDesign = allDesigns.find((d: any) => d.id === designId || d.id === parseInt(designId as string))
      if (updatedDesign) {
        setDesigns(prevDesigns => 
          prevDesigns.map(d => d.id === updatedDesign.id ? updatedDesign : d)
        )
        console.log('✅ 특정 디자인 새로고침 완료')
      }
    } catch (error) {
      console.error('❌ 디자인 새로고침 실패:', error)
    }
  }

  // 이미지 클릭으로 핀 위치 선택
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const rect = img.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setNewPinX(Math.round(x))
    setNewPinY(Math.round(y))
    setShowPinForm(true)
    setNewPinText('')
  }

  // 핀 추가
  const handleAddPin = async () => {
    if (!newPinText.trim() || !selectedDesignId) {
      alert('질문을 입력하세요.')
      return
    }

    try {
      console.log('📍 관리자: 핀 추가 요청', { designId: selectedDesignId, text: newPinText })
      const response = await fetch(`${API_BASE_URL}/designs/${selectedDesignId}/pins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x: newPinX,
          y: newPinY,
          text: newPinText
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const newPin = await response.json()
      console.log('✅ 관리자: 핀 추가 완료:', newPin)

      // 특정 설계만 새로고침
      await refreshSingleDesign(selectedDesignId)

      // 입력값 초기화
      setNewPinText('')
      setNewPinX(50)
      setNewPinY(50)
      setShowPinForm(false)
    } catch (error) {
      console.error('❌ 핀 추가 실패:', error)
      alert('핀 추가에 실패했습니다.')
    }
  }

  // 질문 생성 완료 (상태 변경: 질문생성중 → 질문생성완료)
  const handleCompleteQuestions = async () => {
    if (!selectedDesignId) return

    try {
      console.log('📍 관리자: 상태 변경 요청 (질문생성완료)')
      const response = await fetch(`${API_BASE_URL}/designs/${selectedDesignId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: '질문생성완료' })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const updatedDesign = await response.json()
      console.log('✅ 관리자: 상태 변경 완료:', updatedDesign)

      // 로컬 state 업데이트
      const updatedDesigns = designs.map(d => {
        if (d.id === selectedDesignId) {
          d.status = '질문생성완료'
        }
        return d
      })
      setDesigns(updatedDesigns)
      alert('질문 생성이 완료되었습니다. 사용자가 이제 답변을 입력할 수 있습니다.')
    } catch (error) {
      console.error('❌ 상태 변경 실패:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  // 상태 직접 변경
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedDesignId) return

    try {
      console.log('📍 관리자: 상태 변경 요청:', newStatus)
      
      // 상태에 따라 날짜 필드 추가
      const payload: any = { status: newStatus }
      const now = new Date()
      const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
      
      if (newStatus === '질문생성완료') {
        payload.questionCreatedAt = dateStr
      } else if (newStatus === '답변전송완료') {
        payload.answerSubmittedAt = dateStr
      } else if (newStatus === '최종피드백완료') {
        payload.finalFeedbackCompletedAt = dateStr
      }
      
      const response = await fetch(`${API_BASE_URL}/designs/${selectedDesignId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const updatedDesign = await response.json()
      console.log('✅ 관리자: 상태 변경 완료:', updatedDesign)

      // 로컬 state 업데이트
      const updatedDesigns = designs.map(d => {
        if (d.id === selectedDesignId) {
          d.status = newStatus as any
          if (newStatus === '질문생성완료') {
            d.questionCreatedAt = dateStr
          } else if (newStatus === '답변전송완료') {
            d.answerSubmittedAt = dateStr
          } else if (newStatus === '최종피드백완료') {
            d.finalFeedbackCompletedAt = dateStr
          }
        }
        return d
      })
      setDesigns(updatedDesigns)
    } catch (error) {
      console.error('❌ 상태 변경 실패:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  // 최종 피드백 제출
  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || !selectedDesignId) {
      alert('피드백을 입력하세요.')
      return
    }

    try {
      console.log('📝 최종 피드백 제출:', { designId: selectedDesignId, feedback: feedbackText })
      
      // 현재 날짜 기록
      const now = new Date()
      const finalFeedbackCompletedAt = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
      
      // 최종 피드백 저장 (backend의 feedback 필드에 저장)
      const response = await fetch(`${API_BASE_URL}/designs/${selectedDesignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          feedback: feedbackText,
          status: '최종피드백완료',
          finalFeedbackCompletedAt: finalFeedbackCompletedAt
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const updatedDesign = await response.json()
      console.log('✅ 최종 피드백 저장 완료:', updatedDesign)

      // 로컬 state 업데이트
      const updatedDesigns = designs.map(d => {
        if (d.id === selectedDesignId) {
          d.status = '최종피드백완료'
          d.finalFeedbackCompletedAt = finalFeedbackCompletedAt
        }
        return d
      })
      setDesigns(updatedDesigns)

      // 폼 초기화
      setFeedbackText('')
      setShowFeedbackForm(false)
      alert('최종 피드백이 전송되었습니다.')
    } catch (error) {
      console.error('❌ 최종 피드백 제출 실패:', error)
      alert('최종 피드백 제출에 실패했습니다.')
    }
  }

  // 핀 삭제
  const handleDeletePin = async (pinId: string) => {
    if (!selectedDesignId) return

    try {
      console.log('📍 관리자: 핀 삭제 요청')
      const response = await fetch(`${API_BASE_URL}/designs/${selectedDesignId}/pins/${pinId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      console.log('✅ 관리자: 핀 삭제 완료')

      // 로컬 state 업데이트
      const updatedDesigns = designs.map(d => {
        if (d.id === selectedDesignId && d.pins) {
          d.pins = d.pins.filter(p => p.id !== pinId)
        }
        return d
      })
      setDesigns(updatedDesigns)
    } catch (error) {
      console.error('❌ 핀 삭제 실패:', error)
      alert('핀 삭제에 실패했습니다.')
    }
  }

  // 각 답변(comment)에 대한 피드백 제출
  const handleSubmitCommentFeedback = async (pinId: string, commentId: string, feedbackText: string) => {
    if (!selectedDesignId || !feedbackText.trim()) {
      alert('피드백을 입력하세요.')
      return
    }

    try {
      console.log('📝 댓글 피드백 제출:', { designId: selectedDesignId, pinId, commentId, feedbackText })
      
      const response = await fetch(
        `${API_BASE_URL}/designs/${selectedDesignId}/pins/${pinId}/comments/${commentId}/feedback`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedbackText })
        }
      )

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const updatedComment = await response.json()
      console.log('✅ 댓글 피드백 저장 완료:', updatedComment)

      // 로컬 state 업데이트
      const updatedDesigns = designs.map(d => {
        if (d.id === selectedDesignId && d.pins) {
          return {
            ...d,
            pins: d.pins.map(p => {
              if (p.id === pinId && p.comments) {
                return {
                  ...p,
                  comments: p.comments.map(c =>
                    c.id === commentId
                      ? { ...c, adminFeedback: { text: feedbackText, timestamp: new Date().toISOString() } }
                      : c
                  )
                }
              }
              return p
            })
          }
        }
        return d
      })
      setDesigns(updatedDesigns)
      setCommentFeedbacks(prev => ({ ...prev, [commentId]: '' }))
      setEditingCommentId(null)
    } catch (error) {
      console.error('❌ 댓글 피드백 저장 실패:', error)
      alert('피드백 저장에 실패했습니다.')
    }
  }

  // 관리자 계정 생성
  const handleCreateAdmin = async () => {
    if (!newAdminUsername || !newAdminPassword || !newAdminEmail) {
      alert('모든 필드를 입력하세요.')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newAdminUsername, password: newAdminPassword, email: newAdminEmail })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '계정 생성 실패')
      }

      alert('관리자 계정이 생성되었습니다.')
      setNewAdminUsername('')
      setNewAdminPassword('')
      setNewAdminEmail('')
      await fetchAccounts()
    } catch (error) {
      console.error('❌ 관리자 계정 생성 실패:', error)
      alert('계정 생성에 실패했습니다: ' + (error as Error).message)
    }
  }

  // 사용자 계정 생성
  const handleCreateUser = async () => {
    if (!newUserUsername || !newUserPassword || !newUserName || !newUserExperience || !newUserJobTitle) {
      alert('모든 필드를 입력하세요.')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: newUserUsername, 
          password: newUserPassword, 
          name: newUserName,
          experience: newUserExperience,
          jobTitle: newUserJobTitle
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '계정 생성 실패')
      }

      alert('사용자 계정이 생성되었습니다.')
      setNewUserUsername('')
      setNewUserPassword('')
      setNewUserName('')
      setNewUserExperience('')
      setNewUserJobTitle('')
      await fetchAccounts()
    } catch (error) {
      console.error('❌ 사용자 계정 생성 실패:', error)
      alert('계정 생성에 실패했습니다: ' + (error as Error).message)
    }
  }

  // 관리자 계정 삭제
  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/admins/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('계정 삭제 실패')
      }

      alert('관리자 계정이 삭제되었습니다.')
      await fetchAccounts()
    } catch (error) {
      console.error('❌ 관리자 계정 삭제 실패:', error)
      alert('계정 삭제에 실패했습니다.')
    }
  }

  // 사용자 계정 삭제
  const handleDeleteUser = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('계정 삭제 실패')
      }

      alert('사용자 계정이 삭제되었습니다.')
      await fetchAccounts()
    } catch (error) {
      console.error('❌ 사용자 계정 삭제 실패:', error)
      alert('계정 삭제에 실패했습니다.')
    }
  }

  // 관리자 계정 수정 시작
  const handleStartEditAdmin = (admin: any) => {
    setEditingAccountId(admin.id)
    setEditingAccountType('admin')
    setEditAdminUsername(admin.username)
    setEditAdminPassword('')
    setEditAdminEmail(admin.email)
  }

  // 관리자 계정 수정 저장
  const handleSaveEditAdmin = async () => {
    if (!editingAccountId) return

    try {
      const response = await fetch(`${API_BASE_URL}/admins/${editingAccountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editAdminUsername,
          password: editAdminPassword || undefined,
          email: editAdminEmail
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '계정 수정 실패')
      }

      alert('관리자 계정이 수정되었습니다.')
      setEditingAccountId(null)
      setEditingAccountType(null)
      await fetchAccounts()
    } catch (error) {
      console.error('❌ 관리자 계정 수정 실패:', error)
      alert('계정 수정에 실패했습니다: ' + (error as Error).message)
    }
  }

  // 사용자 계정 수정 시작
  const handleStartEditUser = (user: any) => {
    setEditingAccountId(user.id)
    setEditingAccountType('user')
    setEditUserUsername(user.username)
    setEditUserPassword('')
    setEditUserName(user.name)
    setEditUserExperience(user.experience)
    setEditUserJobTitle(user.jobTitle)
  }

  // 사용자 계정 수정 저장
  const handleSaveEditUser = async () => {
    if (!editingAccountId) return

    try {
      const response = await fetch(`${API_BASE_URL}/users/${editingAccountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editUserUsername,
          password: editUserPassword || undefined,
          name: editUserName,
          experience: editUserExperience,
          jobTitle: editUserJobTitle
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '계정 수정 실패')
      }

      alert('사용자 계정이 수정되었습니다.')
      setEditingAccountId(null)
      setEditingAccountType(null)
      await fetchAccounts()
    } catch (error) {
      console.error('❌ 사용자 계정 수정 실패:', error)
      alert('계정 수정에 실패했습니다: ' + (error as Error).message)
    }
  }

  // 수정 취소
  const handleCancelEdit = () => {
    setEditingAccountId(null)
    setEditingAccountType(null)
  }

  return (
    <div className="admin-panel-container">
      {/* Logo Header */}
      <LogoHeader />

      {/* Divider */}
      <div className="admin-divider"></div>

      <div className="admin-panel">
        <div className="admin-header">
          <h1>관리자 패널</h1>
          <div className="admin-header-buttons">
            <button 
              onClick={() => {
                setShowAccountModal(true)
                fetchAccounts()
              }}
              className="account-management-button"
            >
              계정 관리
            </button>
            <button onClick={onLogout} className="logout-button">로그아웃</button>
          </div>
        </div>

        <div className="admin-content">
          {/* 왼쪽: 디자인 목록 */}
          <div className="admin-list">
            <h2>디자인 목록</h2>
            {isLoading ? (
              <p>로딩 중...</p>
            ) : designs.length === 0 ? (
              <p>디자인이 없습니다.</p>
            ) : (
              <div className="design-list">
                {designs.map((design) => (
                  <div
                    key={design.id}
                    className={`design-item ${selectedDesignId === design.id ? 'selected' : ''}`}
                    onClick={() => setSelectedDesignId(design.id)}
                  >
                    <div className="design-item-thumbnail">
                      <img src={design.imageUrl} alt="썸네일" />
                    </div>
                  <div className="design-item-info">
                    <p className="design-item-user">{design.userName} ({design.userId})</p>
                    <p className="design-item-category">{design.category}</p>
                    <p className="design-item-date">{design.date}</p>
                    <span className={`design-item-status status-${design.status}`}>
                      {design.status}
                    </span>
                  </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 오른쪽: 디자인 상세 + 핀 관리 */}
          {selectedDesign ? (
            <div className="admin-detail">
              <div className="design-header-info">
                <h2>{selectedDesign.userName} - {selectedDesign.category}</h2>
                <p className="design-date">{selectedDesign.date}</p>
                <p className="design-notes"><strong>전달사항:</strong> {selectedDesign.notes || '없음'}</p>
                <div className="status-control">
                  <label className="status-label">상태:</label>
                  <select 
                    value={selectedDesign.status}
                    onChange={(e) => handleStatusChange(e.target.value as any)}
                    className="status-select"
                  >
                    <option value="질문생성중">1. 질문생성중</option>
                    <option value="질문생성완료">2. 질문생성완료</option>
                    <option value="답변전송완료">3. 답변전송완료</option>
                    <option value="최종피드백완료">4. 최종피드백완료</option>
                  </select>
                </div>
              </div>

              <div className="design-detail-image-wrapper">
                <img 
                  src={selectedDesign.imageUrl} 
                  alt="디자인" 
                  className="design-detail-image"
                  onClick={handleImageClick}
                  style={{ cursor: 'crosshair' }}
                  title="클릭해서 질문 위치를 선택하세요"
                />
              </div>

              <div className="admin-pins-section">
                <h3>질문 관리</h3>
                <p className="pin-instruction">
                  💡 팁: 이미지를 클릭하면 그 위치에 자동으로 질문이 달립니다
                </p>

                {/* 새 핀 추가 */}
                {showPinForm && (
                  <div className="add-pin-form active">
                    <div className="pin-form-header">
                      <h4>새 질문 추가</h4>
                      <button 
                        className="form-close-button"
                        onClick={() => setShowPinForm(false)}
                      >
                        ✕
                      </button>
                    </div>
                    <p className="pin-location-info">
                      위치: <span className="coord">{newPinX}%</span> × <span className="coord">{newPinY}%</span>
                    </p>
                    <textarea
                      placeholder="질문을 입력하세요"
                      value={newPinText}
                      onChange={(e) => setNewPinText(e.target.value)}
                      className="pin-text-input-new"
                      rows={3}
                    />
                    <div className="pin-form-buttons">
                      <button onClick={handleAddPin} className="add-pin-button">
                        질문 추가
                      </button>
                      <button 
                        onClick={() => setShowPinForm(false)} 
                        className="cancel-button"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {/* 기존 핀 목록 */}
                <div className="pins-list">
                  {selectedDesign.pins && selectedDesign.pins.length > 0 ? (
                    selectedDesign.pins.map((pin) => (
                      <div key={pin.id} className="pin-item">
                        <div className="pin-header">
                          <span className="pin-position">({pin.x}%, {pin.y}%)</span>
                          <button
                            onClick={() => handleDeletePin(pin.id)}
                            className="pin-delete-button"
                          >
                            삭제
                          </button>
                        </div>
                        <p className="pin-text">Q. {pin.text}</p>

                        {/* 댓글 */}
                        <div className="pin-comments">
                          {pin.comments && pin.comments.length > 0 ? (
                            pin.comments.map((comment) => (
                              <div key={comment.id} className="comment-item">
                                <p className="comment-author">{comment.author}</p>
                                <p className="comment-text">A. {comment.text}</p>
                                <p className="comment-time">{comment.timestamp}</p>
                                
                                {/* 기존 관리자 피드백 표시 */}
                                {comment.adminFeedback && (
                                  <div className="comment-admin-feedback">
                                    <div className="admin-feedback-header">
                                      <span className="admin-feedback-label">댓글 피드백</span>
                                      <span className="admin-feedback-time">{comment.adminFeedback.timestamp}</span>
                                    </div>
                                    <p className="admin-feedback-text">{comment.adminFeedback.text}</p>
                                    <button
                                      onClick={() => setEditingCommentId(editingCommentId === comment.id ? null : comment.id)}
                                      className="comment-edit-feedback-btn"
                                    >
                                      수정
                                    </button>
                                  </div>
                                )}
                                
                                {/* 피드백 입력 폼 - 편집 중일 때 또는 피드백이 없을 때 */}
                                {(editingCommentId === comment.id || !comment.adminFeedback) && (
                                  <div className="comment-feedback-form">
                                    <textarea
                                      placeholder="이 답변에 대한 피드백을 입력하세요"
                                      value={commentFeedbacks[comment.id] || ''}
                                      onChange={(e) => setCommentFeedbacks(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                      className="comment-feedback-input"
                                      rows={2}
                                    />
                                    <div className="comment-feedback-buttons">
                                      <button
                                        onClick={() => handleSubmitCommentFeedback(pin.id, comment.id, commentFeedbacks[comment.id])}
                                        className="comment-feedback-submit-btn"
                                      >
                                        피드백 저장
                                      </button>
                                      {comment.adminFeedback && (
                                        <button
                                          onClick={() => setEditingCommentId(null)}
                                          className="comment-feedback-cancel-btn"
                                        >
                                          취소
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="no-comments">아직 답변이 없습니다.</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-pins">질문이 없습니다. 위에서 추가하세요.</p>
                  )}
                </div>

                {/* 최종 피드백 섹션 (3번, 4번 상태 모두에서 입력/수정 가능) */}
                {(selectedDesign.status === '답변전송완료' || selectedDesign.status === '최종피드백완료') && (
                  <div className="feedback-section">
                    <div className="feedback-divider"></div>
                    <h4>최종 피드백</h4>
                    
                    {showFeedbackForm ? (
                      <div className="feedback-form">
                        <textarea
                          placeholder="최종 피드백을 입력하세요"
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          className="feedback-input"
                          rows={4}
                        />
                        <div className="feedback-buttons">
                          <button 
                            onClick={handleSubmitFeedback}
                            className="feedback-submit-button"
                          >
                            {selectedDesign.status === '최종피드백완료' ? '피드백 수정' : '피드백 전송 (상태 4번으로 변경)'}
                          </button>
                          <button 
                            onClick={() => {
                              setShowFeedbackForm(false)
                              setFeedbackText('')
                            }}
                            className="feedback-cancel-button"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {selectedDesign.feedback && (
                          <div className="final-feedback-display">
                            <p className="final-feedback-text">{selectedDesign.feedback}</p>
                          </div>
                        )}
                        <button 
                          onClick={() => {
                            setFeedbackText(selectedDesign.feedback || '')
                            setShowFeedbackForm(true)
                          }}
                          className="feedback-start-button"
                        >
                          {selectedDesign.feedback ? '피드백 수정' : '최종 피드백 작성'}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* 질문 생성 완료 버튼 */}
                {selectedDesign.status === '질문생성중' && selectedDesign.pins && selectedDesign.pins.length > 0 && (
                  <div className="complete-button-wrapper">
                    <button 
                      onClick={handleCompleteQuestions}
                      className="complete-questions-button"
                    >
                      질문 생성 완료
                    </button>
                    <p className="button-hint">클릭하면 사용자가 답변을 입력할 수 있습니다</p>
                  </div>
                )}

                {/* 상태 표시 */}
                {selectedDesign.status === '질문생성완료' && (
                  <div className="status-badge completed">
                    ✓ 사용자가 답변을 입력 중입니다
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="admin-empty">
              <p>왼쪽 목록에서 디자인을 선택하세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* 계정 관리 모달 */}
      {showAccountModal && (
        <div className="account-modal-overlay">
          <div className="account-modal-content">
            <div className="account-modal-header">
              <h2>계정 관리</h2>
              <button 
                className="account-modal-close"
                onClick={() => setShowAccountModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="account-tabs">
              <button 
                className={`account-tab ${accountTab === 'admin' ? 'active' : ''}`}
                onClick={() => setAccountTab('admin')}
              >
                관리자 계정
              </button>
              <button 
                className={`account-tab ${accountTab === 'user' ? 'active' : ''}`}
                onClick={() => setAccountTab('user')}
              >
                사용자 계정
              </button>
            </div>

            <div className="account-modal-body">
              {accountTab === 'admin' ? (
                <>
                  <div className="account-form">
                    <h3>새 관리자 계정 생성</h3>
                    <input
                      type="text"
                      placeholder="아이디"
                      value={newAdminUsername}
                      onChange={(e) => setNewAdminUsername(e.target.value)}
                      className="account-input"
                    />
                    <input
                      type="password"
                      placeholder="비밀번호"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="account-input"
                    />
                    <input
                      type="email"
                      placeholder="이메일"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="account-input"
                    />
                    <button 
                      onClick={handleCreateAdmin}
                      className="account-create-button"
                    >
                      관리자 계정 생성
                    </button>
                  </div>

                  <div className="account-list">
                    <h3>관리자 목록 ({admins.length})</h3>
                    {admins.map(admin => (
                      <div key={admin.id} className="account-item">
                        {editingAccountId === admin.id && editingAccountType === 'admin' ? (
                          <div className="account-edit-form">
                            <input
                              type="text"
                              placeholder="아이디"
                              value={editAdminUsername}
                              onChange={(e) => setEditAdminUsername(e.target.value)}
                              className="account-input"
                            />
                            <input
                              type="password"
                              placeholder="새 비밀번호 (선택)"
                              value={editAdminPassword}
                              onChange={(e) => setEditAdminPassword(e.target.value)}
                              className="account-input"
                            />
                            <input
                              type="email"
                              placeholder="이메일"
                              value={editAdminEmail}
                              onChange={(e) => setEditAdminEmail(e.target.value)}
                              className="account-input"
                            />
                            <div className="account-button-group">
                              <button 
                                onClick={handleSaveEditAdmin}
                                className="account-save-button"
                              >
                                저장
                              </button>
                              <button 
                                onClick={handleCancelEdit}
                                className="account-cancel-button"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="account-info">
                              <p className="account-username">{admin.username}</p>
                              <p className="account-email">{admin.email}</p>
                            </div>
                            <div className="account-button-group">
                              <button 
                                onClick={() => handleStartEditAdmin(admin)}
                                className="account-edit-button"
                              >
                                수정
                              </button>
                              <button 
                                onClick={() => handleDeleteAdmin(admin.id)}
                                className="account-delete-button"
                              >
                                삭제
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="account-form">
                    <h3>새 사용자 계정 생성</h3>
                    <input
                      type="text"
                      placeholder="아이디"
                      value={newUserUsername}
                      onChange={(e) => setNewUserUsername(e.target.value)}
                      className="account-input"
                    />
                    <input
                      type="password"
                      placeholder="비밀번호"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="account-input"
                    />
                    <input
                      type="text"
                      placeholder="이름"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="account-input"
                    />
                    <input
                      type="text"
                      placeholder="직무경력"
                      value={newUserExperience}
                      onChange={(e) => setNewUserExperience(e.target.value)}
                      className="account-input"
                    />
                    <input
                      type="text"
                      placeholder="주요직무"
                      value={newUserJobTitle}
                      onChange={(e) => setNewUserJobTitle(e.target.value)}
                      className="account-input"
                    />
                    <button 
                      onClick={handleCreateUser}
                      className="account-create-button"
                    >
                      사용자 계정 생성
                    </button>
                  </div>

                  <div className="account-list">
                    <h3>사용자 목록 ({users.length})</h3>
                    {users.map(user => (
                      <div key={user.id} className="account-item">
                        {editingAccountId === user.id && editingAccountType === 'user' ? (
                          <div className="account-edit-form">
                            <input
                              type="text"
                              placeholder="아이디"
                              value={editUserUsername}
                              onChange={(e) => setEditUserUsername(e.target.value)}
                              className="account-input"
                            />
                            <input
                              type="password"
                              placeholder="새 비밀번호 (선택)"
                              value={editUserPassword}
                              onChange={(e) => setEditUserPassword(e.target.value)}
                              className="account-input"
                            />
                            <input
                              type="text"
                              placeholder="이름"
                              value={editUserName}
                              onChange={(e) => setEditUserName(e.target.value)}
                              className="account-input"
                            />
                            <input
                              type="text"
                              placeholder="직무경력"
                              value={editUserExperience}
                              onChange={(e) => setEditUserExperience(e.target.value)}
                              className="account-input"
                            />
                            <input
                              type="text"
                              placeholder="주요직무"
                              value={editUserJobTitle}
                              onChange={(e) => setEditUserJobTitle(e.target.value)}
                              className="account-input"
                            />
                            <div className="account-button-group">
                              <button 
                                onClick={handleSaveEditUser}
                                className="account-save-button"
                              >
                                저장
                              </button>
                              <button 
                                onClick={handleCancelEdit}
                                className="account-cancel-button"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="account-info">
                              <p className="account-username">{user.username}</p>
                              <p className="account-detail">이름: {user.name}</p>
                              <p className="account-detail">직무경력: {user.experience}</p>
                              <p className="account-detail">주요직무: {user.jobTitle}</p>
                            </div>
                            <div className="account-button-group">
                              <button 
                                onClick={() => handleStartEditUser(user)}
                                className="account-edit-button"
                              >
                                수정
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="account-delete-button"
                              >
                                삭제
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
