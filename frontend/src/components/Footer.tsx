import './Footer.css'

interface FooterProps {
    isAuthenticated: boolean
    onLogout: () => void
}

export default function Footer({ isAuthenticated, onLogout }: FooterProps) {
    return (
        <footer className="footer">
            <div className="container footer-content">
                <div className="footer-left">
                    <p>&copy; {new Date().getFullYear()} Talk@FCIT. All rights reserved.</p>
                </div>

                {isAuthenticated && (
                    <div className="footer-right">
                        <button className="btn-logout-footer" onClick={onLogout}>
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </footer>
    )
}
