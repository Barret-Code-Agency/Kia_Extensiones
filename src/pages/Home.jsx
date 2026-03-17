import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

import './Home.css';
import BookingModal from '../components/BookingModal';
import { DATOS_INICIALES } from '../data/servicios';

const SECCIONES = [
    { key: 'servicios', label: 'Servicios' },
    { key: 'precios',   label: 'Precios'   },
    { key: 'cuidados',  label: 'Cuidados'  },
    { key: 'info',      label: 'Info'      },
];

const TRABAJOS = [
    { src: '/images/trabajos/vol3d.jpg',          titulo: 'Volumen tecnológico 3D',  emoji: '🦋' },
    { src: '/images/trabajos/vol5d.jpg',          titulo: 'Volumen tecnológico 5D',  emoji: '🖤' },
    { src: '/images/trabajos/vol4d-1.jpg',        titulo: 'Volumen tecnológico 4D',  emoji: '💕' },
    { src: '/images/trabajos/efecto-rimmel.jpg',  titulo: 'Efecto Rimmel',           emoji: '🖤' },
    { src: '/images/trabajos/vol4d-2.jpg',        titulo: 'Volumen tecnológico 4D',  emoji: '💕' },
    { src: '/images/trabajos/vol4d-3.jpg',        titulo: 'Volumen tecnológico 4D',  emoji: '💕' },
];

const CUIDADOS = [
    { icono: '💧', titulo: 'Primeras 24 hs', texto: 'No mojar las pestañas durante las primeras 24hs para que selle el adhesivo.' },
    { icono: '🧴', titulo: 'Desmaquillado', texto: 'Utilizar desmaquillantes y cremas libres de aceite.' },
    { icono: '♨️', titulo: 'Calor y vapor', texto: 'Evitar el vapor y el agua caliente directo en las pestañas, ya que puede modificar la curvatura de las extensiones.' },
    { icono: '🚫', titulo: 'Máscara', texto: 'No utilizar máscara de pestañas sobre las extensiones.' },
    { icono: '🔥', titulo: 'Fuego', texto: 'Cuidalas del fuego y encendedores.' },
    { icono: '🪮', titulo: 'Higiene', texto: 'Es muy importante mantener la higiene y peinarlas diariamente.' },
];

