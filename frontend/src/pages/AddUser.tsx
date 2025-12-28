import { useState } from 'react'
import './AddUser.css'
import { users } from '../services/api'

interface AddUserProps {
    onNavigate: (page: string) => void
}

export default function AddUser({ onNavigate }: AddUserProps) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user'
    })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        // Validation
        if (!formData.email.endsWith('@pucit.edu.pk')) {
            setError('Please use a PUCIT email address (@pucit.edu.pk)')
            return
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        try {
            await users.create({
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                role: formData.role,
                password: formData.password,
                re_password: formData.confirmPassword
            })

            setSuccess(`User ${formData.firstName} ${formData.lastName} created successfully!`)
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                confirmPassword: '',
                role: 'user'
            })
        } catch (err: any) {
            console.error('Failed to create user:', err)
            // Extract error message from Django REST Framework error response
            const msg = err.response?.data
                ? Object.entries(err.response.data as Record<string, string[]>)
                    .map(([key, val]) => `${key}: ${val}`).join(', ')
                : 'Failed to create user. Please try again.'
            setError(msg)
        }
    }

    return (
        <div className="add-user-page">
            <div className="container">
                <div className="add-user-container">
                    <div className="add-user-card glass">
                        <div className="add-user-header">
                            <h2 className="add-user-title gradient-text">Add New User</h2>
                            <p className="add-user-subtitle">Create a new account for a student or staff member</p>
                        </div>

                        <form onSubmit={handleSubmit} className="add-user-form">
                            {error && (
                                <div className="error-message">
                                    <span className="error-icon">⚠️</span>
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="success-message">
                                    <span className="success-icon">✅</span>
                                    {success}
                                </div>
                            )}

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="firstName" className="form-label">First Name</label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        className="form-input"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="lastName" className="form-label">Last Name</label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        className="form-input"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="email" className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="form-input"
                                    placeholder="user@pucit.edu.pk"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="role" className="form-label">Role</label>
                                <select
                                    id="role"
                                    name="role"
                                    className="form-select"
                                    value={formData.role}
                                    onChange={handleChange}
                                >
                                    <option value="user">User</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="password" className="form-label">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        className="form-input"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        className="form-input"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={() => onNavigate('home')}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit">
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
