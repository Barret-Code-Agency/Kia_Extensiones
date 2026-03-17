import { useState } from 'react';
import './AdminLogin.css';

export default function AdminLogin({ onLogin }) {
    const [usuario,  setUsuario]  = useState('');
    const [password, setPassword] = useState('');
    const [error,    setError]    = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setCargando(true);
        setError('');

        const userOk = usuario  === import.meta.env.VITE_ADMIN_USER;
        const passOk = password === import.meta.env.VITE_ADMIN_PASS;

        setTimeout(() => {
            if (userOk && passOk) {
                sessionStorage.setItem('admin_auth', '1');
                onLogin();
            } else {
                setError('Usuario o contraseña incorrectos');
                setPassword('');
            }
            setCargando(false);
        }, 400);
    };

    return (
        <div className="login-overlay">
            <form className="login-card" onSubmit={handleSubmit} noValidate>
                <h1 className="login-title">Kia Extensiones</h1>
                <p className="login-subtitle">Panel de administración</p>

                <div className="login-field">
                    <label htmlFor="admin-user">Usuario</label>
                    <input
                        id="admin-user"
                        type="text"
                        autoComplete="username"
                        value={usuario}
                        onChange={e => setUsuario(e.target.value)}
                        required
                    />
                </div>

                <div className="login-field">
                    <label htmlFor="admin-pass">Contraseña</label>
                    <input
                        id="admin-pass"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <p className="login-error">{error}</p>}

                <button type="submit" className="login-btn" disabled={cargando}>
                    {cargando ? 'Verificando...' : 'Ingresar'}
                </button>
            </form>
        </div>
    );
}
