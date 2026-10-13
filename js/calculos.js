(function (raiz) {
  "use strict";

  var PERIODICIDAD = [
    { nombre: "Mensual", valor: 12 },
    { nombre: "Bimestral", valor: 6 },
    { nombre: "Trimestral", valor: 4 },
    { nombre: "Cuatrimestral", valor: 3 },
    { nombre: "Semestral", valor: 2 },
    { nombre: "Anual", valor: 1 }
  ];

  var FORMAS_PAGO = [
    { nombre: "Mensual", valor: 12 },
    { nombre: "Bimestral", valor: 6 },
    { nombre: "Trimestral", valor: 4 },
    { nombre: "Semestral", valor: 2 },
    { nombre: "Único al vencimiento", valor: 0 }
  ];

  var ISR = 0.30;
  var PTU = 0.10;

  function redondear(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function convertir(monto, de, a, tipoCambio) {
    if (de === a) return monto;
    return de === "USD" ? monto * tipoCambio : monto / tipoCambio;
  }

  function valorEmision(e) {
    var m = e.monto, p = e.precio;
    var c = e.cupon || 0, n = e.periodicidad || 1, plazo = e.plazo || 0;
    var rendimientoTotal = m * c * plazo;
    return {
      valorNominal: m,
      costoAccion: e.acciones ? m / e.acciones : null,
      precioEmision: m * p,
      costoEmision: m * (1 - p),
      rendimientoPeriodo: m * (c / n),
      rendimientoAnual: m * c,
      rendimientoTotal: rendimientoTotal,
      totalPagar: m + rendimientoTotal
    };
  }

  function emisionPorAnio(e) {
    var filas = [];
    for (var anio = 1; anio <= e.plazo; anio++) {
      filas.push({ anio: anio, capital: e.monto, intereses: e.monto * e.cupon * anio });
    }
    return filas;
  }

  function rendimiento(e) {
    var v = e.valorInicial, n = e.periodos, r = e.tasa;
    var totalPeriodos = n * e.anios;
    var tasaPeriodo = r / n;
    var saldo = v;
    var serie = [{ periodo: 0, saldo: v, rendimiento: 0 }];
    for (var k = 1; k <= totalPeriodos; k++) {
      saldo = saldo * (1 + tasaPeriodo);
      serie.push({ periodo: k, saldo: saldo, rendimiento: saldo - v });
    }
    var final = v * Math.pow(1 + tasaPeriodo, totalPeriodos);
    return {
      montoVencimiento: final,
      rendimientoTotal: final - v,
      totalPeriodos: totalPeriodos,
      tasaPeriodo: tasaPeriodo,
      serie: serie
    };
  }

 function comparativoRendimiento(e) {
    var base = { valorInicial: e.valorInicial, periodos: e.periodos, anios: e.anios };
    var esperado = rendimiento(Object.assign({}, base, { tasa: e.tasaEsperada }));
    var realizado = rendimiento(Object.assign({}, base, { tasa: e.tasaRealizada }));
    return {
      esperado: esperado,
      realizado: realizado,
      diferenciaMonto: realizado.montoVencimiento - esperado.montoVencimiento,
      diferenciaPuntos: (e.tasaRealizada - e.tasaEsperada) * 100,
      cumplimiento: esperado.rendimientoTotal ? (realizado.rendimientoTotal / esperado.rendimientoTotal) * 100 : null
    };
  }

  function credito(e) {
    var monto = e.monto, tasa = e.interes, anios = e.plazo, forma = e.formaPago;
    var comision = monto * e.comision;
    var tabla = [];

    if (forma === 0) {
      var interesUnico = redondear(monto * tasa * anios);
      tabla.push({
        numero: 1,
        pago: redondear(monto + interesUnico),
        saldoInicial: monto,
        capital: monto,
        interes: interesUnico,
        saldoFinal: 0
      });
    } else {
      var i = tasa / forma;
      var N = forma * anios;
      var pago = i === 0 ? monto / N : monto * i / (1 - Math.pow(1 + i, -N));
      pago = redondear(pago);
      var saldo = monto;
      for (var k = 1; k <= N; k++) {
        var interes = redondear(saldo * i);
        var capital = redondear(pago - interes);
        var pagoK = pago;
        if (k === N) { 
          capital = redondear(saldo);
          pagoK = redondear(capital + interes);
        }
        var saldoFinal = redondear(saldo - capital);
        tabla.push({ numero: k, pago: pagoK, saldoInicial: saldo, capital: capital, interes: interes, saldoFinal: saldoFinal });
        saldo = saldoFinal;
      }
    }

    var totalIntereses = 0, totalPagado = 0, totalCapital = 0;
    tabla.forEach(function (f) {
      totalIntereses += f.interes;
      totalPagado += f.pago;
      totalCapital += f.capital;
    });

    return {
      pagoProgramado: tabla[0].pago,
      numeroPagos: tabla.length,
      comision: comision,
      montoRecibir: monto - comision,
      totalCapital: redondear(totalCapital),
      totalIntereses: redondear(totalIntereses),
      totalPagar: redondear(totalPagado),
      tabla: tabla
    };
  }

  function estadoResultados(e) {
    var utilidadBruta = e.ventas - e.costoVentas;
    var utilidadOperacion = utilidadBruta - e.gastos - e.depreciacion;
    var uai = utilidadOperacion;
    var isr = uai > 0 ? uai * ISR : 0;
    var ptu = uai > 0 ? uai * PTU : 0;
    var utilidadNeta = uai - isr - ptu;
    return {
      ventas: e.ventas,
      costoVentas: e.costoVentas,
      utilidadBruta: utilidadBruta,
      gastos: e.gastos,
      depreciacion: e.depreciacion,
      utilidadOperacion: utilidadOperacion,
      utilidadAntesImpuestos: uai,
      isr: isr,
      ptu: ptu,
      utilidadNeta: utilidadNeta,
      margenBruto: e.ventas ? (utilidadBruta / e.ventas) * 100 : null,
      margenNeto: e.ventas ? (utilidadNeta / e.ventas) * 100 : null
    };
  }

  var NIVELES_ENDEUDAMIENTO = [
    { hasta: 0.40, rango: "< 0.40", nivel: "Bajo", texto: "Estructura conservadora; posible desaprovechamiento de apalancamiento" },
    { hasta: 0.60, rango: "0.40 – 0.60", nivel: "Moderado", texto: "Equilibrio saludable" },
    { hasta: 1.00, rango: "0.60 – 1.00", nivel: "Alto", texto: "Dependencia significativa de deuda" },
    { hasta: Infinity, rango: "> 1.00", nivel: "Muy alto", texto: "Más deuda que capital propio → riesgo elevado" }
  ];

  function nivelEndeudamiento(ratio) {
    if (ratio === null || !isFinite(ratio)) return null;
    for (var i = 0; i < NIVELES_ENDEUDAMIENTO.length; i++) {
      var n = NIVELES_ENDEUDAMIENTO[i];
      if (i === 0 ? ratio < n.hasta : ratio <= n.hasta) return i;
    }
    return NIVELES_ENDEUDAMIENTO.length - 1;
  }

  function balanceGeneral(e) {
    var totalActivo = e.bancos + e.clientes + e.inventarios;
    var totalPasivo = e.proveedores + e.acreedores;
    var capital = totalActivo - totalPasivo;
    var razon = totalPasivo ? totalActivo / totalPasivo : null;
    var endeudamiento = capital > 0 ? totalPasivo / capital : null;
    return {
      totalActivo: totalActivo,
      totalPasivo: totalPasivo,
      capitalContable: capital,
      razonCirculante: razon,
      capitalTrabajo: capital,
      endeudamiento: endeudamiento,
      nivelEndeudamiento: nivelEndeudamiento(endeudamiento)
    };
  }

  var OBJETIVOS_EMISION = [
    "Proyectos de crecimiento",
    "Expandir operaciones",
    "Desarrollo de nuevos productos",
    "Saldar deudas existentes"
  ];
  var PERIODOS_DIVIDENDO = [
    { nombre: "Trimestral", valor: 4 },
    { nombre: "Semestral", valor: 2 },
    { nombre: "Anual", valor: 1 }
  ];

  function armarExportacion(empresa, modulos, fecha) {
    modulos = modulos || {};
    var faltantes = [];
    var res = function (clave) {
      var m = modulos[clave];
      return m && m.calculado && m.resultado ? m.resultado : null;
    };

    if (!empresa || !empresa.empresa || !empresa.mercado || !empresa.divisa) faltantes.push("empresa");
    var esDeuda = empresa && empresa.mercado === "Deuda";

    var ve = res("valor-emision");
    if (!ve || ve.mercado !== (empresa && empresa.mercado)) { faltantes.push("valor-emision"); ve = null; }
    var er = res("estado-resultados");
    if (!er) faltantes.push("estado-resultados");
    var bg = res("balance-general");
    if (!bg) faltantes.push("balance-general");
    var bmv = res("datos-bmv");
    if (!bmv || bmv.mercado !== (empresa && empresa.mercado)) { faltantes.push("datos-bmv"); bmv = null; }

    var datos = null;
    if (!faltantes.length) {
      var e = ve.entradas;
      var emision = esDeuda
        ? { tipo: "bonos", monto: e.monto, plazoAnios: e.plazo, cupon: e.cupon, periodicidad: e.periodicidad, precio: e.precio }
        : { tipo: "acciones", monto: e.monto, acciones: e.acciones, accionesTotales: e.acciones, precio: e.precio };
      emision.divisa = empresa.divisa;
      emision.tipoCambio = e.tc;
      emision.resultados = ve.resultados;

      var d = bmv.entradas;
      datos = {
        formato: "simulador-bmv/empresa",
        version: 1,
        exportado: fecha || new Date().toISOString(),
        id: empresa.id || null,
        empresa: {
          nombre: empresa.empresa,
          mercado: empresa.mercado,
          carrera: empresa.carrera || null,
          tipoEmpresa: empresa.tipoEmpresa || null,
          divisa: empresa.divisa
        },
        emision: emision,
        estadoResultados: {
          ventasAnio1: er.entradas.ventas,
          costoVentas: er.entradas.costo,
          gastos: er.entradas.gastos,
          depreciacion: er.entradas.depreciacion,
          resultados: er.resultados
        },
        balanceGeneral: {
          bancos: bg.entradas.bancos,
          clientes: bg.entradas.clientes,
          inventarios: bg.entradas.inventarios,
          proveedores: bg.entradas.proveedores,
          acreedores: bg.entradas.acreedores,
          resultados: bg.resultados
        },
        datosBMV: {
          crecimientoAnual: d.crecimiento,
          cajaOtraDivisa: { divisa: empresa.divisa === "USD" ? "MXN" : "USD", monto: d.cajaOtra },
          deudaInicial: d.deudaMonto > 0
            ? { monto: d.deudaMonto, tasaAnual: d.deudaTasa, plazoMeses: d.deudaPlazo }
            : { monto: 0, tasaAnual: null, plazoMeses: null },
          objetivoEmision: d.objetivo,
          dividendos: esDeuda ? null : { porcentajeUtilidad: d.dividendosPct, periodicidad: d.dividendosPeriodo }
        }
      };
    }
    return { completo: !faltantes.length, faltantes: faltantes, datos: datos };
  }

  var api = {
    PERIODICIDAD: PERIODICIDAD,
    FORMAS_PAGO: FORMAS_PAGO,
    ISR: ISR,
    PTU: PTU,
    NIVELES_ENDEUDAMIENTO: NIVELES_ENDEUDAMIENTO,
    redondear: redondear,
    convertir: convertir,
    valorEmision: valorEmision,
    emisionPorAnio: emisionPorAnio,
    rendimiento: rendimiento,
    comparativoRendimiento: comparativoRendimiento,
    credito: credito,
    estadoResultados: estadoResultados,
    balanceGeneral: balanceGeneral,
    nivelEndeudamiento: nivelEndeudamiento,
    OBJETIVOS_EMISION: OBJETIVOS_EMISION,
    PERIODOS_DIVIDENDO: PERIODOS_DIVIDENDO,
    armarExportacion: armarExportacion
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else raiz.Calculos = api;
})(typeof window !== "undefined" ? window : this);
