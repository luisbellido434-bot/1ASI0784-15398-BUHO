// -------------- MONITOREO DEL CONDUCTOR --------------
(function () {
  if (pagina !== "monitoreo") return;

  const VISTAS = ["v-consent", "v-cal", "v-mon", "v-alerta", "v-resumen"];
  let vistaActual = "v-consent";
  const vista = (id) => {
    vistaActual = id;
    VISTAS.forEach((v) => {
      const el = $(v);
      if (el) el.hidden = v !== id;
    });
    document.body.dataset.vista = id;
    window.scrollTo(0, 0);
  };

  const ruta = leerJSON("buho_rutaElegida", null);
  const origen = ruta ? ruta.origen : "Ubicación actual";
  const destino = ruta ? ruta.destino : "Sin destino";
  const etiquetaRuta = ruta ? "Ruta: " + origen + " → " + destino : "Ruta libre (sin destino elegido)";
  if ($("ruta-mon")) $("ruta-mon").textContent = etiquetaRuta;
  if ($("ruta-cal")) $("ruta-cal").textContent = etiquetaRuta;

  // Variables del monitoreo
  let stream = null, faceLandmarker = null, rafId = null;
  let ses = null, alertaActual = null;
  let tickId, velId, beepId, audioCtx, wakeLock;
  const video = $("video-cal");
  const canvasLuz = document.createElement("canvas");
  canvasLuz.width = 64; canvasLuz.height = 48;
  const ctxLuz = canvasLuz.getContext("2d", { willReadFrequently: true });

  // Parámetros de detección
  const EAR_UMBRAL = 0.21;     // Ojos cerrados
  const MICRO_MS = 1500;       // Microsueño de 1,5 s (HU01)
  const DESVIO_MS = 3000;      // Distracción de 3 s (HU02)
  const MAR_UMBRAL = 0.60;     // Boca abierta (bostezo)
  const BOSTEZO_MS = 2000;     // Bostezo de 2 s (HU04)
  const ROSTRO_PERDIDO_MS = 15000; // 15 s sin rostro (HU39)

  let tOjosCerrados = 0, tDesvio = 0, tBostezo = 0, tSinRostro = 0;
  let bostezoContado = false, avisoSinRostroDado = false;
  let bostezosRecientes = [];

  // Cálculos faciales
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function calcularEAR(lm) {
    const ear = (i) => (dist(lm[i[1]], lm[i[5]]) + dist(lm[i[2]], lm[i[4]])) / (2 * dist(lm[i[0]], lm[i[3]]));
    const izq = ear([33, 160, 158, 133, 153, 144]);
    const der = ear([362, 385, 387, 263, 373, 380]);
    return (izq + der) / 2;
  }
  function calcularMAR(lm) {
    return dist(lm[13], lm[14]) / dist(lm[78], lm[308]);
  }
  function cabezaDesviada(lm) {
    const dIzq = dist(lm[1], lm[234]);
    const dDer = dist(lm[1], lm[454]);
    const ratio = dIzq / (dIzq + dDer);
    return ratio < 0.28 || ratio > 0.72; // ~ >30° de giro
  }
  function medirBrillo() {
    if (!video || video.readyState < 2) return 0;
    ctxLuz.drawImage(video, 0, 0, 64, 48);
    const d = ctxLuz.getImageData(0, 0, 64, 48).data;
    let suma = 0;
    for (let i = 0; i < d.length; i += 4) suma += (d[i] + d[i + 1] + d[i + 2]) / 3;
    return suma / (64 * 48);
  }

  // Alertas de sonido y voz
  function hablar(texto) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = "es-PE";
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  function beep() {
    if (!audioCtx) return;
    try {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = "square"; o.frequency.value = 880; g.gain.value = 0.25;
      o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.35);
    } catch (e) {}
  }

  // Carga del modelo MediaPipe
  async function cargarModelo() {
    if (faceLandmarker) return true;
    try {
      $("estado-cam").textContent = "Cargando detector facial…";
      const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14");
      const fileset = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      faceLandmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1
      });
      return true;
    } catch (e) {
      $("estado-cam").textContent = "No se pudo cargar el modelo IA (revisa tu conexión).";
      return false;
    }
  }

  // Control de cámara
  async function iniciarCamara() {
    vista("v-cal");
    $("err-permiso").hidden = true;
    $("btn-iniciar-ruta").disabled = true;
    $("chk-cam").className = "";
    $("chk-rostro").className = "";
    $("chk-luz").className = "";

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      video.srcObject = stream;
      await video.play();
      $("chk-cam").className = "ok";
      const okModelo = await cargarModelo();
      if (okModelo) bucleVision();
    } catch (e) {
      $("chk-cam").className = "mal";
      $("estado-cam").textContent = "Permiso de cámara denegado";
      $("err-permiso").hidden = false;
    }
  }

  function detenerCamara() {
    cancelAnimationFrame(rafId);
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    if (video) video.srcObject = null;
  }

  // Procesamiento de video
  let ultimoVideoTime = -1;
  function bucleVision() {
    rafId = requestAnimationFrame(bucleVision);
    if (!faceLandmarker || !video || video.readyState < 2) return;
    if (video.currentTime === ultimoVideoTime) return;
    ultimoVideoTime = video.currentTime;

    const ahora = performance.now();
    const res = faceLandmarker.detectForVideo(video, ahora);
    const lm = res.faceLandmarks && res.faceLandmarks[0];

    // Calibración de cámara (HU37)
    if (vistaActual === "v-cal") {
      const brillo = medirBrillo();
      const luzOk = brillo >= 45;
      const rostroOk = !!lm;
      $("chk-rostro").className = rostroOk ? "ok" : "mal";
      $("chk-luz").className = luzOk ? "ok" : "mal";
      $("guia-cal").classList.toggle("ok", rostroOk && luzOk);
      $("estado-cam").textContent = !rostroOk
        ? "Rostro no detectado, ajusta la cámara"
        : !luzOk ? "Poca iluminación en cabina" : "Encuadre listo";
      $("btn-iniciar-ruta").disabled = !(rostroOk && luzOk);
      return;
    }

    // Monitoreo activo o alerta
    if (vistaActual !== "v-mon" && vistaActual !== "v-alerta") return;

    if (!lm) {
      $("banner-rostro").hidden = false;
      $("m-ear").textContent = "—";
      if (!tSinRostro) tSinRostro = ahora;
      if (ahora - tSinRostro >= ROSTRO_PERDIDO_MS && !avisoSinRostroDado) {
        avisoSinRostroDado = true;
        hablar("Cámara desalineada. No veo tu rostro.");
      }
      return;
    }

    // Rostro recuperado
    $("banner-rostro").hidden = true;
    tSinRostro = 0;
    avisoSinRostroDado = false;

    const ear = calcularEAR(lm);
    const mar = calcularMAR(lm);
    const desviado = cabezaDesviada(lm);
    $("m-ear").textContent = ear.toFixed(2);

    // Cierre automático de alertas
    if (alertaActual && !alertaActual.simulada) {
      if (alertaActual.tipo === "micro" && ear >= EAR_UMBRAL) cerrarAlerta();
      if (alertaActual.tipo === "distraccion" && !desviado) cerrarAlerta();
      return;
    }

    // Detección de microsueño (HU01)
    if (ear < EAR_UMBRAL) {
      if (!tOjosCerrados) tOjosCerrados = ahora;
      if (ahora - tOjosCerrados >= MICRO_MS) {
        tOjosCerrados = 0;
        disparar("micro", false);
        return;
      }
    } else {
      tOjosCerrados = 0;
    }

    // Detección de distracción (HU02)
    if (desviado) {
      if (!tDesvio) tDesvio = ahora;
      if (ahora - tDesvio >= DESVIO_MS) {
        tDesvio = 0;
        disparar("distraccion", false);
        return;
      }
    } else {
      tDesvio = 0;
    }

    // Detección de bostezos (HU04)
    if (mar > MAR_UMBRAL) {
      if (!tBostezo) tBostezo = ahora;
      if (ahora - tBostezo >= BOSTEZO_MS && !bostezoContado) {
        bostezoContado = true;
        ses.eventos.push({ t: Date.now(), tipo: "bostezo" });
        actualizarFatiga();
        const hace5Min = Date.now() - 5 * 60000;
        bostezosRecientes = bostezosRecientes.filter((t) => t >= hace5Min);
        bostezosRecientes.push(Date.now());
        if (bostezosRecientes.length >= 3) {
          bostezosRecientes = [];
          hablar("Sugerimos ventilar la cabina y planificar una pausa.");
          aviso("3 bostezos detectados: ventila la cabina.");
        }
      }
    } else {
      tBostezo = 0;
      bostezoContado = false;
    }
  }

  // Sesión de monitoreo
  async function iniciarSesion() {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    ses = { inicio: Date.now(), eventos: [] };
    alertaActual = null;
    guardarJSON("buho_rutaActual", { origen, destino, inicio: ses.inicio });
    guardar("buho_calibracion", String(ses.inicio));
    try { wakeLock = await navigator.wakeLock.request("screen"); } catch (e) {}
    vista("v-mon");

    clearInterval(tickId);
    tickId = setInterval(() => {
      const s = Math.floor((Date.now() - ses.inicio) / 1000);
      $("m-tiempo").textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
    }, 500);

    clearInterval(velId);
    let v = 42;
    $("m-vel").textContent = v;
    $("al-vel").textContent = v;
    velId = setInterval(() => {
      v = Math.max(25, Math.min(60, v + Math.round((Math.random() - 0.5) * 6)));
      $("m-vel").textContent = v;
      $("al-vel").textContent = v;
    }, 1500);

    actualizarFatiga();
  }

  const viajeTemp = () => ({ eventos: ses.eventos.map((e) => ({ h: new Date(e.t).getHours(), tipo: e.tipo })) });

  function actualizarFatiga() {
    const n = indiceFatiga(viajeTemp());
    $("barra-in").style.width = Math.max(n, 4) + "%";
    $("barra-in").style.background = n < 30 ? "var(--ok)" : n < 60 ? "var(--warn)" : "var(--danger)";
    $("barra").setAttribute("aria-valuenow", n);
    $("nivel-txt").textContent = n < 30 ? "Baja" : n < 60 ? "Moderada" : "Alta";
    $("m-alertas").textContent = ses.eventos.length;
  }

  const TEXTOS = {
    micro: { t: "¡MANTENTE ALERTA!", s: "Cierre prolongado de ojos detectado", v: "Atención. Busca un lugar seguro para detenerte y descansar." },
    distraccion: { t: "MIRA AL FRENTE", s: "Mirada sostenida fuera de la vía", v: "Atención al frente. Mantén tu mirada en la vía." },
  };

  function disparar(tipo, simulada) {
    if (alertaActual) return;
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    alertaActual = { tipo, inicio: Date.now(), simulada: !!simulada };
    const x = TEXTOS[tipo];
    $("al-titulo").textContent = x.t;
    $("al-sub").textContent = x.s;
    $("al-voz").textContent = "“" + x.v + "”";
    vista("v-alerta");
    beep();
    clearInterval(beepId);
    beepId = setInterval(beep, 1200);
    if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
    hablar(x.v);
    if (simulada) setTimeout(cerrarAlerta, 4500);
  }

  function cerrarAlerta() {
    if (!alertaActual) return;
    clearInterval(beepId);
    try { speechSynthesis.cancel(); } catch (e) {}
    ses.eventos.push({ t: Date.now(), tipo: alertaActual.tipo });
    alertaActual = null;
    vista("v-mon");
    actualizarFatiga();
  }

  // Eventos de botones
  $("chk-consent").addEventListener("change", (e) => {
    $("btn-consent-ok").disabled = !e.target.checked;
  });
  $("btn-consent-ok").addEventListener("click", () => {
    guardar("buho_consent", "1");
    iniciarCamara();
  });
  $("btn-reintentar-cam").addEventListener("click", iniciarCamara);
  $("btn-iniciar-ruta").addEventListener("click", iniciarSesion);
  $("btn-probar").addEventListener("click", () => disparar("micro", true));

  $("btn-finalizar").addEventListener("click", () => {
    clearInterval(tickId);
    clearInterval(velId);
    clearInterval(beepId);
    detenerCamara();
    try { wakeLock && wakeLock.release(); } catch (e) {}
    const fin = Date.now(), f = new Date(ses.inicio), dos = (n) => String(n).padStart(2, "0");
    const viaje = {
      id: String(ses.inicio), origen, destino,
      fecha: f.getFullYear() + "-" + dos(f.getMonth() + 1) + "-" + dos(f.getDate()),
      horaInicio: dos(f.getHours()) + ":" + dos(f.getMinutes()),
      duracionMin: Math.max(1, Math.round((fin - ses.inicio) / 60000)),
      eventos: viajeTemp().eventos, muestra: false,
    };
    guardarViaje(viaje);
    quitar("buho_rutaActual");
    const c = conteos(viaje);
    $("res-sub").textContent = usuario + " · " + origen + " → " + destino;
    $("r-tiempo").textContent = fmtDuracion(viaje.duracionMin);
    $("r-total").textContent = viaje.eventos.length;
    $("r-micro").textContent = c.micro;
    $("r-bost").textContent = c.bostezo;
    $("r-dis").textContent = c.distraccion;
    vista("v-resumen");
  });

  window.addEventListener("beforeunload", detenerCamara);

  // Verificar consentimiento de cámara
  if (leer("buho_consent") === "1") {
    iniciarCamara();
  } else {
    vista("v-consent");
  }
})();