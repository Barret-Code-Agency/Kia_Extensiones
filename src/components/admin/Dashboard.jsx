import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase';
import { RANGOS_HORA } from '../../data/servicios';
import StatCard from './StatCard';
import './Dashboard.css';

const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_LARGO = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                     "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_SEMANA = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

function Panel({ title, children }) {
    return (
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <h3 style={{ color: 'var(--lila)', fontFamily: 'sans-serif', marginBottom: '16px', fontSize: '1rem' }}>
                {title}
            </h3>
            {children}
        </div>
    );
}

function BarRow({ label, value, max, color = 'var(--lila)', suffix = '' }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div style={{ marginBottom: '10px', fontFamily: 'sans-serif', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ color: '#555' }}>{label}</span>
                <strong style={{ color }}>{typeof value === 'number' && suffix === '$'
                    ? `$${value.toLocaleString('es-AR')}`
                    : `${value}${suffix}`}
                </strong>
            </div>
            <div style={{ background: '#f0f0f0', borderRadius: '6px', height: '7px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '6px', transition: 'width 0.4s' }} />
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [turnos, setTurnos] = useState([]);

    useEffect(() => {
        const unsubscribe = onValue(ref(db, 'turnos'), snap => {
            setTurnos(Object.values(snap.val() || {}));
        });
        return unsubscribe;
    }, []);

    const ahora      = new Date();
    const mesActual  = ahora.getMonth();
    const añoActual  = ahora.getFullYear();

    const confirmados    = turnos.filter(t => t.estado === 'confirmado');
    const turnosMes      = turnos.filter(t => t.mes === mesActual && t.año === añoActual);
    const confirmadosMes = turnosMes.filter(t => t.estado === 'confirmado');
    const pendientesMes  = turnosMes.filter(t => t.estado === 'pendiente');

    const ingresosMes    = confirmadosMes.reduce((s, t) => s + (t.montoSeña     || 0), 0);
    const pendienteCobro = confirmadosMes.reduce((s, t) => s + (t.montoRestante || 0), 0);
    const ingresoTotal   = confirmados.reduce((s, t) => s + (t.montoSeña || 0), 0);

    const ticketPromedio = confirmados.length
        ? Math.round(confirmados.reduce((s, t) => s + (t.montoTotal || 0), 0) / confirmados.length)
        : 0;

    const tasaConf = turnos.length
        ? Math.round(confirmados.length / turnos.length * 100)
        : 0;

    // Clientes únicos
    const clientesUnicos = new Set(confirmados.map(t => t.cliente?.trim().toLowerCase())).size;

    // ── Ranking de clientes ──
    const mapaClientes = {};
    confirmados.forEach(t => {
        const nombre = t.cliente?.trim() || 'Sin nombre';
        const key    = nombre.toLowerCase();
        if (!mapaClientes[key]) mapaClientes[key] = { nombre, turnos: 0, gasto: 0, ultimoMes: -1, ultimoAño: -1 };
        mapaClientes[key].turnos++;
        mapaClientes[key].gasto += t.montoTotal || 0;
        // guardar última visita
        const fechaT = new Date(t.año, t.mes, t.dia);
        const fechaG = new Date(mapaClientes[key].ultimoAño, mapaClientes[key].ultimoMes, 1);
        if (fechaT >= fechaG) { mapaClientes[key].ultimoMes = t.mes; mapaClientes[key].ultimoAño = t.año; }
    });
    const rankingClientes = Object.values(mapaClientes)
        .sort((a, b) => b.gasto - a.gasto)
        .slice(0, 8);
    const maxGastoCliente = rankingClientes[0]?.gasto || 1;

    // ── Ingresos últimos 6 meses ──
    const ultimos6 = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(añoActual, mesActual - i, 1);
        const m = d.getMonth();
        const a = d.getFullYear();
        const ing = confirmados
            .filter(t => t.mes === m && t.año === a)
            .reduce((s, t) => s + (t.montoSeña || 0), 0);
        ultimos6.push({ label: MESES_CORTO[m], ing });
    }
    const maxIng6 = Math.max(...ultimos6.map(x => x.ing), 1);

    // ── Servicios más pedidos ──
    const conteoServs = {};
    confirmados.forEach(t => {
        if (t.servicio) conteoServs[t.servicio] = (conteoServs[t.servicio] || 0) + 1;
    });
    const populares    = Object.entries(conteoServs).sort(([, a], [, b]) => b - a).slice(0, 5);
    const maxPopular   = populares[0]?.[1] || 1;

    // ── Horarios más populares ──
    const conteoHoras = {};
    confirmados.forEach(t => { if (t.hora) conteoHoras[t.hora] = (conteoHoras[t.hora] || 0) + 1; });
    const horasRanking = Object.entries(conteoHoras).sort(([, a], [, b]) => b - a);
    const maxHora      = horasRanking[0]?.[1] || 1;

    // ── Días de semana más populares ──
    const conteoDias = {};
    confirmados.forEach(t => {
        const ds = new Date(t.año, t.mes, t.dia).getDay();
        const nombre = DIAS_SEMANA[ds];
        conteoDias[nombre] = (conteoDias[nombre] || 0) + 1;
    });
    const diasRanking = Object.entries(conteoDias).sort(([, a], [, b]) => b - a).slice(0, 5);
    const maxDia      = diasRanking[0]?.[1] || 1;

    // ── Capacidad total del mes (slots × días sin domingo) ──
    const diasEnMes = new Date(añoActual, mesActual + 1, 0).getDate();
    const totalPosibleMes = RANGOS_HORA.length * Array.from({ length: diasEnMes }, (_, i) =>
        new Date(añoActual, mesActual, i + 1).getDay()
    ).filter(d => d !== 0).length;

    // ── Próximos turnos (7 días) ──
    const hoy     = new Date(); hoy.setHours(0, 0, 0, 0);
    const en7dias = new Date(); en7dias.setDate(hoy.getDate() + 7);
    const proximos = confirmados
        .filter(t => {
            const f = new Date(t.año, t.mes, t.dia);
            return f >= hoy && f <= en7dias;
        })
        .sort((a, b) => new Date(a.año, a.mes, a.dia) - new Date(b.año, b.mes, b.dia));

    return (
        <div>
            <h1 className="admin-section-title">Dashboard</h1>

            {/* ── Stat cards ── */}
            <div className="stat-cards">
                <StatCard label={`Turnos en ${MESES_LARGO[mesActual]}`} value={`${turnosMes.length}/${totalPosibleMes}`} />
                <StatCard label="Confirmados este mes"                   value={`${confirmadosMes.length}/${totalPosibleMes}`} />
                <StatCard label="Pendientes de pago"                     value={pendientesMes.length} rosa />
                <StatCard label={`Señas cobradas ${MESES_LARGO[mesActual]}`} value={`$${ingresosMes.toLocaleString('es-AR')}`} />
                <StatCard label="Pendiente de cobro"                     value={`$${pendienteCobro.toLocaleString('es-AR')}`} rosa />
                <StatCard label="Total señas históricas"                 value={`$${ingresoTotal.toLocaleString('es-AR')}`} />
                <StatCard label="Ticket promedio"                        value={`$${ticketPromedio.toLocaleString('es-AR')}`} sub="por turno (total servicio)" />
                <StatCard label="Clientes únicos"                        value={clientesUnicos} sub={`Tasa conf. ${tasaConf}%`} />
            </div>

            {/* ── Paneles ── */}
            <div className="dashboard-panels" style={{ marginBottom: '24px' }}>

                <Panel title="👑 Ranking de clientes (por gasto)">
                    {rankingClientes.length === 0 ? (
                        <p style={{ color: '#aaa', fontFamily: 'sans-serif', fontSize: '0.9rem' }}>Sin datos aún</p>
                    ) : rankingClientes.map((c, i) => (
                        <div key={i} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'sans-serif', fontSize: '0.78rem', marginBottom: '3px' }}>
                                <span style={{ color: '#555' }}>
                                    <strong style={{ color: i === 0 ? '#f5a623' : i === 1 ? '#9b9b9b' : i === 2 ? '#b87333' : 'var(--lila)' }}>
                                        <span className="ranking-medal">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}</span>
                                    </strong>
                                    {' '}{c.nombre}
                                </span>
                                <span style={{ color: '#888', fontSize: '0.71rem' }}>{c.turnos} turno{c.turnos > 1 ? 's' : ''}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, background: '#f0f0f0', borderRadius: '6px', height: '7px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${Math.round((c.gasto / maxGastoCliente) * 100)}%`,
                                        height: '100%',
                                        background: i === 0 ? '#f5a623' : 'var(--lila)',
                                        borderRadius: '6px',
                                    }} />
                                </div>
                                <strong style={{ color: 'var(--lila)', fontSize: '0.75rem', minWidth: '70px', textAlign: 'right' }}>
                                    ${c.gasto.toLocaleString('es-AR')}
                                </strong>
                            </div>
                        </div>
                    ))}
                </Panel>

                <Panel title="📊 Ingresos últimos 6 meses (señas)">
                    {ultimos6.map((m, i) => (
                        <BarRow
                            key={i}
                            label={m.label}
                            value={m.ing}
                            max={maxIng6}
                            color="var(--rosa)"
                            suffix="$"
                        />
                    ))}
                    <p style={{ fontFamily: 'sans-serif', fontSize: '0.75rem', color: '#bbb', marginTop: '8px', marginBottom: 0 }}>
                        Solo señas cobradas por MercadoPago
                    </p>
                </Panel>

                <Panel title="🏆 Servicios más pedidos">
                    {populares.length === 0 ? (
                        <p style={{ color: '#aaa', fontFamily: 'sans-serif', fontSize: '0.9rem' }}>Sin datos aún</p>
                    ) : populares.map(([serv, count], i) => (
                        <BarRow key={i} label={`${i + 1}. ${serv}`} value={count} max={maxPopular} suffix=" turnos" color="var(--lila)" />
                    ))}
                </Panel>

                <Panel title="⏰ Horarios más reservados">
                    {horasRanking.length === 0 ? (
                        <p style={{ color: '#aaa', fontFamily: 'sans-serif', fontSize: '0.9rem' }}>Sin datos aún</p>
                    ) : horasRanking.map(([hora, count], i) => (
                        <BarRow key={i} label={`${hora} hs`} value={count} max={maxHora} suffix=" turnos" color="var(--rosa)" />
                    ))}
                </Panel>

                <Panel title="📅 Días más populares">
                    {diasRanking.length === 0 ? (
                        <p style={{ color: '#aaa', fontFamily: 'sans-serif', fontSize: '0.9rem' }}>Sin datos aún</p>
                    ) : diasRanking.map(([dia, count], i) => (
                        <BarRow key={i} label={dia} value={count} max={maxDia} suffix=" turnos" color="#7c3aed" />
                    ))}
                </Panel>
            </div>

            {/* ── Próximos 7 días ── */}
            <Panel title="📋 Próximos 7 días">
                {proximos.length === 0 ? (
                    <p style={{ color: '#aaa', fontFamily: 'sans-serif', fontSize: '0.9rem' }}>Sin turnos próximos</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                        {proximos.map((t, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 14px', borderRadius: '10px',
                                background: '#fdf4ff', border: '1px solid #f0e4ff',
                                fontFamily: 'sans-serif', fontSize: '0.85rem',
                            }}>
                                <div>
                                    <strong style={{ color: 'var(--rosa)' }}>{t.dia}/{t.mes + 1} {t.hora}hs</strong>
                                    <div style={{ color: '#555', marginTop: '2px' }}>{t.cliente}</div>
                                </div>
                                <div style={{ color: 'var(--lila)', fontSize: '0.78rem', textAlign: 'right', maxWidth: '110px' }}>
                                    {t.servicio}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Panel>
        </div>
    );
}
