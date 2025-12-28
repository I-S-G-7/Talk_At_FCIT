import { useState, useEffect } from 'react'
import { reports, discussions } from '../services/api'
import { type User } from '../data/mockData'
import { getInitials } from '../data/mockData'
import './Moderation.css'

interface Report {
    id: number
    reporter: User
    content_type: 'post' | 'comment'
    post_id?: number
    comment_id?: number
    reason: string
    status: 'pending' | 'resolved' | 'dismissed'
    created_at: string
}

interface ModerationProps {
    onNavigate: (page: string) => void
    currentUser: any | null
}

export default function Moderation({ onNavigate, currentUser }: ModerationProps) {
    const [reportList, setReportList] = useState<Report[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator')) {
            fetchReports();
        }
    }, [currentUser]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await reports.list();
            // Handle pagination
            const results = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
            setReportList(results);
        } catch (err) {
            console.error("Failed to load reports", err);
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'moderator')) {
        return (
            <div className="moderation-page">
                <div className="access-denied glass">
                    <span className="icon">🚫</span>
                    <h2>Access Denied</h2>
                    <p>You do not have permission to view this page.</p>
                    <button className="btn-primary" onClick={() => onNavigate('home')}>
                        Back to Home
                    </button>
                </div>
            </div>
        )
    }

    const handleAction = async (id: number, action: 'resolve' | 'dismiss') => {
        try {
            const status = action === 'resolve' ? 'resolved' : 'dismissed';
            await reports.updateStatus(id, status);
            // Optimistic update
            setReportList(prev => prev.map(r =>
                r.id === id ? { ...r, status: status } : r
            ));
        } catch (err) {
            console.error("Failed to update report", err);
            alert("Failed to update status");
        }
    }

    const handleDeleteContent = async (report: Report) => {
        if (!confirm("Are you sure you want to delete this content?")) return;
        try {
            if (report.post_id) {
                await discussions.deletePost(report.post_id);
                // Auto resolve report
                await handleAction(report.id, 'resolve');
            }
        } catch (err) {
            console.error("Failed to delete", err);
            alert("Failed to delete content");
        }
    }

    return (
        <div className="moderation-page">
            <div className="container">
                <div className="moderation-header">
                    <h1 className="gradient-text">Moderation Dashboard</h1>
                    <div className="stats-cards">
                        <div className="stat-card glass">
                            <span className="stat-value">{reportList.filter(r => r.status === 'pending').length}</span>
                            <span className="stat-label">Pending</span>
                        </div>
                        <div className="stat-card glass">
                            <span className="stat-value">{reportList.filter(r => r.status === 'resolved').length}</span>
                            <span className="stat-label">Resolved</span>
                        </div>
                    </div>
                </div>

                <div className="reports-list">
                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '2rem' }}>Loading reports...</p>
                    ) : (
                        <>
                            {reportList.filter(r => r.status === 'pending').map(report => (
                                <div key={report.id} className="report-card glass">
                                    <div className="report-header">
                                        <span className={`report-type ${report.content_type}`}>
                                            {report.content_type ? report.content_type.toUpperCase() : 'EXTERN'}
                                        </span>
                                        <span className="report-date">
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="report-content">
                                        <h3>Reason: {report.reason}</h3>
                                        {report.reporter && (
                                            <p className="reporter-info">
                                                Reported by: {report.reporter.first_name || 'User'} {report.reporter.last_name}
                                            </p>
                                        )}
                                        <div className="content-preview">
                                            <strong>Target ID: {report.post_id || report.comment_id || 'N/A'}</strong>
                                            <div className="preview-actions" style={{ marginTop: '0.5rem' }}>
                                                {report.post_id && (
                                                    <button
                                                        className="btn-secondary"
                                                        onClick={() => onNavigate(`post/${report.post_id}`)}
                                                        style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                                                    >
                                                        View Post
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="report-actions">
                                        <button
                                            className="btn-dismiss"
                                            onClick={() => handleAction(report.id, 'dismiss')}
                                        >
                                            Dismiss
                                        </button>
                                        <button
                                            className="btn-resolve"
                                            onClick={() => handleAction(report.id, 'resolve')}
                                        >
                                            Resolve
                                        </button>
                                        {report.post_id && (
                                            <button
                                                className="btn-delete-content"
                                                onClick={() => handleDeleteContent(report)}
                                                style={{ background: 'var(--error)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', marginLeft: '0.5rem' }}
                                            >
                                                Delete Post
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {reportList.filter(r => r.status === 'pending').length === 0 && (
                                <div className="empty-state glass">
                                    <span className="icon">✅</span>
                                    <h3>All Caught Up!</h3>
                                    <p>No pending reports to review.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
