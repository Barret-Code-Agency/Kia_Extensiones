import './BloqueosDias.css';
import { useEffect, useState } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { db } from '../../firebase';
import { RANGOS_HORA } from '../../data/servicios';

const NOMBRES_MES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                     "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_SEMANA = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

// Easter dates para calcular feriados móviles
const EASTER = {
    2025: [2025, 4, 20],
    2026: [2026, 4, 5],
    2027: [2027, 3, 28],
};

function getHolidaysAR(año) {
    const fijos = [
        [1, 1], [3, 24], [4, 2], [5, 1], [5, 25],
        [6, 20], [7, 9], [8, 17], [10, 12], [11, 20],
        [12, 8], [12, 25],
    ];
    const keys = new Set(fijos.map(([m, d]) =>
        `${año}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    ));
    // Carnaval (-48, -47 antes de Pascua) y Viernes Santo (-2)
    const e = EASTER[año];
    if (e) {
        const pascua = new Date(e[0], e[1] - 1, e[2]);
        [-48, -47, -2].forEach(offset => {
            const d = new Date(pascua);
            d.setDate(d.getDate() + offset);
            keys.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
        });
    }
    return keys;
}

export default function BloqueosDias() {
    const hoy = new Date();
    const [fecha,       setFecha]       = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    const [bloqueados,  setBloqueados]  = useState({});
    const [desbloqueos, setDesbloqueos] = useState({});
    const [bloqueosHora,setBloqueosHora]= useState({});
    const [diaActivo,   setDiaActivo]   = useState(null);

    const mes = fecha.getMonth();
    const año = fecha.getFullYear();
    const holidays = getHolidaysAR(año);

    useEffect(() => {
        const u1 = onValue(ref(db, 'bloqueos'),     snap => setBloqueados(snap.val()    || {}));
        const u2 = onValue(ref(db, 'bloqueosHora'), snap => setBloqueosHora(snap.val() || {}));
        const u3 = onValue(ref(db, 'desbloqueos'),  snap => setDesbloqueos(snap.val()  || {}));
        return () => { u1(); u2(); u3(); };
    }, []);

    const formatKey = (dia) =>
        `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

    // Clasificadores
    const esDomingo          = (dia) => new Date(año, mes, dia).getDay() === 0;
    const esSabado           = (dia) => new Date(año, mes, dia).getDay() === 6;
    const esHoliday          = (dia) => holidays.has(formatKey(dia));
    const esDefaultBloqueado = (dia) => esDomingo(dia) || esSabado(dia) || esHoliday(dia);
    const esBloqueadoManual  = (dia) => !!bloqueados[formatKey(dia)];
    const esDesbloqueado     = (dia) => !!desbloqueos[formatKey(dia)];
    const esBloqueadoEfectivo= (dia) => esBloqueadoManual(dia) || (esDefaultBloqueado(dia) && !esDesbloqueado(dia));
    const esHoy              = (dia) => dia === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear();
    const tieneHorasBloqueadas = (dia) => {
        const key = formatKey(dia);
        return bloqueosHora[key] && Object.keys(bloqueosHora[key]).length > 0;
    };

    // ── Bloqueo/desbloqueo de día completo ──
    const toggleDia = async (dia) => {
        const key = formatKey(dia);
        if (esBloqueadoManual(dia)) {
            await remove(ref(db, `bloqueos/${key}`));
            return;
        }
        if (esDefaultBloqueado(dia) && esDesbloqueado(dia)) {
            // Volver a bloquear: quitar de desbloqueos
            await remove(ref(db, `desbloqueos/${key}`));
            setDiaActivo(null);
            return;
        }
        if (!esDefaultBloqueado(dia)) {
            // Bloquear día libre normal
            await set(ref(db, `bloqueos/${key}`), true);
            setDiaActivo(null);
        }
    };

    // ── Click en un día del calendario ──
    const handleClickDia = async (dia) => {
        const key = formatKey(dia);
        if (esBloqueadoManual(dia)) {
            await remove(ref(db, `bloqueos/${key}`));
            return;
        }
        if (esDefaultBloqueado(dia) && !esDesbloqueado(dia)) {
            // Desbloquear excepción (sábado / domingo / feriado)
            await set(ref(db, `desbloqueos/${key}`), true);
            setDiaActivo(dia);
            return;
        }
        // Día disponible (libre o excepción desbloqueada): abrir panel de horarios
        setDiaActivo(prev => prev === dia ? null : dia);
    };

    // ── Bloqueo de horario individual ──
    const toggleHora = async (dia, hora) => {
        const key     = formatKey(dia);
        const horaKey = hora.replace(':', '-');
        const path    = `bloqueosHora/${key}/${horaKey}`;
        if (bloqueosHora[key]?.[horaKey]) {
            await remove(ref(db, path));
        } else {
            await set(ref(db, path), true);
        }
    };

    const estaHoraBloqueada = (dia, hora) => {
        const key     = formatKey(dia);
        const horaKey = hora.replace(':', '-');
        return !!bloqueosHora[key]?.[horaKey];
    };

    // Construir grilla
    const diaSemanaInicio = (() => {
        const d = new Date(año, mes, 1).getDay();
        return d === 0 ? 6 : d - 1;
    })();
    const totalDias = new Date(año, mes + 1, 0).getDate();
    const celdas = [
        ...Array(diaSemanaInicio).fill(null),
        ...Array.from({ length: totalDias }, (_, i) => i + 1),
    ];

    const labelFeriado = (dia) => {
        if (esDomingo(dia)) return 'Dom';
        if (esSabado(dia))  return 'Sáb';
        if (esHoliday(dia)) return 'Fer';
        return null;
    };

    return (
        <div>
            <h1 className="admin-section-title">Bloquear Días y Horarios</h1>
            <p style={{ fontFamily: 'sans-serif', color: '#888', marginBottom: '24px', fontSize: '0.9rem' }}>
                <strong>Sábados, domingos y feriados</strong> están bloqueados por defecto.
                Hacé click en uno para habilitarlo como excepción.<br />
                Hacé click en un día libre para bloquear horarios o el día completo.
            </p>

            {/* Leyenda */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', fontFamily: 'sans-serif', fontSize: '0.75rem', color: '#666' }}>
                {[
                    ['#f0fdf4', '#1a9e4a', '✓ Libre'],
                    ['#fce4ec', 'var(--rosa)', '🔒 Bloqueado'],
                    ['#fff8e1', '#f59e0b', '🔓 Excepción habilitada'],
                    ['#fff3e0', '#e65100', '⏰ Horarios parciales'],
                ].map(([bg, border, label]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '12px', height: '12px', background: bg, border: `1.5px solid ${border}`, borderRadius: '3px', display: 'inline-block' }} />
                        {label}
                    </div>
                ))}
            </div>

            {/* Navegación de mes */}
            <div className="admin-cal-header">
                <button className="admin-cal-nav" onClick={() => { setFecha(new Date(año, mes - 1, 1)); setDiaActivo(null); }}>‹</button>
                <span className="admin-cal-title">{NOMBRES_MES[mes]} {año}</span>
                <button className="admin-cal-nav" onClick={() => { setFecha(new Date(año, mes + 1, 1)); setDiaActivo(null); }}>›</button>
            </div>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Calendario — ancho completo */}
                <div className="admin-cal-grid" style={{ flex: 1, minWidth: 0 }}>
                    {DIAS_SEMANA.map(d => (
                        <div key={d} className="admin-cal-weekday">{d}</div>
                    ))}

                    {celdas.map((dia, i) =>
                        dia === null ? (
                            <div key={`e-${i}`} className="admin-cal-day cal-empty" />
                        ) : (() => {
                            const bloq      = esBloqueadoEfectivo(dia);
                            const excepcion = esDefaultBloqueado(dia) && esDesbloqueado(dia);
                            const parcial   = !bloq && !excepcion && tieneHorasBloqueadas(dia);
                            const label     = labelFeriado(dia);

                            let bg     = bloq ? '#fce4ec' : excepcion ? '#fff8e1' : parcial ? '#fff3e0' : '#f0fdf4';
                            let border = bloq ? 'var(--rosa)' : excepcion ? '#f59e0b' : parcial ? '#e65100' : '#1a9e4a';
                            if (diaActivo === dia) { bg = 'var(--lila)'; border = 'var(--lila)'; }
                            if (esHoy(dia))  border = 'var(--rosa)';

                            return (
                                <div
                                    key={dia}
                                    onClick={() => handleClickDia(dia)}
                                    title={
                                        bloq && !excepcion  ? (esBloqueadoManual(dia) ? 'Click para desbloquear' : 'Click para habilitar como excepción')
                                        : excepcion         ? 'Excepción habilitada — click para ver horarios'
                                        : 'Click para gestionar horarios'
                                    }
                                    style={{
                                        borderRadius: '10px',
                                        padding: '6px 4px',
                                        minHeight: '52px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: bg,
                                        border: `1.5px solid ${border}`,
                                        transition: 'all 0.15s',
                                        fontFamily: 'sans-serif',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '2px',
                                    }}
                                >
                                    <span style={{
                                        fontSize: '0.82rem',
                                        fontWeight: esHoy(dia) ? 'bold' : 'normal',
                                        color: diaActivo === dia ? 'white' : bloq ? 'var(--rosa)' : excepcion ? '#b45309' : '#333',
                                    }}>{dia}</span>
                                    {label && (
                                        <span style={{ fontSize: '0.55rem', color: diaActivo === dia ? 'white' : '#aaa' }}>{label}</span>
                                    )}
                                    {excepcion && <span style={{ fontSize: '0.6rem' }}>🔓</span>}
                                    {esBloqueadoManual(dia) && <span style={{ fontSize: '0.6rem' }}>🔒</span>}
                                    {parcial && <span style={{ fontSize: '0.55rem', color: '#e65100' }}>⏰</span>}
                                </div>
                            );
                        })()
                    )}
                </div>

                {/* Panel de horarios del día activo */}
                {diaActivo && !esBloqueadoEfectivo(diaActivo) && (
                    <div style={{
                        background: '#fff',
                        border: '2px solid var(--lila)',
                        borderRadius: '12px',
                        padding: '18px',
                        minWidth: '220px',
                        fontFamily: 'sans-serif',
                    }}>
                        <h3 style={{ color: 'var(--lila)', margin: '0 0 2px', fontSize: '1rem' }}>
                            {diaActivo} de {NOMBRES_MES[mes]}
                        </h3>
                        {esDesbloqueado(diaActivo) && (
                            <p style={{ fontSize: '0.72rem', color: '#f59e0b', margin: '0 0 8px' }}>
                                🔓 Día habilitado como excepción
                            </p>
                        )}
                        <p style={{ color: '#999', fontSize: '0.78rem', margin: '0 0 14px' }}>
                            Tocá un horario para bloquearlo/liberarlo
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {RANGOS_HORA.map(h => {
                                const bloq = estaHoraBloqueada(diaActivo, h);
                                return (
                                    <button
                                        key={h}
                                        onClick={() => toggleHora(diaActivo, h)}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 14px',
                                            borderRadius: '8px',
                                            border: `1.5px solid ${bloq ? '#e03060' : '#1a9e4a'}`,
                                            background: bloq ? '#fce4ec' : '#e8f5e9',
                                            color: bloq ? '#e03060' : '#1a9e4a',
                                            fontWeight: 'bold',
                                            fontSize: '0.88rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <span>{h}</span>
                                        <span>{bloq ? '🔒 Bloqueado' : '✓ Libre'}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Botón bloquear/re-bloquear día completo */}
                        <button
                            onClick={() => toggleDia(diaActivo)}
                            style={{
                                marginTop: '16px',
                                width: '100%',
                                padding: '8px',
                                borderRadius: '8px',
                                border: '1.5px solid var(--rosa)',
                                background: '#fce4ec',
                                color: 'var(--rosa)',
                                fontWeight: 'bold',
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                            }}
                        >
                            {esDesbloqueado(diaActivo)
                                ? '🔒 Volver a bloquear este día'
                                : '🔒 Bloquear día completo'}
                        </button>
                    </div>
                )}
            </div>

            {/* Lista de bloqueos y excepciones del mes */}
            <div style={{ marginTop: '30px' }}>
                <h3 style={{ color: 'var(--lila)', fontFamily: 'sans-serif', marginBottom: '12px', fontSize: '1rem' }}>
                    Bloqueos en {NOMBRES_MES[mes]} {año}
                </h3>

                {/* Días bloqueados manualmente */}
                {Object.keys(bloqueados)
                    .filter(k => k.startsWith(`${año}-${String(mes + 1).padStart(2, '0')}`))
                    .sort()
                    .map(k => (
                        <span key={k} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: '#fce4ec', color: 'var(--rosa)', borderRadius: '20px',
                            padding: '4px 12px', fontSize: '0.82rem', fontFamily: 'sans-serif',
                            marginRight: '8px', marginBottom: '8px',
                        }}>
                            🔒 {k} (día completo)
                            <button onClick={() => remove(ref(db, `bloqueos/${k}`))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '0.9rem', padding: '0' }}>✕</button>
                        </span>
                    ))
                }

                {/* Horarios bloqueados */}
                {Object.entries(bloqueosHora)
                    .filter(([k]) => k.startsWith(`${año}-${String(mes + 1).padStart(2, '0')}`))
                    .sort(([a], [b]) => a.localeCompare(b))
                    .flatMap(([dia, horas]) =>
                        Object.keys(horas).map(horaKey => {
                            const hora = horaKey.replace('-', ':');
                            return (
                                <span key={`${dia}-${horaKey}`} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    background: '#fff3e0', color: '#e65100', borderRadius: '20px',
                                    padding: '4px 12px', fontSize: '0.82rem', fontFamily: 'sans-serif',
                                    marginRight: '8px', marginBottom: '8px',
                                }}>
                                    ⏰ {dia} {hora}
                                    <button onClick={() => remove(ref(db, `bloqueosHora/${dia}/${horaKey}`))}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '0.9rem', padding: '0' }}>✕</button>
                                </span>
                            );
                        })
                    )
                }

                {/* Excepciones desbloqueadas */}
                {Object.keys(desbloqueos)
                    .filter(k => k.startsWith(`${año}-${String(mes + 1).padStart(2, '0')}`))
                    .sort()
                    .map(k => (
                        <span key={k} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: '#fff8e1', color: '#b45309', borderRadius: '20px',
                            padding: '4px 12px', fontSize: '0.82rem', fontFamily: 'sans-serif',
                            marginRight: '8px', marginBottom: '8px',
                        }}>
                            🔓 {k} (excepción habilitada)
                            <button onClick={() => remove(ref(db, `desbloqueos/${k}`))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '0.9rem', padding: '0' }}>✕</button>
                        </span>
                    ))
                }

                {Object.keys(bloqueados).filter(k => k.startsWith(`${año}-${String(mes + 1).padStart(2, '0')}`)).length === 0 &&
                 Object.keys(bloqueosHora).filter(k => k.startsWith(`${año}-${String(mes + 1).padStart(2, '0')}`)).length === 0 &&
                 Object.keys(desbloqueos).filter(k => k.startsWith(`${año}-${String(mes + 1).padStart(2, '0')}`)).length === 0 && (
                    <p style={{ color: '#aaa', fontFamily: 'sans-serif', fontSize: '0.85rem' }}>Sin bloqueos ni excepciones este mes.</p>
                )}
            </div>
        </div>
    );
}
