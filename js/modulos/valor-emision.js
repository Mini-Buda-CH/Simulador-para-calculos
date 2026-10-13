(function () {
  "use strict";
  var C = window.Calculos, F = window.Formato, G = window.Graficas;
  var MERCADOS = [{ nombre: "Capitales", valor: "Capitales" }, { nombre: "Deuda", valor: "Deuda" }];

  function mercadoDe(ctx) {
    return ctx.datos && (ctx.datos.mercado === "Capitales" || ctx.datos.mercado === "Deuda") ? ctx.datos.mercado : null;
  }

  function montar(area, ctx) {
    var almacen = window.Registro.almacen("valor-emision");
    var principal = ctx.divisa;
    var otra = principal === "USD" ? "MXN" : "USD";
    var grafica = null;
    var mercadoFijo = mercadoDe(ctx);
    var mercado = mercadoFijo || (almacen.valores && almacen.valores.mercado) || "Capitales";

    function camposDe(m) {
      var comunes = F.campo({ id: "monto", label: "Monto solicitado", tipo: "dinero", placeholder: "0.00" }) +
        F.campo({ id: "divisa", label: "Divisa", tipo: "fijo", valor: principal, ayuda: "Tomada de los datos de la empresa" });
      var propios = m === "Deuda"
        ? F.campo({ id: "plazo", label: "Plazo de pago (años)", tipo: "entero", placeholder: "Ej. 5" }) +
          F.campo({ id: "cupon", label: "Cupón anual", tipo: "porcentaje", placeholder: "Ej. 9.50" }) +
          F.campo({ id: "periodicidad", label: "Periodicidad de pagos", tipo: "select", opciones: C.PERIODICIDAD })
        : F.campo({ id: "acciones", label: "Cantidad de acciones a emitir", tipo: "entero", placeholder: "Ej. 10000", ayuda: "Es también el total de acciones de la empresa" });
      return comunes + propios +
        F.campo({ id: "precio", label: "Precio de emisión", tipo: "porcentaje", placeholder: "Ej. 98.50" }) +
        F.campo({ id: "tc", label: "Tipo de cambio (MXN por USD)", tipo: "dinero", valor: ctx.tipoCambio, ayuda: "Para la conversión a " + otra });
    }

    function render() {
      var selector = mercadoFijo ? "" :
        '<div class="rejilla-campos">' + F.campo({ id: "mercado", label: "Tipo de mercado", tipo: "select", opciones: MERCADOS, valor: mercado, ayuda: "Captura la empresa en el inicio para fijarlo" }) + "</div>";
      area.innerHTML =
        '<form class="tarjeta-panel" id="f-emision" novalidate>' +
          '<div class="tarjeta-panel__cabeza"><h2 class="panel-titulo">' + (mercado === "Deuda" ? "Datos de la emisión de bonos" : "Datos de la emisión de acciones") + "</h2>" +
          '<span class="etiqueta">Mercado de ' + (mercado === "Deuda" ? "deuda" : "capitales") + "</span></div>" +
          selector +
          '<div class="rejilla-campos">' + camposDe(mercado) + "</div>" +
          '<div class="tarjeta-panel__pie"><button class="boton boton--primario" type="submit">Calcular <span class="boton__flecha" aria-hidden="true"></span></button></div>' +
        "</form>" +
        '<div id="r-emision" class="salidas" hidden></div>';
    }

    render();
    var form, salida;

    function enlazar() {
      form = area.querySelector("#f-emision");
      salida = area.querySelector("#r-emision");
      F.activar(form);
      var yaCalculado = F.recordar(form, almacen) && almacen.resultado && almacen.resultado.mercado === mercado;
      form.addEventListener("submit", function (ev) { ev.preventDefault(); calcular(); });
      var sel = form.querySelector("#mercado");
      if (sel) sel.addEventListener("change", function () {
        if (!sel.value || sel.value === mercado) return;
        mercado = sel.value;
        almacen.calculado = false;
        almacen.guardar();
        if (grafica) { grafica.destroy(); grafica = null; }
        render();
        enlazar();
      });
      if (yaCalculado) calcular(true);
    }

    function calcular(sinEsqueleto) {
      var reglas = {
        monto: { tipo: "dinero", mayorQueCero: true },
        precio: { tipo: "porcentaje", mayorQueCero: true, max: 200 },
        tc: { tipo: "dinero", mayorQueCero: true }
      };
      if (mercado === "Deuda") {
        reglas.plazo = { tipo: "entero", min: 1, max: 100 };
        reglas.cupon = { tipo: "porcentaje", min: 0, max: 100 };
        reglas.periodicidad = { tipo: "select" };
      } else {
        reglas.acciones = { tipo: "entero", mayorQueCero: true };
      }
      var e = F.leer(form, reglas);
      if (!e) return;
      almacen.calculado = true;
      if (sinEsqueleto) pintar(e);
      else window.Esqueleto.cargar(salida, ["dos", "grafica"], function () { pintar(e); }, form.querySelector('button[type="submit"]'));
    }

    function pintar(e) {
      ctx.tipoCambio = e.tc;
      var esDeuda = mercado === "Deuda";
      var entrada = esDeuda
        ? { monto: e.monto, plazo: e.plazo, cupon: e.cupon, periodicidad: e.periodicidad, precio: e.precio }
        : { monto: e.monto, acciones: e.acciones, precio: e.precio };
      var r = C.valorEmision(entrada);
      var conv = function (n) { return C.convertir(n, principal, otra, e.tc); };
      var mismo = function (n) { return n; };

      almacen.resultado = { mercado: mercado, entradas: Object.assign({ tc: e.tc }, entrada), resultados: r };
      almacen.guardar();

      function filas(fn, divisa) {
        var base = [["Valor nominal", F.dinero(fn(r.valorNominal), divisa)]];
        if (!esDeuda) base.push(["Costo por acción", F.dinero(fn(r.costoAccion), divisa)]);
        base.push(["Precio de emisión", F.dinero(fn(r.precioEmision), divisa)]);
        base.push(["Costo de emisión", F.dinero(fn(r.costoEmision), divisa), esDeuda ? "" : "resultados__fila--total"]);
        if (esDeuda) {
          base.push(["Rendimiento por periodo", F.dinero(fn(r.rendimientoPeriodo), divisa)]);
          base.push(["Rendimiento anual", F.dinero(fn(r.rendimientoAnual), divisa)]);
          base.push(["Rendimiento total al final del plazo", F.dinero(fn(r.rendimientoTotal), divisa)]);
          base.push(["Total a pagar", F.dinero(fn(r.totalPagar), divisa), "resultados__fila--total"]);
        }
        return base;
      }

      var tituloGrafica, notaGrafica;
      if (esDeuda) {
        var nombrePeriodo = C.PERIODICIDAD.filter(function (p) { return p.valor === e.periodicidad; })[0].nombre.toLowerCase();
        tituloGrafica = "Capital e intereses acumulados por año";
        notaGrafica = "Cupón " + nombrePeriodo + " de " + F.porcentaje(e.cupon * 100) + " anual sobre " + F.dinero(e.monto, principal) + ".";
      } else {
        tituloGrafica = "Composición de la colocación";
        notaGrafica = F.numero(e.acciones, 0) + " acciones a " + F.dinero(r.costoAccion, principal) + " de valor nominal; precio de emisión al " + F.porcentaje(e.precio * 100) + ".";
      }

      salida.innerHTML =
        '<div class="rejilla-dos">' +
          '<article class="tarjeta-panel tarjeta-panel--destacada">' +
            '<div class="tarjeta-panel__cabeza"><h2 class="panel-titulo">Resultados en ' + principal + '</h2><span class="etiqueta">Divisa principal</span></div>' +
            F.listaResultados(filas(mismo, principal)) +
          "</article>" +
          '<article class="tarjeta-panel">' +
            '<div class="tarjeta-panel__cabeza"><h2 class="panel-titulo">Conversión a ' + otra + '</h2><span class="etiqueta">TC ' + F.numero(e.tc, 2) + " MXN/USD</span></div>" +
            F.listaResultados(filas(conv, otra)) +
          "</article>" +
        "</div>" +
        '<article class="tarjeta-panel">' +
          '<div class="tarjeta-panel__cabeza"><div><h2 class="panel-titulo">' + tituloGrafica + "</h2>" +
          '<p class="nota">' + F.escapar(notaGrafica) + "</p></div>" +
          F.alternador([principal, otra], principal) + "</div>" +
          '<div class="grafica"><canvas id="g-emision" aria-label="' + tituloGrafica + '" role="img"></canvas></div>' +
        "</article>";
      salida.hidden = false;

      var porAnio = esDeuda ? C.emisionPorAnio(entrada) : null;
      function dibujar(divisa) {
        var fn = divisa === principal ? mismo : conv;
        if (grafica) grafica.destroy();
        var config = esDeuda
          ? {
              type: "bar",
              data: {
                labels: porAnio.map(function (f) { return "Año " + f.anio; }),
                datasets: [
                  { label: "Capital", data: porAnio.map(function (f) { return fn(f.capital); }), backgroundColor: G.COLORES.suave, borderRadius: 4, stack: "s" },
                  { label: "Intereses acumulados", data: porAnio.map(function (f) { return fn(f.intereses); }), backgroundColor: G.COLORES.principal, borderRadius: 4, stack: "s" }
                ]
              },
              options: {
                scales: { x: { stacked: true, grid: { display: false } }, y: G.ejeMonto(divisa, { stacked: true }) },
                plugins: { tooltip: { callbacks: { label: function (c) { return c.dataset.label + ": " + F.dinero(c.parsed.y, divisa); } } } }
              }
            }
          : {
              type: "bar",
              data: {
                labels: ["Valor nominal", "Recibe la empresa", "Costo de emisión"],
                datasets: [{
                  label: divisa,
                  data: [fn(r.valorNominal), fn(r.precioEmision), fn(r.costoEmision)],
                  backgroundColor: [G.COLORES.suave, G.COLORES.principal, G.COLORES.terciario],
                  borderRadius: 4
                }]
              },
              options: {
                scales: { x: { grid: { display: false } }, y: G.ejeMonto(divisa) },
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return F.dinero(c.parsed.y, divisa); } } } }
              }
            };
        grafica = G.crear(salida.querySelector("#g-emision"), config);
      }
      dibujar(principal);
      F.activarAlternador(salida, dibujar);
    }

    enlazar();
    return function () { if (grafica) grafica.destroy(); };
  }

  window.Modulos = window.Modulos || {};
  window.Modulos["valor-emision"] = {
    titulo: "Valor de emisión",
    etiqueta: function (ctx) { return mercadoDe(ctx) === "Deuda" ? "Emisión de deuda" : "Emisión de acciones"; },
    montar: montar
  };
})();
