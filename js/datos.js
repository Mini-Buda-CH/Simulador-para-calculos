window.DatosSimulador = (function () {
  var CLAVE = "simuladorIPO.datos";
  var CLAVE_MODULOS = "simuladorIPO.modulos";

  function leer() {
    try {
      var crudo = localStorage.getItem(CLAVE);
      return crudo ? JSON.parse(crudo) : null;
    } catch (e) {
      return null;
    }
  }

  function guardar(datos) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
      return true;
    } catch (e) {
      return false;
    }
  }

  function borrarModulos() {
    try {
      localStorage.removeItem(CLAVE_MODULOS);
    } catch (e) { /* sin almacenamiento disponible */ }
  }

  function borrar() {
    try {
      localStorage.removeItem(CLAVE);
    } catch (e) { /* sin almacenamiento disponible */ }
    borrarModulos();
  }

  function nuevoId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "emp-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  return { CLAVE_MODULOS: CLAVE_MODULOS, leer: leer, guardar: guardar, borrar: borrar, borrarModulos: borrarModulos, nuevoId: nuevoId };
})();

window.Registro = (function () {
  "use strict";
  var D = window.DatosSimulador;
  var cache = null;

  function idEmpresa() {
    var d = D.leer();
    return d && d.id ? d.id : null;
  }

  function cargar() {
    if (cache) return cache;
    var id = idEmpresa();
    var guardado = null;
    try { guardado = JSON.parse(localStorage.getItem(D.CLAVE_MODULOS)); } catch (e) { guardado = null; }
    cache = guardado && guardado.id === id && guardado.modulos ? guardado : { id: id, modulos: {} };
    return cache;
  }

  function guardar() {
    try { localStorage.setItem(D.CLAVE_MODULOS, JSON.stringify(cargar())); } catch (e) { /* sin almacenamiento */ }
  }

  function almacen(nombre) {
    var c = cargar();
    var a = c.modulos[nombre] || (c.modulos[nombre] = {});
    if (!a.guardar) Object.defineProperty(a, "guardar", { value: guardar, enumerable: false });
    return a;
  }

  function leer(nombre) {
    return cargar().modulos[nombre] || null;
  }

  return { almacen: almacen, leer: leer, guardar: guardar };
})();
