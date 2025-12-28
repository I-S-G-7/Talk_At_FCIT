import { useState, useEffect } from 'react';
import { type Post, type Comment, getTimeAgo, getInitials, getCategoryIcon } from '../data/mockData';
import { discussions } from '../services/api';
import './PostDetail.css';

interface PostDetailProps {
    postId?: number;
    post?: Post | null;
    onNavigate: (page: string) => void;
    currentUser: any;
    onBack: () => void;
}

const PostDetail = ({ postId, post, onNavigate, currentUser, onBack }: PostDetailProps) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [fullPost, setFullPost] = useState<Post | null>(post || null);
    const [userVote, setUserVote] = useState<1 | -1 | null>(post?.user_vote || null);
    const [voteCount, setVoteCount] = useState(post?.upvotes_count || 0);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isReporting, setIsReporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [reportStatus, setReportStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const targetId = postId || post?.id;

    useEffect(() => {
        if (!targetId) return;

        // Fetch full post details
        discussions.getPost(targetId)
            .then(res => {
                setFullPost(res.data);
                // Update local state
                if (res.data.user_vote !== undefined) setUserVote(res.data.user_vote);
                setVoteCount(res.data.upvotes_count);
            })
            .catch(err => console.error("Failed to fetch post details", err));

        // Fetch comments
        discussions.getComments(targetId)
            .then(res => {
                const data = res.data as any;
                setComments(data.results || data);
            })
            .catch(err => console.error("Failed to fetch comments", err));
    }, [targetId]);

    if (!fullPost) return <div className="loading">Loading post...</div>;

    const handleVote = async (value: 1 | -1) => {
        if (!currentUser || !fullPost) {
            onNavigate('login');
            return;
        }

        // Optimistic update
        const oldVote = userVote;
        const oldCount = voteCount;

        try {
            if (userVote === value) {
                // Unvote logic - optimistically remove vote
                setVoteCount(prev => prev - value);
                setUserVote(null);
            } else {
                const change = userVote ? value * 2 : value;
                setVoteCount(prev => prev + change);
                setUserVote(value);
                await discussions.votePost(fullPost.id, value === 1 ? 'up' : 'down');
            }
        } catch (err) {
            // Revert optimistic update on error
            setUserVote(oldVote);
            setVoteCount(oldCount);
            console.error("Vote failed", err);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !currentUser || !fullPost) return;

        try {
            const res = await discussions.addComment(fullPost.id, newComment);
            setComments([res.data, ...comments]);
            setNewComment('');
        } catch (err) {
            console.error("Failed to add comment", err);
            alert("Failed to add comment");
        }
    };

    const handleAddReply = async (parentId: number) => {
        if (!replyContent.trim() || !currentUser || !fullPost) return;

        try {
            const res = await discussions.addComment(fullPost.id, replyContent, parentId);
            setComments([...comments, res.data]);
            setReplyContent('');
            setReplyingTo(null);
        } catch (err) {
            console.error("Failed to add reply", err);
            alert("Failed to add reply");
        }
    };

    const handleReport = async () => {
        if (!currentUser) return onNavigate('login');
        if (!reportReason.trim() || !fullPost) return;

        setIsReporting(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('http://localhost:8000/api/reports/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    post_id: fullPost.id,
                    reason: reportReason,
                    report_type: 'spam' // Default to spam or add selector
                })
            });

            if (res.ok) {
                setReportStatus('success');
                setTimeout(() => {
                    setShowReportModal(false);
                    setReportReason('');
                    setReportStatus('idle');
                }, 2000);
            } else {
                setReportStatus('error');
            }
        } catch (err) {
            console.error("Failed to report", err);
            setReportStatus('error');
        } finally {
            setIsReporting(false);
        }
    };

    const handleDelete = async () => {
        if (!fullPost) return;
        setIsDeleting(true);
        try {
            await discussions.deletePost(fullPost.id);
            onBack(); // Navigate back after delete
        } catch (err) {
            console.error("Failed to delete post", err);
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const topLevelComments = comments.filter(c => !c.parent);
    const getReplies = (commentId: number) => comments.filter(c => c.parent === commentId);

    return (
        <div className="post-detail fade-in">
            <button className="back-button" onClick={onBack}>
                <span className="back-icon">←</span>
                Back to Feed
            </button>

            <article className="post-article">
                <header className="post-header">
                    <div className="post-category">
                        <span className="category-icon">{getCategoryIcon(fullPost.category?.slug)}</span>
                        <span>{fullPost.category?.name}</span>
                    </div>

                    {fullPost.is_pinned && (
                        <span className="pinned-badge">📌 Pinned</span>
                    )}
                    {fullPost.is_locked && (
                        <span className="locked-badge">🔒 Locked</span>
                    )}
                </header>

                <h1 className="post-title">{fullPost.title}</h1>

                <div className="post-author">
                    <div className="author-avatar">
                        {getInitials(fullPost.author?.first_name, fullPost.author?.last_name)}
                    </div>
                    <div className="author-info">
                        <span className="author-name">
                            {fullPost.author?.first_name ? `${fullPost.author.first_name} ${fullPost.author.last_name}` : fullPost.author?.email}
                            {fullPost.author?.role !== 'user' && (
                                <span className={`role-badge ${fullPost.author?.role}`}>
                                    {fullPost.author?.role}
                                </span>
                            )}
                        </span>
                        <span className="post-time">{getTimeAgo(fullPost.created_at)}</span>
                    </div>
                </div>

                <div className="post-content">
                    {(fullPost.content || '').split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </div>

                <div className="post-actions">
                    <div className="vote-buttons">
                        <button
                            className={`vote-btn upvote ${userVote === 1 ? 'active' : ''}`}
                            onClick={() => handleVote(1)}
                        >
                            ▲
                        </button>
                        <span className="vote-count">{voteCount}</span>
                        <button
                            className={`vote-btn downvote ${userVote === -1 ? 'active' : ''}`}
                            onClick={() => handleVote(-1)}
                        >
                            ▼
                        </button>
                    </div>
                    <button className="action-btn">
                        <span>💬</span> {comments.length} Comments
                    </button>

                    {(currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator' || currentUser.id === fullPost.author?.id)) && (
                        <button className="action-btn delete-btn" onClick={() => setShowDeleteModal(true)} style={{ color: 'var(--error)' }}>
                            <span>🗑️</span> Delete
                        </button>
                    )}
                    {currentUser && currentUser.id !== fullPost.author?.id && (
                        <button className="action-btn report-btn" onClick={() => setShowReportModal(true)} style={{ color: 'var(--warning)' }}>
                            <span>🚩</span> Report
                        </button>
                    )}
                </div>
            </article>

            <section className="comments-section">
                <h2>Comments ({comments.length})</h2>

                {currentUser && !fullPost.is_locked && (
                    <div className="comment-form glass">
                        <div className="form-avatar">
                            {getInitials(currentUser.first_name, currentUser.last_name)}
                        </div>
                        <div className="form-input-wrapper">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                rows={3}
                            />
                            <button
                                className="submit-comment-btn"
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                            >
                                Post Comment
                            </button>
                        </div>
                    </div>
                )}

                {!currentUser && (
                    <div className="login-prompt glass">
                        <p>Please <button onClick={() => onNavigate('login')}>login</button> to comment</p>
                    </div>
                )}

                <div className="comments-list">
                    {topLevelComments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            replies={getReplies(comment.id)}
                            currentUser={currentUser}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                            replyContent={replyContent}
                            setReplyContent={setReplyContent}
                            onAddReply={handleAddReply}
                            onNavigate={onNavigate}
                        />
                    ))}
                </div>

                {topLevelComments.length === 0 && (
                    <div className="no-comments">
                        <span className="no-comments-icon">💭</span>
                        <p>No comments yet. Be the first to share your thoughts!</p>
                    </div>
                )}
            </section>

            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal glass">
                        <h2>Delete Post</h2>
                        <p>Are you sure you want to delete this post? This cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleDelete} disabled={isDeleting} style={{ background: 'var(--error)', borderColor: 'var(--error)' }}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReportModal && (
                <div className="modal-overlay">
                    <div className="modal glass">
                        <h2>Report Post</h2>
                        {reportStatus === 'success' ? (
                            <div className="success-message" style={{ color: 'var(--success)', padding: '1rem', textAlign: 'center' }}>
                                ✅ Report submitted successfully
                            </div>
                        ) : (
                            <>
                                <textarea
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    placeholder="Why are you reporting this post?"
                                    rows={4}
                                />
                                {reportStatus === 'error' && <p style={{ color: 'var(--error)' }}>Failed to submit report. Please try again.</p>}
                                <div className="modal-actions">
                                    <button className="btn-secondary" onClick={() => setShowReportModal(false)}>Cancel</button>
                                    <button className="btn-primary" onClick={handleReport} disabled={isReporting || !reportReason.trim()}>
                                        {isReporting ? 'Submitting...' : 'Submit Report'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

interface CommentItemProps {
    comment: Comment;
    replies: Comment[];
    currentUser: any;
    replyingTo: number | null;
    setReplyingTo: (id: number | null) => void;
    replyContent: string;
    setReplyContent: (content: string) => void;
    onAddReply: (parentId: number) => void;
    onNavigate: (page: string) => void;
}

const CommentItem = ({
    comment,
    replies,
    currentUser,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    onAddReply,
    onNavigate
}: CommentItemProps) => {
    const [userVote, setUserVote] = useState<1 | -1 | null>(comment.user_vote || null);
    const [voteCount, setVoteCount] = useState(comment.upvotes_count);

    const handleVote = (value: 1 | -1) => {
        if (!currentUser) {
            onNavigate('login');
            return;
        }
        if (userVote === value) {
            setVoteCount(prev => prev - value);
            setUserVote(null);
        } else {
            const change = userVote ? value * 2 : value;
            setVoteCount(prev => prev + change);
            setUserVote(value);
        }
    };

    return (
        <div className="comment-item">
            <div className="comment-avatar">
                {getInitials(comment.author?.first_name, comment.author?.last_name)}
            </div>
            <div className="comment-content">
                <div className="comment-header">
                    <span className="comment-author">
                        {comment.author?.first_name} {comment.author?.last_name}
                    </span>
                    <span className="comment-time">{getTimeAgo(comment.created_at)}</span>
                </div>
                <p className="comment-text">{comment.content}</p>
                <div className="comment-actions">
                    <button
                        className={`vote-mini upvote ${userVote === 1 ? 'active' : ''}`}
                        onClick={() => handleVote(1)}
                    >
                        ▲
                    </button>
                    <span className="vote-count-mini">{voteCount}</span>
                    <button
                        className={`vote-mini downvote ${userVote === -1 ? 'active' : ''}`}
                        onClick={() => handleVote(-1)}
                    >
                        ▼
                    </button>
                    {currentUser && (
                        <button
                            className="reply-btn"
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        >
                            Reply
                        </button>
                    )}
                </div>

                {replyingTo === comment.id && (
                    <div className="reply-form">
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            rows={2}
                        />
                        <div className="reply-form-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => {
                                    setReplyingTo(null);
                                    setReplyContent('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="submit-reply-btn"
                                onClick={() => onAddReply(comment.id)}
                                disabled={!replyContent.trim()}
                            >
                                Reply
                            </button>
                        </div>
                    </div>
                )}

                {replies.length > 0 && (
                    <div className="replies">
                        {replies.map(reply => (
                            <div key={reply.id} className="reply-item">
                                <div className="comment-avatar small">
                                    {getInitials(reply.author?.first_name, reply.author?.last_name)}
                                </div>
                                <div className="comment-content">
                                    <div className="comment-header">
                                        <span className="comment-author">
                                            {reply.author?.first_name} {reply.author?.last_name}
                                        </span>
                                        <span className="comment-time">{getTimeAgo(reply.created_at)}</span>
                                    </div>
                                    <p className="comment-text">{reply.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostDetail;
