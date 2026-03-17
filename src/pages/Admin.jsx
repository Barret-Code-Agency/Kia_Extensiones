import '../components/admin/AdminLayout.css';
import { useState } from 'react';
import AdminNav      from '../components/admin/AdminNav';
import Dashboard     from '../components/admin/Dashboard';
import AgendaView    from '../components/admin/AgendaView';
import PagosView     from '../components/admin/PagosView';
import ClientesView  from '../components/admin/ClientesView';
import GaleriaAdmin  from '../components/admin/GaleriaAdmin';
import PreciosTable  from '../components/admin/PreciosTable';
import BloqueosDias  from '../components/admin/BloqueosDias';

const SECCIONES = {
    dashboard: Dashboard,
    agenda:    AgendaView,
    pagos:     PagosView,
    clientes:  ClientesView,
    galeria:   GaleriaAdmin,
    precios:   PreciosTable,
    bloqueos:  BloqueosDias,
};

export default function Admin() {
    const [seccion, setSeccion] = useState('dashboard');
    const [mobileShowMenu, setMobileShowMenu] = useState(true);
    const Componente = SECCIONES[seccion];

    const handleChange = (id) => {
        setSeccion(id);
        setMobileShowMenu(false);
    };

    return (
        <div className={`admin-layout ${mobileShowMenu ? 'mobile-menu' : 'mobile-content'}`}>
            <AdminNav activo={seccion} onChange={handleChange} />
            <main className="admin-content">
                <button className="admin-mobile-back" onClick={() => setMobileShowMenu(true)}>
                    ← Menú
                </button>
                <Componente />
            </main>
        </div>
    );
}
