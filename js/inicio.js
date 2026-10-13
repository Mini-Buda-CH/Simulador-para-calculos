(function () {
  "use strict";

  var MERCADOS = ["Capitales", "Deuda"];

  var CARRERAS = {
    "Finanzas y Contaduría": [
      "Grupos financieros y banca comercial",
      "Fideicomisos de bienes raíces",
      "Casas de bolsa y operadoras de fondos"
    ],
    "Administración y Gestión Empresarial": [
      "Conglomerados industriales y de materiales",
      "Grandes cadenas de retail",
      "Empresas de infraestructura y logística"
    ],
    "Administración de Empresas Turísticas": [
      "Operadores de aeropuertos",
      "Cadenas hoteleras e inmobiliarias turísticas",
      "Servicios de entretenimiento y restaurantes"
    ]
  };

  var LISTAS = ["mercado", "carrera", "tipoEmpresa"];
  var PLACEHOLDER = {
    mercado: "Selecciona el tipo de mercado",
    carrera: "Selecciona la carrera",
    tipoEmpresa: "Selecciona el tipo de empresa"
  };

  var form = document.getElementById("form-inicio");
  var empresa = document.getElementById("empresa");
  var mercado = document.getElementById("mercado");
  var carrera = document.getElementById("carrera");
  var tipoEmpresa = document.getElementById("tipoEmpresa");
  var btnLimpiar = document.getElementById("btn-limpiar");

  function llenarSelect(select, opciones, seleccionado) {
    select.innerHTML = "";
    var vacio = document.createElement("option");
    vacio.value = "";
    vacio.textContent = PLACEHOLDER[select.id];
    select.appendChild(vacio);

    opciones.forEach(function (texto) {
      var op = document.createElement("option");
      op.value = texto;
      op.textContent = texto;
      op.title = texto;
      select.appendChild(op);
    });

    select.disabled = opciones.length === 0;
    select.value = seleccionado && opciones.indexOf(seleccionado) !== -1 ? seleccionado : "";
    select.title = select.value;
  }

  function llenarTipos(seleccionado) {
    llenarSelect(tipoEmpresa, CARRERAS[carrera.value] || [], seleccionado);
  }

  function llenarTodo(datos) {
    datos = datos || {};
    llenarSelect(mercado, MERCADOS, datos.mercado);
    llenarSelect(carrera, Object.keys(CARRERAS), datos.carrera);
    llenarTipos(datos.tipoEmpresa);
  }

  [mercado, carrera, tipoEmpresa].forEach(function (select) {
    select.addEventListener("change", function () {
      select.title = select.value;
      limpiarError(select.id);
      if (select === carrera) {
        limpiarError("tipoEmpresa");
        llenarTipos();
      }
    });
  });

  function campoDe(nombre) {
    return nombre === "divisa"
      ? document.getElementById("divisa-campo")
      : document.getElementById(nombre).closest(".campo");
  }

  function controlesDe(nombre) {
    return nombre === "divisa" ? Array.prototype.slice.call(document.querySelectorAll('input[name="divisa"]')) : [document.getElementById(nombre)];
  }

  function mostrarError(nombre, mensaje) {
    campoDe(nombre).classList.add("invalido");
    controlesDe(nombre).forEach(function (c) { c.setAttribute("aria-invalid", "true"); });
    document.getElementById(nombre + "-error").textContent = mensaje;
  }

  function limpiarError(nombre) {
    campoDe(nombre).classList.remove("invalido");
    controlesDe(nombre).forEach(function (c) { c.removeAttribute("aria-invalid"); });
    document.getElementById(nombre + "-error").textContent = "";
  }

  function limpiarErrores() {
    ["empresa"].concat(LISTAS, ["divisa"]).forEach(limpiarError);
  }

  empresa.addEventListener("input", function () { limpiarError("empresa"); });
  form.querySelectorAll('input[name="divisa"]').forEach(function (r) {
    r.addEventListener("change", function () { limpiarError("divisa"); });
  });

  function divisaSeleccionada() {
    var marcado = form.querySelector('input[name="divisa"]:checked');
    return marcado ? marcado.value : "";
  }

  function validar() {
    limpiarErrores();
    var primerInvalido = null;
    function falla(nombre, mensaje, elemento) {
      mostrarError(nombre, mensaje);
      if (!primerInvalido) primerInvalido = elemento;
    }

    var nombre = empresa.value.trim();
    if (!nombre) falla("empresa", "Escribe el nombre de la empresa.", empresa);

    LISTAS.forEach(function (id) {
      var select = document.getElementById(id);
      if (!select.value) {
        var mensaje = id === "tipoEmpresa" && !carrera.value ? "Primero elige la carrera." : "Selecciona una opción.";
        falla(id, mensaje, select.disabled ? carrera : select);
      }
    });

    if (!divisaSeleccionada()) {
      falla("divisa", "Elige MXN o USD.", form.querySelector('input[name="divisa"]'));
    }

    if (primerInvalido) {
      primerInvalido.focus();
      return null;
    }

    return {
      empresa: nombre,
      mercado: mercado.value,
      carrera: carrera.value,
      tipoEmpresa: tipoEmpresa.value,
      divisa: divisaSeleccionada(),
      fecha: new Date().toISOString()
    };
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var datos = validar();
    if (!datos) return;
    var previos = window.DatosSimulador.leer();
    var misma = previos && previos.id && previos.empresa === datos.empresa &&
      previos.mercado === datos.mercado && previos.divisa === datos.divisa;
    datos.id = misma ? previos.id : window.DatosSimulador.nuevoId();
    if (!misma) window.DatosSimulador.borrarModulos();
    window.DatosSimulador.guardar(datos);
    window.location.href = "simulador.html";
  });

  btnLimpiar.addEventListener("click", function () {
    form.reset();
    limpiarErrores();
    llenarTodo();
    window.DatosSimulador.borrar();
    empresa.focus();
  });

  var guardados = window.DatosSimulador.leer();
  llenarTodo(guardados);
  if (guardados) {
    empresa.value = guardados.empresa || "";
    var radio = form.querySelector('input[name="divisa"][value="' + guardados.divisa + '"]');
    if (radio) radio.checked = true;
  }
})();
