// Opción: Costo de crédito (pago fijo, tabla de amortización)
(function () {
  "use strict";
  var C = window.Calculos, F = window.Formato, G = window.Graficas;
  var almacen = {};

  function montar(area, ctx) {
    var divisa = ctx.divisa;
    var grafica = null;

    area.innerHTML =
      '<form class="tarjeta-panel" id="f-cred" novalidate>' +
        '<div class="tarjeta-panel__cabeza"><h2 class="panel-titulo">Datos del crédito</h2><span class="etiqueta">Entrada de datos · ' + divisa + "</span></div>" +
        '<div class="rejilla-campos">' +
          F.campo({ id: "monto", label: "Monto del crédito", tipo: "dinero", placeholder: "0.00" }) +
          F.campo({ id: "forma", label: "Forma de pago", tipo: "select", opciones: C.FORMAS_PAGO }) +
          F.campo({ id: "plazo", label: "Plazo (años)", tipo: "entero", placeholder: "Ej. 3" }) +
          F.campo({ id: "comision", label: "Comisiones", tipo: "porcentaje", placeholder: "Ej. 1.50", ayuda: "Se cobra al inicio sobre el monto" }) +
          F.campo({ id: "interes", label: "Interés anual", tipo: "porcentaje", placeholder: "Ej. 14.00" }) +
        "</div>" +
        '<div class="tarjeta-panel__pie"><button class="boton boton--primario" type="submit">Calcular <span class="boton__flecha" aria-hidden="true"></span></button></div>' +
      "</form>" +
      '<div id="r-cred" class="salidas" hidden></div>';

    var form = area.querySelector("#f-cred");
    var salida = area.querySelector("#r-cred");
    F.activar(form);
    var yaCalculado = F.recordar(form, almacen);

    function calcular(sinEsqueleto) {
      var e = F.leer(form, {
        monto: { tipo: "dinero", mayorQueCero: true },
        forma: { tipo: "select" },
        plazo: { tipo: "entero", min: 1, max: 50 },
        comision: { tipo: "porcentaje", min: 0, max: 100 },
        interes: { tipo: "porcentaje", min: 0, max: 1000 }
      });
      if (!e) return;
      almacen.calculado = true;
      if (sinEsqueleto) pintar(e);
      else window.Esqueleto.cargar(salida, ["dos", "tabla"], function () { pintar(e); }, form.querySelector('button[type="submit"]'));
    }

    function pintar(e) {

      var r = C.credito({ monto: e.monto, formaPago: e.forma, plazo: e.plazo, comision: e.comision, interes: e.interes });
      var d = function (n) { return F.dinero(n, divisa); };

      var filas = r.tabla.map(function (f) {
        return "<tr><td>" + f.numero + "</td><td>" + F.dinero(f.pago) + "</td><td>" + F.dinero(f.saldoInicial) + "</td><td>" +
          F.dinero(f.capital) + "</td><td>" + F.dinero(f.interes) + "</td><td>" + F.dinero(f.saldoFinal) + "</td></tr>";
      }).join("");

      salida.innerHTML =
        '<div class="rejilla-dos">' +
          '<article class="tarjeta-panel tarjeta-panel--destacada">' +
            '<div class="tarjeta-panel__cabeza"><h2 class="panel-titulo">Resumen del crédito</h2><span class="etiqueta">' + divisa + "</span></div>" +
            F.listaResultados([
              ["Pago programado", d(r.pagoProgramado)],
              ["Número de pagos programados", String(r.numeroPagos)],
              ["Monto por recibir", d(r.montoRecibir)],
              ["Importe total de capital", d(r.totalCapital)],
              ["Importe total de intereses", d(r.totalIntereses)],
              ["Monto total por pagar", d(r.totalPagar), "resultados__fila--total"]
            ]) +
            '<p class="nota">Comisión cobrada al inicio: ' + d(r.comision) + ".</p>" +
          "</article>" +
          '<article class="tarjeta-panel">' +
            '<div class="tarjeta-panel__cabeza"><h2 class="panel-titulo">¿A dónde va cada pago?</h2></div>' +
            '<div class="grafica grafica--chica"><canvas id="g-cred" role="img" aria-label="Gráfica de capital e intereses por pago"></canvas></div>' +
          "</article>" +
        "</div>" +
        '<article class="tarjeta-panel">' +
          '<div class="tarjeta-panel__cabeza"><h2 class="panel-titulo">Tabla de amortización</h2><span class="etiqueta">' + divisa + "</span></div>" +
          '<div class="tabla-scroll"><table class="tabla"><thead><tr><th>Núm. de pago</th><th>Pago programado</th><th>Saldo inicial</th><th>Pago a capital</th><th>Pago de intereses</th><th>Saldo final</th></tr></thead>' +
          "<tbody>" + filas + "</tbody>" +
          "<tfoot><tr><td>Total</td><td>" + F.dinero(r.totalPagar) + "</td><td></td><td>" + F.dinero(r.totalCapital) + "</td><td>" + F.dinero(r.totalIntereses) + "</td><td></td></tr></tfoot>" +
          "</table></div>" +
        "</article>";
      salida.hidden = false;

      if (grafica) grafica.destroy();
      grafica = G.crear(salida.querySelector("#g-cred"), {
        type: "bar",
        data: {
          labels: r.tabla.map(function (f) { return String(f.numero); }),
          datasets: [
            { label: "Pago a capital", data: r.tabla.map(function (f) { return f.capital; }), backgroundColor: G.COLORES.suave, stack: "s" },
            { label: "Pago de intereses", data: r.tabla.map(function (f) { return f.interes; }), backgroundColor: G.COLORES.terciario, stack: "s" }
          ]
        },
        options: {
          interaction: { mode: "index", intersect: false },
          scales: {
            x: { stacked: true, grid: { display: false }, title: { display: true, text: "Número de pago" }, ticks: { maxTicksLimit: 12 } },
            y: G.ejeMonto(null, { stacked: true })
          },
          plugins: { tooltip: { callbacks: { label: function (c) { return c.dataset.label + ": " + d(c.parsed.y); } } } }
        }
      });
    }

    form.addEventListener("submit", function (ev) { ev.preventDefault(); calcular(); });
    if (yaCalculado) calcular(true);
    return function () { if (grafica) grafica.destroy(); };
  }

  window.Modulos = window.Modulos || {};
  window.Modulos.credito = { titulo: "Costo de crédito", etiqueta: "Financiamiento", montar: montar };
})();
