(function () {
  "use strict";
  var C = window.Calculos, F = window.Formato;

  var PARTES = [
    { clave: "empresa", nombre: "Datos de la empresa", enlace: "index.html", accion: "Capturar en el inicio" },
    { clave: "valor-emision", nombre: "Valor de emisión", enlace: "#valor-emision", accion: "Calcular" },
    { clave: "estado-resultados", nombre: "Estado de resultados", enlace: "#estado-resultados", accion: "Calcular" },
    { clave: "balance-general", nombre: "Balance general", enlace: "#balance-general", accion: "Calcular" },
    { clave: "datos-bmv", nombre: "Datos para Simulador BMV", enlace: "#datos-bmv", accion: "Completar" }
  ];

  function nombreArchivo(nombre) {
    var base = String(nombre || "empresa")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "empresa";
    return base + "_bmv.json";
  }

  function descargar(objeto, archivo) {
    var blob = new Blob([JSON.stringify(objeto, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = archivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function montar(area, ctx) {
    var empresa = ctx.datos;
    var modulos = {};
    ["valor-emision", "estado-resultados", "balance-general", "datos-bmv"].forEach(function (k) {
      modulos[k] = window.Registro.leer(k);
    });
    var r = C.armarExportacion(empresa, modulos);
    var divisa = ctx.divisa;

    var lista = PARTES.map(function (p) {
      var listo = r.faltantes.indexOf(p.clave) === -1;
      return '<li class="verif__item' + (listo ? " listo" : "") + '">' +
        '<span class="verif__marca" aria-hidden="true">' + (listo ? "✓" : "") + "</span>" +
        '<span class="verif__nombre">' + p.nombre + "</span>" +
        (listo
          ? '<span class="sello sello--bueno">Completo</span>'
          : '<a class="sello sello--medio verif__ir" href="' + p.enlace + '">' + p.accion + " →</a>") +
        "</li>";
    }).join("");

    var resumen = "";
    if (r.datos) {
      var d = r.datos;
      var em = d.emision;
      var emisionTxt = em.tipo === "acciones"
        ? F.numero(em.acciones, 0) + " acciones · " + F.dinero(em.monto, divisa)
        : "Bonos a " + em.plazoAnios + " años · cupón " + F.porcentaje(em.cupon * 100);
      var deuda = d.datosBMV.deudaInicial.monto > 0
        ? F.dinero(d.datosBMV.deudaInicial.monto, divisa) + " al " + F.porcentaje(d.datosBMV.deudaInicial.tasaAnual * 100)
        : "Sin deuda";
      resumen =
        '<div class="kpis">' +
          '<div class="kpi"><span class="etiqueta">Emisión</span><strong class="kpi__texto">' + F.escapar(emisionTxt) + "</strong></div>" +
          '<div class="kpi"><span class="etiqueta">Ventas año 1</span><strong>' + F.dinero(d.estadoResultados.ventasAnio1, divisa) + "</strong></div>" +
          '<div class="kpi"><span class="etiqueta">Crecimiento esperado</span><strong>' + F.porcentaje(d.datosBMV.crecimientoAnual * 100) + "</strong></div>" +
        "</div>" +
        '<article class="tarjeta-panel">' +
          '<div class="tarjeta-panel__cabeza"><h2 class="panel-titulo">Resumen del archivo</h2><span class="etiqueta">' + F.escapar(nombreArchivo(d.empresa.nombre)) + "</span></div>" +
          F.listaResultados([
            ["Empresa", d.empresa.nombre + " · " + d.empresa.mercado + " · " + d.empresa.divisa],
            ["Carrera · tipo de empresa", [d.empresa.carrera, d.empresa.tipoEmpresa].filter(Boolean).join(" · ") || "—"],
            ["Caja en " + divisa + " (bancos)", F.dinero(d.balanceGeneral.bancos, divisa)],
            ["Caja en " + d.datosBMV.cajaOtraDivisa.divisa, F.dinero(d.datosBMV.cajaOtraDivisa.monto, d.datosBMV.cajaOtraDivisa.divisa)],
            ["Deuda bancaria inicial", deuda],
            ["Objetivo de la emisión", d.datosBMV.objetivoEmision],
            ["Dividendos", d.datosBMV.dividendos ? F.porcentaje(d.datosBMV.dividendos.porcentajeUtilidad * 100) + " de la utilidad, " + C.PERIODOS_DIVIDENDO.filter(function (p) { return p.valor === d.datosBMV.dividendos.periodicidad; })[0].nombre.toLowerCase() : "No aplica (mercado de deuda)"]
          ]) +
        "</article>";
    }

    area.innerHTML =
      '<article class="tarjeta-panel">' +
        '<div class="tarjeta-panel__cabeza"><div><h2 class="panel-titulo">Lista de verificación</h2>' +
        '<p class="nota">El archivo reúne todo lo necesario para cargar esta empresa en el Simulador BMV.</p></div>' +
        '<span class="etiqueta">' + (PARTES.length - r.faltantes.length) + " de " + PARTES.length + " completas</span></div>" +
        '<ul class="verif">' + lista + "</ul>" +
        '<div class="tarjeta-panel__pie exportar-pie">' +
          '<p class="nota" id="exp-estado">' + (r.completo ? "Todo listo para descargar." : "Completa las partes pendientes para habilitar la descarga.") + "</p>" +
          '<button class="boton boton--primario" type="button" id="btn-descargar"' + (r.completo ? "" : " disabled") + ">Descargar JSON <span class=\"boton__flecha\" aria-hidden=\"true\">↓</span></button>" +
        "</div>" +
      "</article>" +
      resumen;

    var boton = area.querySelector("#btn-descargar");
    boton.addEventListener("click", function () {
      var final = C.armarExportacion(empresa, modulos);
      if (!final.completo) return;
      descargar(final.datos, nombreArchivo(final.datos.empresa.nombre));
      area.querySelector("#exp-estado").textContent = "Archivo descargado: " + nombreArchivo(final.datos.empresa.nombre);
    });
  }

  window.Modulos = window.Modulos || {};
  window.Modulos.exportar = { titulo: "Exportar", etiqueta: "Simulador BMV", montar: montar };
})();
