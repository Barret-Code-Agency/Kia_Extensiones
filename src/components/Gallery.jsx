import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

import './Gallery.css';

const CATEGORIAS = ['Todas', 'Extensiones', 'Cejas', 'Lifting', 'Otros'];

// Fallback hardcodeado si Firebase no tiene fotos aún
const FOTOS_DEFAULT = [
    { src: '/images/1.jpeg', categoria: 'Extensiones' },
    { src: '/images/2.jpeg', categoria: 'Extensiones' },
    { src: '/images/3.jpeg', categoria: 'Cejas' },
];

const IMAGE_WIDTH = 110; // 100px + 10px gap
const VISIBLE     = 3;

export default function Gallery() {
    const [fotos,     setFotos]     = useState(FOTOS_DEFAULT);
    const [categoria, setCategoria] = useState('Todas');
    const [idx,       setIdx]       = useState(0);

    useEffect(() => {
        const unsub = onValue(ref(db, 'galeria'), snap => {
            const data = snap.val();
            if (data) {
                setFotos(Object.values(data));
            }
        });
        return unsub;
    }, []);

    // Resetear posición cuando cambia la categoría
    useEffect(() => { setIdx(0); }, [categoria]);

    const fotasFiltradas = categoria === 'Todas'
        ? fotos
        : fotos.filter(f => f.categoria === categoria);

    const mover = (dir) => {
        setIdx(prev => {
            const sig = prev + dir;
            if (sig < 0) return 0;
            if (sig > fotasFiltradas.length - VISIBLE) return Math.max(0, fotasFiltradas.length - VISIBLE);
            return sig;
        });
    };

    return (
        <section className="section-trabajos">
            <h2 className="brand-name title-center">Nuestros Trabajos</h2>

            {/* Filtros por categoría */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
                {CATEGORIAS.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategoria(cat)}
                        style={{
                            padding: '5px 14px',
                            borderRadius: '20px',
                            border: '2px solid var(--rosa)',
                            background: categoria === cat ? 'var(--rosa)' : 'white',
                            color: categoria === cat ? 'white' : 'var(--rosa)',
                            cursor: 'pointer',
                            fontFamily: 'sans-serif',
                            fontSize: '0.82rem',
                            fontWeight: 'bold',
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="slider-main-container">
                <button className="nav-btn prev" onClick={() => mover(-1)}>&#10094;</button>

                <div className="slider-wrapper">
                    <div
                        className="photos-container"
                        style={{ transform: `translateX(-${idx * IMAGE_WIDTH}px)` }}
                    >
                        {fotasFiltradas.map((foto, i) => (
                            <div key={i} className={`photo-box${foto.horizontal ? ' horizontal' : ''}`}>
                                <img src={foto.url || foto.src} alt={foto.categoria || `Foto ${i + 1}`} />
                            </div>
                        ))}
                        {fotasFiltradas.length === 0 && (
                            <p style={{ fontFamily: 'sans-serif', color: '#aaa', padding: '20px' }}>
                                Sin fotos en esta categoría todavía.
                            </p>
                        )}
                    </div>
                </div>

                <button className="nav-btn next" onClick={() => mover(1)}>&#10095;</button>
            </div>
        </section>
    );
}
