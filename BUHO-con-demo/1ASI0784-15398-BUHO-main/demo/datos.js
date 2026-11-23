// ===== BÚHO · datos y funciones de almacenamiento =====
// Se carga ANTES que app.js. Aquí vive todo lo que tiene que ver con "qué información guarda la app".
// Idea clave: primero se define la forma de los datos (un viaje es un objeto) y después se dibuja la interfaz.

// --- Almacenamiento seguro (si el navegador lo bloquea, el demo sigue funcionando) ---
const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const leer = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const quitar = (k) => { try { localStorage.removeItem(k); } catch (e) {} };
const leerJSON = (k, defecto) => { try { return JSON.parse(localStorage.getItem(k)) ?? defecto; } catch (e) { return defecto; } };
const guardarJSON = (k, v) => guardar(k, JSON.stringify(v));

// --- Rutas disponibles (distancias y tiempos referenciales para el demo) ---
const RUTAS = [
  { origen: "Ayacucho", destino: "Callao",   km: 580, duracion: "9 h 30 min", riesgo: "medio" },
  { origen: "Lima",     destino: "Ica",      km: 305, duracion: "4 h 20 min", riesgo: "bajo" },
  { origen: "Lima",     destino: "Chiclayo", km: 770, duracion: "11 h",       riesgo: "medio" },
  { origen: "Lima",     destino: "Ayacucho", km: 570, duracion: "9 h 30 min", riesgo: "medio" },
];

// --- Viajes de ejemplo (para que Historial y Rutas no se vean vacíos al exponer) ---
// Forma de un viaje: { origen, destino, fecha, horaInicio, duracionMin, eventos: [{ h: hora del día, tipo }] }
// tipo puede ser: "micro" (micro-sueño), "bostezo" o "distraccion"
const ev = (h, tipo) => ({ h, tipo });
const MUESTRA = [
  { id: "m1",  origen: "Lima",     destino: "Chiclayo", fecha: "2026-11-17", horaInicio: "06:30", duracionMin: 540, eventos: [ev(8,"bostezo"), ev(9,"bostezo"), ev(11,"micro"), ev(14,"micro"), ev(14,"distraccion")] },
  { id: "m2",  origen: "Lima",     destino: "Ayacucho", fecha: "2026-11-12", horaInicio: "07:00", duracionMin: 480, eventos: [ev(10,"bostezo"), ev(13,"micro"), ev(14,"bostezo")] },
  { id: "m3",  origen: "Ayacucho", destino: "Callao",   fecha: "2026-11-05", horaInicio: "05:30", duracionMin: 600, eventos: [ev(7,"bostezo"), ev(9,"micro"), ev(12,"distraccion"), ev(14,"micro"), ev(15,"bostezo")] },
  { id: "m4",  origen: "Lima",     destino: "Ica",      fecha: "2026-10-21", horaInicio: "14:00", duracionMin: 260, eventos: [ev(15,"micro"), ev(16,"bostezo")] },
  { id: "m5",  origen: "Lima",     destino: "Chiclayo", fecha: "2026-10-08", horaInicio: "06:00", duracionMin: 560, eventos: [ev(8,"bostezo"), ev(13,"distraccion"), ev(14,"micro"), ev(14,"bostezo"), ev(17,"micro")] },
  { id: "m6",  origen: "Lima",     destino: "Ica",      fecha: "2026-09-15", horaInicio: "13:00", duracionMin: 250, eventos: [ev(14,"micro")] },
  { id: "m7",  origen: "Ayacucho", destino: "Callao",   fecha: "2026-09-02", horaInicio: "06:00", duracionMin: 590, eventos: [ev(9,"bostezo"), ev(13,"micro"), ev(15,"micro")] },
  { id: "m8",  origen: "Lima",     destino: "Ayacucho", fecha: "2026-08-19", horaInicio: "07:30", duracionMin: 500, eventos: [ev(11,"bostezo"), ev(14,"distraccion")] },
  { id: "m9",  origen: "Lima",     destino: "Chiclayo", fecha: "2026-07-22", horaInicio: "06:30", duracionMin: 550, eventos: [ev(8,"bostezo"), ev(12,"micro"), ev(15,"bostezo")] },
  { id: "m10", origen: "Lima",     destino: "Ica",      fecha: "2026-06-10", horaInicio: "09:00", duracionMin: 270, eventos: [ev(11,"bostezo")] },
].map((v) => ({ ...v, muestra: true }));

// --- Viajes: los reales (guardados al finalizar un monitoreo) + los de ejemplo, del más reciente al más antiguo ---
function todosLosViajes() {
  const reales = leerJSON("buho_viajes", []);
  return [...reales, ...MUESTRA].sort((a, b) => (b.fecha + b.horaInicio).localeCompare(a.fecha + a.horaInicio));
}
function guardarViaje(v) {
  const reales = leerJSON("buho_viajes", []);
  reales.unshift(v);
  guardarJSON("buho_viajes", reales.slice(0, 50));
}

// --- Cálculos sobre un viaje ---
function conteos(v) {
  const c = { micro: 0, bostezo: 0, distraccion: 0 };
  v.eventos.forEach((e) => c[e.tipo]++);
  return c;
}
// Índice de fatiga 0–100 (los micro-sueños pesan más que los bostezos)
function indiceFatiga(v) {
  const c = conteos(v);
  return Math.min(100, c.micro * 30 + c.bostezo * 12 + c.distraccion * 6);
}
// 0 = bajo, 1 = media, 2 = alta
function nivelIdx(v) {
  const n = indiceFatiga(v);
  return n < 30 ? 0 : n < 60 ? 1 : 2;
}

// --- Formatos para mostrar ---
function fmtDuracion(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return h ? h + " h" + (m ? " " + m + " min" : "") : m + " min";
}
function fmtFecha(iso) {
  const t = new Date(iso + "T12:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// --- Perfil del conductor ---
const perfil = () => leerJSON("buho_perfil", {});

// --- Mapita de la ruta (dibujo simple en SVG) ---
function mapaSVG() {
  return '<svg viewBox="0 0 380 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    '<g stroke="#fff" stroke-width="8"><path d="M0 40h380M0 105h380M70 0v150M190 0v150M300 0v150"/></g>' +
    '<path d="M70 105H190V40H300" fill="none" stroke="#26275f" stroke-width="4" stroke-dasharray="8 6"/>' +
    '<circle cx="70" cy="105" r="7" fill="#1a8a4a"/><circle cx="300" cy="40" r="7" fill="#cf2d2d"/></svg>';
}
