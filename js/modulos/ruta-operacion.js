(function () {
  "use strict";

  var CARRILES = [
    { nombre: "Cliente", detalle: "Inversionista" },
    { nombre: "Intermediario", detalle: "Casa de bolsa" },
    { nombre: "Bolsa", detalle: "Sistema de negociación" },
    { nombre: "Compensación", detalle: "Contraparte central" },
    { nombre: "Custodia", detalle: "Depósito de valores" }
  ];

  var PASOS = [
    { carril: 0, icono: "usuario", titulo: ["Apertura", "de cuenta"], texto: "El cliente abre una cuenta con un intermediario autorizado." },
    { carril: 0, icono: "orden", titulo: ["Orden de", "compra/venta"], texto: "Decide y captura o instruye una orden." },
    { carril: 1, icono: "escudo", titulo: ["Validación", "y controles"], texto: "El intermediario valida datos, recursos y controles." },
    { carril: 2, icono: "servidor", titulo: ["Ingreso al", "sistema"], texto: "La orden llega al sistema de negociación." },
    { carril: 2, icono: "cruce", titulo: ["Cruce de", "posturas"], texto: "Se cruza con una postura compatible." },
    { carril: 3, icono: "balanza", titulo: ["Obligaciones", "efectivo/valores"], texto: "Se determinan obligaciones de efectivo y valores." },
    { carril: 3, icono: "liquidar", titulo: ["Compensación", "y liquidación"], texto: "Se compensa y liquida." },
    { carril: 4, icono: "custodia", titulo: ["Posiciones", "y custodia"], texto: "Se actualizan posiciones y registros de custodia." }
  ];

  function montar(area) {
    window.RutaVertical.montar(area, {
      id: "ruta-op",
      titulo: "Del cliente a la custodia",
      nota: "Selecciona un paso para ver su descripción. Cada columna es un participante del mercado.",
      carriles: CARRILES,
      pasos: PASOS
    });
  }

  window.Modulos = window.Modulos || {};
  window.Modulos["ruta-operacion"] = { titulo: "Ruta de una operación", etiqueta: "Mercado de valores", montar: montar };
})();
