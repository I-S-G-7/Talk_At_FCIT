import { useState, useEffect } from 'react'
import './Home.css'
import PostCard from '../components/PostCard'
import { type Post, type Category, getCategoryIcon } from '../data/mockData'
import { discussions } from '../services/api'

interface HomeProps {
    onNavigate: (page: string) => void
    isAuthenticated: boolean
    onViewPost: (post: Post) => void
    currentUser: any
}

export default function Home({ onNavigate, isAuthenticated, onViewPost, currentUser }: HomeProps) {
    // State
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [posts, setPosts] = useState<Post[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch categories
                const categoriesRes = await discussions.getCategories()
                const cats = Array.isArray(categoriesRes.data) ? categoriesRes.data : (categoriesRes.data as any).results || []
                setCategories(cats)

                // Fetch posts
                await fetchPosts()
            } catch (error) {
                console.error("Failed to fetch data:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchPosts()
        }, 300)
        return () => clearTimeout(timeoutId)
    }, [selectedCategory, searchQuery])

    const fetchPosts = async () => {
        try {
            const categoryParam = selectedCategory !== 'all' ? selectedCategory : undefined
            const searchParam = searchQuery || undefined
            const response = await discussions.getPosts(categoryParam, searchParam)

            // Handle pagination (DRF returns { results: [], count: ... })
            let fetchedPosts = Array.isArray(response.data) ? response.data : (response.data as any).results || []

            // Default sort: Latest
            fetchedPosts.sort((a: Post, b: Post) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

            setPosts(fetchedPosts)
        } catch (error) {
            console.error("Error fetching posts", error)
        }
    }

    if (loading && posts.length === 0) {
        return <div className="loading-state">Loading discussions...</div>
    }

    return (
        <div className="home-page">
            <div className="container">
                {/* Hero Section */}
                <div className="hero-section">
                    <h1 className="hero-title">
                        Welcome to <span className="gradient-text">Talk@FCIT</span>
                    </h1>
                    <p className="hero-subtitle">
                        Connect, discuss, and share knowledge with your fellow FCIT students
                    </p>
                    {!isAuthenticated && (
                        <button className="btn-hero" onClick={() => onNavigate('login')}>
                            Join the Community →
                        </button>
                    )}
                </div>

                {/* Search and Filter */}
                <div className="controls-section">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search discussions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="category-filters">
                        <button
                            className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('all')}
                        >
                            📋 All
                        </button>
                        {categories.map(category => (
                            <button
                                key={category.id}
                                className={`category-btn ${selectedCategory === category.slug ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(category.slug)}
                            >
                                {getCategoryIcon(category.slug)} {category.name}
                            </button>
                        ))}
                    </div>

                    {/* Sort controls removed as per requirement */}
                </div>

                {/* Create Post CTA */}
                {isAuthenticated && (
                    <div className="create-post-cta glass" onClick={() => onNavigate('create-post')}>
                        <span className="cta-icon">✍️</span>
                        <span className="cta-text">Share your thoughts with the community...</span>
                        <button className="cta-btn">Create Post</button>
                    </div>
                )}

                {/* Posts List */}
                <div className="posts-list">
                    {posts.length > 0 ? (
                        posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onClick={() => onViewPost(post)}
                                currentUser={currentUser}
                                onNavigate={onNavigate}
                            />
                        ))
                    ) : (
                        <div className="no-posts">
                            <span className="no-posts-icon">📭</span>
                            <h3>No posts found</h3>
                            <p>Be the first to start a discussion!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
