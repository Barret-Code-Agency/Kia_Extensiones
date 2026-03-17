import { useState, useEffect } from 'react';
import { ref, get, push, set } from 'firebase/database';
import { db } from '../firebase';
import { DATOS_INICIALES, PRECIO_RESERVA_PORCENTAJE, RANGOS_HORA } from '../data/servicios';
import BookingCalendar  from './BookingCalendar';
import BookingTimeSlots from './BookingTimeSlots';
import BookingForm      from './BookingForm';
import './BookingModal.css';

// ─── Helpers de calendario ────────────────────────────────────────────────────
const EASTER_BM = { 2025: [2025,4,20], 2026: [2026,4,5], 2027: [2027,3,28] };
export function getHolidaysAR_BM(año) {
    const fijos = [[1,1],[3,24],[4,2],[5,1],[5,25],[6,20],[7,9],[8,17],[10,12],[11,20],[12,8],[12,25]];
    const keys  = new Set(fijos.map(([m,d]) => `${año}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`));
    const e = EASTER_BM[año];
    if (e) {
        const pascua = new Date(e[0], e[1]-1, e[2]);
        [-48,-47,-2].forEach(offset => {
            const d = new Date(pascua); d.setDate(d.getDate()+offset);
            keys.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
        });
    }
    return keys;
}

const DIAS_SEMANA_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function generarMeses() {
    const hoy      = new Date();
    const mesesMap = new Map();
    for (let i = 0; i < 60; i++) {
        const f   = new Date();
        f.setDate(hoy.getDate() + i);
        const mesIdx    = f.getMonth();
        const año       = f.getFullYear();
        const key       = `${año}-${mesIdx}`;
        const diaSemana = f.getDay();
        const colIdx    = diaSemana === 0 ? 6 : diaSemana - 1;
        if (!mesesMap.has(key)) {
            const nombreLargo = f.toLocaleString('es-ES', { month: 'long' });
            mesesMap.set(key, {
                nombre: nombreLargo.charAt(0).toUpperCase() + nombreLargo.slice(1),
                año, offset: colIdx, dias: [],
            });
        }
        mesesMap.get(key).dias.push({
            dia: f.getDate(), mesIdx,
            mesNombre: f.toLocaleString('es-ES', { month: 'short' }),
            año, esDomingo: diaSemana === 0,
            diaSemanaCorto: DIAS_SEMANA_CORTO[colIdx], colIdx,
        });
    }
    return Array.from(mesesMap.values());
}

const MESES = generarMeses();

