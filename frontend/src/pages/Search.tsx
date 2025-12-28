import { useState, useEffect } from 'react';
import { type Post, type User, type Category, getInitials, getCategoryIcon } from '../data/mockData';
import { discussions, users } from '../services/api';
import PostCard from '../components/PostCard';
import './Search.css';

interface SearchProps {
    onNavigate: (page: string) => void;
    onViewPost: (post: Post) => void;
    currentUser: any;
}

type SearchTab = 'posts' | 'users' | 'categories';

const Search = ({ onNavigate, onViewPost, currentUser }: SearchProps) => {
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<SearchTab>('posts');
    const [searchResults, setSearchResults] = useState<{
        posts: Post[];
        users: User[];
        categories: Category[];
    }>({
        posts: [],
        users: [],
        categories: []
    });
    const [hasSearched, setHasSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initialCategories, setInitialCategories] = useState<Category[]>([]);

    useEffect(() => {
        discussions.getCategories()
            .then(res => {
                const results = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
                setInitialCategories(results);
            })
            .catch(err => console.error("Failed to fetch initial categories", err));
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query.trim().length < 2) {
                setSearchResults({ posts: [], users: [], categories: [] });
                setHasSearched(false);
                return;
            }

            setLoading(true);
            try {
                const [postsRes, catsRes, usersRes] = await Promise.all([
                    discussions.searchPosts(query),
                    discussions.getCategories(),
                    users.search(query)
                ]);

                const posts = Array.isArray(postsRes.data) ? postsRes.data : (postsRes.data as any).results || [];
                const allCats = Array.isArray(catsRes.data) ? catsRes.data : (catsRes.data as any).results || [];
                const foundUsers = (usersRes.data as any).results || [];

                const filteredCats = allCats.filter((c: any) => c && c.name && c.name.toLowerCase().includes(query.toLowerCase()));

                setSearchResults({
                    posts: posts,
                    users: foundUsers,
                    categories: filteredCats
                });
                setHasSearched(true);
            } catch (error: any) {
                console.error("Search failed:", error.response?.data || error.message);
                // Ensure we don't leave loading state if verify fails, but here we just log
            } finally {
                setLoading(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSearch = (searchQuery: string) => {
        setQuery(searchQuery);
    };

    const totalResults =
        searchResults.posts.length +
        searchResults.users.length +
        searchResults.categories.length;

    const getTabCount = (tab: SearchTab): number => {
        switch (tab) {
            case 'posts': return searchResults.posts.length;
            case 'users': return searchResults.users.length;
            case 'categories': return searchResults.categories.length;
        }
    };

    return (
        <div className="search-page fade-in">
            <div className="search-header">
                <h1>Search</h1>
                <p>Find posts, users, and categories</p>
            </div>

            <div className="search-box glass">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search for anything..."
                    autoFocus
                />
                {query && !loading && (
                    <button className="clear-btn" onClick={() => handleSearch('')}>
                        ✕
                    </button>
                )}
                {loading && <span className="loading-spinner-small">...</span>}
            </div>

            {hasSearched && (
                <>
                    <div className="results-summary">
                        Found <strong>{totalResults}</strong> results for "{query}"
                    </div>

                    <div className="search-tabs">
                        {(['posts', 'users', 'categories'] as SearchTab[]).map(tab => (
                            <button
                                key={tab}
                                className={`search-tab ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {getTabCount(tab) > 0 && (
                                    <span className="tab-count">{getTabCount(tab)}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="search-results">
                        {activeTab === 'posts' && (
                            <div className="posts-results">
                                {searchResults.posts.length > 0 ? (
                                    searchResults.posts.map(post => (
                                        <PostCard
                                            key={post.id}
                                            post={post}
                                            onClick={() => onViewPost(post)}
                                            currentUser={currentUser}
                                            onNavigate={onNavigate}
                                        />
                                    ))
                                ) : (
                                    <div className="no-results">
                                        <span className="no-results-icon">📝</span>
                                        <p>No posts found matching "{query}"</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="users-results">
                                {searchResults.users.length > 0 ? (
                                    searchResults.users.map(user => (
                                        <div key={user.id} className="result-card user-result">
                                            <div className="user-avatar">
                                                {getInitials(user.first_name, user.last_name)}
                                            </div>
                                            <div className="user-info">
                                                <div className="user-name-row">
                                                    <h3>{user.first_name} {user.last_name}</h3>
                                                    {user.role !== 'user' && (
                                                        <span className={`role-tag ${user.role}`}>{user.role}</span>
                                                    )}
                                                    {user.is_verified && <span className="verified-tag">✓</span>}
                                                </div>
                                                <p className="user-email">{user.email}</p>
                                                <p className="user-bio">{user.bio}</p>
                                                <div className="user-stats">
                                                    <span>📝 {user.posts_count} posts</span>
                                                    <span>👥 {user.followers_count} followers</span>
                                                </div>
                                            </div>
                                            <button className="view-profile-btn" onClick={() => onNavigate(`profile/${user.id}`)}>View Profile</button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-results">
                                        <span className="no-results-icon">👤</span>
                                        <p>No users found matching "{query}"</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'categories' && (
                            <div className="categories-results">
                                {searchResults.categories.length > 0 ? (
                                    searchResults.categories.map(category => (
                                        <div key={category.id} className="result-card category-result">
                                            <div className="category-icon-large">
                                                {getCategoryIcon(category.slug)}
                                            </div>
                                            <div className="category-info">
                                                <h3>{category.name}</h3>
                                                <p>{category.description}</p>
                                                <span className="category-posts-count">
                                                    {category.posts_count} posts
                                                </span>
                                            </div>
                                            <button className="browse-category-btn">Browse</button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-results">
                                        <span className="no-results-icon">📂</span>
                                        <p>No categories found matching "{query}"</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {!hasSearched && (
                <div className="search-suggestions">
                    <h3>Popular Categories</h3>
                    <div className="suggestion-chips">
                        {initialCategories.length > 0 ? initialCategories.slice(0, 5).map(category => (
                            <button
                                key={category.id}
                                className="suggestion-chip"
                                onClick={() => handleSearch(category.name)}
                            >
                                {getCategoryIcon(category.slug)} {category.name}
                            </button>
                        )) : <p>Loading categories...</p>}
                    </div>

                    <h3>Trending Topics</h3>
                    <div className="trending-list">
                        <button onClick={() => handleSearch('React')}>
                            🔥 React Development
                        </button>
                        <button onClick={() => handleSearch('Exam')}>
                            🔥 Exams
                        </button>
                        <button onClick={() => handleSearch('GSoC')}>
                            🔥 Google Summer of Code
                        </button>
                        <button onClick={() => handleSearch('Tech Fest')}>
                            🔥 Tech Fest 2024
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Search;
