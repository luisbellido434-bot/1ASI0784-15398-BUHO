// ----------- LÓGICA GENERAL ENTRE PAGINAS -----------

// Página de inicio de sesión por defecto
const $ = (id) => document.getElementById(id);
const pagina = document.body.dataset.pagina || "login";

// Mostrar avisos temporales
let toastTimer;
function aviso(texto) {
  let t = $("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status");
    document.body.appendChild(t);
  }
  t.textContent = texto;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2600);
}
// Eventos de notificación
document.querySelectorAll("[data-pronto]").forEach((el) =>
  el.addEventListener("click", () => aviso(el.dataset.pronto))
);

// Validar sesión del usuario
const usuario = leer("buho_usuario");
if (pagina !== "login" && !usuario) window.location.replace("index.html");

// Mostrar errores de validación
function marcar(caja, msgId, texto) {
  $(caja).classList.toggle("error", !!texto);
  $(msgId).textContent = texto;
  const campo = $(caja).querySelector("input, select");
  if (campo) campo.setAttribute("aria-invalid", texto ? "true" : "false");
  return !texto;
}

// Menú inferior
const ICONOS = {
  inicio: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z"/></svg>',
  rutas: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-4 1 2-5z"/></svg>',
  historial: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
  perfil: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
};
const SECCIONES = [["inicio", "Inicio"], ["rutas", "Rutas"], ["historial", "Historial"], ["perfil", "Perfil"]];
if ($("nav")) {
  $("nav").innerHTML = SECCIONES.map(([id, txt]) =>
    `<a href="${id === "inicio" ? "inicio" : id}.html" ${id === pagina ? 'aria-current="page"' : ""}>${ICONOS[id]}${txt}</a>`
  ).join("");
}

