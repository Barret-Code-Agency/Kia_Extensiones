// ===== DATOS & CONFIGURACIÓN =====
const DATOS_INICIALES = [
    { cat: "Extensiones", nombre: "Clásicas", precio: 20000 },
    { cat: "Extensiones", nombre: "Efecto Rímel", precio: 22000 },
    { cat: "Extensiones", nombre: "Volumen Tecnológico 3D", precio: 24000 },
    { cat: "Extensiones", nombre: "Volumen Tecnológico 4D", precio: 24500 },
    { cat: "Extensiones", nombre: "Volumen Tecnológico 5D", precio: 25500 },
    { cat: "Extensiones", nombre: "Volumen Medio (4D, 5D)", precio: 25000 },
    { cat: "Extensiones", nombre: "Volumen Ruso (6D, 7D)", precio: 26000 },
    { cat: "Extensiones", nombre: "Service", precio: 1000 },
    { cat: "Extras", nombre: "Remoción EK", precio: 3000 },
    { cat: "Extras", nombre: "Remoción Otro Lugar", precio: 4500 },
    { cat: "Extras", nombre: "Mala praxis", precio: 5000 },
    { cat: "Extras", nombre: "Maquillaje", precio: 2000 },
    { cat: "Extras", nombre: "Toque color", precio: 4000 },
    { cat: "Cejas", nombre: "Diseño y Perfilado", precio: 6000 },
    { cat: "Cejas", nombre: "Perfilado y Laminado", precio: 10000 }
];

const PRECIO_RESERVA_PORCENTAJE = 0.5;
const LINK_MERCADO_PAGO = "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=TU_ID";

let fechaSeleccionada = {
    dia: null, mesNombre: null, mesIndice: null,
    año: null, hora: null, servicio: null,
    montoTotal: 0, montoReserva: 0, montoRestante: 0
};

// ===== SERVICIOS (FIREBASE) =====
// Una sola definición: lee desde Firebase, inicializa si está vacío

async function obtenerServicios() {
    const snapshot = await db.ref('servicios').once('value');
    if (snapshot.exists()) {
        return snapshot.val();
    } else {
        await db.ref('servicios').set(DATOS_INICIALES);
        return DATOS_INICIALES;
    }
}

// ===== CALENDARIO =====

function abrirCalendario() {
    const modal = document.getElementById('modal-turno');
    if (modal) {
        modal.style.display = 'flex';
        renderizarCalendarios();
    }
}

function cerrarModal() {
    document.getElementById('modal-turno').style.display = 'none';
    document.getElementById('horarios-container').style.display = 'none';
    document.getElementById('form-reserva').style.display = 'none';
}

function renderizarCalendarios() {
    const contenedor = document.querySelector('.calendarios-wrapper');
    if (!contenedor) return;
    contenedor.innerHTML = "";

    const hoy = new Date();
    const grid = document.createElement('div');
    grid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 15px; width: 100%; padding: 20px;";

    for (let i = 0; i < 60; i++) {
        const fecha = new Date();
        fecha.setDate(hoy.getDate() + i);

        const dia       = fecha.getDate();
        const mesIdx    = fecha.getMonth();
        const mesNombre = fecha.toLocaleString('es-ES', { month: 'short' });
        const año       = fecha.getFullYear();
        const diaSemana = fecha.getDay();

        const celda = document.createElement('div');
        celda.className = "calendar-day";
        celda.innerHTML = `<span style="font-size:0.8rem">${mesNombre}</span><br><strong>${dia}</strong>`;

        if (diaSemana === 0) {
            celda.classList.add('day-busy');
            celda.style.opacity = "0.5";
        } else {
            celda.classList.add('day-free');
            celda.onclick = () => manejarSeleccionDia(dia, mesNombre, mesIdx, año, celda);
        }
        grid.appendChild(celda);
    }
    contenedor.appendChild(grid);
}

function manejarSeleccionDia(dia, nombreMes, indiceMes, año, elemento) {
    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('day-selected'));
    elemento.classList.add('day-selected');
    fechaSeleccionada.dia        = dia;
    fechaSeleccionada.mesNombre  = nombreMes;
    fechaSeleccionada.mesIndice  = indiceMes;
    fechaSeleccionada.año        = año;
    document.getElementById('seleccion-info').innerText = `Día elegido: ${dia} de ${nombreMes}`;
    mostrarHorarios();
}