// ─── Componente principal ─────────────────────────────────────────────────────
export default function BookingModal({ isOpen, onClose }) {
    const [diaInfo,      setDiaInfo]      = useState(null);
    const [hora,         setHora]         = useState(null);
    const [servicio,     setServicio]     = useState({ nombre: '', precio: 0 });
    const [nombre,       setNombre]       = useState('');
    const [whatsapp,     setWhatsapp]     = useState('');
    const [confirmados,  setConfirmados]  = useState([]);
    const [servicios,    setServicios]    = useState([]);
    const [bloqueados,   setBloqueados]   = useState({});
    const [bloqueosHora, setBloqueosHora] = useState({});
    const [desbloqueos,  setDesbloqueos]  = useState({});
    const [isMobile,     setIsMobile]     = useState(window.innerWidth < 600);
    const [isXSmall,     setIsXSmall]     = useState(window.innerWidth < 500);

    useEffect(() => {
        const check = () => {
            setIsMobile(window.innerWidth < 600);
            setIsXSmall(window.innerWidth < 500);
        };
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        async function cargar() {
            const [snapTurnos, snapServs, snapBloq, snapBloqHora, snapDesbl] = await Promise.all([
                get(ref(db, 'turnos')),
                get(ref(db, 'servicios')),
                get(ref(db, 'bloqueos')),
                get(ref(db, 'bloqueosHora')),
                get(ref(db, 'desbloqueos')),
            ]);
            const turnos = snapTurnos.val() || {};
            setConfirmados(Object.values(turnos).filter(t => t.estado === 'confirmado'));
            if (snapServs.exists()) {
                setServicios(snapServs.val());
            } else {
                await set(ref(db, 'servicios'), DATOS_INICIALES);
                setServicios(DATOS_INICIALES);
            }
            setBloqueados(snapBloq.val() || {});
            setBloqueosHora(snapBloqHora.val() || {});
            setDesbloqueos(snapDesbl.val() || {});
        }
        cargar();
    }, [isOpen]);

    const cerrar = () => {
        setDiaInfo(null); setHora(null);
        setServicio({ nombre: '', precio: 0 });
        setNombre(''); setWhatsapp('');
        onClose();
    };

    const seleccionarDia = (d) => {
        setDiaInfo({ dia: d.dia, mesNombre: d.mesNombre, mesIndice: d.mesIdx, año: d.año, diaSemana: d.diaSemanaCorto });
        setHora(null);
        setServicio({ nombre: '', precio: 0 });
    };

    const handleServicioChange = (e) => {
        const nombreElegido = e.target.value;
        const encontrado    = servicios.find(s => s.nombre === nombreElegido);
        setServicio({ nombre: nombreElegido, precio: encontrado ? encontrado.precio : 0 });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!servicio.nombre || !nombre || !whatsapp) {
            alert('Completa todos los campos'); return;
        }
        const snapFinal      = await get(ref(db, 'turnos'));
        const turnosActuales = Object.values(snapFinal.val() || {});
        const slotTomado     = turnosActuales.some(t =>
            t.estado !== 'cancelado' &&
            t.dia === diaInfo.dia && t.mes === diaInfo.mesIndice &&
            t.año === diaInfo.año && t.hora === hora
        );
        if (slotTomado) {
            alert('Este horario ya fue reservado. Por favor elegí otro.');
            setConfirmados(turnosActuales.filter(t => t.estado === 'confirmado'));
            setHora(null); return;
        }
        const nuevoRef = push(ref(db, 'turnos'));
        const turnoId  = nuevoRef.key;
        const seña     = servicio.precio * PRECIO_RESERVA_PORCENTAJE;
        await set(nuevoRef, {
            id: turnoId, cliente: nombre, whatsapp,
            dia: diaInfo.dia, mes: diaInfo.mesIndice, año: diaInfo.año, hora,
            servicio: servicio.nombre, montoTotal: servicio.precio,
            montoSeña: seña, montoRestante: servicio.precio - seña,
            estado: 'pendiente', timestamp_creacion: Date.now(),
        });
        const resp = await fetch(`${import.meta.env.VITE_API_URL || ''}/crear-preferencia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ turnoId, monto: seña, servicio: servicio.nombre }),
        });
        const { init_point, error } = await resp.json();
        if (!init_point) {
            alert(error || 'No se pudo conectar con MercadoPago. Intenta nuevamente.'); return;
        }
        window.location.href = init_point;
    };

    if (!isOpen) return null;

    const seña     = servicio.precio * PRECIO_RESERVA_PORCENTAJE;
    const restante = servicio.precio - seña;

    return (
        <div
            className="modal-overlay"
            style={{ display: 'flex' }}
            role="dialog"
            aria-modal="true"
            aria-label="Reservar turno"
            onClick={(e) => { if (e.target === e.currentTarget) cerrar(); }}
        >
            <div className="modal-content" style={{ maxWidth: '800px' }}>
                <button
                    className="close-modal"
                    onClick={cerrar}
                    aria-label="Cerrar modal"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    &times;
                </button>

                <h2 className="modal-title">
                    {diaInfo ? (
                        <>
                            <button
                                onClick={() => { setDiaInfo(null); setHora(null); setServicio({ nombre: '', precio: 0 }); }}
                                aria-label="Volver al calendario"
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--lila)', fontSize: '1rem', marginRight: '10px',
                                    verticalAlign: 'middle', fontFamily: 'sans-serif',
                                }}
                            >
                                ← Volver
                            </button>
                            {diaInfo.diaSemana} {diaInfo.dia} de {diaInfo.mesNombre}
                        </>
                    ) : 'Seleccioná tu Turno'}
                </h2>

                {!diaInfo && (
                    <BookingCalendar
                        meses={MESES}
                        diaInfo={diaInfo}
                        bloqueados={bloqueados}
                        bloqueosHora={bloqueosHora}
                        desbloqueos={desbloqueos}
                        confirmados={confirmados}
                        isMobile={isMobile}
                        isXSmall={isXSmall}
                        onSelectDia={seleccionarDia}
                        getHolidaysAR_BM={getHolidaysAR_BM}
                    />
                )}

                {diaInfo && (
                    <BookingTimeSlots
                        rangosHora={RANGOS_HORA}
                        diaInfo={diaInfo}
                        confirmados={confirmados}
                        bloqueosHora={bloqueosHora}
                        hora={hora}
                        onSelectHora={setHora}
                    />
                )}

                {hora && (
                    <BookingForm
                        servicios={servicios}
                        servicio={servicio}
                        seña={seña}
                        restante={restante}
                        nombre={nombre}
                        whatsapp={whatsapp}
                        onServicioChange={handleServicioChange}
                        onNombreChange={setNombre}
                        onWhatsappChange={setWhatsapp}
                        onSubmit={handleSubmit}
                    />
                )}
            </div>
        </div>
    );
}
