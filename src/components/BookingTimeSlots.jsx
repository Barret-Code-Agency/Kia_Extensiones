export default function BookingTimeSlots({ rangosHora, diaInfo, confirmados, bloqueosHora, hora, onSelectHora }) {
    const estaOcupado = (h) => {
        if (!diaInfo) return false;
        const turnoOcupado = confirmados.some(t =>
            t.dia === diaInfo.dia && t.mes === diaInfo.mesIndice && t.hora === h
        );
        if (turnoOcupado) return true;
        const dayKey  = `${diaInfo.año}-${String(diaInfo.mesIndice + 1).padStart(2, '0')}-${String(diaInfo.dia).padStart(2, '0')}`;
        const horaKey = h.replace(':', '-');
        return !!bloqueosHora[dayKey]?.[horaKey];
    };

    return (
        <div style={{ display: 'block', marginTop: '20px' }}>
            <h4 style={{ textAlign: 'center', color: 'var(--rosa)', fontFamily: 'sans-serif', marginBottom: '10px' }}>
                Horarios Disponibles
            </h4>
            <div
                role="listbox"
                aria-label="Seleccionar horario"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '10px', padding: '10px',
                }}
            >
                {rangosHora.map(h => {
                    const ocupado = estaOcupado(h);
                    const seleccionado = hora === h;
                    return (
                        <button
                            key={h}
                            role="option"
                            aria-selected={seleccionado}
                            aria-disabled={ocupado}
                            aria-label={`${h}${ocupado ? ', ocupado' : seleccionado ? ', seleccionado' : ', disponible'}`}
                            className={`hora-btn${ocupado ? ' hora-busy' : seleccionado ? ' selected' : ''}`}
                            onClick={!ocupado ? () => onSelectHora(h) : undefined}
                        >
                            {h}{ocupado ? ' (Ocupado)' : ''}
                        </button>
                    );
                })}
            </div>
            <p style={{ textAlign: 'center', marginTop: '15px', fontWeight: 'bold', color: '#333' }}>
                Precio de la reserva:{' '}
                <span style={{ color: '#28a745' }}>50% del servicio</span>
            </p>
        </div>
    );
}
