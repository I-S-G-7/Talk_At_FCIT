import { useState, useEffect } from 'react'
import './CreatePost.css'
import { discussions } from '../services/api'
import { type Category } from '../data/mockData'

interface CreatePostProps {
    onNavigate: (page: string) => void
    currentUser: any
}

export default function CreatePost({ onNavigate, currentUser }: CreatePostProps) {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: '',
    })
    const [categories, setCategories] = useState<Category[]>([])
    const [success, setSuccess] = useState(false)
    const [fetchingCats, setFetchingCats] = useState(true)

    useEffect(() => {
        discussions.getCategories()
            .then(res => {
                const data = res.data as any
                const categoriesData = data.results || data
                setCategories(categoriesData)
                if (categoriesData && categoriesData.length > 0) {
                    setFormData(prev => ({ ...prev, category: categoriesData[0].id.toString() }))
                }
            })
            .catch(err => console.error("Failed to load categories", err))
            .finally(() => setFetchingCats(false))
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.category) {
            alert("Please select a category")
            return
        }

        try {
            await discussions.createPost({
                title: formData.title,
                content: formData.content,
                category: parseInt(formData.category)
            })
            setSuccess(true)
            setTimeout(() => {
                onNavigate('home')
            }, 2000)
        } catch (err) {
            console.error("Failed to create post", err)
            alert("Failed to create post. Please try again.")
        }
    }

    // ... (rest of render) ...

    // Update the Category Select rendering
    /*
                                <select
                                    id="category"
                                    name="category"
                                    className="form-select"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
    */

    if (!currentUser) {
        return (
            <div className="create-post-page">
                <div className="container">
                    <div className="error-state">
                        <h2>Please login to create a post</h2>
                        <button className="btn-primary" onClick={() => onNavigate('login')}>
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="create-post-page">
                <div className="container">
                    <div className="success-state glass">
                        <span className="success-icon">✅</span>
                        <h2>Post Created Successfully!</h2>
                        <p>Redirecting to home page...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="create-post-page">
            <div className="container">
                <div className="create-post-container">
                    <div className="page-header">
                        <button className="back-btn" onClick={() => onNavigate('home')}>
                            <span>←</span> Back
                        </button>
                        <h1 className="page-title gradient-text">Create New Post</h1>
                        <p className="page-subtitle">Share your thoughts with the FCIT community</p>
                    </div>

                    <form onSubmit={handleSubmit} className="create-post-form glass">
                        <div className="form-group">
                            <label htmlFor="category" className="form-label">
                                Category
                            </label>
                            <select
                                id="category"
                                name="category"
                                className="form-select"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                disabled={fetchingCats}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="title" className="form-label">
                                Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                className="form-input"
                                placeholder="Enter a descriptive title..."
                                value={formData.title}
                                onChange={handleChange}
                                required
                                maxLength={200}
                            />
                            <p className="form-hint">{formData.title.length}/200 characters</p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="content" className="form-label">
                                Content
                            </label>
                            <textarea
                                id="content"
                                name="content"
                                className="form-textarea"
                                placeholder="Write your post content here..."
                                value={formData.content}
                                onChange={handleChange}
                                required
                                rows={12}
                            />
                            <p className="form-hint">Be clear and respectful in your post</p>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => onNavigate('home')}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-submit">
                                <span>✍️</span>
                                Publish Post
                            </button>
                        </div>
                    </form>

                    <div className="posting-guidelines glass">
                        <h3>📋 Posting Guidelines</h3>
                        <ul>
                            <li>Be respectful and courteous to other members</li>
                            <li>Stay on topic and choose the appropriate category</li>
                            <li>No spam, self-promotion, or advertising</li>
                            <li>Use clear and descriptive titles</li>
                            <li>Provide context and details in your post</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
