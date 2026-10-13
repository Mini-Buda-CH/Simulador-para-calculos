window.Esqueleto = (function () {
  "use strict";

  var DURACION = 950;

  function lineas(n) {
    var s = "";
    for (var i = 0; i < n; i++) {
      s += '<div class="esq-fila"><span class="esq esq-linea" style="width:' + (38 + (i * 17) % 30) + '%"></span>' +
        '<span class="esq esq-linea esq-linea--corta"></span></div>';
    }
    return s;
  }

  function tarjeta(filas) {
    return '<div class="tarjeta-panel esq-tarjeta"><span class="esq esq-titulo"></span>' + lineas(filas) + "</div>";
  }

  var PIEZAS = {
    kpis: function () {
      var k = '<div class="kpi esq-tarjeta"><span class="esq esq-linea esq-linea--corta"></span><span class="esq esq-kpi"></span></div>';
      return '<div class="kpis">' + k + k + k + "</div>";
    },
    dos: function () { return '<div class="rejilla-dos">' + tarjeta(6) + tarjeta(6) + "</div>"; },
    tarjeta: function () { return tarjeta(5); },
    grafica: function () {
      return '<div class="tarjeta-panel esq-tarjeta"><span class="esq esq-titulo"></span><span class="esq esq-grafica"></span></div>';
    },
    tabla: function () { return tarjeta(7); }
  };

  function cargar(contenedor, forma, pintar, boton) {
    clearTimeout(contenedor._esqTimer);
    contenedor.classList.remove("revelar");
    contenedor.innerHTML = forma.map(function (p) { return PIEZAS[p](); }).join("");
    contenedor.hidden = false;
    contenedor.setAttribute("aria-busy", "true");
    if (boton) boton.disabled = true;

    contenedor._esqTimer = setTimeout(function () {
      if (boton) boton.disabled = false;
      contenedor.removeAttribute("aria-busy");
      if (!document.body.contains(contenedor)) return;
      contenedor.classList.remove("revelar");
      pintar();
      void contenedor.offsetWidth;
      contenedor.classList.add("revelar");
    }, DURACION);
  }

  return { cargar: cargar };
})();
