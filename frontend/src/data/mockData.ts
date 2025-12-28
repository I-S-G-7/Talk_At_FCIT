// Helper functions
export const getTimeAgo = (dateString: string | undefined | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'week', seconds: 604800 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 }
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
        }
    }
    return 'just now';
};

export const getInitials = (firstName: string | undefined | null, lastName: string | undefined | null): string => {
    const f = firstName ? firstName.charAt(0) : '';
    const l = lastName ? lastName.charAt(0) : '';
    return `${f}${l}`.toUpperCase();
};

export const getCategoryIcon = (slug: string | undefined | null): string => {
    if (!slug) return '📝';
    const icons: Record<string, string> = {
        'general': '💬',
        'academics': '📚',
        'events': '🎉',
        'tech-talk': '💻',
        'career': '💼',
        'help': '❓'
    };
    return icons[slug] || '📝';
};

// Types
export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    bio: string;
    profile_picture: string | null;
    role: 'user' | 'moderator' | 'admin';
    is_verified: boolean;
    created_at: string;
    posts_count?: number;
    followers_count?: number;
    following_count?: number;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string;
    posts_count?: number;
}

export interface Post {
    id: number;
    author: User;
    category: Category;
    title: string;
    content: string;
    upvotes_count: number;
    comments_count: number;
    is_pinned: boolean;
    is_locked: boolean;
    created_at: string;
    updated_at: string;
    user_vote?: 1 | -1 | null;
}

export interface Comment {
    id: number;
    post_id: number;
    author: User;
    content: string;
    parent: number | null;
    upvotes_count: number;
    created_at: string;
    replies?: Comment[];
    user_vote?: 1 | -1 | null;
}

export interface Notification {
    id: number;
    sender: User | null;
    notification_type: 'comment' | 'reply' | 'mention' | 'vote';
    message: string;
    post_id?: number;
    comment_id?: number;
    is_read: boolean;
    created_at: string;
}

// Messaging Types
export interface PrivateMessage {
    id: number;
    sender: User;
    content: string;
    is_read: boolean;
    created_at: string;
}

export interface Conversation {
    id: number;
    participants: User[];
    other_participant: User;
    messages: PrivateMessage[];
    last_message?: {
        content: string;
        sender_id: number;
        created_at: string;
        is_read: boolean;
    };
    unread_count: number;
    updated_at: string;
}

export interface ChatMessage {
    id: number;
    sender: User;
    content: string;
    created_at: string;
}

export interface ChatRoom {
    id: number;
    name: string;
    description: string;
    is_active: boolean;
    message_count: number;
}