// -------- INICIO DE SESIÓN --------
const form = $("form-login");
if (form) {
  const correo = $("correo");
  const clave = $("clave");

  const validarCorreo = () => {
    const v = correo.value.trim();
    if (!v) return marcar("caja-correo", "err-correo", "Escribe tu correo electrónico.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
      return marcar("caja-correo", "err-correo", "Revisa el formato, por ejemplo: nombre@gmail.com");
    return marcar("caja-correo", "err-correo", "");
  };
  const validarClave = () => {
    if (!clave.value) return marcar("caja-clave", "err-clave", "Escribe tu contraseña.");
    if (clave.value.length < 6) return marcar("caja-clave", "err-clave", "Debe tener al menos 6 caracteres.");
    return marcar("caja-clave", "err-clave", "");
  };

  correo.addEventListener("blur", validarCorreo);
  clave.addEventListener("blur", validarClave);

  // Mostrar u ocultar contraseña
  $("ver-clave").addEventListener("click", (e) => {
    const visible = clave.type === "text";
    clave.type = visible ? "password" : "text";
    e.currentTarget.setAttribute("aria-pressed", String(!visible));
    e.currentTarget.setAttribute("aria-label", visible ? "Mostrar contraseña" : "Ocultar contraseña");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const okCorreo = validarCorreo();
    const okClave = validarClave();
    if (!okCorreo || !okClave) {
      (okCorreo ? clave : correo).focus();
      return;
    }
    // Simulación de inicio de sesión
    const nombre = correo.value.split("@")[0].replace(/[._-]+/g, " ");
    guardar("buho_usuario", nombre);
    const btn = $("btn-ingresar");
    btn.disabled = true;
    btn.textContent = "Ingresando…";
    setTimeout(() => (window.location.href = "inicio.html"), 700);
  });
}

// ------- PÁGINA DE INICIO -------
if (pagina === "inicio") {
  $("nombre").textContent = usuario;
  const p = perfil();
  $("rol").textContent = p.vehiculo ? "Conductor de " + p.vehiculo : "Conductor";

  // Estado de la cámara y calibración
  $("txt-camara").textContent = leer("buho_consent") === "1" ? "autorizada" : "pendiente";
  const cal = Number(leer("buho_calibracion"));
  $("txt-calibracion").textContent = !cal ? "sin calibrar"
    : new Date(cal).toDateString() === new Date().toDateString() ? "hoy"
    : new Date(cal).toLocaleDateString("es-PE", { day: "numeric", month: "short" });
  const elegida = leerJSON("buho_rutaElegida", null);
  $("estado-sistema").textContent = elegida ? "Ruta: " + elegida.origen + " → " + elegida.destino : "Sistema listo";

  // Estadísticas de conducción
  const viajes = todosLosViajes();
  const ultimo = viajes[0];
  $("st-horas").textContent = fmtDuracion(viajes.reduce((a, v) => a + v.duracionMin, 0));
  $("st-viajes").textContent = viajes.length;
  $("st-ultimo").textContent = fmtDuracion(ultimo.duracionMin);
  $("txt-ultimo").textContent = "Último viaje recorrido: " + ultimo.origen + " → " + ultimo.destino;

  // Acceso al monitoreo
  $("btn-monitoreo").addEventListener("click", () => (window.location.href = "monitoreo.html"));

  // Niveles de somnolencia
  const niveles = [
    { clave: "bajo", texto: "BAJO", detalle: "Estado normal" },
    { clave: "media", texto: "MEDIA", detalle: "Señales leves de cansancio" },
    { clave: "alta", texto: "ALTA", detalle: "Riesgo alto: detente a descansar" },
  ];
  let idx = nivelIdx(ultimo);

  function pintarNivel() {
    const n = niveles[idx];
    const v = $("nivel-valor");
    v.textContent = n.texto;
    v.className = "nivel-valor " + n.clave;
    $("nivel-texto").textContent = n.detalle;
    [...$("barra").children].forEach((seg, i) => {
      seg.className = i <= idx ? "on-" + n.clave : "";
    });
  }
  pintarNivel();

  $("btn-simular").addEventListener("click", () => {
    idx = (idx + 1) % niveles.length;
    pintarNivel();
    if (niveles[idx].clave === "alta") $("alerta").showModal();
  });
  $("btn-alerta-ok").addEventListener("click", () => {
    $("alerta").close();
    idx = 0;
    pintarNivel();
    aviso("Gracias. Nivel reiniciado.");
  });
}

// --------- GESTIÓN DE RUTAS ----------
if (pagina === "rutas") {
  // Verificar si existe ruta activa
  const act = leerJSON("buho_rutaActual", null);
  const caja = $("ruta-actual");
  if (act && Date.now() - act.inicio < 12 * 3600 * 1000) {
    const hora = new Date(act.inicio).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    const min = Math.max(1, Math.round((Date.now() - act.inicio) / 60000));
    caja.innerHTML = `
      <span class="tag tag-ok">En camino</span>
      <p class="ruta-nombre">${act.origen} → ${act.destino}</p>
      <p class="subtitulo">Inicio: ${hora} · Transcurrido: ${fmtDuracion(min)}</p>
      <div class="mapa mapa-mini" role="img" aria-label="Mapa de la ruta actual">${mapaSVG()}</div>
      <div class="fila-btn">
        <a class="btn btn-primario" href="monitoreo.html">Retomar monitoreo</a>
        <button type="button" class="btn btn-borde" id="btn-cancelar-ruta">Cancelar ruta</button>
      </div>`;
    $("btn-cancelar-ruta").addEventListener("click", () => { quitar("buho_rutaActual"); location.reload(); });
  } else {
    caja.innerHTML = `
      <span class="tag">Sin ruta activa</span>
      <p class="subtitulo" style="margin-top:8px">No tienes un viaje en curso. Elige una ruta de la lista o inicia un monitoreo libre.</p>
      <a class="btn btn-primario" href="monitoreo.html">Iniciar monitoreo</a>`;
  }

  // Seleccionar ruta
  $("lista-rutas").innerHTML = RUTAS.map((r, i) => `
    <div class="ruta-item">
      <div><strong>${r.origen} → ${r.destino}</strong>
        <small>${r.km} km · ${r.duracion} · riesgo ${r.riesgo}</small></div>
      <button type="button" class="btn btn-primario" data-ruta="${i}">Iniciar</button>
    </div>`).join("");
  $("lista-rutas").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ruta]");
    if (!b) return;
    guardarJSON("buho_rutaElegida", RUTAS[b.dataset.ruta]);
    window.location.href = "monitoreo.html";
  });

  // Mostrar últimos viajes
  const lvl = ["tag-ok", "tag-aviso", "tag-alerta"];
  $("lista-viajes").innerHTML = todosLosViajes().slice(0, 8).map((v) => {
    const n = nivelIdx(v), c = conteos(v);
    return `
    <article class="viaje">
      <div class="viaje-cab"><strong>${v.origen} → ${v.destino}</strong>${v.muestra ? '<span class="tag">ejemplo</span>' : '<span class="tag tag-ok">real</span>'}</div>
      <p>${fmtFecha(v.fecha)} · ${v.horaInicio} · ${fmtDuracion(v.duracionMin)}</p>
      <div class="chips">
        <span class="tag ${lvl[n]}">${v.eventos.length} alertas</span>
        <span class="tag">${c.micro} micro-sueños</span><span class="tag">${c.bostezo} bostezos</span><span class="tag">${c.distraccion} distracciones</span>
      </div>
    </article>`;
  }).join("");
}

