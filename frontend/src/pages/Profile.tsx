import { useState, useEffect } from 'react'
import { discussions, auth } from '../services/api'
import PostCard from '../components/PostCard'
import './Profile.css'

interface ProfileProps {
    user: any
    userId?: number
    onNavigate: (page: string) => void
    currentUser?: any
}

export default function Profile({ user: initialUser, userId, onNavigate, currentUser }: ProfileProps) {
    const [user, setUser] = useState<any>(initialUser)
    const [posts, setPosts] = useState<any[]>([])
    const [stats, setStats] = useState({ upvotes: 0, comments: 0 })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setUser(initialUser)
    }, [initialUser])

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user && userId) {
                setLoading(true)
                try {
                    const res = await auth.getUser(userId)
                    setUser(res.data)
                } catch (err) {
                    console.error("Failed to fetch user", err)
                } finally {
                    setLoading(false)
                }
            }
        }
        fetchUserData()
    }, [userId, user])

    useEffect(() => {
        if (user) {
            discussions.getPosts(undefined, undefined, user.id)
                .then(res => {
                    const fetchedPosts = Array.isArray(res.data) ? res.data : (res.data as any).results || []
                    setPosts(fetchedPosts)

                    // Calculate stats
                    const totalUpvotes = fetchedPosts.reduce((acc: number, post: any) => acc + (post.upvotes_count || 0), 0)
                    const totalComments = fetchedPosts.reduce((acc: number, post: any) => acc + (post.comments_count || 0), 0)
                    setStats({ upvotes: totalUpvotes, comments: totalComments })
                })
                .catch(err => console.error("Failed to fetch user posts", err))
        }
    }, [user])

    if (loading) {
        return <div className="loading-spinner"></div>
    }

    if (!user) {
        return (
            <div className="profile-page">
                <div className="container">
                    <div className="error-state">
                        <h2>Please login to view your profile</h2>
                        <button className="btn-primary" onClick={() => onNavigate('login')}>
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="profile-page">
            <div className="container">
                <div className="profile-header glass">
                    <div className="profile-avatar-large">
                        {user.first_name?.[0] || 'U'}
                    </div>
                    <div className="profile-info">
                        <h1 className="profile-name">
                            {user.first_name} {user.last_name}
                        </h1>
                        <p className="profile-email">{user.email}</p>
                        <div className="profile-stats">
                            <div className="stat-item">
                                <span className="stat-value">{posts.length}</span>
                                <span className="stat-label">Posts</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{stats.upvotes}</span>
                                <span className="stat-label">Upvotes</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{stats.comments}</span>
                                <span className="stat-label">Comments</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-content">
                    <div className="section-header">
                        <h2>Your Posts</h2>
                        <button className="btn-primary" onClick={() => onNavigate('create-post')}>
                            <span>✍️</span>
                            Create New Post
                        </button>
                    </div>

                    <div className="posts-grid">
                        {posts.length > 0 ? (
                            posts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    currentUser={currentUser}
                                    onNavigate={onNavigate}
                                    className="profile-post-card"
                                />
                            ))
                        ) : (
                            <div className="no-posts">
                                <p>You haven't posted anything yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
