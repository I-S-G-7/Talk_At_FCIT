import { useState } from 'react'
import './Navbar.css'
import { type User, getInitials } from '../data/mockData'

interface NavbarProps {
    isAuthenticated: boolean
    currentUser: User | null
    onNavigate: (page: string) => void
    activePage: string
}

export default function Navbar({ isAuthenticated, currentUser, onNavigate, activePage }: NavbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleNavigate = (page: string) => {
        onNavigate(page)
        setMobileMenuOpen(false)
    }

    // Helper to determine if a link is active
    const isActive = (page: string) => activePage === page ? 'active' : ''

    return (
        <nav className="navbar glass">
            <div className="container navbar-content">
                <div className="navbar-brand" onClick={() => handleNavigate('home')}>
                    <span className="logo-icon">💬</span>
                    <span className="logo-text gradient-text">Talk@FCIT</span>
                </div>

                <button
                    className="mobile-menu-btn"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? '✕' : '☰'}
                </button>

                <div className={`navbar-menu ${mobileMenuOpen ? 'open' : ''}`}>
                    <button className={`nav-link ${isActive('home')}`} onClick={() => handleNavigate('home')}>
                        <span className="nav-icon">🏠</span>
                        Home
                    </button>

                    <button className={`nav-link ${isActive('search')}`} onClick={() => handleNavigate('search')}>
                        <span className="nav-icon">🔍</span>
                        Search
                    </button>

                    {isAuthenticated ? (
                        <>
                            <button className={`nav-link ${isActive('create-post')}`} onClick={() => handleNavigate('create-post')}>
                                <span className="nav-icon">✍️</span>
                                Create Post
                            </button>
                            {currentUser?.role === 'admin' && (
                                <button className={`nav-link admin-btn ${isActive('add-user')}`} onClick={() => handleNavigate('add-user')}>
                                    <span className="nav-icon">👤➕</span>
                                    Add User
                                </button>
                            )}
                            {(currentUser?.role === 'admin' || currentUser?.role === 'moderator') && (
                                <button className={`nav-link admin-btn ${isActive('moderation')}`} onClick={() => handleNavigate('moderation')}>
                                    <span className="nav-icon">🛡️</span>
                                    Moderation
                                </button>
                            )}
                            <button className={`nav-link notification-btn ${isActive('messages')}`} onClick={() => handleNavigate('messages')}>
                                <span className="nav-icon">💬</span>
                                Messages
                            </button>
                            <button className={`nav-link ${isActive('chat')}`} onClick={() => handleNavigate('chat')}>
                                <span className="nav-icon">🗨️</span>
                                Chat
                            </button>
                            <button className={`nav-link notification-btn ${isActive('notifications')}`} onClick={() => handleNavigate('notifications')}>
                                <span className="nav-icon">🔔</span>
                                Notifications
                            </button>
                            <button className={`nav-link ${isActive('profile')}`} onClick={() => handleNavigate('profile')}>
                                <span className="nav-icon">👤</span>
                                Profile
                            </button>

                        </>
                    ) : (
                        <>
                            <button className="btn-secondary" onClick={() => handleNavigate('login')}>
                                Login
                            </button>
                        </>
                    )}
                </div>

                {isAuthenticated && currentUser && (
                    <div className="user-badge" onClick={() => handleNavigate('profile')}>
                        <div className="user-avatar">
                            {getInitials(currentUser.first_name, currentUser.last_name)}
                        </div>
                        <span className="user-name">{currentUser.first_name}</span>
                        {currentUser.role !== 'user' && (
                            <span className={`user-role ${currentUser.role}`}>
                                {currentUser.role}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </nav>
    )
}
