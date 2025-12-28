import { useState } from 'react'
import './Auth.css'

interface RegisterProps {
    onRegister: (user: any) => void
    onNavigate: (page: string) => void
}

export default function Register({ onRegister, onNavigate }: RegisterProps) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
    })
    const [error, setError] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validation
        if (!formData.email.endsWith('@pucit.edu.pk')) {
            setError('Please use your PUCIT email address (@pucit.edu.pk)')
            return
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        if (formData.password !== formData.password_confirm) {
            setError('Passwords do not match')
            return
        }

        if (!formData.first_name || !formData.last_name) {
            setError('Please enter your first and last name')
            return
        }

        // Mock registration - in real app, this would call the API
        const mockUser = {
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
        }

        onRegister(mockUser)
    }

    return (
        <div className="auth-page">
            <div className="container">
                <div className="auth-container">
                    <div className="auth-card glass">
                        <div className="auth-header">
                            <h2 className="auth-title gradient-text">Join Talk@FCIT</h2>
                            <p className="auth-subtitle">Create your account to get started</p>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form">
                            {error && (
                                <div className="error-message">
                                    <span className="error-icon">⚠️</span>
                                    {error}
                                </div>
                            )}

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="first_name" className="form-label">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        id="first_name"
                                        name="first_name"
                                        className="form-input"
                                        placeholder="John"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="last_name" className="form-label">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        id="last_name"
                                        name="last_name"
                                        className="form-input"
                                        placeholder="Doe"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="email" className="form-label">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="form-input"
                                    placeholder="your.name@pucit.edu.pk"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                                <p className="form-hint">Must be a valid PUCIT email address</p>
                            </div>

                            <div className="form-group">
                                <label htmlFor="password" className="form-label">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    className="form-input"
                                    placeholder="At least 8 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password_confirm" className="form-label">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    id="password_confirm"
                                    name="password_confirm"
                                    className="form-input"
                                    placeholder="Re-enter your password"
                                    value={formData.password_confirm}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-submit">
                                Create Account
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>
                                Already have an account?{' '}
                                <button className="link-btn" onClick={() => onNavigate('login')}>
                                    Login here
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
