export default function BookingForm({
    servicios,
    servicio,
    seña,
    restante,
    nombre,
    whatsapp,
    onServicioChange,
    onNombreChange,
    onWhatsappChange,
    onSubmit,
}) {
    // Agrupar por categoría
    const categorias = servicios.reduce((acc, s) => {
        if (!acc[s.cat]) acc[s.cat] = [];
        acc[s.cat].push(s);
        return acc;
    }, {});

    return (
        <form
            onSubmit={onSubmit}
            style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}
            aria-label="Formulario de reserva"
        >
            <label
                htmlFor="booking-servicio"
                style={{ color: 'var(--lila)', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}
            >
                Seleccioná tu servicio:
            </label>

            <select
                id="booking-servicio"
                required
                className="input-modal"
                style={{ backgroundColor: '#fffafc', border: '1.5px solid var(--rosa)' }}
                value={servicio.nombre}
                onChange={onServicioChange}
                aria-required="true"
            >
                <option value="" disabled>Elegir servicio...</option>
                {Object.entries(categorias).map(([cat, items]) => (
                    <optgroup key={cat} label={cat}>
                        {items.map(s => (
                            <option key={s.nombre} value={s.nombre}>
                                {s.nombre} - ${s.precio}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>

            {servicio.precio > 0 && (
                <div
                    role="region"
                    aria-label="Resumen de precios"
                    style={{
                        background: '#f9f9f9', padding: '15px', borderRadius: '10px',
                        marginBottom: '15px', borderLeft: '5px solid var(--lila)', display: 'block',
                    }}
                >
                    <p style={{ margin: '5px 0' }}>
                        <strong>Valor Total:</strong> ${servicio.precio}
                    </p>
                    <p style={{ margin: '5px 0', color: 'var(--rosa)' }}>
                        <strong>Reservar ahora (50%):</strong>
                        <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}> ${seña}</span>
                    </p>
                    <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9em' }}>
                        Restante a pagar en el local: ${restante}
                    </p>
                </div>
            )}

            <label htmlFor="booking-nombre" style={{ display: 'none' }}>Nombre completo</label>
            <input
                id="booking-nombre"
                type="text"
                placeholder="Nombre Completo"
                required
                className="input-modal"
                value={nombre}
                onChange={e => onNombreChange(e.target.value)}
                aria-label="Nombre completo"
                aria-required="true"
                autoComplete="name"
            />

            <label htmlFor="booking-whatsapp" style={{ display: 'none' }}>Número de WhatsApp</label>
            <input
                id="booking-whatsapp"
                type="tel"
                placeholder="WhatsApp"
                required
                className="input-modal"
                value={whatsapp}
                onChange={e => onWhatsappChange(e.target.value)}
                aria-label="Número de WhatsApp"
                aria-required="true"
                autoComplete="tel"
            />

            <button type="submit" className="btn-pagar">
                {servicio.precio > 0 ? `Pagar Reserva ($${seña})` : 'Pagar Reserva'}
            </button>
        </form>
    );
}
