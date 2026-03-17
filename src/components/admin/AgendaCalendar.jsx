import { useState, useEffect } from 'react';
import './AgendaCalendar.css';

const NOMBRES_MES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                     "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_SEMANA = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

function useWindowWidth() {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handler = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return width;
}

// Construye la grilla de un mes (celdas vacías + días)
function buildCeldas(año, mes) {
    const primerDia = new Date(año, mes, 1).getDay();
    const inicio    = primerDia === 0 ? 6 : primerDia - 1; // Lunes=0
    const total     = new Date(año, mes + 1, 0).getDate();
    return [
        ...Array(inicio).fill(null),
        ...Array.from({ length: total }, (_, i) => i + 1),
    ];
}

function CalMes({ año, mes, turnos, bloqueados, diaDetalle, onDayClick, w }) {
    const hoy = new Date();

    // Turnos agrupados por día (todos los estados excepto cancelado)
    const porDia = {};
    turnos
        .filter(t => t.mes === mes && t.año === año && t.estado !== 'cancelado')
        .forEach(t => {
            if (!porDia[t.dia]) porDia[t.dia] = [];
            porDia[t.dia].push(t);
        });

    const esBloqueado = (dia) => {
        const key = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        return bloqueados.includes(key);
    };

    const getDayClass = (dia) => {
        const esDomingo = new Date(año, mes, dia).getDay() === 0;
        if (esDomingo || esBloqueado(dia)) return 'cal-blocked';
        const count = porDia[dia]?.length || 0;
        if (count === 0) return 'cal-free';
        return 'cal-partial';
    };

    const esHoy = (dia) =>
        dia === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear();

    const esSeleccionado = (dia) =>
        diaDetalle?.dia === dia && diaDetalle?.mes === mes && diaDetalle?.año === año;

    const celdas = buildCeldas(año, mes);
    const mob = w < 600;
    const gridCols = mob ? 'repeat(6, 1fr)' : 'repeat(7, 1fr)';
    const diasHeader = mob ? DIAS_SEMANA.slice(0, 6) : DIAS_SEMANA;
    const celdasVis = mob ? celdas.filter((_, idx) => idx % 7 !== 6) : celdas;

    const labelTurno = (t) => {
        const hora   = String(t.hora  ?? '').split(':')[0];
        const nombre = String(t.cliente ?? '').split(' ')[0];
        if (w < 400 || !nombre) return `${hora}hs`;
        return `${hora} ${nombre}`;
    };

    return (
        <div style={{ width: '100%', minWidth: 0 }}>
            {/* Título del mes */}
            <div style={{
                textAlign: 'center',
                fontFamily: 'sans-serif',
                fontWeight: 'bold',
                fontSize: '1rem',
                color: 'var(--lila)',
                marginBottom: '10px',
                paddingBottom: '8px',
                borderBottom: '2px solid var(--rosa)',
            }}>
                {NOMBRES_MES[mes]} {año}
            </div>

            {/* Cabecera días semana */}
            <div style={{ display: 'grid', gridTemplateColumns: gridCols, marginBottom: '4px' }}>
                {diasHeader.map(d => (
                    <div key={d} style={{
                        textAlign: 'center', fontSize: '0.72rem',
                        color: '#aaa', fontFamily: 'sans-serif', padding: '2px 0',
                    }}>{d}</div>
                ))}
            </div>

            {/* Grilla de días */}
            <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '3px' }}>
                {celdasVis.map((dia, i) =>
                    dia === null ? (
                        <div key={`e-${i}`} />
                    ) : (
                        <div
                            key={dia}
                            onClick={() => {
                                const d = new Date(año, mes, dia);
                                if (d.getDay() !== 0 && !esBloqueado(dia)) onDayClick?.(dia, mes, año);
                            }}
                            style={{
                                borderRadius: '8px',
                                padding: '4px 2px',
                                minHeight: '52px',
                                cursor: new Date(año, mes, dia).getDay() !== 0 && !esBloqueado(dia) ? 'pointer' : 'default',
                                background: esSeleccionado(dia)
                                    ? 'var(--lila)'
                                    : getDayClass(dia) === 'cal-blocked'
                                        ? '#f5f5f5'
                                        : getDayClass(dia) === 'cal-partial'
                                            ? '#fff8e1'
                                            : '#f0fdf4',
                                border: esHoy(dia)
                                    ? '2px solid var(--rosa)'
                                    : esSeleccionado(dia)
                                        ? '2px solid var(--lila)'
                                        : '1px solid #eee',
                                transition: 'all 0.15s',
                            }}
                        >
                            {/* Número del día */}
                            <div style={{
                                textAlign: 'center',
                                fontSize: '0.78rem',
                                fontWeight: esHoy(dia) ? 'bold' : 'normal',
                                color: esSeleccionado(dia) ? 'white'
                                    : getDayClass(dia) === 'cal-blocked' ? '#ccc'
                                    : esHoy(dia) ? 'var(--rosa)'
                                    : '#555',
                                fontFamily: 'sans-serif',
                                marginBottom: '2px',
                            }}>
                                {dia}
                            </div>

                            {/* Turnos del día */}
                            {(porDia[dia] || []).slice(0, 3).map((t, ti) => (
                                <div key={ti} style={{
                                    fontSize: '0.58rem',
                                    background: t.estado === 'confirmado' ? 'var(--lila)' : 'var(--rosa)',
                                    color: 'white',
                                    borderRadius: '3px',
                                    padding: '1px 3px',
                                    marginBottom: '1px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontFamily: 'sans-serif',
                                }}>
                                    {labelTurno(t)}
                                </div>
                            ))}
                            {(porDia[dia]?.length || 0) > 3 && (
                                <div style={{
                                    fontSize: '0.55rem', color: '#888',
                                    fontFamily: 'sans-serif', textAlign: 'center',
                                }}>
                                    +{porDia[dia].length - 3} más
                                </div>
                            )}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

export default function AgendaCalendar({ turnos, bloqueados, onDayClick, diaDetalle }) {
    const hoy = new Date();
    const [centro, setCentro] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    const w = useWindowWidth();

    const offsets = w < 600 ? [0] : [-1, 0, 1];
    const meses = offsets.map(offset => {
        const d = new Date(centro.getFullYear(), centro.getMonth() + offset, 1);
        return { mes: d.getMonth(), año: d.getFullYear() };
    });

    return (
        <div style={{ minWidth: 0 }}>
            {/* Navegación */}
            <div className="admin-cal-header" style={{ marginBottom: '20px' }}>
                <button
                    className="admin-cal-nav"
                    onClick={() => setCentro(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                >‹</button>
                <button
                    className="admin-cal-nav"
                    style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                    onClick={() => setCentro(new Date(hoy.getFullYear(), hoy.getMonth(), 1))}
                >Hoy</button>
                <button
                    className="admin-cal-nav"
                    onClick={() => setCentro(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                >›</button>
            </div>

            {/* Leyenda */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {[
                    ['#f0fdf4', 'var(--lila)', 'Libre'],
                    ['#fff8e1', 'var(--rosa)', 'Con turnos'],
                    ['#f5f5f5', '#ccc', 'Bloqueado/Dom'],
                    ['var(--lila)', 'white', 'Confirmado'],
                ].map(([bg, color, label]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'sans-serif', fontSize: '0.72rem', color: '#666' }}>
                        <span style={{ width: '10px', height: '10px', background: bg, border: `1px solid ${color}`, borderRadius: '3px', display: 'inline-block', flexShrink: 0 }} />
                        {label}
                    </div>
                ))}
            </div>

            {/* Calendarios */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', minWidth: 0 }}>
                {meses.map(({ mes, año }) => (
                    <CalMes
                        key={`${año}-${mes}`}
                        año={año}
                        mes={mes}
                        turnos={turnos}
                        bloqueados={bloqueados}
                        diaDetalle={diaDetalle}
                        onDayClick={onDayClick}
                        w={w}
                    />
                ))}
            </div>
        </div>
    );
}
