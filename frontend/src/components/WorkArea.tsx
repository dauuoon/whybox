import { ReactNode } from 'react'
import '../styles/workArea.css'

interface WorkAreaProps {
  children: ReactNode
}

export default function WorkArea({ children }: WorkAreaProps) {
  return (
    <div className="work-area-overlay">
      <div className="work-area">
        {children}
      </div>
    </div>
  )
}
