import './Header.css';
export default function Header({ onAbrirCalendario }) {
    return (
        <header className="header">
            <div className="header-left">
                <button className="btn-agenda" onClick={onAbrirCalendario}>
                    Agenda de Turnos
                </button>
            </div>
            <div className="title-container">
                <h1 className="brand-name">Kia Extensiones</h1>
            </div>
            <div className="logo-container">
                <img src="/images/Solo logo.png" alt="Logo" className="logo-image" />
            </div>
        </header>
    );
}
