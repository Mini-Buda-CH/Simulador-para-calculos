(function () {
  "use strict";

  var MODULOS = window.Modulos || {};
  var RUTA_INICIAL = "valor-emision";

  var datos = window.DatosSimulador.leer();
  var ctx = {
    datos: datos,
    divisa: datos && datos.divisa === "USD" ? "USD" : "MXN",
    tipoCambio: 18.5
  };

  var area = document.getElementById("area");
  var titulo = document.getElementById("titulo-opcion");
  var etiqueta = document.getElementById("encabezado-etiqueta");
  var sub = document.getElementById("encabezado-sub");
  var grupoEstados = document.getElementById("btn-estados");
  var subEstados = document.getElementById("sub-estados");
  var lateral = document.getElementById("lateral");
  var velo = document.getElementById("velo-menu");
  var btnMovil = document.getElementById("btn-menu-movil");
  var limpiarActual = null;

  if (datos) {
    document.getElementById("chip-empresa").textContent = datos.empresa + " · " + ctx.divisa;
    sub.textContent = [datos.empresa, datos.carrera, datos.tipoEmpresa].filter(Boolean).join(" · ");
  } else {
    document.getElementById("aviso-sin-datos").hidden = false;
    document.getElementById("chip-empresa").textContent = "Capturar empresa";
  }

  var logo = document.getElementById("logo-img");
  function sinLogo() {
    logo.hidden = true;
    document.getElementById("logo-relleno").hidden = false;
  }
  if (logo.complete && logo.naturalWidth === 0) sinLogo();
  logo.addEventListener("error", sinLogo);

  function abrirEstados(abrir) {
    grupoEstados.setAttribute("aria-expanded", String(abrir));
    subEstados.hidden = !abrir;
  }
  grupoEstados.addEventListener("click", function () {
    var abrir = grupoEstados.getAttribute("aria-expanded") !== "true";
    abrirEstados(abrir);
    if (abrir && document.body.classList.contains("lateral-contraido")) contraer(false);
  });

  function contraer(si) {
    document.body.classList.toggle("lateral-contraido", si);
    var btn = document.getElementById("btn-colapsar");
    btn.setAttribute("aria-expanded", String(!si));
    btn.setAttribute("aria-label", si ? "Expandir menú" : "Contraer menú");
    btn.textContent = si ? "»" : "«";
    if (si) abrirEstados(false);
    try { localStorage.setItem("simuladorIPO.menuContraido", si ? "1" : ""); } catch (e) { /* opcional */ }
  }
  document.getElementById("btn-colapsar").addEventListener("click", function () {
    contraer(!document.body.classList.contains("lateral-contraido"));
  });
  try { if (localStorage.getItem("simuladorIPO.menuContraido")) contraer(true); } catch (e) { /* opcional */ }

  function menuMovil(abrir) {
    document.body.classList.toggle("menu-abierto", abrir);
    btnMovil.setAttribute("aria-expanded", String(abrir));
    velo.hidden = !abrir;
  }
  btnMovil.addEventListener("click", function () { menuMovil(!document.body.classList.contains("menu-abierto")); });
  velo.addEventListener("click", function () { menuMovil(false); });
  lateral.addEventListener("click", function (e) {
    if (e.target.closest("a[data-ruta]")) menuMovil(false);
  });

  function mostrar() {
    var ruta = location.hash.replace("#", "") || RUTA_INICIAL;
    var modulo = MODULOS[ruta];
    if (!modulo) { ruta = RUTA_INICIAL; modulo = MODULOS[ruta]; }

    document.querySelectorAll(".menu__item[data-ruta]").forEach(function (a) {
      var activo = a.dataset.ruta === ruta;
      a.classList.toggle("activo", activo);
      if (activo) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    var esEstado = ruta === "estado-resultados" || ruta === "balance-general";
    grupoEstados.classList.toggle("activo-grupo", esEstado);
    if (esEstado && !document.body.classList.contains("lateral-contraido")) abrirEstados(true);

    if (typeof limpiarActual === "function") limpiarActual();
    titulo.textContent = modulo.titulo;
    etiqueta.textContent = (typeof modulo.etiqueta === "function" ? modulo.etiqueta(ctx) : modulo.etiqueta) || "Simulador";
    document.title = modulo.titulo + " · Del aula a la bolsa";
    area.innerHTML = "";
    limpiarActual = modulo.montar(area, ctx) || null;
    window.scrollTo(0, 0);
    [area, document.querySelector(".encabezado")].forEach(function (el) {
      el.classList.remove("entrando");
      void el.offsetWidth;
      el.classList.add("entrando");
    });
  }

  window.addEventListener("hashchange", mostrar);
  mostrar();
  var saltar = document.getElementById("saltar");
  if (saltar) saltar.addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("area").focus();
  });
})();
