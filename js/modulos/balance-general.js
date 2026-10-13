(function () {
  "use strict";
  var C = window.Calculos, F = window.Formato;
  var almacen = null;

  function textoRazon(razon) {
    if (razon === null) return { nivel: "Sin pasivo", clase: "", texto: "No hay pasivos que cubrir, así que la razón circulante no se puede calcular." };
    var base = "Por cada $1 de deuda a corto plazo, la empresa cuenta con $" + F.numero(razon, 3) + " en activos circulantes para cubrirla.";
    if (razon < 1) return { nivel: "Menor a 1", clase: "malo", texto: base + " Señala posibles problemas de liquidez: los activos no son suficientes para cubrir los pasivos inmediatos." };
    if (razon < 1.5) return { nivel: "Mayor a 1", clase: "medio", texto: base + " Tiene suficientes activos para cubrir sus deudas; la liquidez es adecuada, aunque el margen es moderado." };
    if (razon <= 2) return { nivel: "Óptimo (1.5 – 2)", clase: "bueno", texto: base + " Está en el rango que generalmente se considera saludable (varía según la industria)." };
    if (razon <= 3) return { nivel: "Holgado", clase: "bueno", texto: base + " La posición de liquidez es holgada." };
    return { nivel: "Mayor a 3", clase: "medio", texto: base + " Un valor tan alto puede indicar una gestión ineficiente del capital de trabajo." };
  }

  function textoCapitalTrabajo(ct, divisa) {
    if (ct > 0) return { nivel: "Positivo", clase: "bueno", texto: "La empresa tiene " + F.dinero(ct, divisa) + " de \"colchón\" para operar, invertir o cubrir imprevistos." };
    if (ct === 0) return { nivel: "Cero", clase: "medio", texto: "Justo para cubrir deudas, sin margen." };
    return { nivel: "Negativo", clase: "malo", texto: "Las deudas a corto plazo superan los activos por " + F.dinero(Math.abs(ct), divisa) + ": alerta de insolvencia inminente." };
  }

  function montar(area, ctx) {
    almacen = window.Registro.almacen("balance-general");
    var divisa = ctx.divisa;

    area.innerHTML =
      '<form class="tarjeta-panel" id="f-bg" novalidate>' +
        '<div class="tarjeta-panel__cabeza"><h2 class="panel-titulo">Datos del balance</h2><span class="etiqueta">Entrada de datos · ' + divisa + "</span></div>" +
        '<div class="rejilla-dos rejilla-dos--sin-margen">' +
          '<fieldset class="grupo"><legend class="grupo__titulo">Activo</legend>' +
            F.campo({ id: "bancos", label: "Bancos", tipo: "dinero", placeholder: "0.00" }) +
            F.campo({ id: "clientes", label: "Clientes", tipo: "dinero", placeholder: "0.00" }) +
            F.campo({ id: "inventarios", label: "Inventarios", tipo: "dinero", placeholder: "0.00" }) +
          "</fieldset>" +
          '<fieldset class="grupo"><legend class="grupo__titulo">Pasivo</legend>' +
            F.campo({ id: "proveedores", label: "Proveedores", tipo: "dinero", placeholder: "0.00" }) +
            F.campo({ id: "acreedores", label: "Acreedores", tipo: "dinero", placeholder: "0.00" }) +
          "</fieldset>" +
        "</div>" +
        '<div class="tarjeta-panel__pie"><button class="boton boton--primario" type="submit">Calcular <span class="boton__flecha" aria-hidden="true"></span></button></div>' +
      "</form>" +
      '<div id="r-bg" class="salidas" hidden></div>';

    var form = area.querySelector("#f-bg");
    var salida = area.querySelector("#r-bg");
    F.activar(form);
    var yaCalculado = F.recordar(form, almacen);

    function calcular(sinEsqueleto) {
      var dinero = { tipo: "dinero", min: 0 };
      var e = F.leer(form, { bancos: dinero, clientes: dinero, inventarios: dinero, proveedores: dinero, acreedores: dinero });
      if (!e) return;
      almacen.calculado = true;
      if (sinEsqueleto) pintar(e);
      else window.Esqueleto.cargar(salida, ["kpis", "dos", "tarjeta"], function () { pintar(e); }, form.querySelector('button[type="submit"]'));
    }

    function pintar(e) {
      almacen.resultado = { entradas: e, resultados: C.balanceGeneral(e) };
      almacen.guardar();

      var r = C.balanceGeneral(e);
      var razon = textoRazon(r.razonCirculante);
      var ct = textoCapitalTrabajo(r.capitalTrabajo, divisa);
      var niveles = C.NIVELES_ENDEUDAMIENTO;
      var nivel = r.nivelEndeudamiento;
      var textoEnd = nivel === null
        ? "El capital contable es cero o negativo: la empresa debe tanto o más de lo que tiene, por lo que el endeudamiento no se puede medir (riesgo muy elevado)."
        : "Por cada $1 de capital propio, la empresa tiene $" + F.numero(r.endeudamiento, 2) + " de deuda. Es un nivel " + niveles[nivel].nivel.toLowerCase() + ".";

      salida.innerHTML =
        '<div class="kpis">' +
          '<div class="kpi"><span class="etiqueta">Total activo</span><strong>' + F.dinero(r.totalActivo, divisa) + "</strong></div>" +
          '<div class="kpi"><span class="etiqueta">Total pasivo</span><strong>' + F.dinero(r.totalPasivo, divisa) + "</strong></div>" +
          '<div class="kpi kpi--destacado"><span class="etiqueta">Capital contable</span><strong class="' + (r.capitalContable < 0 ? "negativo" : "") + '">' + F.dinero(r.capitalContable, divisa) + "</strong></div>" +
        "</div>" +
        '<div class="rejilla-dos">' +
          '<article class="indicador">' +
            '<span class="etiqueta">Razón circulante</span><strong class="indicador__valor">' + F.numero(r.razonCirculante, 3) + "</strong>" +
            '<span class="sello sello--' + razon.clase + '">' + razon.nivel + "</span>" +
            '<p class="indicador__formula">Total activo ÷ Total pasivo</p>' +
            "<p>" + F.escapar(razon.texto) + "</p>" +
          "</article>" +
          '<article class="indicador">' +
            '<span class="etiqueta">Capital de trabajo</span><strong class="indicador__valor' + (r.capitalTrabajo < 0 ? " negativo" : "") + '">' + F.dinero(r.capitalTrabajo, divisa) + "</strong>" +
            '<span class="sello sello--' + ct.clase + '">' + ct.nivel + "</span>" +
            '<p class="indicador__formula">Total activo − Total pasivo</p>' +
            "<p>" + F.escapar(ct.texto) + "</p>" +
          "</article>" +
        "</div>" +
        '<article class="indicador indicador--ancho">' +
          '<div class="indicador__cabeza"><div><span class="etiqueta">Endeudamiento</span><strong class="indicador__valor">' + F.numero(r.endeudamiento, 2) + "</strong>" +
          (nivel !== null ? '<span class="sello sello--' + ["bueno", "bueno", "medio", "malo"][nivel] + '">' + niveles[nivel].nivel + "</span>" : '<span class="sello sello--malo">Capital ≤ 0</span>') +
          '<p class="indicador__formula">Total pasivo ÷ Capital contable</p>' +
          "<p>" + F.escapar(textoEnd) + "</p></div>" +
          '<table class="tabla tabla--niveles"><thead><tr><th>Ratio</th><th>Nivel</th><th>Interpretación</th></tr></thead><tbody>' +
          niveles.map(function (n, i) {
            return '<tr class="' + (i === nivel ? "activo" : "") + '"><td>' + n.rango + "</td><td>" + n.nivel + "</td><td>" + F.escapar(n.texto) + "</td></tr>";
          }).join("") +
          "</tbody></table></div>" +
        "</article>";
      salida.hidden = false;
    }

    form.addEventListener("submit", function (ev) { ev.preventDefault(); calcular(); });
    if (yaCalculado) calcular(true);
  }

  window.Modulos = window.Modulos || {};
  window.Modulos["balance-general"] = { titulo: "Balance general", etiqueta: "Estados financieros", montar: montar };
})();
