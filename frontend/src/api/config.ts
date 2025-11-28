// API 서버 URL 설정
// Replit 백엔드로 요청 (기본값)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://whybox--dauuoon.replit.app/api'

export const API_ENDPOINTS = {
  // Admin
  LOGIN: '/admin/login',
  
  // Designs
  DESIGNS: '/designs',
  DESIGN_DETAIL: (id: string) => `/designs/${id}`,
  UPDATE_DESIGN_STATUS: (id: string) => `/designs/${id}/status`,
  
  // Pins
  CREATE_PIN: '/pins',
  
  // Comments
  CREATE_COMMENT: '/comments',
  DELETE_COMMENT: (id: string) => `/comments/${id}`,
  
  // Admin Replies
  CREATE_ADMIN_REPLY: (commentId: string) => `/comments/${commentId}/reply`,
  DELETE_ADMIN_REPLY: (id: string) => `/admin-replies/${id}`,
}

export const getFullUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`
}
