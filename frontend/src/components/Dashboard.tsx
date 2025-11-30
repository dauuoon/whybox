import '../styles/dashboard.css'
import WorkArea from './WorkArea'
import LogoHeader from './LogoHeader'
import ImagePreview from './ImagePreview'
import DesignNotes from './DesignNotes'
import ImageHistory from './ImageHistory'
import Toast from './Toast'
import { API_BASE_URL } from '../api/config'
import { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

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
    adminReply?: {
      id: string
      text: string
      timestamp: string
    }
  }>
}

interface HistoryItem {
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
}

type Page = 'upload' | 'preview' | 'notes' | 'history'

export default function Dashboard() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { userInfo } = useAuth()
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<Page>('upload')
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        setUploadedFile(file)
        setCurrentPage('preview')
      }
    })
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      handleFiles(files)
    }
  }

  const handleBackFromPreview = () => {
    setUploadedFile(null)
    setCurrentPage('upload')
  }

  const handleNextFromPreview = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage('notes')
  }

  const handleBackFromNotes = () => {
    setCurrentPage('preview')
  }

  const handleSubmitNotes = async (notes: string) => {
    console.log('🔷 handleSubmitNotes 시작', { uploadedFile, selectedCategory, notes })
    
    if (uploadedFile && selectedCategory) {
      try {
        // 이미지를 Base64로 변환
        const reader = new FileReader()
        reader.onload = async (e) => {
          console.log('🔷 FileReader onload 실행됨')
          const imageBase64 = e.target?.result as string
          
          // 현재 날짜 생성
          const today = new Date()
          const dateString = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`
          
          // 새로운 히스토리 항목 생성
          const newItem: HistoryItem = {
            id: Date.now().toString(),
            imageUrl: imageBase64, // Base64 인코딩된 이미지
            category: selectedCategory,
            date: dateString,
            status: '질문생성중',
            notes: notes,
            pins: [],
          }
          
          console.log('🔷 API 요청 시작', { API_BASE_URL, newItem })
          
          // 백엔드 API에 POST 요청 (사용자 정보 포함)
          try {
            const response = await fetch(`${API_BASE_URL}/designs`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...newItem,
                userName: userInfo?.name || '사용자',
                userId: userInfo?.id || 'unknown'
              })
            })
            console.log('🔷 API 응답 받음:', response)
            if (!response.ok) {
              throw new Error(`API Error: ${response.status}`)
            }
            const savedItem = await response.json()
            newItem.id = savedItem.id // 서버에서 생성된 ID로 업데이트
            console.log('✅ 서버 저장 완료:', savedItem)
            
            // 토스트 알림 띄우기 (성공)
            setToastMessage('이미지 전송 완료!')
            setShowToast(true)
            setTimeout(() => setShowToast(false), 2000)
          } catch (error) {
            console.error('❌ 디자인 저장 실패:', error)
            // 토스트 알림 띄우기 (실패)
            setToastMessage('이미지 전송 실패!')
            setShowToast(true)
            setTimeout(() => setShowToast(false), 2000)
          }
          
          // 히스토리에 추가
          setHistoryItems([newItem, ...historyItems])
          
          // 상태 초기화 후 히스토리 페이지로 이동
          setUploadedFile(null)
          setSelectedCategory('')
          setCurrentPage('history')
          
          console.log('✅ 전달 사항:', notes)
          console.log('✅ 선택된 카테고리:', selectedCategory)
        }
        reader.readAsDataURL(uploadedFile)
      } catch (error) {
        console.error('Failed to submit notes:', error)
      }
    } else {
      console.log('🔴 uploadedFile 또는 selectedCategory가 없음', { uploadedFile, selectedCategory })
    }
  }

  const handleBackToUpload = () => {
    setUploadedFile(null)
    setSelectedCategory('')
    setCurrentPage('upload')
  }

  const handleGoToHistory = () => {
    setCurrentPage('history')
  }

  if (currentPage === 'preview' && uploadedFile) {
    return (
      <ImagePreview
        imageFile={uploadedFile}
        onBack={handleBackFromPreview}
        onNext={handleNextFromPreview}
      />
    )
  }

  if (currentPage === 'notes') {
    return (
      <DesignNotes
        onBack={handleBackFromNotes}
        onSubmit={handleSubmitNotes}
      />
    )
  }

  if (currentPage === 'history') {
    return (
      <ImageHistory
        onDeleteItem={(id) => setHistoryItems(historyItems.filter(item => item.id !== id))}
        onBackToUpload={handleBackToUpload}
      />
    )
  }

  return (
    <WorkArea>
      {/* Logo Header */}
      <LogoHeader />

      {/* Divider */}
      <div className="dashboard-divider"></div>

      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">디자인 이미지 업로드</h1>
        </div>

        <div 
          className={`dashboard-upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="upload-icon">
            <img src="/assets/image.png" alt="업로드 아이콘" />
          </div>
          <p className="upload-text">이미지를 드래그하거나 클릭하여 업로드하세요.</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        <div className="dashboard-fab-buttons">
          <button className="fab-button list" onClick={handleGoToHistory} title="전송 내역">
            <img src="/assets/btn_list.svg" alt="내역" />
          </button>
        </div>
      </div>
      {showToast && <Toast message={toastMessage} />}
    </WorkArea>
  )
}
