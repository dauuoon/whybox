import { useState } from 'react'
import '../styles/imagePreview.css'
import WorkArea from './WorkArea'
import LogoHeader from './LogoHeader'

interface DesignCategory {
  group: string
  items: string[]
}

const DESIGN_CATEGORIES: DesignCategory[] = [
  {
    group: 'UI/UX',
    items: [
      '웹 디자인',
      '모바일 및 앱 디자인',
      '시스템 디자인',
      '와이어프레임',
    ],
  },
  {
    group: 'Visual',
    items: [
      '브랜드 디자인(BI/CI)',
      '편집 디자인(인쇄물)',
      '포스터 디자인',
      '패키지 디자인',
      '콘텐츠 디자인',
      '제품 디자인',
    ],
  },
  {
    group: 'Illustration',
    items: ['일러스트레이션', '캐릭터 디자인', '패턴 디자인'],
  },
  {
    group: 'Video',
    items: [
      '영상 섬네일 디자인',
      '영상 그래픽 디자인',
      '모션 그래픽 디자인',
    ],
  },
  {
    group: 'Others',
    items: ['기타'],
  },
]

interface ImagePreviewProps {
  imageFile?: File
  onBack: () => void
  onNext: (selectedCategory: string) => void
}

export default function ImagePreview({
  imageFile,
  onBack,
  onNext,
}: ImagePreviewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const imageUrl = imageFile
    ? URL.createObjectURL(imageFile)
    : '/src/assets/placeholder.png'

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    setIsDropdownOpen(false)
  }

  const handleNext = () => {
    if (selectedCategory) {
      onNext(selectedCategory)
    }
  }

  const isNextDisabled = !selectedCategory

  return (
    <WorkArea>
      {/* Logo Header */}
      <LogoHeader />

      {/* Divider */}
      <div className="image-preview-divider"></div>

      <div className="image-preview">
        {/* Image Preview Section */}
        <div className="image-preview-container">
          <div className="image-preview-frame">
            <img
              src={imageUrl}
              alt="Preview"
              className="preview-image"
            />
          </div>
        </div>

        {/* Controls Section */}
        <div className="controls-section">
          {/* Left: Design Category Dropdown */}
          <div className="dropdown-wrapper">
            <div className="dropdown-container">
              <button
                className="dropdown-button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="dropdown-label">
                  {selectedCategory || '디자인 분류 선택'}
                </span>
                <span className="dropdown-arrow">▼</span>
              </button>

              {isDropdownOpen && (
                <div className="dropdown-menu">
                  {DESIGN_CATEGORIES.map((category) => (
                    <div key={category.group} className="dropdown-group">
                      <div className="dropdown-group-label">
                        [{category.group}]
                      </div>
                      {category.items.map((item) => (
                        <button
                          key={item}
                          className="dropdown-item"
                          onClick={() => handleCategorySelect(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Navigation Buttons */}
          <div className="buttons-section">
            <button className="nav-button prev-button" onClick={onBack}>
              이전
            </button>
            <button
              className={`nav-button next-button ${
                isNextDisabled ? 'disabled' : ''
              }`}
              onClick={handleNext}
              disabled={isNextDisabled}
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </WorkArea>
  )
}
