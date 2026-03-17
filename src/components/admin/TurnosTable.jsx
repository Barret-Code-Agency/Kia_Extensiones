import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase';

export default function TurnosTable() {
    const [turnos, setTurnos] = useState([]);

    useEffect(() => {
        const turnosRef   = ref(db, 'turnos');
        const unsubscribe = onValue(turnosRef, (snapshot) => {
            const data = snapshot.val() || {};
            setTurnos(Object.values(data));
        });
        return unsubscribe; // cleanup del listener al desmontar
    }, []);

    return (
        <table className="tabla-turnos">
            <thead>
                <tr>
                    <th>Cliente</th>
                    <th>WhatsApp</th>
                    <th>Fecha y Hora</th>
                    <th>Servicio Elegido</th>
                    <th>Estado</th>
                    <th>Detalle Pago</th>
                </tr>
            </thead>
            <tbody>
                {turnos.map((t, i) => (
                    <tr key={t.id || i}>
                        <td>{t.cliente || 'Sin nombre'}</td>
                        <td>{t.whatsapp || '-'}</td>
                        <td>{t.dia}/{parseInt(t.mes) + 1} - {t.hora}hs</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--lila)' }}>
                            {t.servicio || 'No especificado'}
                        </td>
                        <td>
                            <span className={`status-${t.estado}`}>
                                {t.estado ? t.estado.charAt(0).toUpperCase() + t.estado.slice(1) : ''}
                            </span>
                        </td>
                        <td className="info-dinero">
                            <span className="pagado">Pagó: ${t.montoSeña || 0}</span>
                            <br />
                            <span className="restante">
                                Resta: ${(t.montoTotal || 0) - (t.montoSeña || 0)}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
