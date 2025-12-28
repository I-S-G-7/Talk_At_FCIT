import { useState, useEffect } from 'react'
import { type Post, getTimeAgo, getInitials, getCategoryIcon } from '../data/mockData'
import { discussions } from '../services/api'
import './PostCard.css'

interface PostCardProps {
    post: Post
    onClick?: () => void
    currentUser?: any
    onNavigate?: (page: string) => void
    className?: string
}

export default function PostCard({ post, onClick, currentUser, onNavigate, className = '' }: PostCardProps) {
    const [voteCount, setVoteCount] = useState(post.upvotes_count);
    const [userVote, setUserVote] = useState<1 | -1 | null>(post.user_vote || null);

    useEffect(() => {
        setVoteCount(post.upvotes_count);
        setUserVote(post.user_vote || null);
    }, [post]);

    const handleVote = async (value: 1 | -1, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) {
            if (onNavigate) onNavigate('login');
            return;
        }

        // Optimistic update
        const oldVote = userVote;
        const oldCount = voteCount;

        try {
            if (userVote === value) {
                // Unvote logic
                setVoteCount(prev => prev - value);
                setUserVote(null);
                await discussions.votePost(post.id, value === 1 ? 'up' : 'down');
            } else {
                // Vote or switch vote
                const change = userVote ? value * 2 : value;
                setVoteCount(prev => prev + change);
                setUserVote(value);
                await discussions.votePost(post.id, value === 1 ? 'up' : 'down');
            }
        } catch (err) {
            // Revert on error
            setUserVote(oldVote);
            setVoteCount(oldCount);
            console.error("Vote failed", err);
        }
    };

    if (!post) return null;
    return (
        <div className={`post-card ${className}`} onClick={onClick}>
            <div className="post-votes">
                <button
                    className={`vote-btn upvote ${userVote === 1 ? 'active' : ''}`}
                    onClick={(e) => handleVote(1, e)}
                >
                    <span>▲</span>
                </button>
                <span className={`vote-count ${voteCount > 0 ? 'positive' : ''}`}>
                    {voteCount}
                </span>
                <button
                    className={`vote-btn downvote ${userVote === -1 ? 'active' : ''}`}
                    onClick={(e) => handleVote(-1, e)}
                >
                    <span>▼</span>
                </button>
            </div>

            <div className="post-content">
                <div className="post-header">
                    <div className="post-meta">
                        {post.category && (
                            <span className="category-badge badge">
                                {getCategoryIcon(post.category.slug)} {post.category.name}
                            </span>
                        )}
                        <div className="author-info">
                            <div className="author-avatar-small">
                                {getInitials(post.author?.first_name || post.author?.email, post.author?.last_name)}
                            </div>
                            <span className="post-author">
                                {post.author?.first_name ? `${post.author.first_name} ${post.author.last_name}` : post.author?.email}
                                {post.author?.role !== 'user' && (
                                    <span className={`role-tag ${post.author?.role}`}>
                                        {post.author?.role}
                                    </span>
                                )}
                            </span>
                        </div>
                        <span className="post-time">{getTimeAgo(post.created_at)}</span>
                    </div>
                </div>

                <div className="post-badges">
                    {post.is_pinned && <span className="pin-badge">📌 Pinned</span>}
                    {post.is_locked && <span className="lock-badge">🔒 Locked</span>}
                </div>

                <h3 className="post-title">{post.title}</h3>
                <p className="post-text">
                    {(post.content || '').length > 200
                        ? (post.content || '').substring(0, 200) + '...'
                        : (post.content || '')}
                </p>

                <div className="post-footer">
                    <button className="post-action" onClick={(e) => e.stopPropagation()}>
                        <span className="action-icon">💬</span>
                        <span>{post.comments_count} Comments</span>
                    </button>

                </div>
            </div>
        </div>
    )
}
