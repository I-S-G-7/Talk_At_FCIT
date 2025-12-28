import axios from 'axios'
import type { User, Post, Category, Comment } from '../data/mockData'

// Constants
// Use environment variable for production, localhost for dev
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Axios Instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Types
interface AuthResponse {
    access: string
    refresh: string
}

// Request Interceptor (Add Token)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response Interceptor (Handle 401/Refresh)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // If 401 (Unauthorized) and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refreshToken = localStorage.getItem('refreshToken')
                if (!refreshToken) {
                    throw new Error('No refresh token')
                }

                const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
                    refresh: refreshToken
                })

                const { access } = response.data
                localStorage.setItem('accessToken', access)

                originalRequest.headers.Authorization = `Bearer ${access}`
                return api(originalRequest)
            } catch (refreshError) {
                // If refresh fails, logout
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                window.location.href = '/' // Redirect to home/login
                return Promise.reject(refreshError)
            }
        }
        return Promise.reject(error)
    }
)

// API Methods
export const auth = {
    login: (email: string, password: string) =>
        api.post<AuthResponse>('/auth/login/', { email, password }),

    register: (userData: any) =>
        api.post('/auth/users/', userData),

    getCurrentUser: () =>
        api.get<User>('/auth/me/'),

    getUser: (id: number) =>
        api.get<User>(`/auth/users/${id}/`),

    logout: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        // Ideally call backend logout if blacklist is enabled
        // return api.post('/auth/logout/')
    }
}

export const discussions = {
    getCategories: () => api.get<Category[]>('/discussions/categories/'),

    getPosts: (category?: string, search?: string, author?: number) =>
        api.get<Post[]>('/discussions/posts/', { params: { category, search, author, ordering: author ? '-created_at' : undefined } }),

    getPost: (id: number) => api.get<Post>(`/discussions/posts/${id}/`),

    searchPosts: (query: string) => api.get<Post[]>('/discussions/posts/', { params: { search: query } }),

    createPost: (postData: any) => api.post('/discussions/posts/', postData),

    votePost: (id: number, voteType: 'up' | 'down') =>
        api.post(`/discussions/posts/${id}/vote/`, { value: voteType === 'up' ? 1 : -1 }),

    getComments: (postId: number) =>
        api.get<Comment[]>(`/discussions/posts/${postId}/comments/`),

    addComment: (postId: number, content: string, parentId?: number) =>
        api.post(`/discussions/posts/${postId}/comments/`, { content, parent: parentId }),

    deletePost: (postId: number) => api.delete(`/discussions/posts/${postId}/`)
}

export const notifications = {
    list: () => api.get('/notifications/'),
    markRead: (id: number) => api.post(`/notifications/${id}/read/`),
    markAllRead: () => api.post('/notifications/mark-all-read/')
}

export const messaging = {
    listConversations: () => api.get<any[]>('/messaging/conversations/'),
    getConversation: (id: number) => api.get<any>(`/messaging/conversations/${id}/`),
    startConversation: (recipientId: number) => api.post('/messaging/conversations/start/', { recipient_id: recipientId }),
    sendMessage: (data: any) => api.post('/messaging/send/', data),

    listChatRooms: () => api.get<any[]>('/messaging/chat-rooms/'),
    createChatRoom: (data: any) => api.post('/messaging/chat-rooms/', data),
    getChatRoomMessages: (id: number) => api.get<any[]>(`/messaging/chat-rooms/${id}/messages/`),
    sendChatRoomMessage: (id: number, content: string) => api.post(`/messaging/chat-rooms/${id}/send/`, { content })
}

export const users = {
    create: (userData: any) => api.post('/auth/users/', userData),
    search: (query: string) => api.get(`/search/users/?q=${query}`)
}

export const reports = {
    list: (status?: string) => api.get<any[]>('/reports/', { params: { status } }),
    create: (data: any) => api.post('/reports/create/', data),
    updateStatus: (id: number, status: string, notes?: string) =>
        api.post(`/reports/${id}/update/`, { status, moderator_notes: notes })
}

export default api
