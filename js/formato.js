window.Formato = (function () {
  "use strict";

  var nf2 = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function dinero(n, divisa) {
    if (n === null || n === undefined || !isFinite(n)) return "—";
    var texto = (n < 0 ? "-$" : "$") + nf2.format(Math.abs(n));
    return divisa ? texto + " " + divisa : texto;
  }

  function numero(n, decimales) {
    if (n === null || n === undefined || !isFinite(n)) return "—";
    var d = decimales === undefined ? 2 : decimales;
    return new Intl.NumberFormat("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
  }

  function porcentaje(n) {
    return n === null || !isFinite(n) ? "—" : numero(n, 2) + " %";
  }

  function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function limpiarDecimal(valor, negativos) {
    var signo = negativos && valor.trim().charAt(0) === "-" ? "-" : "";
    var s = valor.replace(/[^\d.]/g, "");
    var punto = s.indexOf(".");
    if (punto !== -1) {
      s = s.slice(0, punto + 1) + s.slice(punto + 1).replace(/\./g, "").slice(0, 2);
    }
    return signo + s;
  }

  function limpiarEntero(valor) {
    return valor.replace(/\D/g, "");
  }

  function aNumero(texto) {
    var s = String(texto).replace(/,/g, "").trim();
    if (s === "" || s === "-" || s === ".") return NaN;
    return Number(s);
  }

  function conComas(texto) {
    var n = aNumero(texto);
    return isFinite(n) ? nf2.format(n) : texto;
  }

  function campo(spec) {
    var id = escapar(spec.id);
    var describe = ' aria-describedby="' + (spec.ayuda ? id + "-ayuda " : "") + id + '-error"';
    var html = '<div class="campo" data-campo="' + id + '">' +
      '<label class="campo__label" for="' + id + '">' + escapar(spec.label) + "</label>";

    if (spec.tipo === "select") {
      html += '<select class="control" id="' + id + '" name="' + id + '"' + describe + '><option value="">Selecciona…</option>';
      spec.opciones.forEach(function (op) {
        var sel = String(op.valor) === String(spec.valor) ? " selected" : "";
        html += '<option value="' + escapar(op.valor) + '"' + sel + ">" + escapar(op.nombre) + "</option>";
      });
      html += "</select>";
    } else if (spec.tipo === "fijo") {
      html += '<input class="control control--fijo" id="' + id + '" name="' + id + '"' + describe + ' type="text" readonly value="' + escapar(spec.valor) + '">';
    } else {
      var prefijo = spec.tipo === "dinero" ? "$" : "";
      var sufijo = spec.tipo === "porcentaje" ? "%" : (spec.sufijo || "");
      var modo = spec.tipo === "entero" ? "numeric" : "decimal";
      var valor = spec.valor === undefined || spec.valor === null ? "" : spec.valor;
      if (spec.tipo === "dinero" && valor !== "") valor = conComas(valor);
      html += '<div class="afijos' + (prefijo ? " afijos--pre" : "") + (sufijo ? " afijos--suf" : "") + '">' +
        (prefijo ? '<span class="afijos__pre" aria-hidden="true">' + prefijo + "</span>" : "") +
        '<input class="control" id="' + id + '" name="' + id + '"' + describe + ' type="text" inputmode="' + modo + '" autocomplete="off" data-tipo="' + spec.tipo + '"' +
        (spec.negativos ? ' data-negativos="1"' : "") +
        (spec.placeholder ? ' placeholder="' + escapar(spec.placeholder) + '"' : "") +
        ' value="' + escapar(valor) + '">' +
        (sufijo ? '<span class="afijos__suf" aria-hidden="true">' + escapar(sufijo) + "</span>" : "") +
        "</div>";
    }
    if (spec.ayuda) html += '<span class="campo__ayuda" id="' + id + '-ayuda">' + escapar(spec.ayuda) + "</span>";
    html += '<span class="campo__error" id="' + id + '-error" aria-live="polite"></span></div>';
    return html;
  }

  function activar(form) {
    form.querySelectorAll("input[data-tipo]").forEach(function (input) {
      var tipo = input.dataset.tipo;
      input.addEventListener("input", function () {
        var antes = input.value;
        var limpio = tipo === "entero" ? limpiarEntero(antes) : limpiarDecimal(antes, !!input.dataset.negativos);
        if (limpio !== antes) input.value = limpio;
        limpiarError(form, input.id);
      });
      if (tipo === "dinero") {
        input.addEventListener("focus", function () { input.value = input.value.replace(/,/g, ""); });
        input.addEventListener("blur", function () { if (input.value) input.value = conComas(input.value); });
      }
    });
    form.querySelectorAll("select").forEach(function (s) {
      s.addEventListener("change", function () { limpiarError(form, s.id); });
    });
  }

  function mostrarError(form, id, mensaje) {
    var c = form.querySelector('[data-campo="' + id + '"]');
    if (c) c.classList.add("invalido");
    var control = form.querySelector("#" + id);
    if (control) control.setAttribute("aria-invalid", "true");
    var e = form.querySelector("#" + id + "-error");
    if (e) e.textContent = mensaje;
  }

  function limpiarError(form, id) {
    var c = form.querySelector('[data-campo="' + id + '"]');
    if (c) c.classList.remove("invalido");
    var control = form.querySelector("#" + id);
    if (control) control.removeAttribute("aria-invalid");
    var e = form.querySelector("#" + id + "-error");
    if (e) e.textContent = "";
  }

  function leer(form, reglas) {
    var salida = {};
    var primero = null;
    Object.keys(reglas).forEach(function (id) {
      var r = reglas[id];
      var el = form.querySelector("#" + id);
      limpiarError(form, id);
      var crudo = el.value.trim();
      var error = "";

      if (r.tipo === "select") {
        if (!crudo) error = "Selecciona una opción.";
        else salida[id] = isNaN(Number(crudo)) ? crudo : Number(crudo);
      } else {
        var n = aNumero(crudo);
        if (crudo === "") error = "Campo obligatorio.";
        else if (!isFinite(n)) error = "Debe ser un número.";
        else if (r.tipo === "entero" && !Number.isInteger(n)) error = "Solo números enteros.";
        else if (r.mayorQueCero && n <= 0) error = "Debe ser mayor que 0.";
        else if (r.min !== undefined && n < r.min) error = "Mínimo " + r.min + ".";
        else if (r.max !== undefined && n > r.max) error = "Máximo " + r.max + ".";
        else salida[id] = r.tipo === "porcentaje" ? n / 100 : n;
      }

      if (error) {
        mostrarError(form, id, error);
        if (!primero) primero = el;
      }
    });
    if (primero) { primero.focus(); return null; }
    return salida;
  }

  function recordar(form, almacen) {
    form.querySelectorAll("input:not([readonly]), select").forEach(function (el) {
      if (almacen.valores && el.id in almacen.valores) {
        el.value = almacen.valores[el.id];
        if (el.dataset.tipo === "dinero" && el.value) el.dispatchEvent(new Event("blur"));
      }
      el.addEventListener("change", function () {
        almacen.valores = almacen.valores || {};
        almacen.valores[el.id] = el.value;
        if (typeof almacen.guardar === "function") almacen.guardar();
      });
    });
    return !!almacen.calculado;
  }

  function listaResultados(filas) {
    return '<dl class="resultados">' + filas.map(function (f) {
      return '<div class="resultados__fila' + (f[2] ? " " + f[2] : "") + '"><dt>' + escapar(f[0]) + "</dt><dd>" + escapar(f[1]) + "</dd></div>";
    }).join("") + "</dl>";
  }

  function alternador(divisas, activa) {
    return '<div class="alternador" role="group" aria-label="Divisa de la gráfica">' + divisas.map(function (d) {
      return '<button type="button" class="alternador__btn' + (d === activa ? " activo" : "") + '" data-divisa="' + d + '" aria-pressed="' + (d === activa) + '">' + d + "</button>";
    }).join("") + "</div>";
  }

  function activarAlternador(contenedor, alCambiar) {
    contenedor.querySelectorAll(".alternador__btn").forEach(function (b) {
      b.addEventListener("click", function () {
        contenedor.querySelectorAll(".alternador__btn").forEach(function (o) {
          o.classList.toggle("activo", o === b);
          o.setAttribute("aria-pressed", String(o === b));
        });
        alCambiar(b.dataset.divisa);
      });
    });
  }

  return {
    recordar: recordar,
    listaResultados: listaResultados,
    alternador: alternador,
    activarAlternador: activarAlternador,
    dinero: dinero,
    numero: numero,
    porcentaje: porcentaje,
    escapar: escapar,
    campo: campo,
    activar: activar,
    leer: leer,
    mostrarError: mostrarError
  };
})();
