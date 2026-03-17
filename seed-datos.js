// ─────────────────────────────────────────────────────────────
//  seed-datos.js  — Datos ficticios para testing
//  Uso: node seed-datos.js
//  ⚠️  BORRA y RECREA las colecciones turnos, bloqueos y galeria
// ─────────────────────────────────────────────────────────────

import { db } from './src/firebase.js';
import { ref, set, remove } from 'firebase/database';

// ── Helpers ────────────────────────────────────────────────────
const ts = (year, month, day) => new Date(year, month, day).getTime();

// ── Clientes ficticios ─────────────────────────────────────────
// mes: 0-indexed (2 = Marzo, 3 = Abril)

const TURNOS = {

    // ── PASADOS (confirmados) ──────────────────────────────────

    turno01: {
        id: 'turno01', cliente: 'Valentina García', whatsapp: '+5491122334455',
        dia: 5, mes: 2, año: 2026, hora: '10:00',
        servicio: 'Volumen Ruso (6D, 7D)',
        montoTotal: 26000, montoSeña: 13000, montoRestante: 13000,
        estado: 'confirmado', timestamp_creacion: ts(2026, 2, 4),
    },
    turno02: {
        id: 'turno02', cliente: 'Lucía Martínez', whatsapp: '+5491133445566',
        dia: 5, mes: 2, año: 2026, hora: '14:00',
        servicio: 'Clásicas',
        montoTotal: 20000, montoSeña: 10000, montoRestante: 10000,
        estado: 'confirmado', timestamp_creacion: ts(2026, 2, 4),
    },
    turno03: {
        id: 'turno03', cliente: 'Sofía López', whatsapp: '+5491144556677',
        dia: 10, mes: 2, año: 2026, hora: '10:00',
        servicio: 'Perfilado y Laminado',
        montoTotal: 10000, montoSeña: 5000, montoRestante: 5000,
        estado: 'confirmado', timestamp_creacion: ts(2026, 2, 9),
    },
    turno04: {
        id: 'turno04', cliente: 'Camila Rodríguez', whatsapp: '+5491155667788',
        dia: 10, mes: 2, año: 2026, hora: '14:00',
        servicio: 'Volumen Tecnológico 4D',
        montoTotal: 24500, montoSeña: 12250, montoRestante: 12250,
        estado: 'confirmado', timestamp_creacion: ts(2026, 2, 9),
    },
    turno05: {
        id: 'turno05', cliente: 'Isabella Fernández', whatsapp: '+5491166778899',
        dia: 12, mes: 2, año: 2026, hora: '10:00',
        servicio: 'Diseño y Perfilado',
        montoTotal: 6000, montoSeña: 3000, montoRestante: 3000,
        estado: 'confirmado', timestamp_creacion: ts(2026, 2, 11),
    },
    turno06: {
        id: 'turno06', cliente: 'Martina Torres', whatsapp: '+5491177889900',
        dia: 12, mes: 2, año: 2026, hora: '12:00',
        servicio: 'Efecto Rímel',
        montoTotal: 22000, montoSeña: 11000, montoRestante: 11000,
        estado: 'cancelado', timestamp_creacion: ts(2026, 2, 11),
    },
    turno07: {
        id: 'turno07', cliente: 'Lucía Martínez', whatsapp: '+5491133445566',
        dia: 13, mes: 2, año: 2026, hora: '14:00',
        servicio: 'Service',
        montoTotal: 1000, montoSeña: 500, montoRestante: 500,
        estado: 'confirmado', timestamp_creacion: ts(2026, 2, 12),
    },
    turno08: {
        id: 'turno08', cliente: 'Valentina García', whatsapp: '+5491122334455',
        dia: 14, mes: 2, año: 2026, hora: '10:00',
        servicio: 'Service',
        montoTotal: 1000, montoSeña: 500, montoRestante: 500,
        estado: 'confirmado', timestamp_creacion: ts(2026, 2, 13),
    },
    turno09: {
        id: 'turno09', cliente: 'Camila Rodríguez', whatsapp: '+5491155667788',
        dia: 14, mes: 2, año: 2026, hora: '12:00',
        servicio: 'Remoción EK',
        montoTotal: 3000, montoSeña: 1500, montoRestante: 1500,
        estado: 'confirmado', timestamp_creacion: ts(2026, 2, 13),
    },

    // ── HOY y FUTUROS ──────────────────────────────────────────

    turno10: {
        id: 'turno10', cliente: 'Sofía López', whatsapp: '+5491144556677',
        dia: 17, mes: 2, año: 2026, hora: '10:00',
        servicio: 'Volumen Medio (4D, 5D)',
        montoTotal: 25000, montoSeña: 12500, montoRestante: 12500,
        estado: 'confirmado', timestamp_creacion: ts(2026, 2, 15),
    },
    turno11: {
        id: 'turno11', cliente: 'Martina Torres', whatsapp: '+5491177889900',
        dia: 17, mes: 2, año: 2026, hora: '14:00',
        servicio: 'Efecto Rímel',
        montoTotal: 22000, montoSeña: 11000, montoRestante: 11000,
        estado: 'pendiente', timestamp_creacion: ts(2026, 2, 15),
    },
    turno12: {
        id: 'turno12', cliente: 'Isabella Fernández', whatsapp: '+5491166778899',
        dia: 18, mes: 2, año: 2026, hora: '12:00',
        servicio: 'Clásicas',
        montoTotal: 20000, montoSeña: 10000, montoRestante: 10000,
        estado: 'pendiente', timestamp_creacion: ts(2026, 2, 16),
    },
    turno13: {
        id: 'turno13', cliente: 'Valentina García', whatsapp: '+5491122334455',
        dia: 19, mes: 2, año: 2026, hora: '10:00',
        servicio: 'Volumen Ruso (6D, 7D)',
        montoTotal: 26000, montoSeña: 13000, montoRestante: 13000,
        estado: 'pendiente', timestamp_creacion: ts(2026, 2, 16),
    },
    turno14: {
        id: 'turno14', cliente: 'Camila Rodríguez', whatsapp: '+5491155667788',
        dia: 19, mes: 2, año: 2026, hora: '16:00',
        servicio: 'Volumen Tecnológico 5D',
        montoTotal: 25500, montoSeña: 12750, montoRestante: 12750,
        estado: 'pendiente', timestamp_creacion: ts(2026, 2, 16),
    },
    turno15: {
        id: 'turno15', cliente: 'Lucía Martínez', whatsapp: '+5491133445566',
        dia: 20, mes: 2, año: 2026, hora: '12:00',
        servicio: 'Diseño y Perfilado',
        montoTotal: 6000, montoSeña: 3000, montoRestante: 3000,
        estado: 'pendiente', timestamp_creacion: ts(2026, 2, 16),
    },
    turno16: {
        id: 'turno16', cliente: 'Sofía López', whatsapp: '+5491144556677',
        dia: 23, mes: 2, año: 2026, hora: '10:00',
        servicio: 'Service',
        montoTotal: 1000, montoSeña: 500, montoRestante: 500,
        estado: 'confirmado', timestamp_creacion: ts(2026, 2, 18),
    },
    turno17: {
        id: 'turno17', cliente: 'Martina Torres', whatsapp: '+5491177889900',
        dia: 25, mes: 2, año: 2026, hora: '16:00',
        servicio: 'Perfilado y Laminado',
        montoTotal: 10000, montoSeña: 5000, montoRestante: 5000,
        estado: 'pendiente', timestamp_creacion: ts(2026, 2, 19),
    },
    turno18: {
        id: 'turno18', cliente: 'Valentina García', whatsapp: '+5491122334455',
        dia: 26, mes: 2, año: 2026, hora: '10:00',
        servicio: 'Volumen Medio (4D, 5D)',
        montoTotal: 25000, montoSeña: 12500, montoRestante: 12500,
        estado: 'pendiente', timestamp_creacion: ts(2026, 2, 20),
    },
    turno19: {
        id: 'turno19', cliente: 'Isabella Fernández', whatsapp: '+5491166778899',
        dia: 26, mes: 2, año: 2026, hora: '14:00',
        servicio: 'Efecto Rímel',
        montoTotal: 22000, montoSeña: 11000, montoRestante: 11000,
        estado: 'pendiente', timestamp_creacion: ts(2026, 2, 20),
    },
    turno20: {
        id: 'turno20', cliente: 'Camila Rodríguez', whatsapp: '+5491155667788',
        dia: 28, mes: 2, año: 2026, hora: '10:00',
        servicio: 'Volumen Ruso (6D, 7D)',
        montoTotal: 26000, montoSeña: 13000, montoRestante: 13000,
        estado: 'confirmado', timestamp_creacion: ts(2026, 2, 21),
    },
    turno21: {
        id: 'turno21', cliente: 'Lucía Martínez', whatsapp: '+5491133445566',
        dia: 28, mes: 2, año: 2026, hora: '12:00',
        servicio: 'Clásicas',
        montoTotal: 20000, montoSeña: 10000, montoRestante: 10000,
        estado: 'pendiente', timestamp_creacion: ts(2026, 2, 21),
    },

    // ── ABRIL ─────────────────────────────────────────────────

    turno22: {
        id: 'turno22', cliente: 'Sofía López', whatsapp: '+5491144556677',
        dia: 2, mes: 3, año: 2026, hora: '10:00',
        servicio: 'Volumen Ruso (6D, 7D)',
        montoTotal: 26000, montoSeña: 13000, montoRestante: 13000,
        estado: 'pendiente', timestamp_creacion: ts(2026, 2, 25),
    },
    turno23: {
        id: 'turno23', cliente: 'Valentina García', whatsapp: '+5491122334455',
        dia: 7, mes: 3, año: 2026, hora: '14:00',
        servicio: 'Service',
        montoTotal: 1000, montoSeña: 500, montoRestante: 500,
        estado: 'pendiente', timestamp_creacion: ts(2026, 2, 25),
    },
    turno24: {
        id: 'turno24', cliente: 'Martina Torres', whatsapp: '+5491177889900',
        dia: 8, mes: 3, año: 2026, hora: '10:00',
        servicio: 'Volumen Tecnológico 3D',
        montoTotal: 24000, montoSeña: 12000, montoRestante: 12000,
        estado: 'pendiente', timestamp_creacion: ts(2026, 2, 26),
    },
    turno25: {
        id: 'turno25', cliente: 'Camila Rodríguez', whatsapp: '+5491155667788',
        dia: 9, mes: 3, año: 2026, hora: '12:00',
        servicio: 'Diseño y Perfilado',
        montoTotal: 6000, montoSeña: 3000, montoRestante: 3000,
        estado: 'pendiente', timestamp_creacion: ts(2026, 2, 26),
    },
};

