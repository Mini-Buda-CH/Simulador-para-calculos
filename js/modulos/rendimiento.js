(function () {
  "use strict";
  var C = window.Calculos, F = window.Formato, G = window.Graficas;
  var almacen = {};

  function montar(area, ctx) {
    var divisa = ctx.divisa;
    var grafica = null;

    area.innerHTML =
      '<form class="tarjeta-panel" id="f-rend" novalidate>' +
        '<div class="tarjeta-panel__cabeza"><h2 class="panel-titulo">Datos de la inversión</h2><span class="etiqueta">Entrada de datos · ' + divisa + "</span></div>" +
        '<div class="rejilla-campos">' +
          F.campo({ id: "inicial", label: "Valor inicial", tipo: "dinero", placeholder: "0.00" }) +
          F.campo({ id: "periodos", label: "Periodos de inversión", tipo: "select", opciones: C.PERIODICIDAD }) +
          F.campo({ id: "anios", label: "Años de inversión", tipo: "entero", placeholder: "Ej. 3" }) +
          F.campo({ id: "tasa", label: "Tasa anual esperada", tipo: "porcentaje", placeholder: "Ej. 10.50" }) +
          F.campo({ id: "realizada", label: "Tasa anual realizada", tipo: "porcentaje", placeholder: "Ej. 9.25", ayuda: "La que realmente se obtuvo" }) +
        "</div>" +
        '<div class="tarjeta-panel__pie"><button class="boton boton--primario" type="submit">Calcular <span class="boton__flecha" aria-hidden="true"></span></button></div>' +
      "</form>" +
      '<div id="r-rend" class="salidas" hidden></div>';

    var form = area.querySelector("#f-rend");
    var salida = area.querySelector("#r-rend");
    F.activar(form);
    var yaCalculado = F.recordar(form, almacen);

    function calcular(sinEsqueleto) {
      var e = F.leer(form, {
        inicial: { tipo: "dinero", mayorQueCero: true },
        periodos: { tipo: "select" },
        anios: { tipo: "entero", min: 1, max: 100 },
        tasa: { tipo: "porcentaje", min: 0, max: 1000 },
        realizada: { tipo: "porcentaje", min: 0, max: 1000 }
      });
      if (!e) return;
      almacen.calculado = true;
      if (sinEsqueleto) pintar(e);
      else window.Esqueleto.cargar(salida, ["kpis", "tarjeta", "grafica", "tabla"], function () { pintar(e); }, form.querySelector('button[type="submit"]'));
    }

    function pintar(e) {

      var cmp = C.comparativoRendimiento({ valorInicial: e.inicial, periodos: e.periodos, anios: e.anios, tasaEsperada: e.tasa, tasaRealizada: e.realizada });
      var r = cmp.esperado, real = cmp.realizado;
      var nombre = C.PERIODICIDAD.filter(function (p) { return p.valor === e.periodos; })[0].nombre;
      var filasTabla = r.serie.slice(1).map(function (p, i) {
        var saldoReal = real.serie[i + 1].saldo;
        var dif = saldoReal - p.saldo;
        return "<tr><td>" + p.periodo + "</td><td>" + F.dinero(p.saldo) + "</td><td>" + F.dinero(saldoReal) + '</td><td class="' +
          (dif < 0 ? "negativo" : "") + '">' + F.dinero(dif) + "</td></tr>";
      }).join("");

      var neg = cmp.diferenciaMonto < 0;
      var frase = cmp.diferenciaMonto === 0
        ? "El rendimiento realizado fue igual al esperado."
        : "El rendimiento realizado " + (neg ? "quedó por debajo de" : "superó") + " lo esperado por " +
          F.dinero(Math.abs(cmp.diferenciaMonto), divisa) + " (" + F.numero(Math.abs(cmp.diferenciaPuntos), 2) + " puntos porcentuales " +
          (neg ? "menos" : "más") + " de tasa anual).";

      salida.innerHTML =
        '<div class="kpis">' +
          '<div class="kpi kpi--destacado"><span class="etiqueta">Monto esperado al vencimiento</span><strong>' + F.dinero(r.montoVencimiento, divisa) + "</strong></div>" +
          '<div class="kpi"><span class="etiqueta">Rendimiento esperado</span><strong>' + F.dinero(r.rendimientoTotal, divisa) + "</strong></div>" +
          '<div class="kpi"><span class="etiqueta">Periodos · tasa esperada por periodo</span><strong>' + r.totalPeriodos + " · " + F.porcentaje(r.tasaPeriodo * 100) + "</strong></div>" +
        "</div>" +
        '<article class="tarjeta-panel">' +
          '<div class="tarjeta-panel__cabeza"><h2 class="panel-titulo">Esperado vs. realizado</h2><span class="etiqueta">' + divisa + "</span></div>" +
          F.listaResultados([
            ["Monto esperado (" + F.porcentaje(e.tasa * 100) + ")", F.dinero(r.montoVencimiento, divisa)],
            ["Monto realizado (" + F.porcentaje(e.realizada * 100) + ")", F.dinero(real.montoVencimiento, divisa)],
            ["Rendimiento esperado", F.dinero(r.rendimientoTotal, divisa)],
            ["Rendimiento realizado", F.dinero(real.rendimientoTotal, divisa)],
            ["Diferencia de tasa", (cmp.diferenciaPuntos > 0 ? "+" : "") + F.numero(cmp.diferenciaPuntos, 2) + " pp", neg ? "resultados__fila--negativa" : ""],
            ["Cumplimiento del rendimiento", cmp.cumplimiento === null ? "—" : F.porcentaje(cmp.cumplimiento), neg ? "resultados__fila--negativa" : ""],
            ["Diferencia (realizado − esperado)", F.dinero(cmp.diferenciaMonto, divisa), "resultados__fila--total" + (neg ? " resultados__fila--negativa" : "")]
          ]) +
          '<p class="comparativo-frase' + (neg ? " negativo" : "") + '">' + F.escapar(frase) + "</p>" +
        "</article>" +
        '<article class="tarjeta-panel">' +
          '<div class="tarjeta-panel__cabeza"><div><h2 class="panel-titulo">Comportamiento del rendimiento</h2>' +
          '<p class="nota">Capitalización ' + nombre.toLowerCase() + ": cada periodo el rendimiento se suma al saldo.</p></div></div>" +
          '<div class="grafica"><canvas id="g-rend" role="img" aria-label="Gráfica del saldo esperado y realizado por periodo"></canvas></div>' +
        "</article>" +
        '<article class="tarjeta-panel">' +
          '<div class="tarjeta-panel__cabeza"><h2 class="panel-titulo">Detalle por periodo</h2><span class="etiqueta">' + divisa + "</span></div>" +
          '<div class="tabla-scroll"><table class="tabla"><thead><tr><th>Periodo</th><th>Saldo esperado</th><th>Saldo realizado</th><th>Diferencia</th></tr></thead><tbody>' +
          filasTabla + "</tbody></table></div>" +
        "</article>";
      salida.hidden = false;

      if (grafica) grafica.destroy();
      grafica = G.crear(salida.querySelector("#g-rend"), {
        type: "line",
        data: {
          labels: r.serie.map(function (p) { return p.periodo === 0 ? "Inicio" : String(p.periodo); }),
          datasets: [
            { label: "Saldo esperado", data: r.serie.map(function (p) { return p.saldo; }), borderColor: G.COLORES.secundario, backgroundColor: G.COLORES.secundario, pointRadius: 0, borderWidth: 2 },
            { label: "Saldo realizado", data: real.serie.map(function (p) { return p.saldo; }), borderColor: G.COLORES.terciario, backgroundColor: G.COLORES.terciario, pointRadius: 0, borderWidth: 2, borderDash: [6, 4] },
            { label: "Capital inicial", data: r.serie.map(function () { return e.inicial; }), borderColor: G.COLORES.texto, backgroundColor: G.COLORES.texto, pointRadius: 0, borderWidth: 1 }
          ]
        },
        options: {
          interaction: { mode: "index", intersect: false },
          scales: {
            x: { grid: { display: false }, title: { display: true, text: "Periodo (" + nombre.toLowerCase() + ")" }, ticks: { maxTicksLimit: 12 } },
            y: G.ejeMonto(divisa)
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function (c) { return c.dataset.label + ": " + F.dinero(c.parsed.y, divisa); },
                footer: function (items) {
                  var i = items[0].dataIndex;
                  return "Diferencia: " + F.dinero(real.serie[i].saldo - r.serie[i].saldo, divisa);
                }
              }
            }
          }
        }
      });
    }

    form.addEventListener("submit", function (ev) { ev.preventDefault(); calcular(); });
    if (yaCalculado) calcular(true);
    return function () { if (grafica) grafica.destroy(); };
  }

  window.Modulos = window.Modulos || {};
  window.Modulos.rendimiento = { titulo: "Rendimiento simple", etiqueta: "Inversión", montar: montar };
})();
