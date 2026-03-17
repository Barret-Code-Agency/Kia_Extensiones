import './TurnosTable.css';
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase';

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function PagosView() {
    const [turnos,   setTurnos]   = useState([]);
    const [filtroMes, setFiltroMes] = useState(new Date().getMonth());
    const [filtroAño, setFiltroAño] = useState(new Date().getFullYear());

    useEffect(() => {
        const unsubscribe = onValue(ref(db, 'turnos'), snap => {
            setTurnos(Object.values(snap.val() || {}));
        });
        return unsubscribe;
    }, []);

    const filtrados = turnos.filter(t => t.mes === filtroMes && t.año === filtroAño);
    const totalCobrado  = filtrados.filter(t => t.estado === 'confirmado').reduce((s, t) => s + (t.montoSeña     || 0), 0);
    const totalPendiente= filtrados.filter(t => t.estado === 'confirmado').reduce((s, t) => s + (t.montoRestante || 0), 0);

    // Años disponibles en los datos
    const años = [...new Set(turnos.map(t => t.año))].sort();

    return (
        <div>
            <h1 className="admin-section-title">Pagos</h1>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                    value={filtroMes}
                    onChange={e => setFiltroMes(Number(e.target.value))}
                    style={{ padding: '8px 14px', borderRadius: '20px', border: '1.5px solid #ddd', fontFamily: 'sans-serif' }}
                >
                    {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select
                    value={filtroAño}
                    onChange={e => setFiltroAño(Number(e.target.value))}
                    style={{ padding: '8px 14px', borderRadius: '20px', border: '1.5px solid #ddd', fontFamily: 'sans-serif' }}
                >
                    {(años.length ? años : [new Date().getFullYear()]).map(a => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>
            </div>

            {/* Resumen */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
                <div className="stat-card" style={{ flex: 1, minWidth: '160px' }}>
                    <div className="stat-value">${totalCobrado.toLocaleString('es-AR')}</div>
                    <div className="stat-label">Total cobrado (señas)</div>
                </div>
                <div className="stat-card rosa" style={{ flex: 1, minWidth: '160px' }}>
                    <div className="stat-value">${totalPendiente.toLocaleString('es-AR')}</div>
                    <div className="stat-label">Pendiente de cobro en el local</div>
                </div>
                <div className="stat-card" style={{ flex: 1, minWidth: '160px' }}>
                    <div className="stat-value">{filtrados.length}</div>
                    <div className="stat-label">Turnos en el período</div>
                </div>
            </div>

            {/* Tabla */}
            <table className="tabla-turnos">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Servicio</th>
                        <th>Estado</th>
                        <th>Seña pagada</th>
                        <th>Resto a cobrar</th>
                    </tr>
                </thead>
                <tbody>
                    {filtrados.length === 0 ? (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', color: '#aaa', fontFamily: 'sans-serif', padding: '30px' }}>
                                Sin turnos para {MESES[filtroMes]} {filtroAño}
                            </td>
                        </tr>
                    ) : filtrados.map((t, i) => (
                        <tr key={t.id || i}>
                            <td>{t.cliente || '-'}</td>
                            <td style={{ whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                                <div style={{ fontSize: '0.82rem' }}>{t.dia}/{t.mes + 1}/{t.año}</div>
                                <div style={{ fontSize: '0.75rem', color: '#999' }}>{t.hora}hs</div>
                            </td>
                            <td style={{ color: 'var(--lila)', fontWeight: 'bold' }}>{t.servicio}</td>
                            <td><span className={`status-${t.estado}`}>{t.estado ? t.estado.charAt(0).toUpperCase() + t.estado.slice(1) : ''}</span></td>
                            <td className="pagado" style={{ fontWeight: 'bold' }}>
                                ${(t.montoSeña || 0).toLocaleString('es-AR')}
                            </td>
                            <td className="restante">
                                ${(t.montoRestante || 0).toLocaleString('es-AR')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
