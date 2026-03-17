import { useEffect, useState } from 'react';
import { ref, get, set } from 'firebase/database';
import { db } from '../../firebase';
import './PreciosTable.css';
import { DATOS_INICIALES } from '../../data/servicios';

export default function PreciosTable() {
    const [servicios,   setServicios]   = useState([]);
    const [guardado,    setGuardado]    = useState(false);
    const [notifState,  setNotifState]  = useState('idle'); // idle | sending | ok | error

    useEffect(() => {
        async function cargar() {
            const snapshot = await get(ref(db, 'servicios'));
            if (snapshot.exists()) {
                // Migrar: agregar duracion=1 si falta
                const data = snapshot.val();
                setServicios(data.map(s => ({ duracion: 1, ...s })));
            } else {
                await set(ref(db, 'servicios'), DATOS_INICIALES);
                setServicios(DATOS_INICIALES);
            }
        }
        cargar();
    }, []);

    const handleChange = (index, campo, valor) => {
        setServicios(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [campo]: campo === 'nombre' ? valor : (parseInt(valor) || 0) };
            return updated;
        });
        setGuardado(false);
    };

    const notificarPrecios = async () => {
        if (!window.confirm('¿Enviar la lista de precios actualizada a todos los clientes por WhatsApp?')) return;
        setNotifState('sending');
        try {
            const resp = await fetch(`${import.meta.env.VITE_API_URL || ''}/notificar-precios`, { method: 'POST' });
            const data = await resp.json();
            if (data.ok) {
                setNotifState('ok');
                setTimeout(() => setNotifState('idle'), 4000);
                alert(`✅ Enviado a ${data.enviados} de ${data.total} clientes`);
            } else {
                setNotifState('error');
            }
        } catch {
            setNotifState('error');
        }
    };

    const guardarCambios = async () => {
        try {
            await set(ref(db, 'servicios'), servicios);
            setGuardado(true);
            setTimeout(() => setGuardado(false), 3000);
        } catch {
            alert('Error al guardar. Intentá de nuevo.');
        }
    };

    // Agrupar por categoría
    const categorias = [...new Set(servicios.map(s => s.cat))];

    return (
        <div className="precios-wrap">
            <h1 className="admin-section-title">Modificar Precios</h1>
            <p style={{ fontFamily: 'sans-serif', color: '#888', marginBottom: '24px', fontSize: '0.9rem' }}>
                Editá precios y duración de cada servicio. La duración afecta los turnos disponibles por día.
            </p>

            {categorias.map(cat => (
                <div key={cat} style={{ marginBottom: '32px' }}>
                    <h3 style={{
                        color: 'var(--rosa)', fontFamily: 'sans-serif',
                        fontSize: '1rem', marginBottom: '10px',
                        borderBottom: '2px solid #fce4ec', paddingBottom: '6px',
                    }}>{cat}</h3>

                    <table className="tabla-turnos">
                        <thead>
                            <tr>
                                <th>Servicio</th>
                                <th>Precio Total ($)</th>
                                <th>Duración (hs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {servicios
                                .map((s, i) => ({ ...s, _i: i }))
                                .filter(s => s.cat === cat)
                                .map(serv => (
                                    <tr key={serv._i}>
                                        <td style={{ fontFamily: 'sans-serif', fontSize: '0.9rem' }}>
                                            {serv.nombre}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span style={{ color: '#888', fontFamily: 'sans-serif' }}>$</span>
                                                <input
                                                    type="number"
                                                    value={serv.precio}
                                                    min={0}
                                                    onChange={e => handleChange(serv._i, 'precio', e.target.value)}
                                                    style={{
                                                        width: '100px', padding: '6px 8px',
                                                        border: '1px solid #e0e0e0', borderRadius: '8px',
                                                        fontFamily: 'sans-serif', fontSize: '0.9rem',
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={(serv.duracion || 1) * 2}
                                                min={1}
                                                max={12}
                                                onChange={e => handleChange(serv._i, 'duracion', parseInt(e.target.value) || 1)}
                                                style={{
                                                    width: '60px', padding: '6px 8px',
                                                    border: '1px solid #e0e0e0', borderRadius: '8px',
                                                    fontFamily: 'sans-serif', fontSize: '0.9rem',
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                <button className="btn-admin" onClick={guardarCambios}>
                    💾 Guardar Cambios
                </button>
                <button
                    className="btn-admin"
                    onClick={notificarPrecios}
                    disabled={notifState === 'sending'}
                    style={{ background: notifState === 'ok' ? '#25d366' : undefined }}
                >
                    {notifState === 'sending' ? '⏳ Enviando...' : '📲 Notificar precios por WhatsApp'}
                </button>
                {guardado && (
                    <span style={{ color: 'green', fontFamily: 'sans-serif', fontSize: '0.9rem' }}>
                        ✓ Guardado correctamente
                    </span>
                )}
                {notifState === 'error' && (
                    <span style={{ color: 'red', fontFamily: 'sans-serif', fontSize: '0.9rem' }}>
                        ❌ Error al enviar
                    </span>
                )}
            </div>
        </div>
    );
}
