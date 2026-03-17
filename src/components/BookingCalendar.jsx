import { RANGOS_HORA } from '../data/servicios';

const DIAS_SEMANA_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES_NOMBRES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const formatKey = (año, mes, dia) =>
    `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

export default function BookingCalendar({
    meses,
    diaInfo,
    bloqueados,
    bloqueosHora,
    desbloqueos,
    confirmados,
    isMobile,
    isXSmall,
    onSelectDia,
    getHolidaysAR_BM,
}) {
    const slotsLibresDia = (d) => {
        const dayKey = formatKey(d.año, d.mesIdx, d.dia);
        return RANGOS_HORA.filter(h => {
            const horaKey = h.replace(':', '-');
            return !confirmados.some(t =>
                t.dia === d.dia && t.mes === d.mesIdx && t.año === d.año && t.hora === h
            ) && !bloqueosHora[dayKey]?.[horaKey];
        }).length;
    };

    return (
        <div
            className="calendarios-wrapper"
            style={{ width: '100%', marginTop: isMobile ? '8px' : '0' }}
            role="grid"
            aria-label="Calendario de turnos disponibles"
        >
            {meses.map((mes, mi) => {
                const flat = [...Array(mes.offset).fill(null), ...mes.dias];
                const celdasVis = isXSmall ? flat.filter((_, idx) => idx % 7 !== 6) : flat;
                const headers   = isXSmall ? DIAS_SEMANA_CORTO.slice(0, 6) : DIAS_SEMANA_CORTO;

                return (
                    <div key={mi} style={{ marginBottom: '25px' }}>
                        <h3
                            style={{
                                color: 'var(--lila)', textAlign: 'center',
                                fontFamily: 'sans-serif', fontWeight: 'bold',
                                fontSize: '1.1rem', marginBottom: '10px',
                                paddingBottom: '6px', borderBottom: '2px solid var(--rosa)',
                            }}
                            id={`mes-${mi}`}
                        >
                            {mes.nombre} {mes.año}
                        </h3>

                        {/* Cabecera días semana */}
                        <div
                            role="row"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: isXSmall ? 'repeat(6, 1fr)' : 'repeat(7, 1fr)',
                                gap: isMobile ? '2px' : '4px',
                                marginBottom: '4px',
                            }}
                        >
                            {headers.map(d => (
                                <div
                                    key={d}
                                    role="columnheader"
                                    aria-label={d}
                                    style={{
                                        textAlign: 'center',
                                        fontSize: isMobile ? '0.65rem' : '0.72rem',
                                        color: '#aaa', fontFamily: 'sans-serif',
                                        fontWeight: 'bold', padding: '2px 0',
                                    }}
                                >
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Grilla de días */}
                        <div
                            role="rowgroup"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: isXSmall ? 'repeat(6, 1fr)' : 'repeat(7, 1fr)',
                                gap: isMobile ? '2px' : '4px',
                                padding: '4px 0',
                            }}
                        >
                            {celdasVis.map((d, i) => {
                                if (d === null) return <div key={`e-${i}`} role="gridcell" />;

                                const dayKey       = formatKey(d.año, d.mesIdx, d.dia);
                                const esSabado     = new Date(d.año, d.mesIdx, d.dia).getDay() === 6;
                                const esDefault    = d.esDomingo || esSabado || getHolidaysAR_BM(d.año).has(dayKey);
                                const bloqueadoMan = (esDefault && !desbloqueos[dayKey]) || !!bloqueados[dayKey];
                                const libresCount  = !bloqueadoMan ? slotsLibresDia(d) : 0;
                                const lleno        = !bloqueadoMan && libresCount === 0;
                                const bloqueado    = bloqueadoMan || lleno;

                                const seleccionado =
                                    diaInfo &&
                                    diaInfo.dia === d.dia &&
                                    diaInfo.mesIndice === d.mesIdx &&
                                    diaInfo.año === d.año;

                                let className = 'calendar-day';
                                if (bloqueado)         className += ' day-busy';
                                else if (seleccionado) className += ' day-free day-selected';
                                else                   className += ' day-free';

                                return (
                                    <div
                                        key={i}
                                        role="gridcell"
                                        className={className}
                                        aria-selected={seleccionado ? 'true' : 'false'}
                                        aria-disabled={bloqueado ? 'true' : 'false'}
                                        aria-label={`${d.dia} de ${MESES_NOMBRES[d.mesIdx]}${bloqueado ? ', no disponible' : seleccionado ? ', seleccionado' : `, ${libresCount} horarios libres`}`}
                                        style={{
                                            ...(bloqueado ? { opacity: 0.4 } : {}),
                                            padding: isMobile ? '4px 2px' : '4px 5px',
                                            minHeight: isMobile ? '62px' : '80px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexDirection: 'column',
                                            gap: isMobile ? '3px' : '4px',
                                            cursor: bloqueado ? 'default' : 'pointer',
                                            textAlign: 'center',
                                        }}
                                        onClick={!bloqueado ? () => onSelectDia(d) : undefined}
                                        tabIndex={bloqueado ? -1 : 0}
                                        onKeyDown={!bloqueado ? (e) => e.key === 'Enter' && onSelectDia(d) : undefined}
                                    >
                                        {isMobile ? (
                                            <>
                                                <strong style={{
                                                    fontSize: '1rem',
                                                    color: bloqueado ? '#aaa' : seleccionado ? 'white' : 'var(--lila)',
                                                    lineHeight: 1, display: 'block',
                                                }}>
                                                    {d.dia}
                                                </strong>
                                                {!bloqueadoMan && (
                                                    <span style={{
                                                        display: 'inline-block', fontSize: '0.62rem',
                                                        fontFamily: 'sans-serif', fontWeight: '700',
                                                        color: seleccionado ? 'white'
                                                            : libresCount === 0 ? '#e03060'
                                                            : libresCount <= 2 ? '#e67e00'
                                                            : '#1a9e4a',
                                                        lineHeight: 1, marginTop: '1px',
                                                    }}>
                                                        {libresCount === 0 ? 'lleno' : `${libresCount} lib`}
                                                    </span>
                                                )}
                                                {bloqueadoMan && !d.esDomingo && (
                                                    <span style={{ fontSize: '0.65rem', display: 'block' }}>🔒</span>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {!bloqueadoMan ? (
                                                    <div style={{
                                                        flex: 1, fontFamily: 'sans-serif',
                                                        fontSize: '0.58rem', lineHeight: '1.55', width: '100%',
                                                    }}>
                                                        {RANGOS_HORA.map(h => {
                                                            const horaKey = h.replace(':', '-');
                                                            const ocup =
                                                                confirmados.some(t =>
                                                                    t.dia === d.dia && t.mes === d.mesIdx &&
                                                                    t.año === d.año && t.hora === h
                                                                ) || !!bloqueosHora[dayKey]?.[horaKey];
                                                            return (
                                                                <div key={h} style={{ display: 'flex', justifyContent: 'space-between', gap: '2px' }}>
                                                                    <span style={{ color: '#888' }}>{h}</span>
                                                                    <span style={{ color: ocup ? '#e03060' : '#1a9e4a', fontWeight: 'bold' }}>
                                                                        {ocup ? 'Res' : 'Libre'}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '0.7rem' }}>
                                                        {!d.esDomingo && '🔒'}
                                                    </div>
                                                )}
                                                <strong style={{
                                                    fontSize: '1.05rem',
                                                    color: bloqueado ? '#aaa' : seleccionado ? 'white' : 'var(--lila)',
                                                    lineHeight: 1, minWidth: '16px',
                                                }}>
                                                    {d.dia}
                                                </strong>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