// Corregido: ahora consulta Firebase (antes llamaba a verificarDisponibilidad que no existía)
async function mostrarHorarios() {
    const container  = document.getElementById('horarios-container');
    const gridHoras  = document.getElementById('grid-horas');
    container.style.display = 'block';
    gridHoras.innerHTML = "";

    const rangos = ["10:00", "12:00", "14:00", "16:00", "18:00"];

    // Cargamos turnos confirmados de Firebase una sola vez
    const snapshot = await db.ref('turnos').once('value');
    const turnos   = snapshot.val() || {};
    const confirmados = Object.values(turnos).filter(t => t.estado === 'confirmado');

    rangos.forEach(h => {
        const btn = document.createElement('button');
        btn.innerText  = h;
        btn.className  = "hora-btn";

        const ocupado = confirmados.some(t =>
            t.dia  === fechaSeleccionada.dia  &&
            t.mes  === fechaSeleccionada.mesIndice &&
            t.hora === h
        );

        if (ocupado) {
            btn.classList.add('hora-busy');
            btn.innerText += " (Ocupado)";
        } else {
            btn.onclick = () => manejarSeleccionHora(h, btn);
        }
        gridHoras.appendChild(btn);
    });

    document.getElementById('form-reserva').style.display = 'none';
}

function manejarSeleccionHora(hora, elemento) {
    document.querySelectorAll('.hora-btn').forEach(b => b.classList.remove('selected'));
    elemento.classList.add('selected');
    fechaSeleccionada.hora = hora;
    document.getElementById('form-reserva').style.display = 'block';
}

// ===== RESERVA =====
// Una sola definición: crea turno en Firebase y redirige a MercadoPago

async function enviarReserva(event) {
    event.preventDefault();

    const nombre   = document.getElementById('nombre-cliente').value;
    const whatsapp = document.getElementById('whatsapp-cliente').value;
    const servicio = fechaSeleccionada.servicio;

    if (!servicio || !nombre || !whatsapp) {
        alert("Completa todos los campos");
        return;
    }

    const nuevoTurnoRef = db.ref('turnos').push();
    const turnoId = nuevoTurnoRef.key;

    const datosTurno = {
        id:                turnoId,
        cliente:           nombre,
        whatsapp:          whatsapp,
        dia:               fechaSeleccionada.dia,
        mes:               fechaSeleccionada.mesIndice,
        año:               fechaSeleccionada.año,
        hora:              fechaSeleccionada.hora,
        servicio:          servicio,
        montoTotal:        fechaSeleccionada.montoTotal,
        montoSeña:         fechaSeleccionada.montoReserva,
        montoRestante:     fechaSeleccionada.montoRestante,
        estado:            'pendiente',
        timestamp_creacion: Date.now()
    };

    try {
        await nuevoTurnoRef.set(datosTurno);
        const urlPago = `${LINK_MERCADO_PAGO}&external_reference=${turnoId}`;
        window.location.href = urlPago;
    } catch (e) {
        alert("Error al conectar con la base de datos. Intenta nuevamente.");
    }
}

// ===== SELECTOR DE SERVICIOS =====

window.actualizarCostoReserva = function() {
    const select = document.getElementById('servicio-cliente');
    if (!select) return;

    const opcion = select.options[select.selectedIndex];
    const precio = parseFloat(opcion.dataset.precio) || 0;

    if (precio > 0) {
        const seña     = precio * PRECIO_RESERVA_PORCENTAJE;
        const restante = precio - seña;

        document.getElementById('detalle-precio').style.display = 'block';
        document.getElementById('precio-total').innerText    = `$${precio}`;
        document.getElementById('precio-reserva').innerText  = `$${seña}`;
        document.getElementById('precio-restante').innerText = `$${restante}`;
        document.getElementById('btn-confirmar-pago').innerText = `Pagar Reserva ($${seña})`;

        fechaSeleccionada.servicio      = select.value;
        fechaSeleccionada.montoTotal    = precio;
        fechaSeleccionada.montoReserva  = seña;
        fechaSeleccionada.montoRestante = restante;
    }
};

