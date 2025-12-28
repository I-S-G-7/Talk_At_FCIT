import { useState, useEffect } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Profile from './pages/Profile'
import CreatePost from './pages/CreatePost'
import PostDetail from './pages/PostDetail'
import Notifications from './pages/Notifications'
import Search from './pages/Search'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import AddUser from './pages/AddUser'
import Moderation from './pages/Moderation'
import { type Post, type User } from './data/mockData'
import { auth } from './services/api'

type Page = 'home' | 'login' | 'register' | 'profile' | 'create-post' | 'post-detail' | 'notifications' | 'search' | 'messages' | 'chat' | 'add-user' | 'moderation'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  // Check for existing session
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        try {
          const response = await auth.getCurrentUser()
          setCurrentUser(response.data)
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Session expired', error)
          auth.logout()
        }
      }

    }
    checkAuth()
  }, [])

  const handleLogin = (user: User) => {
    setIsAuthenticated(true)
    setCurrentUser(user)
    setCurrentPage('home')
  }

  const handleLogout = () => {
    auth.logout()
    setIsAuthenticated(false)
    setCurrentUser(null)
    setCurrentPage('home')
  }



  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page)
  }

  const handleViewPost = (post: Post) => {
    setSelectedPost(post)
    setCurrentPage('post-detail')
  }

  const handleBackFromPost = () => {
    setSelectedPost(null)
    setCurrentPage('home')
  }

  const renderPage = () => {
    if (currentPage.startsWith('post/')) {
      const postId = parseInt(currentPage.split('/')[1]);
      return (
        <PostDetail
          postId={postId} // Pass ID directly
          post={selectedPost} // Optional fallback
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onBack={handleBackFromPost}
        />
      );
    }

    if (currentPage.startsWith('profile/')) {
      const userId = parseInt(currentPage.split('/')[1]);
      return <Profile userId={userId} user={null} onNavigate={handleNavigate} currentUser={currentUser} />;
    }

    switch (currentPage) {
      case 'login':
        return <Login onLogin={handleLogin} />
      case 'profile':
        return <Profile user={currentUser} onNavigate={handleNavigate} currentUser={currentUser} />
      case 'create-post':
        return <CreatePost onNavigate={handleNavigate} currentUser={currentUser} />
      case 'post-detail':
        return selectedPost ? (
          <PostDetail
            postId={selectedPost.id}
            post={selectedPost}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onBack={handleBackFromPost}
          />
        ) : (
          <Home
            onNavigate={handleNavigate}
            isAuthenticated={isAuthenticated}
            onViewPost={handleViewPost}
            currentUser={currentUser}
          />
        )
      case 'notifications':
        return <Notifications />
      case 'search':
        return <Search onNavigate={handleNavigate} onViewPost={handleViewPost} currentUser={currentUser} />
      case 'messages':
        return <Messages onNavigate={handleNavigate} currentUser={currentUser} />
      case 'chat':
        return <Chat onNavigate={handleNavigate} currentUser={currentUser} />
      case 'add-user':
        return <AddUser onNavigate={handleNavigate} />
      case 'moderation':
        return <Moderation onNavigate={handleNavigate} currentUser={currentUser} />
      default:
        return (
          <Home
            onNavigate={handleNavigate}
            isAuthenticated={isAuthenticated}
            onViewPost={handleViewPost}
            currentUser={currentUser}
          />
        )
    }
  }

  return (
    <div className="app">
      <Navbar
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onNavigate={handleNavigate}
        activePage={currentPage}

      />
      <main className="main-content">
        {renderPage()}
      </main>
      <Footer isAuthenticated={isAuthenticated} onLogout={handleLogout} />
    </div>
  )
}

export default App
