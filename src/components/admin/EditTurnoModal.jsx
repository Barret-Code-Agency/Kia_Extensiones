import './EditTurnoModal.css';
import { useState } from 'react';
import { ref, update } from 'firebase/database';
import { db } from '../../firebase';
import { RANGOS_HORA } from '../../data/servicios';

function generarDias60() {
    const hoy  = new Date();
    const mapa = new Map();
    for (let i = 0; i < 60; i++) {
        const f   = new Date();
        f.setDate(hoy.getDate() + i);
        const mesIdx = f.getMonth();
        const año    = f.getFullYear();
        const key    = `${año}-${mesIdx}`;
        if (!mapa.has(key)) {
            const nombre = f.toLocaleString('es-ES', { month: 'long' });
            mapa.set(key, {
                nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1),
                año,
                dias: [],
            });
        }
        mapa.get(key).dias.push({
            dia: f.getDate(), mesIdx, año,
            mesNombre: f.toLocaleString('es-ES', { month: 'short' }),
            esDomingo: f.getDay() === 0,
        });
    }
    return Array.from(mapa.values());
}

const MESES_CAL = generarDias60();
const MESES_ES  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                   "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function EditTurnoModal({ turno, onClose }) {
    const [diaInfo, setDiaInfo] = useState(null);
    const [hora,    setHora]    = useState(null);
    const [saving,  setSaving]  = useState(false);

    const handleGuardar = async () => {
        if (!diaInfo && !hora) { onClose(); return; }
        setSaving(true);
        const updates = {};
        if (diaInfo) { updates.dia = diaInfo.dia; updates.mes = diaInfo.mesIdx; updates.año = diaInfo.año; }
        if (hora)    { updates.hora = hora; }
        await update(ref(db, `turnos/${turno.id}`), updates);
        setSaving(false);
        onClose();
    };

    return (
        <div className="edit-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="edit-modal-content">
                <span className="close-modal" onClick={onClose}>&times;</span>
                <h2 className="edit-modal-title">Modificar Turno</h2>

                {/* Info actual */}
                <div style={{
                    background: '#f9f9f9', borderRadius: '10px', padding: '14px',
                    marginBottom: '20px', fontFamily: 'sans-serif', fontSize: '0.9rem',
                }}>
                    <p><strong>Cliente:</strong> {turno.cliente}</p>
                    <p><strong>Turno actual:</strong> {turno.dia}/{turno.mes + 1}/{turno.año} — {turno.hora}hs</p>
                    <p><strong>Servicio:</strong> {turno.servicio}</p>
                </div>

                {/* Selector de nueva fecha */}
                <p style={{ fontFamily: 'sans-serif', fontWeight: 'bold', color: 'var(--lila)', marginBottom: '10px' }}>
                    Nueva fecha (opcional):
                </p>
                <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
                    {MESES_CAL.map((mes, mi) => (
                        <div key={mi} style={{ marginBottom: '16px' }}>
                            <p style={{ fontWeight: 'bold', color: 'var(--lila)', fontSize: '0.85rem', marginBottom: '6px', fontFamily: 'sans-serif' }}>
                                {mes.nombre} {mes.año}
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', gap: '6px' }}>
                                {mes.dias.map((d, i) => {
                                    const sel = diaInfo?.dia === d.dia && diaInfo?.mesIdx === d.mesIdx && diaInfo?.año === d.año;
                                    let cls = 'calendar-day';
                                    if (d.esDomingo) cls += ' day-busy';
                                    else if (sel)    cls += ' day-free day-selected';
                                    else             cls += ' day-free';
                                    return (
                                        <div key={i} className={cls}
                                            style={{ ...(d.esDomingo ? { opacity: 0.4 } : {}), padding: '6px 4px' }}
                                            onClick={!d.esDomingo ? () => setDiaInfo(d) : undefined}
                                        >
                                            <strong style={{ fontSize: '0.8rem' }}>{d.dia}</strong>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Selector de nueva hora */}
                <p style={{ fontFamily: 'sans-serif', fontWeight: 'bold', color: 'var(--lila)', marginBottom: '10px' }}>
                    Nuevo horario (opcional):
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    {RANGOS_HORA.map(h => (
                        <button
                            key={h}
                            className={`hora-btn${hora === h ? ' selected' : ''}`}
                            onClick={() => setHora(h)}
                        >
                            {h}
                        </button>
                    ))}
                </div>

                {/* Resumen del cambio */}
                {(diaInfo || hora) && (
                    <div style={{
                        background: '#f5f0ff', borderRadius: '10px', padding: '12px',
                        marginBottom: '16px', fontFamily: 'sans-serif', fontSize: '0.88rem', color: 'var(--lila)',
                    }}>
                        <strong>Nuevo turno:</strong>{' '}
                        {diaInfo
                            ? `${diaInfo.dia} de ${MESES_ES[diaInfo.mesIdx]} ${diaInfo.año}`
                            : `${turno.dia}/${turno.mes + 1}/${turno.año}`
                        }
                        {' — '}
                        {hora || turno.hora}hs
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-admin" onClick={handleGuardar} disabled={saving}>
                        {saving ? 'Guardando...' : '✅ Guardar cambios'}
                    </button>
                    <button className="btn-admin rojo" onClick={onClose}>Cancelar</button>
                </div>
            </div>
        </div>
    );
}
