// duracion = cantidad de slots de 2hs que ocupa el servicio
export const DATOS_INICIALES = [
    { cat: "Extensiones", nombre: "Clásicas",               precio: 20000, duracion: 2 },
    { cat: "Extensiones", nombre: "Efecto Rímel",           precio: 22000, duracion: 2 },
    { cat: "Extensiones", nombre: "Volumen Tecnológico 3D", precio: 24000, duracion: 2 },
    { cat: "Extensiones", nombre: "Volumen Tecnológico 4D", precio: 24500, duracion: 2 },
    { cat: "Extensiones", nombre: "Volumen Tecnológico 5D", precio: 25500, duracion: 2 },
    { cat: "Extensiones", nombre: "Volumen Medio (4D, 5D)", precio: 25000, duracion: 2 },
    { cat: "Extensiones", nombre: "Volumen Ruso (6D, 7D)",  precio: 26000, duracion: 3 },
    { cat: "Extensiones", nombre: "Service",                precio:  1000, duracion: 1 },
    { cat: "Extras",      nombre: "Remoción EK",            precio:  3000, duracion: 1 },
    { cat: "Extras",      nombre: "Remoción Otro Lugar",    precio:  4500, duracion: 1 },
    { cat: "Extras",      nombre: "Mala praxis",            precio:  5000, duracion: 1 },
    { cat: "Extras",      nombre: "Maquillaje",             precio:  2000, duracion: 1 },
    { cat: "Extras",      nombre: "Toque color",            precio:  4000, duracion: 1 },
    { cat: "Cejas",       nombre: "Diseño y Perfilado",     precio:  6000, duracion: 1 },
    { cat: "Cejas",       nombre: "Perfilado y Laminado",   precio: 10000, duracion: 1 },
];

export const PRECIO_RESERVA_PORCENTAJE = 0.5;
export const RANGOS_HORA = ["10:00", "12:00", "14:00", "16:00", "18:00"];
export const SLOTS_POR_DIA = RANGOS_HORA.length; // 5 turnos máximos por día
