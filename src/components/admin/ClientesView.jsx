import './TurnosTable.css';
import { useEffect, useState } from 'react';
import { ref, get, update } from 'firebase/database';
import { db } from '../../firebase';
import './ClientesView.css';

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default function ClientesView() {
    const [clientes,  setClientes]  = useState([]);
    const [busqueda,  setBusqueda]  = useState('');
    const [expandido, setExpandido] = useState(null);
    const [bajando,   setBajando]   = useState(null); // whatsapp en proceso

    useEffect(() => { cargar(); }, []);

    async function cargar() {
        const snap   = await get(ref(db, 'turnos'));
        const raw    = snap.val() || {};
        // Preservar el ID de cada turno en Firebase
        const turnos = Object.entries(raw).map(([id, t]) => ({ ...t, _id: id }));

        const mapa = {};
        turnos.forEach(t => {
            const key = t.whatsapp || 'sin-telefono';
            if (!mapa[key]) {
                mapa[key] = { nombre: t.cliente, whatsapp: t.whatsapp, historial: [] };
            }
            mapa[key].historial.push(t);
            if (t.timestamp_creacion > (mapa[key]._ts || 0)) {
                mapa[key].nombre = t.cliente;
                mapa[key]._ts    = t.timestamp_creacion;
            }
        });

        const lista = Object.values(mapa).map(c => ({
            ...c,
            historial: c.historial.sort((a, b) =>
                new Date(b.año, b.mes, b.dia) - new Date(a.año, a.mes, a.dia)
            ),
        }));
        lista.sort((a, b) => a.nombre?.localeCompare(b.nombre));
        setClientes(lista);
    }

    const darDeBaja = async (cliente) => {
        const ok = window.confirm(
            `¿Dar de baja a ${cliente.nombre || cliente.whatsapp} de la lista de distribución?\n` +
            `Se eliminará su número de WhatsApp del sistema. El historial de turnos se conserva.`
        );
        if (!ok) return;

        setBajando(cliente.whatsapp);
        try {
            // Borrar solo el campo whatsapp en cada turno del cliente
            await Promise.all(
                cliente.historial.map(t => update(ref(db, `turnos/${t._id}`), { whatsapp: null }))
            );
            // Quitar de la lista local (ya no tiene número, no aparecerá en envíos)
            setClientes(prev => prev.filter(c => c.whatsapp !== cliente.whatsapp));
            setExpandido(null);
        } catch {
            alert('Error al dar de baja. Intentá de nuevo.');
        } finally {
            setBajando(null);
        }
    };

    const filtrados = clientes.filter(c =>
        c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.whatsapp?.includes(busqueda)
    );

    return (
        <div>
            <h1 className="admin-section-title">Fichas de Clientes</h1>

            <input
                className="admin-search"
                placeholder="Buscar por nombre o WhatsApp..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
            />

            <p style={{ fontFamily: 'sans-serif', fontSize: '0.85rem', color: '#aaa', marginBottom: '20px' }}>
                {filtrados.length} cliente{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}
            </p>

            {filtrados.map((c, i) => {
                const confirmados  = c.historial.filter(t => t.estado === 'confirmado');
                const totalGastado = confirmados.reduce((s, t) => s + (t.montoTotal || 0), 0);
                const abierto      = expandido === i;
                const ultimoTurno  = c.historial[0]; // ya está ordenado por más reciente
                const enBaja       = bajando === c.whatsapp;

                return (
                    <div key={i} className="cliente-card">
                        {/* Cabecera clickeable */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div
                                style={{ flex: 1, cursor: 'pointer' }}
                                onClick={() => setExpandido(abierto ? null : i)}
                            >
                                <h3 style={{ margin: 0 }}>{c.nombre || 'Sin nombre'}</h3>
                                <p className="cliente-meta" style={{ marginBottom: 0 }}>
                                    📱 {c.whatsapp || '-'}
                                    &nbsp;·&nbsp;
                                    {c.historial.length} turno{c.historial.length !== 1 ? 's' : ''}
                                    &nbsp;·&nbsp;
                                    Último: {ultimoTurno
                                        ? `${ultimoTurno.dia} ${MESES[ultimoTurno.mes]} ${ultimoTurno.año}`
                                        : '-'}
                                    &nbsp;·&nbsp;
                                    Total: <strong style={{ color: 'var(--lila)' }}>${totalGastado.toLocaleString('es-AR')}</strong>
                                </p>
                            </div>

                                <span
                                    style={{ fontSize: '1.2rem', color: '#ccc', cursor: 'pointer', marginLeft: '12px' }}
                                    onClick={() => setExpandido(abierto ? null : i)}
                                >
                                    {abierto ? '▲' : '▼'}
                                </span>
                        </div>

                        {/* Historial expandido */}
                        {abierto && (
                            <>
                            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginTop: '14px' }}>
                                <table className="cliente-historial">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Hora</th>
                                            <th>Servicio</th>
                                            <th>Estado</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {c.historial.map((t, j) => (
                                            <tr key={j}>
                                                <td>{t.dia} {MESES[t.mes]} {t.año}</td>
                                                <td>{t.hora}hs</td>
                                                <td style={{ color: 'var(--lila)', fontWeight: '600' }}>{t.servicio}</td>
                                                <td>
                                                    <span className={`status-${t.estado}`}>
                                                        {t.estado ? t.estado.charAt(0).toUpperCase() + t.estado.slice(1) : ''}
                                                    </span>
                                                </td>
                                                <td>${(t.montoTotal || 0).toLocaleString('es-AR')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button
                                    onClick={() => darDeBaja(c)}
                                    disabled={enBaja}
                                    style={{
                                        marginTop: '14px',
                                        background: 'none',
                                        border: '1px solid #ffcdd2',
                                        borderRadius: '8px',
                                        color: '#e57373',
                                        fontFamily: 'sans-serif',
                                        fontSize: '0.82rem',
                                        padding: '6px 14px',
                                        cursor: enBaja ? 'not-allowed' : 'pointer',
                                        opacity: enBaja ? 0.6 : 1,
                                    }}
                                >
                                    {enBaja ? '⏳ Procesando...' : '🚫 Dar de baja (quitar de lista de envíos)'}
                                </button>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
