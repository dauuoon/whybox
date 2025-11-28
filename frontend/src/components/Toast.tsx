import { useEffect, useState } from 'react'
import '../styles/toast.css'

interface ToastProps {
  message: string
}

export default function Toast({ message }: ToastProps) {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`toast ${isClosing ? 'toast-exit' : ''}`}>
      <p>{message}</p>
    </div>
  )
}
