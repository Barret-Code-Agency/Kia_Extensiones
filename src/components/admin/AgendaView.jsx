import './TurnosTable.css';
import { useEffect, useState } from 'react';
import { ref, onValue, get, update } from 'firebase/database';
import { db } from '../../firebase';
import AgendaCalendar from './AgendaCalendar';
import EditTurnoModal from './EditTurnoModal';

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function AgendaView() {
    const [tab,       setTab]       = useState('lista');   // 'lista' | 'calendario'
    const [turnos,    setTurnos]    = useState([]);
    const [bloqueados,setBloqueados]= useState([]);
    const [editando,  setEditando]  = useState(null);   // turno a editar
    const [diaDetalle,setDiaDetalle]= useState(null);   // { dia, mes, año } para popup

    useEffect(() => {
        const unsubTurnos = onValue(ref(db, 'turnos'), snap => {
            setTurnos(Object.values(snap.val() || {}));
        });
        const unsubBloq = onValue(ref(db, 'bloqueos'), snap => {
            setBloqueados(Object.keys(snap.val() || {}));
        });
        return () => { unsubTurnos(); unsubBloq(); };
    }, []);

    const cancelarTurno = async (turno) => {
        if (!confirm(`¿Cancelar el turno de ${turno.cliente}?`)) return;
        await update(ref(db, `turnos/${turno.id}`), { estado: 'cancelado' });
    };

    // Turnos del día seleccionado en el calendario
    const turnosDelDia = diaDetalle
        ? turnos.filter(t => t.dia === diaDetalle.dia && t.mes === diaDetalle.mes && t.año === diaDetalle.año)
        : [];

    const turnosOrdenados = [...turnos].sort((a, b) => {
        const fa = new Date(a.año, a.mes, a.dia);
        const fb = new Date(b.año, b.mes, b.dia);
        return fa - fb;
    });

    return (
        <div>
            <h1 className="admin-section-title">Gestión de Agenda</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
                {[['lista', '📋 Lista de Turnos'], ['calendario', '🗓 Vista Mensual']].map(([id, label]) => (
                    <button
                        key={id}
                        className={`btn-admin${tab === id ? '' : ' rosa'}`}
                        style={{ opacity: tab === id ? 1 : 0.5 }}
                        onClick={() => setTab(id)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── LISTA ── */}
            {tab === 'lista' && (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="tabla-turnos">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>WhatsApp</th>
                            <th>Fecha y Hora</th>
                            <th>Servicio</th>
                            <th>Estado</th>
                            <th>Pago</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {turnosOrdenados.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: '30px', fontFamily: 'sans-serif' }}>Sin turnos</td></tr>
                        ) : turnosOrdenados.map((t, i) => (
                            <tr key={t.id || i}>
                                <td>{t.cliente || '-'}</td>
                                <td>{t.whatsapp || '-'}</td>
                                <td style={{ whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                                    <div style={{ fontSize: '0.82rem' }}>{t.dia}/{t.mes + 1}/{t.año}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#999' }}>{t.hora}hs</div>
                                </td>
                                <td style={{ color: 'var(--lila)', fontWeight: 'bold' }}>{t.servicio}</td>
                                <td><span className={`status-${t.estado}`}>{t.estado ? t.estado.charAt(0).toUpperCase() + t.estado.slice(1) : ''}</span></td>
                                <td className="info-dinero">
                                    <span className="pagado">Seña: ${t.montoSeña || 0}</span><br />
                                    <span className="restante">Resta: ${(t.montoTotal || 0) - (t.montoSeña || 0)}</span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <button
                                            className="btn-admin"
                                            style={{ fontSize: '0.78rem', padding: '5px 12px', width: '80px' }}
                                            onClick={() => setEditando(t)}
                                        >
                                            Editar
                                        </button>
                                        {t.estado !== 'cancelado' && (
                                            <button
                                                className="btn-admin rojo"
                                                style={{ fontSize: '0.78rem', padding: '5px 12px', width: '80px' }}
                                                onClick={() => cancelarTurno(t)}
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}

            {/* ── CALENDARIO ── */}
            {tab === 'calendario' && (
                <div style={{ display: 'grid', gridTemplateColumns: diaDetalle ? '1fr 320px' : '1fr', gap: '30px', minWidth: 0, overflow: 'hidden' }}>
                    <AgendaCalendar
                        turnos={turnos}
                        bloqueados={bloqueados}
                        diaDetalle={diaDetalle}
                        onDayClick={(dia, mes, año) =>
                            setDiaDetalle(prev =>
                                prev?.dia === dia && prev?.mes === mes && prev?.año === año ? null : { dia, mes, año }
                            )
                        }
                    />

                    {/* Panel lateral del día */}
                    {diaDetalle && (
                        <div style={{
                            background: 'white', borderRadius: '16px', padding: '20px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            height: 'fit-content',
                        }}>
                            <h3 style={{ color: 'var(--lila)', fontFamily: 'sans-serif', marginBottom: '14px' }}>
                                {diaDetalle.dia} de {MESES[diaDetalle.mes]} {diaDetalle.año}
                            </h3>
                            {turnosDelDia.length === 0 ? (
                                <p style={{ color: '#aaa', fontFamily: 'sans-serif', fontSize: '0.9rem' }}>Sin turnos este día</p>
                            ) : turnosDelDia
                                .sort((a, b) => a.hora?.localeCompare(b.hora))
                                .map((t, i) => (
                                <div key={i} style={{
                                    borderLeft: `3px solid ${t.estado === 'confirmado' ? 'var(--lila)' : 'var(--rosa)'}`,
                                    paddingLeft: '12px', marginBottom: '14px',
                                    fontFamily: 'sans-serif', fontSize: '0.88rem',
                                }}>
                                    <p style={{ fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>{t.hora}hs — {t.cliente}</p>
                                    <p style={{ color: 'var(--lila)', marginBottom: '4px' }}>{t.servicio}</p>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <span className={`status-${t.estado}`}>{t.estado ? t.estado.charAt(0).toUpperCase() + t.estado.slice(1) : ''}</span>
                                        <button
                                            className="btn-admin"
                                            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                                            onClick={() => setEditando(t)}
                                        >✏️</button>
                                        {t.estado !== 'cancelado' && (
                                            <button
                                                className="btn-admin rojo"
                                                style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                                                onClick={() => cancelarTurno(t)}
                                            >✕</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal de edición */}
            {editando && (
                <EditTurnoModal turno={editando} onClose={() => setEditando(null)} />
            )}
        </div>
    );
}
