(function () {
  "use strict";

  var CARRILES = [
    { nombre: "Cliente", detalle: "Ordenante" },
    { nombre: "Emisora", detalle: "Banco del cliente" },
    { nombre: "Banxico", detalle: "SPEI" },
    { nombre: "Receptora", detalle: "Banco del beneficiario" }
  ];

  var PASOS = [
    {
      carril: 0, icono: "telefono", titulo: ["Instrucción", "del cliente"],
      texto: "El usuario inicia la transferencia desde su app o banca en línea, ingresando la CLABE, número de tarjeta o celular del beneficiario, el monto y un concepto."
    },
    {
      carril: 1, icono: "escudo", titulo: ["Validación por", "la emisora"],
      texto: "El banco verifica la identidad del cliente (token, NIP, biometría), confirma saldo suficiente y límites, y genera evidencia de la validación."
    },
    {
      carril: 1, icono: "enviar", titulo: ["Envío", "al SPEI"],
      texto: "La institución prepara la instrucción de pago, la firma digitalmente y la envía al Banco de México."
    },
    {
      carril: 2, icono: "banco", titulo: ["Procesamiento", "y liquidación"],
      texto: "Banco de México verifica las firmas electrónicas (que garantizan la integridad de la instrucción), procesa la operación y liquida los fondos entre las cuentas de reserva que los bancos mantienen en su sistema."
    },
    {
      carril: 3, icono: "cartera", titulo: ["Acreditación en", "cuenta destino"],
      texto: "La institución receptora recibe la orden, verifica la información y abona el monto en la cuenta del beneficiario."
    },
    {
      carril: 2, icono: "recibo", titulo: ["Generación del", "comprobante"],
      texto: "Se emite un Comprobante Electrónico de Pago (CEP) con una clave de rastreo, que permite verificar el estado de la operación en el Módulo de Información del SPEI (MI-SPEI)."
    }
  ];

  function montar(area) {
    window.RutaVertical.montar(area, {
      id: "ruta-spei",
      titulo: "Ruta de una transferencia SPEI",
      nota: "Selecciona un paso para ver su descripción. Cada columna es un participante de la transferencia.",
      carriles: CARRILES,
      pasos: PASOS
    });
  }

  window.Modulos = window.Modulos || {};
  window.Modulos.spei = { titulo: "SPEI", etiqueta: "Pagos electrónicos", montar: montar };
})();
