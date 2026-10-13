(function () {
  "use strict";
  var C = window.Calculos, F = window.Formato, G = window.Graficas;
  var almacen = null;

  var RENGLONES = [
    ["+", "Ventas totales", "ventas"],
    ["−", "Costo de ventas", "costoVentas"],
    ["=", "Utilidad bruta", "utilidadBruta", true],
    ["−", "Gastos de administración y ventas", "gastos"],
    ["−", "Depreciación y amortización", "depreciacion"],
    ["=", "Utilidad de operación", "utilidadOperacion", true],
    ["=", "Utilidad antes de impuestos", "utilidadAntesImpuestos", true],
    ["−", "ISR (" + C.ISR * 100 + " %)", "isr"],
    ["−", "PTU (" + C.PTU * 100 + " %)", "ptu"],
    ["=", "Utilidad neta", "utilidadNeta", true]
  ];

  function tablaEstado(r, fn, divisa) {
    return '<table class="tabla tabla--estado"><caption class="sr-only">Estado de resultados en ' + divisa + "</caption><tbody>" +
      RENGLONES.map(function (x) {
        var valor = fn(r[x[2]]);
        return '<tr class="' + (x[3] ? "fila-total" : "") + (x[2] === "utilidadNeta" ? " fila-final" : "") + '">' +
          '<td class="signo">' + x[0] + "</td><td>" + F.escapar(x[1]) + '</td><td class="' + (valor < 0 ? "negativo" : "") + '">' + F.dinero(valor) + "</td></tr>";
      }).join("") + "</tbody></table>";
  }

  function fraseMargen(margen, final) {
    if (margen === null) return "Sin ventas no se puede calcular el margen.";
    var monto = "$" + F.numero(Math.abs(margen), 2);
    if (margen < 0) {
      return "Por cada $100 vendidos, la empresa pierde " + monto + (final ? " al final del ejercicio." : " antes de cubrir gastos operativos.");
    }
    return final
      ? "Por cada $100 vendidos, la empresa retiene " + monto + " como ganancia final."
      : "Por cada $100 vendidos, la empresa retiene " + monto + " para cubrir gastos operativos, impuestos y generar ganancia neta.";
  }

  function montar(area, ctx) {
    almacen = window.Registro.almacen("estado-resultados");
    var principal = ctx.divisa;
    var otra = principal === "USD" ? "MXN" : "USD";
    var grafica = null;

    area.innerHTML =
      '<form class="tarjeta-panel" id="f-er" novalidate>' +
        '<div class="tarjeta-panel__cabeza"><h2 class="panel-titulo">Datos del ejercicio</h2><span class="etiqueta">Entrada de datos · ' + principal + "</span></div>" +
        '<div class="rejilla-campos">' +
          F.campo({ id: "ventas", label: "Ventas totales anuales", tipo: "dinero", placeholder: "0.00" }) +
          F.campo({ id: "costo", label: "Costo de ventas", tipo: "dinero", placeholder: "0.00" }) +
          F.campo({ id: "gastos", label: "Gastos de administración y ventas", tipo: "dinero", placeholder: "0.00" }) +
          F.campo({ id: "depreciacion", label: "Depreciación y amortización", tipo: "dinero", placeholder: "0.00" }) +
          F.campo({ id: "tc", label: "Tipo de cambio (MXN por USD)", tipo: "dinero", valor: ctx.tipoCambio, ayuda: "Para la conversión a " + otra }) +
        "</div>" +
        '<div class="tarjeta-panel__pie"><button class="boton boton--primario" type="submit">Calcular <span class="boton__flecha" aria-hidden="true"></span></button></div>' +
      "</form>" +
      '<div id="r-er" class="salidas" hidden></div>';

    var form = area.querySelector("#f-er");
    var salida = area.querySelector("#r-er");
    F.activar(form);
    var yaCalculado = F.recordar(form, almacen);

    function calcular(sinEsqueleto) {
      var e = F.leer(form, {
        ventas: { tipo: "dinero", mayorQueCero: true },
        costo: { tipo: "dinero", min: 0 },
        gastos: { tipo: "dinero", min: 0 },
        depreciacion: { tipo: "dinero", min: 0 },
        tc: { tipo: "dinero", mayorQueCero: true }
      });
      if (!e) return;
      almacen.calculado = true;
      if (sinEsqueleto) pintar(e);
      else window.Esqueleto.cargar(salida, ["dos", "dos", "grafica"], function () { pintar(e); }, form.querySelector('button[type="submit"]'));
    }

    function pintar(e) {
      // Guardado para la exportación (ventas = año 1)
      almacen.resultado = {
        entradas: { ventas: e.ventas, costo: e.costo, gastos: e.gastos, depreciacion: e.depreciacion, tc: e.tc },
        resultados: C.estadoResultados({ ventas: e.ventas, costoVentas: e.costo, gastos: e.gastos, depreciacion: e.depreciacion })
      };
      almacen.guardar();
      ctx.tipoCambio = e.tc;

      var r = C.estadoResultados({ ventas: e.ventas, costoVentas: e.costo, gastos: e.gastos, depreciacion: e.depreciacion });
      var mismo = function (n) { return n; };
      var conv = function (n) { return C.convertir(n, principal, otra, e.tc); };

      salida.innerHTML =
        '<div class="rejilla-dos">' +
          '<article class="tarjeta-panel tarjeta-panel--destacada">' +
            '<div class="tarjeta-panel__cabeza"><h2 class="panel-titulo">Estado de resultados en ' + principal + '</h2><span class="etiqueta">Divisa principal</span></div>' +
            tablaEstado(r, mismo, principal) +
          "</article>" +
          '<article class="tarjeta-panel">' +
            '<div class="tarjeta-panel__cabeza"><h2 class="panel-titulo">Conversión a ' + otra + '</h2><span class="etiqueta">TC ' + F.numero(e.tc, 2) + " MXN/USD</span></div>" +
            tablaEstado(r, conv, otra) +
          "</article>" +
        "</div>" +
        '<div class="rejilla-dos">' +
          '<article class="indicador">' +
            '<span class="etiqueta">Margen bruto</span><strong class="indicador__valor">' + F.porcentaje(r.margenBruto) + "</strong>" +
            '<p class="indicador__formula">(Ventas − Costo de ventas) ÷ Ventas × 100</p>' +
            "<p>" + F.escapar(fraseMargen(r.margenBruto, false)) + "</p>" +
          "</article>" +
          '<article class="indicador">' +
            '<span class="etiqueta">Margen neto</span><strong class="indicador__valor' + (r.margenNeto < 0 ? " negativo" : "") + '">' + F.porcentaje(r.margenNeto) + "</strong>" +
            '<p class="indicador__formula">Utilidad neta ÷ Ventas × 100</p>' +
            "<p>" + F.escapar(fraseMargen(r.margenNeto, true)) + "</p>" +
          "</article>" +
        "</div>" +
        '<article class="tarjeta-panel">' +
          '<div class="tarjeta-panel__cabeza"><div><h2 class="panel-titulo">De ventas a utilidad neta</h2>' +
          '<p class="nota">Cada barra muestra cuánto resta cada concepto hasta llegar a la utilidad neta.</p></div>' +
          F.alternador([principal, otra], principal) + "</div>" +
          '<div class="grafica"><canvas id="g-er" role="img" aria-label="Gráfica de cascada del estado de resultados"></canvas></div>' +
        "</article>";
      salida.hidden = false;

      function dibujar(divisa) {
        var fn = divisa === principal ? mismo : conv;
        var pasos = [
          ["Ventas", [0, r.ventas], "total"],
          ["Costo de ventas", [r.ventas, r.utilidadBruta], "resta"],
          ["Utilidad bruta", [0, r.utilidadBruta], "total"],
          ["Gastos adm. y ventas", [r.utilidadBruta, r.utilidadBruta - r.gastos], "resta"],
          ["Depreciación", [r.utilidadBruta - r.gastos, r.utilidadOperacion], "resta"],
          ["Utilidad de operación", [0, r.utilidadOperacion], "total"],
          ["ISR", [r.utilidadAntesImpuestos, r.utilidadAntesImpuestos - r.isr], "resta"],
          ["PTU", [r.utilidadAntesImpuestos - r.isr, r.utilidadNeta], "resta"],
          ["Utilidad neta", [0, r.utilidadNeta], "total"]
        ];
        if (grafica) grafica.destroy();
        grafica = G.crear(salida.querySelector("#g-er"), {
          type: "bar",
          data: {
            labels: pasos.map(function (p) { return p[0]; }),
            datasets: [{
              label: divisa,
              data: pasos.map(function (p) { return [fn(p[1][0]), fn(p[1][1])]; }),
              backgroundColor: pasos.map(function (p) {
                if (p[2] === "resta") return G.COLORES.terciario;
                return p[1][1] < 0 ? G.COLORES.negativo : G.COLORES.principal;
              }),
              borderRadius: 4
            }]
          },
          options: {
            scales: { x: { grid: { display: false } }, y: G.ejeMonto(divisa) },
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: function (c) { var v = c.raw; return F.dinero(Math.abs(v[1] - v[0]), divisa); } } }
            }
          }
        });
      }
      dibujar(principal);
      F.activarAlternador(salida, dibujar);
    }

    form.addEventListener("submit", function (ev) { ev.preventDefault(); calcular(); });
    if (yaCalculado) calcular(true);
    return function () { if (grafica) grafica.destroy(); };
  }

  window.Modulos = window.Modulos || {};
  window.Modulos["estado-resultados"] = { titulo: "Estado de resultados", etiqueta: "Estados financieros", montar: montar };
})();
