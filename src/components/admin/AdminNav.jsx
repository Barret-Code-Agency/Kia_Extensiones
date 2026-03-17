const ITEMS = [
    { id: 'dashboard', label: 'Dashboard',          icon: '📊' },
    { id: 'agenda',    label: 'Gestión de Agenda',  icon: '📅' },
    { id: 'pagos',     label: 'Pagos',              icon: '💰' },
    { id: 'clientes',  label: 'Fichas de Clientes', icon: '👥' },
    { id: 'galeria',   label: 'Galería de Fotos',   icon: '📸' },
    { id: 'precios',   label: 'Modificar Precios',  icon: '💲' },
    { id: 'bloqueos',  label: 'Bloquear Días',      icon: '🔒' },
];

export default function AdminNav({ activo, onChange }) {
    return (
        <aside className="admin-sidebar">
            <div className="admin-sidebar-logo">Kia Extensiones</div>

            <nav style={{ marginTop: '10px' }}>
                {ITEMS.map(item => (
                    <button
                        key={item.id}
                        className={`admin-nav-btn${activo === item.id ? ' active' : ''}`}
                        onClick={() => onChange(item.id)}
                    >
                        <span className="admin-nav-icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <div style={{
                marginTop: 'auto', padding: '20px',
                fontSize: '0.75rem', color: '#ccc',
                fontFamily: 'sans-serif', textAlign: 'center',
            }}>
                Panel de Administración
            </div>
        </aside>
    );
}
