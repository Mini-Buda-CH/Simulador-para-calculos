(function () {
  "use strict";
  var C = window.Calculos, F = window.Formato;

  function montar(area, ctx) {
    var almacen = window.Registro.almacen("datos-bmv");
    var mercado = ctx.datos && ctx.datos.mercado;
    var esDeuda = mercado === "Deuda";
    var otra = ctx.divisa === "USD" ? "MXN" : "USD";
    var objetivos = C.OBJETIVOS_EMISION.map(function (o) { return { nombre: o, valor: o }; });

    var dividendos = esDeuda ? "" :
      '<section class="bmv-grupo">' +
        '<h3 class="bmv-grupo__titulo">Política de dividendos</h3>' +
        '<p class="nota">Los dividendos son opcionales: la empresa decide cuánto de su utilidad neta reparte a sus accionistas.</p>' +
        '<div class="rejilla-campos">' +
          F.campo({ id: "dividendosPct", label: "Porcentaje de la utilidad neta", tipo: "porcentaje", placeholder: "Ej. 30", ayuda: "0 si no reparte dividendos" }) +
          F.campo({ id: "dividendosPeriodo", label: "Periodicidad", tipo: "select", opciones: C.PERIODOS_DIVIDENDO }) +
        "</div>" +
      "</section>";

    area.innerHTML =
      (mercado ? "" : '<div class="aviso">Captura primero los datos de la empresa en <a href="index.html">el inicio</a>; el mercado define qué datos se piden aquí.</div>') +
      '<form class="tarjeta-panel" id="f-bmv" novalidate>' +
        '<div class="tarjeta-panel__cabeza"><div><h2 class="panel-titulo">Datos faltantes para el Simulador BMV</h2>' +
        '<p class="nota">Las ventas del Estado de resultados se toman como el año 1; desde ahí se proyectan con el crecimiento esperado.</p></div>' +
        '<span class="etiqueta">Mercado de ' + (esDeuda ? "deuda" : "capitales") + "</span></div>" +

        '<section class="bmv-grupo">' +
          '<h3 class="bmv-grupo__titulo">Proyección</h3>' +
          '<div class="rejilla-campos">' +
            F.campo({ id: "crecimiento", label: "Crecimiento anual esperado", tipo: "porcentaje", negativos: true, placeholder: "Ej. 8.00", ayuda: "Incluye la inflación esperada" }) +
            F.campo({ id: "objetivo", label: "Objetivo de la emisión", tipo: "select", opciones: objetivos }) +
          "</div>" +
        "</section>" +

        '<section class="bmv-grupo">' +
          '<h3 class="bmv-grupo__titulo">Liquidez y deuda inicial</h3>' +
          '<div class="rejilla-campos">' +
            F.campo({ id: "cajaOtra", label: "Caja en " + otra, tipo: "dinero", placeholder: "0.00", ayuda: "La caja en " + ctx.divisa + " es Bancos del Balance general" }) +
            F.campo({ id: "deudaMonto", label: "Deuda bancaria inicial", tipo: "dinero", placeholder: "0.00", ayuda: "0 si no tiene deuda" }) +
            F.campo({ id: "deudaTasa", label: "Tasa anual de la deuda", tipo: "porcentaje", placeholder: "Ej. 12.00" }) +
            F.campo({ id: "deudaPlazo", label: "Plazo restante (meses)", tipo: "entero", placeholder: "Ej. 24" }) +
          "</div>" +
        "</section>" +

        dividendos +

        '<div class="tarjeta-panel__pie bmv-pie">' +
          '<p class="bmv-confirmacion" id="bmv-ok" role="status" aria-live="polite"></p>' +
          '<button class="boton boton--primario" type="submit">Guardar datos <span class="boton__flecha" aria-hidden="true"></span></button>' +
        "</div>" +
      "</form>";

    var form = area.querySelector("#f-bmv");
    var ok = area.querySelector("#bmv-ok");
    F.activar(form);
    F.recordar(form, almacen);

    function aviso(texto, conEnlace) {
      ok.innerHTML = F.escapar(texto) + (conEnlace ? ' <a href="#exportar">Ir a Exportar →</a>' : "");
      ok.classList.remove("visible");
      void ok.offsetWidth;
      ok.classList.add("visible");
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var montoTexto = form.querySelector("#deudaMonto").value.replace(/,/g, "").trim();
      var conDeuda = montoTexto !== "" && Number(montoTexto) > 0;
      var reglas = {
        crecimiento: { tipo: "porcentaje", min: -100, max: 1000 },
        objetivo: { tipo: "select" },
        cajaOtra: { tipo: "dinero", min: 0 },
        deudaMonto: { tipo: "dinero", min: 0 }
      };
      if (conDeuda) {
        reglas.deudaTasa = { tipo: "porcentaje", min: 0, max: 200 };
        reglas.deudaPlazo = { tipo: "entero", min: 1, max: 600 };
      }
      if (!esDeuda) {
        reglas.dividendosPct = { tipo: "porcentaje", min: 0, max: 100 };
        reglas.dividendosPeriodo = { tipo: "select" };
      }
      var e = F.leer(form, reglas);
      if (!e) { aviso("Revisa los campos marcados.", false); return; }

      almacen.calculado = true;
      almacen.resultado = {
        mercado: mercado || null,
        entradas: {
          crecimiento: e.crecimiento,
          objetivo: e.objetivo,
          cajaOtra: e.cajaOtra,
          deudaMonto: e.deudaMonto,
          deudaTasa: conDeuda ? e.deudaTasa : null,
          deudaPlazo: conDeuda ? e.deudaPlazo : null,
          dividendosPct: esDeuda ? null : e.dividendosPct,
          dividendosPeriodo: esDeuda ? null : e.dividendosPeriodo
        }
      };
      almacen.guardar();
      aviso("Datos guardados.", true);
    });
  }

  window.Modulos = window.Modulos || {};
  window.Modulos["datos-bmv"] = { titulo: "Datos para Simulador BMV", etiqueta: "Simulador BMV", montar: montar };
})();
