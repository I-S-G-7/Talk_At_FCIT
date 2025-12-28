
import { useState } from 'react'
import './Auth.css'
import { auth } from '../services/api'

interface LoginProps {
    onLogin: (user: any) => void
}

export default function Login({ onLogin }: LoginProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Validation
        if (!email.includes('@')) { // Relaxed validation for admin login if needed
            setError('Please enter a valid email')
            setLoading(false)
            return
        }

        try {
            // 1. Login to get token
            const response = await auth.login(email, password)
            const { access, refresh } = response.data

            localStorage.setItem('accessToken', access)
            localStorage.setItem('refreshToken', refresh)

            // 2. Fetch current user details
            const userResponse = await auth.getCurrentUser()

            // 3. Update App state
            onLogin(userResponse.data)

        } catch (err: any) {
            console.error('Login failed:', err)
            if (err.response?.status === 401) {
                setError('Wrong password or email')
            } else {
                setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="container">
                <div className="auth-container">
                    <div className="auth-card glass">
                        <div className="auth-header">
                            <h2 className="auth-title gradient-text">Welcome Back!</h2>
                            <p className="auth-subtitle">Login to continue to Talk@FCIT</p>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form">
                            {error && (
                                <div className="error-message">
                                    <span className="error-icon">⚠️</span>
                                    {error}
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="email" className="form-label">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    className="form-input"
                                    placeholder="your.name@pucit.edu.pk"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password" className="form-label">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    className="form-input"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>
                                Need an account? Contact your administrator.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
