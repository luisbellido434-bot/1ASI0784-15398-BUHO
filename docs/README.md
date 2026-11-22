# BÚHO — Tu copiloto digital incansable

Landing Page oficial del proyecto **BÚHO**, sistema de detección temprana de somnolencia y distracción en conductores mediante visión artificial con cámara web convencional y alertas de voz escalonadas.

## Información Académica
- **Universidad:** Universidad Peruana de Ciencias Aplicadas (UPC) — Facultad de Ingeniería
- **Curso:** HCI for UX Design (`1ASI0784`)
- **Ciclo / Sección:** `2026-20` · Sección `15398`
- **Docentes:** Silvia Adelma Campos Benites / Marco Antoni Mendoza Rodríguez
- **Equipo Galácticos:**
  - Anderson Joel Calisaya Mamani (`U20251E654`)
  - Cristian Alberto Condori Chara (`U20251F004`)
  - Luis Felipe Delgado Choñocca (`U20251E611`)
  - Josue Kerip De la Cruz Huaman (`U20251F028`)
  - Luis Elias Bellido Isidro (`U20251G006`)

## Enlaces de Diseño UX/UI (Figma)
- **Wireflow Diagrams:** [Ver en Figma](https://www.figma.com/design/4PU8HNQwsg0uBlPmPsdUYm/Sin-t%C3%ADtulo?node-id=0-1&t=8QtFVVXF7SSsvQpr-1)
- **Prototipo Interactivo:** [Ver en Figma](https://www.figma.com/design/aOCbZjoe7BdxFTgxPzazMA/Prototipo-de-BUHO?node-id=0-1&t=YXYy5a5cdmF1ODlB-1)

## Fundamentos Técnicos Aplicados (HTML5, CSS3 & JS)
1. **HTML5 Semántico y Accesible:** Estructura con `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<figure>`, `<figcaption>`, `<table>`, `<details>`, `<summary>` y `<footer>`, además de enlaces de salto (`skip link`) y atributos ARIA (`aria-label`, `aria-labelledby`, `aria-describedby`, `aria-live`).
2. **Imágenes Responsivas (`<picture>`):** Implementación de `<picture>` con `<source media="(min-width: 768px)">` y escalado fluido (`max-width: 100%; height: auto`).
3. **CSS3 Externo y Diseño Responsivo:** Separación de presentación en `css/styles.css` aplicando *CSS Box Model* (`box-sizing: border-box`), *Flexbox*, *CSS Grid*, tipografía fluida (`clamp()` con unidades `vw`), pseudoclases interactivas (`:hover`, `:focus-visible`) y *Media Queries* (`@media`) para Desktop, Tablet (`<= 980px`) y Mobile (`<= 760px`).
4. **JavaScript Interactivo:** Menú hamburguesa móvil, selección dinámica de segmentos objetivo, simulación de alerta de voz calmada, acordeón de preguntas frecuentes y validación en línea de formularios (`<fieldset>`).

## Estructura del Repositorio
```text
├── index.html               # Punto de entrada principal para GitHub Pages
├── favicon.ico              # Ícono del sitio
├── .nojekyll                # Desactiva el procesamiento Jekyll en GitHub Pages
├── .gitignore               # Archivos excluidos del control de versiones
├── README.md                # Documentación principal del repositorio
├── assets/
│   ├── images/              # Recursos gráficos (fondo.jpg, logo-buho.png)
│   ├── icons/               # Iconografía adicional
│   ├── fonts/               # Tipografías locales
│   └── videos/              # Recursos multimedia de demostración
├── css/
│   └── styles.css           # Hoja de estilos externa responsive y guía visual BÚHO
├── js/
│   └── main.js              # Interacciones, filtro de segmentos, demo de voz y validación
├── pages/
│   └── index.html           # Copia estructurada según el Final Project Handbook (Cap. V)
└── docs/
    └── README.md            # Documentación técnica del despliegue
```

## Despliegue en GitHub Pages
1. Crear un repositorio público en GitHub (por ejemplo, `buho-landing-page`) y subir todos los archivos de esta carpeta en la rama `main`.
2. En el repositorio, ingresar a **Settings > Pages**.
3. En **Build and deployment > Source**, seleccionar **Deploy from a branch**.
4. Elegir la rama `main` y la carpeta `/ (root)`, luego hacer clic en **Save**.
5. Esperar 1–2 minutos y verificar la URL pública generada (`https://<usuario>.github.io/<repositorio>/`) tanto en navegador de escritorio como en dispositivo móvil.
