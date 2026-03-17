import './GaleriaAdmin.css';
import { useEffect, useRef, useState } from 'react';
import {
    ref as storageRef,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
} from 'firebase/storage';
import { ref as dbRef, onValue, push, set, remove } from 'firebase/database';
import { storage, db } from '../../firebase';

const CATEGORIAS = ['Extensiones', 'Cejas', 'Extras', 'General'];

export default function GaleriaAdmin() {
    const [fotos,     setFotos]     = useState([]);
    const [categoria, setCategoria] = useState('General');
    const [progreso,  setProgreso]  = useState(0);
    const [subiendo,  setSubiendo]  = useState(false);
    const inputRef = useRef();

    // Escuchar la colección "galeria" en Firebase DB
    useEffect(() => {
        const unsubscribe = onValue(dbRef(db, 'galeria'), snap => {
            const data = snap.val() || {};
            setFotos(Object.entries(data).map(([id, v]) => ({ id, ...v })));
        });
        return unsubscribe;
    }, []);

    const handleArchivo = (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;
        subirFoto(archivo);
    };

    const subirFoto = (archivo) => {
        setSubiendo(true);
        setProgreso(0);

        const ruta     = `galeria/${Date.now()}_${archivo.name}`;
        const sRef     = storageRef(storage, ruta);
        const upload   = uploadBytesResumable(sRef, archivo);

        upload.on(
            'state_changed',
            snap => setProgreso(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
            err  => { console.error(err); setSubiendo(false); },
            async () => {
                const url = await getDownloadURL(upload.snapshot.ref);
                const nuevoRef = push(dbRef(db, 'galeria'));
                await set(nuevoRef, { url, categoria, ruta, activa: true });
                setSubiendo(false);
                setProgreso(0);
                if (inputRef.current) inputRef.current.value = '';
            }
        );
    };

    const eliminarFoto = async (foto) => {
        if (!confirm('¿Eliminar esta foto?')) return;
        await deleteObject(storageRef(storage, foto.ruta));
        await remove(dbRef(db, `galeria/${foto.id}`));
    };

    const fotosFiltradas = categoria === 'Todas'
        ? fotos
        : fotos.filter(f => f.categoria === categoria);

    return (
        <div>
            <h1 className="admin-section-title">Galería de Fotos</h1>

            {/* Upload */}
            <div className="galeria-upload-row" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
                <select
                    value={categoria}
                    onChange={e => setCategoria(e.target.value)}
                    style={{ padding: '8px 14px', borderRadius: '20px', border: '1.5px solid #ddd', fontFamily: 'sans-serif' }}
                >
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <div className="upload-area" style={{ flex: 1 }} onClick={() => inputRef.current?.click()}>
                    {subiendo ? (
                        <>
                            <p>Subiendo... {progreso}%</p>
                            <div className="upload-progress">
                                <div className="upload-progress-bar" style={{ width: `${progreso}%` }} />
                            </div>
                        </>
                    ) : (
                        <p>📁 Hacé click para subir una foto (categoría: <strong>{categoria}</strong>)</p>
                    )}
                </div>
                <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleArchivo} />
            </div>

            {/* Filtro de visualización */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {['Todas', ...CATEGORIAS].map(c => (
                    <button
                        key={c}
                        className={`btn-admin${c === categoria ? '' : ' rosa'}`}
                        style={{ opacity: c === categoria ? 1 : 0.5, fontSize: '0.82rem', padding: '6px 14px' }}
                        onClick={() => setCategoria(c)}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {/* Grid de fotos */}
            {fotosFiltradas.length === 0 ? (
                <p style={{ color: '#aaa', fontFamily: 'sans-serif', marginTop: '20px' }}>
                    No hay fotos en esta categoría.
                </p>
            ) : (
                <div className="galeria-grid">
                    {fotosFiltradas.map(foto => (
                        <div key={foto.id} className="galeria-item">
                            <img src={foto.url} alt="" />
                            <div className="galeria-item-overlay">
                                <span className="galeria-cat-badge">{foto.categoria}</span>
                                <button className="btn-delete-img" onClick={() => eliminarFoto(foto)}>
                                    🗑 Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
