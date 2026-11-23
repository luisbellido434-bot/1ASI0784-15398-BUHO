document.documentElement.classList.add("js");

// Enlace al prototipo interactivo en Figma
const ENLACE_DEMO = new URL("../demo/index.html", document.currentScript.src).href;

// 1. Navegación móvil (Menú hamburguesa)
const burger = document.getElementById("burger");
const menu = document.getElementById("menu");

burger.addEventListener("click", () => {
  const abierto = menu.classList.toggle("abierto");
  burger.setAttribute("aria-expanded", String(abierto));
  burger.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
});

menu.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    menu.classList.remove("abierto");
    burger.setAttribute("aria-expanded", "false");
  }
});

// 2. Aparición suave al hacer scroll (IntersectionObserver)
const items = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visto");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach((el) => io.observe(el));
} else {
  items.forEach((el) => el.classList.add("visto"));
}

// 3. Simulación de alerta de voz calmada en cabina
const btnVoz = document.getElementById("btn-probar-voz");
const vozEstado = document.getElementById("voz-estado");

if (btnVoz && vozEstado) {
  btnVoz.addEventListener("click", () => {
    const mensaje = "Atención. Se detectó cierre prolongado de ojos. Busca un lugar seguro para detenerte y descansar.";
    vozEstado.textContent = "Reproduciendo aviso: “" + mensaje + "”";

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(mensaje);
      utter.lang = "es-ES";
      utter.rate = 0.96;
      utter.onend = () => {
        vozEstado.textContent = "Aviso finalizado. Pulsa nuevamente para repetir.";
      };
      window.speechSynthesis.speak(utter);
    }
  });
}

// 4. Selección de opciones por segmento objetivo
const filtroBtns = document.querySelectorAll(".filtro-btn");
const segCards = document.querySelectorAll("#seg-grid .seg");

filtroBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const filtro = btn.dataset.seg;

    filtroBtns.forEach((b) => {
      const activo = b === btn;
      b.classList.toggle("activo", activo);
      b.setAttribute("aria-pressed", String(activo));
    });

    segCards.forEach((card) => {
      if (filtro === "todos") {
        card.classList.remove("destacado", "atenuado");
      } else {
        const coincide = card.dataset.perfil === filtro;
        card.classList.toggle("destacado", coincide);
        card.classList.toggle("atenuado", !coincide);
      }
    });
  });
});

// Preselección directa del perfil en el formulario desde las tarjetas
document.querySelectorAll("[data-select-perfil]").forEach((link) => {
  link.addEventListener("click", () => {
    const selectPerfil = document.getElementById("perfil");
    if (selectPerfil) {
      selectPerfil.value = link.dataset.selectPerfil;
    }
  });
});

// 5. Validación en línea del formulario de registro
const $ = (id) => document.getElementById(id);

function marcar(campo, msg, texto) {
  $(campo).classList.toggle("error", Boolean(texto));
  if ($(msg)) {
    $(msg).textContent = texto;
  }
  return !texto;
}

$("form-demo").addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = $("nombre").value.trim();
  const cel = $("cel").value.trim();
  const correo = $("correo").value.trim();

  const resultados = [
    marcar("c-nombre", "e-nombre", nombre.length < 2 ? "Escribe tu nombre." : ""),
    marcar("c-cel", "e-cel", /^9\d{8}$/.test(cel) ? "" : "Usa 9 dígitos que empiecen con 9."),
    marcar("c-correo", "e-correo", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ? "" : "Revisa el formato: nombre@gmail.com"),
    marcar("c-perfil", "e-perfil", $("perfil").value ? "" : "Elige tu perfil."),
    marcar("c-acepto", "e-acepto", $("acepto").checked ? "" : "Debes aceptar el uso académico de tus datos para continuar.")
  ];

  if (!resultados.every(Boolean)) {
    document.querySelector(".error input, .error select, .error")?.focus?.();
    return;
  }

  $("form-demo").hidden = true;
  $("exito").hidden = false;
  $("exito-nombre").textContent = nombre.split(" ")[0];

  if (ENLACE_DEMO) {
    $("btn-descarga").href = ENLACE_DEMO;
    $("btn-descarga").hidden = false;
  }
});

const btnReiniciar = $("btn-reiniciar");
if (btnReiniciar) {
  btnReiniciar.addEventListener("click", () => {
    $("form-demo").reset();
    $("exito").hidden = true;
    $("form-demo").hidden = false;
    $("nombre").focus();
  });
}