// -------- HISTORIAL DE VIAJES --------
if (pagina === "historial") {
  const viajes = todosLosViajes();
  const totalAlertas = viajes.reduce((a, v) => a + v.eventos.length, 0);
  $("h-viajes").textContent = viajes.length;
  $("h-alertas").textContent = totalAlertas;
  $("h-prom").textContent = (totalAlertas / viajes.length).toFixed(1);

  // Calcular alertas por hora
  function datosPorHora() {
    const c = new Array(24).fill(0);
    viajes.forEach((v) => v.eventos.forEach((e) => c[e.h]++));
    let a = 6, b = 20; // rango mínimo visible 6h–20h; se amplía si hay alertas fuera de ese rango
    c.forEach((n, h) => { if (n) { a = Math.min(a, h); b = Math.max(b, h); } });
    const etq = [], val = [];
    for (let h = a; h <= b; h++) { etq.push(h + "h"); val.push(c[h]); }
    return { etq, val, desde: a };
  }
  // Calcular alertas de los últimos 6 meses
  function datosPorMes() {
    const hoy = new Date(), etq = [], val = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const clave = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      etq.push(MESES[d.getMonth()]);
      val.push(viajes.filter((v) => v.fecha.startsWith(clave)).reduce((a, v) => a + v.eventos.length, 0));
    }
    return { etq, val };
  }

  function pintar(modo) {
    const { etq, val, desde } = modo === "hora" ? datosPorHora() : datosPorMes();
    const max = Math.max(...val, 1);
    const mayor = Math.max(...val);
    $("grafico").innerHTML = val.map((n, i) => `
      <div class="col">
        <span class="num">${n}</span>
        <div class="barra-g ${n === 0 ? "cero" : n === mayor ? "pico" : ""}" style="height:${Math.round((n / max) * 130)}px"></div>
        <span class="eti">${etq[i]}</span>
      </div>`).join("");
    $("grafico").setAttribute("aria-label", "Alertas " + (modo === "hora" ? "por hora del día" : "por mes") + ": " + etq.map((e, i) => e + " " + val[i]).join(", "));

    // Mostrar resumen del gráfico
    const i = val.indexOf(mayor);
    $("interpreta").textContent = mayor === 0 ? "Aún no hay alertas registradas."
      : modo === "hora"
        ? `Tu mayor frecuencia de alertas está entre las ${desde + i}:00 y las ${desde + i + 1}:00 (${mayor} alertas). Considera hacer una pausa antes de esa hora.`
        : `${etq[i]} fue el mes con más alertas (${mayor}). Revisa qué rutas y horarios usaste ese mes.`;
  }
  const botones = document.querySelectorAll(".segmentado button");
  botones.forEach((b) => b.addEventListener("click", () => {
    botones.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    pintar(b.dataset.modo);
  }));
  pintar("hora");
}

