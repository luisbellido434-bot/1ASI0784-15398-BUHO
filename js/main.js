document.documentElement.classList.add("js");

// Configuración: enlace real de la demo (Figma, ejecutable, etc.)
const ENLACE_DEMO = "";

// Menú móvil
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

// Aparición suave al hacer scroll
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

// Formulario con validación en línea
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