export default function Home() {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [seccion,      setSeccion]      = useState('servicios');
    const [servicios,    setServicios]    = useState([]);
    const [trabajoIdx,   setTrabajoIdx]   = useState(0);

    useEffect(() => {
        const unsub = onValue(ref(db, 'servicios'), snap => {
            setServicios(snap.val() || DATOS_INICIALES);
        });
        return unsub;
    }, []);

    // Agrupar servicios por categoría
    const categorias = servicios.reduce((acc, s) => {
        if (!acc[s.cat]) acc[s.cat] = [];
        acc[s.cat].push(s);
        return acc;
    }, {});

    return (
        <>
            <Header onAbrirCalendario={() => setModalAbierto(true)} />

            <main className="hero-section">
                <div className="hero-content">
                    <h2 className="hero-text">
                        Reserva tu turno y luce una mirada{' '}
                        <span className="text-different">inolvidable</span>
                    </h2>
                </div>
                <img
                    src="/images/Gemini_Generated_Image_e86r6ze86r6ze86r (1).png"
                    alt="Kia"
                    className="person-overlay"
                />
            </main>

            {/* ── Navegación de secciones ── */}
            <nav className="secciones-nav">
                {SECCIONES.map(s => (
                    <button
                        key={s.key}
                        className={`seccion-btn${seccion === s.key ? ' seccion-btn-active' : ''}`}
                        onClick={() => setSeccion(s.key)}
                    >
                        {s.label}
                    </button>
                ))}
            </nav>

            {/* ── Contenido de sección ── */}
            <section className="seccion-contenido">

                {/* SERVICIOS */}
                {seccion === 'servicios' && (
                    <div>
                        <h2 className="brand-name seccion-titulo">Servicios</h2>

                        {/* Carrusel de trabajos */}
                        <div className="trabajos-carousel">
                            <button
                                className="carousel-arrow carousel-arrow-left"
                                onClick={() => setTrabajoIdx(i => (i - 1 + TRABAJOS.length) % TRABAJOS.length)}
                            >&#10094;</button>

                            <div className="carousel-foto-wrap">
                                <img
                                    src={TRABAJOS[trabajoIdx].src}
                                    alt={TRABAJOS[trabajoIdx].titulo}
                                    className="carousel-foto"
                                />
                                <p className="carousel-titulo">
                                    {TRABAJOS[trabajoIdx].emoji} {TRABAJOS[trabajoIdx].titulo}
                                </p>
                                <div className="carousel-dots">
                                    {TRABAJOS.map((_, i) => (
                                        <span
                                            key={i}
                                            className={`carousel-dot${i === trabajoIdx ? ' active' : ''}`}
                                            onClick={() => setTrabajoIdx(i)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                className="carousel-arrow carousel-arrow-right"
                                onClick={() => setTrabajoIdx(i => (i + 1) % TRABAJOS.length)}
                            >&#10095;</button>
                        </div>

                        {Object.entries(categorias).map(([cat, items]) => (
                            <div key={cat} className="seccion-cat-grupo">
                                <h3 className="seccion-cat-titulo">{cat}</h3>
                                <div className="seccion-cards">
                                    {items.map(s => (
                                        <div key={s.nombre} className="seccion-card">
                                            <span className="seccion-card-nombre">{s.nombre}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* PRECIOS */}
                {seccion === 'precios' && (
                    <div>
                        <h2 className="brand-name seccion-titulo">Precios</h2>
                        {Object.entries(categorias).map(([cat, items]) => (
                            <div key={cat} className="seccion-cat-grupo">
                                <h3 className="seccion-cat-titulo">{cat}</h3>
                                <div className="seccion-precios-lista">
                                    {items.map(s => (
                                        <div key={s.nombre} className="seccion-precio-row">
                                            <span className="seccion-precio-nombre">{s.nombre}</span>
                                            <span className="seccion-precio-valor">${s.precio.toLocaleString('es-AR')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <p className="seccion-nota">* Los precios pueden variar. Consultá por promociones.</p>
                    </div>
                )}

                {/* CUIDADOS */}
                {seccion === 'cuidados' && (
                    <div>
                        <h2 className="brand-name seccion-titulo">Cuidados</h2>
                        <p style={{ fontFamily: 'sans-serif', color: '#888', textAlign: 'center', marginBottom: '24px', fontSize: '0.9rem' }}>
                            Seguí estos consejos para prolongar la duración de tus extensiones.
                        </p>
                        <div className="seccion-cuidados-grid">
                            {CUIDADOS.map((c, i) => (
                                <div key={i} className="seccion-cuidado-card">
                                    <span className="seccion-cuidado-icono">{c.icono}</span>
                                    <h4 className="seccion-cuidado-titulo">{c.titulo}</h4>
                                    <p className="seccion-cuidado-texto">{c.texto}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* INFO */}
                {seccion === 'info' && (
                    <div>
                        <h2 className="brand-name seccion-titulo">Info</h2>
                        <div className="seccion-info-lista">

                            <div className="seccion-info-bloque">
                                <h3 className="seccion-info-bloque-titulo">🗓️ Turnos</h3>
                                <ul className="seccion-info-items">
                                    <li>🖤 Trabajo de <strong>Lunes a Viernes de 10hs a 16hs</strong>.</li>
                                    <li>🖤 Los turnos se sacan con anticipación. Se recomienda reservar con <strong>mínimo semana y media de anticipación</strong> por la alta demanda.</li>
                                    <li>🖤 Tiempo máximo de espera <strong>10 minutos</strong>. Pasados los 10', el turno se cancela automáticamente.</li>
                                    <li>🖤 <strong>No se permiten acompañantes</strong>.</li>
                                    <li>🖤 Para reservar se requiere una <strong>seña del 50%</strong> del servicio, sin excepción.</li>
                                    <li>🖤 En caso de no poder asistir, avisar con <strong>48hs de anticipación</strong>. Sin aviso, la seña no es reembolsable.</li>
                                    <li>🖤 Si el turno se cancela <strong>el mismo día</strong>, la seña se pierde y se deberá abonar el total del servicio, caso contrario no se darán más turnos.</li>
                                </ul>
                            </div>

                            <div className="seccion-info-bloque">
                                <h3 className="seccion-info-bloque-titulo">✨ Service / Retoque</h3>
                                <p className="seccion-info-texto">
                                    El service se realiza a los <strong>15 a 21 días</strong> dependiendo del servicio elegido.
                                    Para que cuente como service deben tener un mínimo del <strong>40% de las extensiones</strong>;
                                    de lo contrario se cobra como nueva colocación.
                                </p>
                                <div className="seccion-info-importante">
                                    <strong>IMPORTANTE</strong><br />
                                    Para que tus pestañas luzcan siempre hermosas, es clave respetar los tiempos del service.
                                    Recordá que los turnos se reservan con <strong>mínimo semana y media de anticipación</strong> por la alta demanda.
                                </div>
                            </div>

                        </div>
                    </div>
                )}

            </section>

            <BookingModal
                isOpen={modalAbierto}
                onClose={() => setModalAbierto(false)}
            />

            <footer className="footer-admin-link">
                <Link to="/admin">Panel Admin</Link>
            </footer>
        </>
    );
}