const BLOQUEOS = {
    '2026-03-21': true,   // Sábado bloqueado (vacaciones)
    '2026-04-01': true,   // Miércoles — Semana Santa
    '2026-04-03': true,   // Viernes Santo
};

// ── Ejecutar seed ──────────────────────────────────────────────
async function seed() {
    console.log('🗑  Limpiando datos anteriores...');
    await remove(ref(db, 'turnos'));
    await remove(ref(db, 'bloqueos'));

    console.log('📝 Cargando turnos ficticios...');
    await set(ref(db, 'turnos'), TURNOS);

    console.log('🔒 Cargando bloqueos...');
    await set(ref(db, 'bloqueos'), BLOQUEOS);

    const total = Object.keys(TURNOS).length;
    const confirmados = Object.values(TURNOS).filter(t => t.estado === 'confirmado').length;
    const pendientes  = Object.values(TURNOS).filter(t => t.estado === 'pendiente').length;
    const cancelados  = Object.values(TURNOS).filter(t => t.estado === 'cancelado').length;

    console.log(`\n✅ Seed completo:`);
    console.log(`   ${total} turnos cargados`);
    console.log(`   ${confirmados} confirmados | ${pendientes} pendientes | ${cancelados} cancelados`);
    console.log(`   ${Object.keys(BLOQUEOS).length} días bloqueados`);
    console.log(`\n   Clientes: Valentina García, Lucía Martínez, Sofía López,`);
    console.log(`             Camila Rodríguez, Isabella Fernández, Martina Torres`);

    process.exit(0);
}

seed().catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
});
