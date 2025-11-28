import '../styles/imageHistory.css'
import WorkArea from './WorkArea'
import LogoHeader from './LogoHeader'
import DesignDetail from './DesignDetail'
import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../api/config'

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
}

interface HistoryItem {
  id: string
  imageUrl: string
  category: string
  date: string
  status: '질문생성중' | '질문생성완료' | '답변전송완료' | '최종피드백완료'
  notes?: string
  pins?: Pin[]
}

interface ImageHistoryProps {
  historyItems: HistoryItem[]
  onDeleteItem: (id: string) => void
  onBackToUpload: () => void
}

export default function ImageHistory({ onDeleteItem, onBackToUpload }: Omit<ImageHistoryProps, 'historyItems'>) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [backendItems, setBackendItems] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 백엔드에서 디자인 데이터 조회
  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        console.log('🔷 백엔드에서 디자인 조회 시작...')
        const response = await fetch(`${API_BASE_URL}/designs`)
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }
        const data = await response.json()
        console.log('✅ 백엔드 디자인 조회 완료:', data)
        setBackendItems(data)
      } catch (error) {
        console.error('❌ 백엔드 디자인 조회 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDesigns()

    // 2초마다 디자인 새로고침 (사용자의 답변 및 관리자의 질문 실시간 확인)
    const interval = setInterval(fetchDesigns, 2000)
    
    return () => clearInterval(interval)
  }, [])

  const handleDeleteItem = async (id: string) => {
    try {
      console.log('🔷 백엔드에 삭제 요청:', id)
      const response = await fetch(`${API_BASE_URL}/designs/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }
      console.log('✅ 백엔드 삭제 완료')
      
      // 로컬 state에서도 제거
      setBackendItems(backendItems.filter(item => item.id !== id))
      onDeleteItem(id)
      setOpenMenuId(null)
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('❌ 삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  const selectedItem = selectedItemId ? backendItems.find(item => item.id === selectedItemId) : null

  if (selectedItem) {
    return (
      <DesignDetail
        historyItem={selectedItem}
        onBack={() => setSelectedItemId(null)}
      />
    )
  }

  return (
    <WorkArea>
      {/* Logo Header */}
      <LogoHeader />

      {/* Divider */}
      <div className="image-history-divider"></div>

      <div className="image-history">

        <div className="history-list">
          {isLoading ? (
            <div className="history-empty">
              <p>데이터를 불러오는 중입니다...</p>
            </div>
          ) : backendItems.length === 0 ? (
            <div className="history-empty">
              <p>전송된 내역이 없습니다.</p>
            </div>
          ) : (
            backendItems.map((item) => (
              <div key={item.id} className="history-item" onClick={() => setSelectedItemId(item.id)}>
                <div className="item-thumbnail">
                  <img src={item.imageUrl} alt="썸네일" />
                </div>

                <div className="item-info">
                  <div className="info-status">
                    <span className={`status-badge status-${item.status}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="info-details">
                    <p className="info-category">{item.category}_{formatDate(item.date)}</p>
                  </div>
                </div>

                <div className="item-menu-wrapper" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="menu-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleMenu(item.id)
                    }}
                  >
                    ⋮
                  </button>

                  {openMenuId === item.id && (
                    <div className="menu-dropdown">
                      <button
                        className="menu-item delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirmId(item.id)
                          setOpenMenuId(null)
                        }}
                      >
                        삭제하기
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="history-fab-buttons">
          <button className="fab-button add active" onClick={onBackToUpload} title="이미지 추가">
            <img src="/assets/btn_add.svg" alt="추가" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-dialog">
            <h3 className="delete-confirm-title">정말 삭제하시겠습니까?</h3>
            
            <p className="delete-confirm-message">
              삭제된 내역은 복구할 수 없습니다.
            </p>

            <div className="delete-confirm-buttons">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="delete-confirm-button delete-confirm-button-cancel">
                취소
              </button>
              <button
                onClick={() => deleteConfirmId && handleDeleteItem(deleteConfirmId)}
                className="delete-confirm-button delete-confirm-button-delete">
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </WorkArea>
  )
}
