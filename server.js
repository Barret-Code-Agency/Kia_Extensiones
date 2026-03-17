require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const admin   = require('firebase-admin');
const cron    = require('node-cron');

// Credenciales Firebase: env var en producción, archivo local en desarrollo
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString())
    : require('./serviceAccountKey.json');

admin.initializeApp({
    credential:  admin.credential.cert(serviceAccount),
    databaseURL: "https://kia-extensiones-default-rtdb.firebaseio.com"
});

const app = express();
app.use(cors({ origin: process.env.APP_URL ? process.env.APP_URL.split(',') : '*' }));
app.use(express.json());

// ===== WHATSAPP (UltraMsg) =====

const MESES_NOMBRES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                       "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

async function enviarWhatsApp(telefono, mensaje) {
    await fetch(`https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE}/messages/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            token: process.env.ULTRAMSG_TOKEN,
            to:    telefono,
            body:  mensaje
        })
    });
}

async function enviarConfirmacionWhatsApp(telefono, nombre, servicio, dia, mes, hora) {
    const mensaje =
        `¡Hola ${nombre}! ✨ Tu pago fue recibido con éxito.\n` +
        `Tu turno en *Kia Extensiones* está CONFIRMADO 💖\n` +
        `📅 ${dia} de ${MESES_NOMBRES[mes]} a las ${hora}hs\n` +
        `💅 Servicio: ${servicio}\n` +
        `¡Te esperamos!`;
    try {
        await enviarWhatsApp(telefono, mensaje);
        console.log(`✅ WhatsApp confirmación enviado a ${nombre} (${telefono})`);
    } catch (error) {
        console.error("❌ Error enviando WhatsApp confirmación:", error);
    }
}

// ===== CRON: AVISOS 24HS Y CANCELACIONES AUTOMÁTICAS =====
// Corre cada hora en punto
cron.schedule('0 * * * *', async () => {
    console.log('🕐 Revisando turnos pendientes...');
    const ahora = Date.now();
    const H24   = 24 * 60 * 60 * 1000;
    const H18   = 18 * 60 * 60 * 1000;
    const H6    = 6  * 60 * 60 * 1000;

    try {
        const snap   = await admin.database().ref('turnos').once('value');
        const turnos = snap.val() || {};

        for (const [id, t] of Object.entries(turnos)) {
            if (t.estado !== 'pendiente') continue;

            const horaNum    = parseInt((t.hora || '0').split(':')[0]);
            const fechaTurno = new Date(t.año, t.mes, t.dia, horaNum, 0, 0).getTime();
            const diff       = fechaTurno - ahora;

            // Si el turno ya pasó o quedan menos de 6hs → cancelar
            if (diff <= H6) {
                await admin.database().ref(`turnos/${id}`).update({ estado: 'cancelado' });
                console.log(`❌ Turno de ${t.cliente} (${t.dia}/${t.mes+1}) cancelado automáticamente`);
                continue;
            }

            // Si faltan entre 18hs y 24hs y aún no se avisó → enviar aviso
            if (diff <= H24 && diff > H18 && !t.aviso24h) {
                const msg =
                    `¡Hola ${t.cliente}! 🌸\n` +
                    `Te recordamos que mañana tenés turno en *Kia Extensiones*.\n` +
                    `📅 ${t.dia} de ${MESES_NOMBRES[t.mes]} a las ${t.hora}hs — ${t.servicio}\n` +
                    `⚠️ Todavía no registramos el pago de la seña. Si no se abona, el turno se libera automáticamente dentro de 6 horas.\n` +
                    `¡No pierdas tu lugar! 💖`;
                try {
                    await enviarWhatsApp(t.whatsapp, msg);
                    await admin.database().ref(`turnos/${id}`).update({ aviso24h: true });
                    console.log(`📩 Aviso 24hs enviado a ${t.cliente}`);
                } catch (e) {
                    console.error(`❌ Error aviso 24hs a ${t.cliente}:`, e);
                }
            }
        }
    } catch (err) {
        console.error('❌ Error en cron de avisos:', err);
    }
});

// ===== NOTIFICAR ACTUALIZACIÓN DE PRECIOS =====
app.post('/notificar-precios', async (req, res) => {
    try {
        const [snapTurnos, snapServs] = await Promise.all([
            admin.database().ref('turnos').once('value'),
            admin.database().ref('servicios').once('value'),
        ]);

        const turnos   = Object.values(snapTurnos.val() || {});
        const servicios = snapServs.val() || [];

        // Números únicos de todos los clientes que alguna vez reservaron
        const numeros = [...new Set(turnos.map(t => t.whatsapp).filter(Boolean))];

        // Agrupar servicios por categoría y construir lista
        const categorias = servicios.reduce((acc, s) => {
            if (!acc[s.cat]) acc[s.cat] = [];
            acc[s.cat].push(s);
            return acc;
        }, {});

        const lista = Object.entries(categorias)
            .map(([cat, items]) => {
                const lineas = items
                    .map(s => `• ${s.nombre}: $${s.precio.toLocaleString('es-AR')}`)
                    .join('\n');
                return `*${cat}*\n${lineas}`;
            })
            .join('\n\n');

        const mensaje =
            `¡Hola! 🌸 Desde *Kia Extensiones* te compartimos nuestra lista de precios actualizada:\n\n` +
            lista +
            `\n\n¡Gracias por elegirnos siempre! 💖`;

        // Enviar con delay de 1 seg entre mensajes para no saturar la API
        let enviados = 0;
        for (const numero of numeros) {
            try {
                await enviarWhatsApp(numero, mensaje);
                enviados++;
                console.log(`📩 Precio enviado a ${numero}`);
            } catch (e) {
                console.error(`❌ Error enviando a ${numero}:`, e);
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log(`✅ Precios notificados a ${enviados}/${numeros.length} clientes`);
        res.json({ ok: true, enviados, total: numeros.length });
    } catch (err) {
        console.error('❌ Error notificando precios:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// ===== CREAR PREFERENCIA DE PAGO =====
// El frontend llama a este endpoint, que crea la preferencia en MP y devuelve el init_point real.

app.post('/crear-preferencia', async (req, res) => {
    const { turnoId, monto, servicio } = req.body;

    try {
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
                items: [{
                    title:       servicio,
                    unit_price:  monto,
                    quantity:    1,
                    currency_id: 'ARS',
                }],
                external_reference: turnoId,
                notification_url:   process.env.WEBHOOK_URL,
                back_urls: {
                    success: process.env.APP_URL || 'http://localhost:5173',
                    failure: process.env.APP_URL || 'http://localhost:5173',
                    pending: process.env.APP_URL || 'http://localhost:5173',
                },
                auto_return: 'approved',
            }),
        });

        const data = await response.json();

        if (!data.init_point) {
            console.error('❌ MP no devolvió init_point:', data);
            return res.status(500).json({ error: 'Error creando preferencia en MercadoPago' });
        }

        res.json({ init_point: data.init_point });

    } catch (error) {
        console.error('❌ Error creando preferencia MP:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ===== WEBHOOK MERCADO PAGO =====
// Ruta única y limpia. Confirma turno solo cuando el pago es aprobado.

app.post('/mercadopago-webhook', async (req, res) => {
    const { action, data } = req.body;

    // Solo nos interesa el evento de pago creado/actualizado
    if (action !== "payment.created" && action !== "payment.updated") {
        return res.sendStatus(200);
    }

    try {
        const paymentId = data.id;

        // Consultar el estado real del pago en MercadoPago
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
        });
        const infoPago = await response.json();

        if (infoPago.status !== 'approved') {
            console.log(`Pago ${paymentId} no aprobado (estado: ${infoPago.status})`);
            return res.sendStatus(200);
        }

        const turnoId  = infoPago.external_reference;
        const turnoRef = admin.database().ref(`turnos/${turnoId}`);
        const snapshot = await turnoRef.once('value');
        const turno    = snapshot.val();

        if (!turno) {
            console.error(`❌ Turno ${turnoId} no encontrado en Firebase`);
            return res.sendStatus(200);
        }

        // Evitar confirmar dos veces
        if (turno.estado === 'confirmado') {
            console.log(`Turno ${turnoId} ya estaba confirmado`);
            return res.sendStatus(200);
        }

        const seña = turno.montoTotal / 2;

        // 1. Actualizar estado en Firebase
        await turnoRef.update({
            estado:        'confirmado',
            montoPagado:   seña,
            montoRestante: seña
        });

        // 2. Enviar confirmación por WhatsApp
        await enviarConfirmacionWhatsApp(
            turno.whatsapp,
            turno.cliente,
            turno.servicio,
            turno.dia,
            turno.mes,
            turno.hora
        );

        console.log(`✅ Turno ${turnoId} confirmado para ${turno.cliente}`);

    } catch (error) {
        console.error("❌ Error en webhook MP:", error);
    }

    res.sendStatus(200);
});

app.listen(3000, () => console.log("🚀 Servidor Kia Extensiones activo en puerto 3000"));
