# Kia Extensiones

Sistema de turnos online para estudio de extensiones de pestañas. Permite a los clientes reservar turnos, abonar la seña vía MercadoPago y recibir confirmación por WhatsApp. Incluye panel de administración completo.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express |
| Base de datos | Firebase Realtime Database |
| Almacenamiento | Firebase Storage (galería) |
| Pagos | MercadoPago Checkout Pro |
| WhatsApp | UltraMsg API |
| Deploy | Render (backend) / cualquier hosting estático (frontend) |

---

## Funcionalidades

### Landing pública
- Sección de servicios con precios dinámicos (leídos desde Firebase)
- Galería de fotos por categorías (Extensiones / Cejas / Extras)
- Modal de reserva de turno con calendario, horarios disponibles y formulario de datos
- Pago de seña (50% del servicio) vía MercadoPago Checkout Pro
- Diseño en rosa y lila con tipografía cursiva (Great Vibes)

### Panel de administración (`/admin`)
- Login con contraseña
- **Dashboard** — estadísticas generales (turnos del día, confirmados, pendientes, ingresos)
- **Agenda** — vista mensual y diaria de turnos con filtros
- **Turnos** — tabla completa con edición, cancelación manual y cambio de estado
- **Clientes** — historial por cliente con total gastado
- **Pagos** — registro de señas y saldos pendientes
- **Precios** — ABM de servicios y categorías, con botón para notificar lista actualizada por WhatsApp masivo
- **Galería** — subida y eliminación de fotos por categoría (Firebase Storage)
- **Bloqueos** — bloquear días completos o franjas horarias para que no aparezcan en el calendario

### Automatizaciones (server.js)
- **Aviso 24hs**: cron cada hora — si faltan entre 18 y 24hs para el turno y sigue pendiente, envía WhatsApp al cliente recordándole pagar la seña
- **Cancelación automática**: si quedan menos de 6hs y el turno sigue sin pagar, se cancela automáticamente
- **Resumen diario al admin**: cron a las 21:00 — envía al número del admin los turnos del día siguiente con su estado
- **Notificación masiva de precios**: endpoint `POST /notificar-precios` que envía la lista de precios por WhatsApp a todos los clientes que alguna vez reservaron

---

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# MercadoPago
MP_ACCESS_TOKEN=APP_USR-...

# URL del webhook (URL pública del servidor + /mercadopago-webhook)
WEBHOOK_URL=https://tu-server.render.com/mercadopago-webhook

# URL del frontend (para back_urls de MP)
APP_URL=https://tu-frontend.com

# UltraMsg WhatsApp
ULTRAMSG_INSTANCE=instance12345
ULTRAMSG_TOKEN=tu_token

# WhatsApp del admin (para recibir resumen diario)
ADMIN_WHATSAPP=5491112345678

# Firebase Admin SDK (en producción: JSON del serviceAccountKey en base64)
FIREBASE_SERVICE_ACCOUNT=base64_del_json
```

> En desarrollo, se puede usar el archivo `serviceAccountKey.json` directamente en la raíz (no subir al repo).

---

## Instalación y uso local

```bash
# Clonar e instalar dependencias
npm install

# Iniciar el servidor backend (puerto 3000)
npm run server

# Iniciar el frontend con Vite (puerto 5173)
npm run dev
```

Acceder al panel de admin en `http://localhost:5173/admin`.

---

## Estructura del proyecto

```
├── src/
│   ├── pages/
│   │   ├── Home.jsx              # Landing pública
│   │   └── Admin.jsx             # Panel de administración
│   ├── components/
│   │   ├── BookingModal.jsx       # Modal de reserva (calendario + form + pago)
│   │   ├── BookingCalendar.jsx    # Selector de fecha
│   │   ├── BookingTimeSlots.jsx   # Selector de horario
│   │   ├── BookingForm.jsx        # Formulario de datos del cliente
│   │   ├── Gallery.jsx            # Slider de fotos
│   │   ├── Header.jsx
│   │   └── admin/
│   │       ├── AdminLogin.jsx
│   │       ├── AdminNav.jsx
│   │       ├── Dashboard.jsx
│   │       ├── AgendaView.jsx
│   │       ├── AgendaCalendar.jsx
│   │       ├── TurnosTable.jsx
│   │       ├── EditTurnoModal.jsx
│   │       ├── ClientesView.jsx
│   │       ├── PagosView.jsx
│   │       ├── PreciosTable.jsx
│   │       ├── GaleriaAdmin.jsx
│   │       ├── BloqueosDias.jsx
│   │       └── StatCard.jsx
│   ├── data/
│   │   └── servicios.js          # Datos iniciales y constantes
│   ├── firebase.js               # Inicialización Firebase (db + storage)
│   └── main.jsx
├── server.js                     # Backend Express (MP webhook + WhatsApp + crons)
├── public/images/                # Imágenes estáticas
└── package.json
```

---

## Flujo de reserva

```
Cliente elige servicio → selecciona fecha/hora → completa datos
  → turno guardado en Firebase (estado: "pendiente")
    → pago de seña vía MercadoPago
      → webhook confirma pago aprobado
        → turno actualizado (estado: "confirmado")
          → WhatsApp de confirmación al cliente
```

Si el cliente **no paga la seña**:
- A las 24hs antes: recibe un WhatsApp de recordatorio
- A las 6hs antes: el turno se cancela automáticamente y el horario queda libre

---

## Estructura de datos en Firebase

### `turnos/{id}`
```json
{
  "cliente": "Nombre Apellido",
  "whatsapp": "5491112345678",
  "servicio": "Extensiones clásicas",
  "dia": 20,
  "mes": 2,
  "año": 2026,
  "hora": "10:00",
  "estado": "confirmado",
  "montoTotal": 50000,
  "montoPagado": 25000,
  "montoRestante": 25000,
  "aviso24h": true
}
```

### `servicios/`
Array de objetos `{ nombre, precio, cat }` donde `cat` es la categoría (ej: "Extensiones").

### `bloqueos/`
Días u horarios bloqueados para que no aparezcan disponibles en el calendario.
