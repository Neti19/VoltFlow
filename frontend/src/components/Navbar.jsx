import { Link } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav style={{ padding: '1rem', background: '#1e293b', color: 'white', display: 'flex', gap: '20px' }}>
            <Link to="/" style={{ color: '#4ade80', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.2rem' }}>VoltFlow</Link>
            <Link to="/stations" style={{ color: 'white', textDecoration: 'none' }}>Find Chargers</Link>
            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>Register</Link>
        </nav>
    );
}