// ------------- PERFIL DEL CONDUCTOR --------------
if (pagina === "perfil") {
  const p = perfil();
  const datos = {
    nombre: p.nombre || usuario || "Josue De la Cruz",
    licencia: p.licencia || "A-IIb",
    tel: p.tel || "987654321",
    vehiculo: p.vehiculo || "bus",
    contacto: p.contacto || "Luis De la Cruz",
    ctel: p.ctel || "987654321",
    ccorreo: p.ccorreo || "familia@gmail.com",
  };

  function pintarPerfil() {
    $("perfil-nombre").textContent = datos.nombre.split(" ")[0];
    $("perfil-rol").textContent = "conductor";
    $("v-nombre").textContent = datos.nombre;
    $("v-licencia").textContent = datos.licencia;
    $("v-tel").textContent = datos.tel;
    $("v-contacto").textContent = datos.contacto;
    $("v-ctel").textContent = datos.ctel;
    $("v-ccorreo").textContent = datos.ccorreo;
  }
  pintarPerfil();

  function abrirEdicion() {
    $("p-nombre").value = datos.nombre;
    $("p-licencia").value = datos.licencia;
    $("p-tel").value = datos.tel;
    $("p-contacto").value = datos.contacto;
    $("p-ctel").value = datos.ctel;
    $("p-ccorreo").value = datos.ccorreo;
    $("dlg-perfil").showModal();
  }
  $("card-datos").addEventListener("click", abrirEdicion);
  $("card-contacto").addEventListener("click", abrirEdicion);
  $("btn-cerrar-perfil").addEventListener("click", () => $("dlg-perfil").close());

  $("form-perfil").addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = $("p-nombre").value.trim();
    const tel = $("p-tel").value.trim();
    const ok1 = marcar("caja-nombre", "err-nombre", nombre.length < 2 ? "Escribe tu nombre." : "");
    const ok2 = marcar("caja-tel", "err-tel", tel && !/^9\d{8}$/.test(tel) ? "Usa 9 dígitos empezando con 9." : "");
    if (!ok1 || !ok2) return;

    Object.assign(datos, {
      nombre,
      licencia: $("p-licencia").value.trim() || "—",
      tel: tel || "—",
      contacto: $("p-contacto").value.trim() || "—",
      ctel: $("p-ctel").value.trim() || "—",
      ccorreo: $("p-ccorreo").value.trim() || "—",
    });
    guardarJSON("buho_perfil", datos);
    guardar("buho_usuario", datos.nombre);
    pintarPerfil();
    $("dlg-perfil").close();
    aviso("Perfil actualizado.");
  });

  // Configuración de sensibilidad (HU40)
  $("op-sensibilidad").addEventListener("click", () => {
    $("s-nivel").value = leer("buho_sensibilidad") || "media";
    $("dlg-sens").showModal();
  });
  $("btn-guardar-sens").addEventListener("click", () => {
    guardar("buho_sensibilidad", $("s-nivel").value);
    $("dlg-sens").close();
    aviso("Sensibilidad guardada.");
  });

  // Configuración de sonido y volumen (HU06 Y HU07)
  $("s-vol").addEventListener("input", (e) => {
    $("s-vol-txt").textContent = e.target.value + "%";
  });
  $("op-sonido").addEventListener("click", () => {
    $("s-tipo").value = leer("buho_tipoAlerta") || "voz";
    const vol = leer("buho_volumen") || "70";
    $("s-vol").value = vol;
    $("s-vol-txt").textContent = vol + "%";
    $("dlg-sonido").showModal();
  });
  $("btn-guardar-sonido").addEventListener("click", () => {
    guardar("buho_tipoAlerta", $("s-tipo").value);
    guardar("buho_volumen", $("s-vol").value);
    $("dlg-sonido").close();
    aviso("Preferencias de audio guardadas.");
  });

  $("btn-salir").addEventListener("click", () => {
    quitar("buho_usuario");
    window.location.href = "index.html";
  });
}