async function cargarSelectServicios() {
    const select = document.getElementById('servicio-cliente');
    if (!select) return;

    const servicios = await obtenerServicios();
    select.innerHTML = '<option value="" disabled selected>Elegir servicio...</option>';

    const categorias = {};
    servicios.forEach(i => {
        if (!categorias[i.cat]) categorias[i.cat] = [];
        categorias[i.cat].push(i);
    });

    for (const cat in categorias) {
        const grupo = document.createElement('optgroup');
        grupo.label = cat;
        categorias[cat].forEach(s => {
            const op       = document.createElement('option');
            op.value       = s.nombre;
            op.innerText   = `${s.nombre} - $${s.precio}`;
            op.dataset.precio = s.precio;
            grupo.appendChild(op);
        });
        select.appendChild(grupo);
    }
}

// ===== ADMIN: PRECIOS =====
// Corregido: carga y guarda en Firebase (antes usaba localStorage)

async function renderizarTablaAdminPrecios() {
    const tbody = document.getElementById('tabla-admin-body');
    if (!tbody) return;

    const servicios = await obtenerServicios();
    tbody.innerHTML = '';

    servicios.forEach((serv, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding:10px; border-bottom:1px solid #eee;">${serv.cat}</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${serv.nombre}</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">
                $<input type="number" value="${serv.precio}" id="precio-${index}" style="width:80px; padding:5px;">
            </td>
            <td style="padding:10px; border-bottom:1px solid #eee; text-align:center; color: green;">
               Activo
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.guardarCambiosAdmin = async function() {
    const servicios = await obtenerServicios();

    servicios.forEach((serv, index) => {
        const input = document.getElementById(`precio-${index}`);
        if (input) serv.precio = parseInt(input.value);
    });

    try {
        await db.ref('servicios').set(servicios);
        alert("¡Precios guardados con éxito! El formulario ya está actualizado.");
        renderizarTablaAdminPrecios();
        cargarSelectServicios();
    } catch (e) {
        alert("Error al guardar. Intenta de nuevo.");
    }
};

// ===== ADMIN: TURNOS =====

function renderizarTurnosAdmin() {
    const tbody = document.getElementById('lista-turnos');
    if (!tbody) return;

    db.ref('turnos').on('value', (snapshot) => {
        const turnos = snapshot.val() || {};
        tbody.innerHTML = "";

        Object.values(turnos).forEach(t => {
            const fecha = `${t.dia}/${parseInt(t.mes) + 1} - ${t.hora}hs`;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${t.cliente || "Sin nombre"}</td>
                <td>${t.whatsapp || "-"}</td>
                <td>${fecha}</td>
                <td style="font-weight:bold; color: var(--lila);">${t.servicio || "No especificado"}</td>
                <td><span class="status-${t.estado}">${t.estado.toUpperCase()}</span></td>
                <td class="info-dinero">
                    <span class="pagado">Pagó: $${t.montoSeña || 0}</span><br>
                    <span class="restante">Resta: $${(t.montoTotal || 0) - (t.montoSeña || 0)}</span>
                </td>
            `;
            tbody.appendChild(row);
        });
    });
}

// ===== SLIDER DE FOTOS =====

let currentIndex  = 0;
const totalImages  = 3;   // Coincide con los 3 photo-box del HTML
const visibleImages = 3;
const imageWidth   = 110;

function moveSlide(direction) {
    const track = document.getElementById('track');
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex > totalImages - visibleImages) currentIndex = totalImages - visibleImages;
    track.style.transform = `translateX(-${currentIndex * imageWidth}px)`;
}

// ===== INICIALIZACIÓN =====

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-reserva');
    if (form) form.addEventListener('submit', enviarReserva);

    cargarSelectServicios();
    renderizarTablaAdminPrecios();
    renderizarTurnosAdmin();

    window.onclick = function(event) {
        const modal = document.getElementById('modal-turno');
        if (modal && event.target === modal) cerrarModal();
    };
});
