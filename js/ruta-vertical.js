window.RutaVertical = (function () {
  "use strict";
  var F = window.Formato;

  var TONOS = ["var(--color-iris-gleam)", "var(--color-cyan-signal)", "var(--color-orchid-bloom)", "var(--color-periwinkle)", "var(--color-pale-iris)"];

  var ICONOS = {
    telefono: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
    escudo: '<path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    enviar: '<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>',
    banco: '<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>',
    cartera: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M16 15h1.5"/>',
    recibo: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    usuario: '<circle cx="10" cy="8" r="4"/><path d="M3 21c0-4 3-6.5 7-6.5 1.4 0 2.6.3 3.7.8"/><path d="M19 15v6M16 18h6"/>',
    orden: '<path d="M4 19h16"/><path d="M5 15l4-4 3 3 6-6"/><path d="M14 8h4v4"/>',
    servidor: '<rect x="4" y="4" width="16" height="7" rx="1.5"/><rect x="4" y="13" width="16" height="7" rx="1.5"/><path d="M8 7.5h.5M8 16.5h.5"/>',
    cruce: '<path d="M4 7h13l-3-3"/><path d="M20 17H7l3 3"/>',
    balanza: '<path d="M12 4v16M7 20h10M5 8h14"/><path d="M5 8l-3 6h6zM19 8l-3 6h6z"/>',
    liquidar: '<path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
    custodia: '<rect x="3" y="4" width="18" height="15" rx="2"/><circle cx="12" cy="11.5" r="3.5"/><path d="M12 8v.5M12 15v.5M8.5 11.5H9M15 11.5h.5M7 19v2M17 19v2"/>'
  };

  function icono(nombre) {
    return '<svg class="icono" viewBox="0 0 24 24" aria-hidden="true">' + (ICONOS[nombre] || ICONOS.cruce) + "</svg>";
  }

  function gota(x, y, r) {
    return "M" + (x - r) + " " + y +
      "A" + r + " " + r + " 0 0 1 " + x + " " + (y - r) +
      "A" + r + " " + r + " 0 0 1 " + (x + r) + " " + y +
      "L" + (x + r) + " " + (y + r) +
      "L" + x + " " + (y + r) +
      "A" + r + " " + r + " 0 0 1 " + (x - r) + " " + y + "Z";
  }

  var COL = 92, CAB = 58, FILA = 58, R = 14;

  function dos(n) { return (n < 10 ? "0" : "") + n; }
  function cx(c) { return c * COL + COL / 2; }
  function cy(i) { return CAB + 18 + i * FILA; }

  function conector(x1, y1, x2, y2) {
    y1 += R + 3; y2 -= R + 3;
    if (x1 === x2) return "M" + x1 + " " + y1 + "V" + y2;
    var m = (y1 + y2) / 2, k = 8, dir = x2 > x1 ? 1 : -1;
    return "M" + x1 + " " + y1 + "V" + (m - k) +
      "Q" + x1 + " " + m + " " + (x1 + k * dir) + " " + m +
      "H" + (x2 - k * dir) +
      "Q" + x2 + " " + m + " " + x2 + " " + (m + k) +
      "V" + y2;
  }

  function mapa(cfg) {
    var id = cfg.id;
    var ancho = cfg.carriles.length * COL;
    var alto = cy(cfg.pasos.length - 1) + R + 18;
    var s = '<svg class="ruta-mapa__svg" viewBox="0 0 ' + ancho + " " + alto + '" role="img" aria-labelledby="' + id + '-t">' +
      '<title id="' + id + '-t">Mapa de participantes: ' + F.escapar(cfg.carriles.map(function (c) { return c.nombre; }).join(", ")) + "</title>";

    cfg.carriles.forEach(function (c, i) {
      s += '<g class="mapa-carril" style="--tono:' + TONOS[i % TONOS.length] + '">' +
        '<line class="mapa-carril__guia" x1="' + cx(i) + '" y1="' + (CAB - 4) + '" x2="' + cx(i) + '" y2="' + alto + '"/>' +
        '<circle class="mapa-carril__punto" cx="' + cx(i) + '" cy="14" r="4"/>' +
        '<text class="mapa-carril__nombre" x="' + cx(i) + '" y="38" text-anchor="middle">' + F.escapar(c.nombre) + "</text></g>";
    });

    for (var i = 0; i < cfg.pasos.length - 1; i++) {
      var d = conector(cx(cfg.pasos[i].carril), cy(i), cx(cfg.pasos[i + 1].carril), cy(i + 1));
      s += '<path class="mapa-tramo" d="' + d + '"/>' +
        '<path class="mapa-tramo mapa-tramo--hecho" data-hasta="' + (i + 1) + '" pathLength="1" d="' + d + '"/>';
    }

    cfg.pasos.forEach(function (p, i) {
      var x = cx(p.carril), y = cy(i), t = Math.round(R * 1.1);
      s += '<g class="mapa-paso" data-paso="' + i + '" style="--tono:' + TONOS[p.carril % TONOS.length] + '">' +
        "<title>Paso " + (i + 1) + ": " + F.escapar(p.titulo.join(" ")) + "</title>" +
        '<path class="mapa-paso__halo" d="' + gota(x, y, R + 6) + '"/>' +
        '<path class="mapa-paso__punto" d="' + gota(x, y, R) + '"/>' +
        '<svg class="mapa-paso__icono" x="' + (x - t / 2) + '" y="' + (y - t / 2) + '" width="' + t + '" height="' + t + '" viewBox="0 0 24 24">' + (ICONOS[p.icono] || ICONOS.cruce) + "</svg></g>";
    });
    return s + "</svg>";
  }

  function lista(cfg) {
    return cfg.pasos.map(function (p, i) {
      var c = cfg.carriles[p.carril];
      var sig = cfg.pasos[i + 1];
      var relevo = sig && sig.carril !== p.carril
        ? '<span class="paso__relevo">Pasa a <b style="--tono:' + TONOS[sig.carril % TONOS.length] + '">' + F.escapar(cfg.carriles[sig.carril].nombre) + "</b></span>"
        : "";
      return '<li class="paso" data-paso="' + i + '" style="--tono:' + TONOS[p.carril % TONOS.length] + '">' +
        '<button type="button" class="paso__boton" aria-expanded="false" aria-controls="' + cfg.id + "-p" + i + '">' +
          '<span class="gota" aria-hidden="true">' + icono(p.icono) + "</span>" +
          '<span class="paso__cabeza">' +
            '<span class="paso__actor"><b>Paso ' + dos(i + 1) + "</b>" + F.escapar(c.nombre) + " · " + F.escapar(c.detalle) + "</span>" +
            '<span class="paso__titulo">' + F.escapar(p.titulo.join(" ")) + "</span>" +
          "</span>" +
        "</button>" +
        '<div class="paso__cuerpo" id="' + cfg.id + "-p" + i + '"><div class="paso__interior">' +
          "<p>" + F.escapar(p.texto) + "</p>" + relevo +
        "</div></div>" +
      "</li>";
    }).join("");
  }

  function montar(area, cfg) {
    var total = cfg.pasos.length;
    var actual = 0;

    area.innerHTML =
      '<article class="tarjeta-panel ruta">' +
        '<header class="ruta__cabeza">' +
          '<div><h2 class="panel-titulo">' + F.escapar(cfg.titulo) + "</h2>" +
          '<p class="nota">' + F.escapar(cfg.nota) + "</p></div>" +
          '<div class="ruta__nav">' +
            '<span class="etiqueta ruta__contador"><b data-r="num">01</b> / ' + dos(total) + "</span>" +
            '<button type="button" class="boton boton--fantasma boton--icono" data-r="ant" aria-label="Paso anterior">←</button>' +
            '<button type="button" class="boton boton--fantasma boton--icono" data-r="sig" aria-label="Paso siguiente">→</button>' +
          "</div>" +
        "</header>" +
        '<div class="ruta__segmentos" aria-hidden="true">' + cfg.pasos.map(function (p) {
          return '<span style="--tono:' + TONOS[p.carril % TONOS.length] + '"></span>';
        }).join("") + "</div>" +
        '<div class="ruta__cuerpo">' +
          '<ol class="ruta__pasos">' + lista(cfg) + "</ol>" +
          '<aside class="ruta-mapa"><span class="etiqueta">Participantes</span>' + mapa(cfg) + "</aside>" +
        "</div>" +
      "</article>";

    var raiz = area.querySelector(".ruta");
    var pasos = area.querySelectorAll(".paso");
    var botones = area.querySelectorAll(".paso__boton");
    var tramos = area.querySelectorAll(".mapa-tramo--hecho");
    var puntos = area.querySelectorAll(".mapa-paso");
    var segmentos = area.querySelectorAll(".ruta__segmentos span");
    var num = area.querySelector('[data-r="num"]');

    function seleccionar(i, desdeTeclado) {
      actual = Math.max(0, Math.min(total - 1, i));
      raiz.classList.toggle("sin-animacion", !!desdeTeclado);
      pasos.forEach(function (li, k) {
        li.classList.toggle("activo", k === actual);
        li.classList.toggle("hecho", k < actual);
        botones[k].setAttribute("aria-expanded", String(k === actual));
      });
      puntos.forEach(function (g, k) {
        g.classList.toggle("activo", k === actual);
        g.classList.toggle("hecho", k < actual);
      });
      tramos.forEach(function (t) { t.classList.toggle("hecha", Number(t.dataset.hasta) <= actual); });
      segmentos.forEach(function (s, k) { s.classList.toggle("lleno", k <= actual); });
      num.textContent = dos(actual + 1);
      area.querySelector('[data-r="ant"]').disabled = actual === 0;
      area.querySelector('[data-r="sig"]').disabled = actual === total - 1;
      if (desdeTeclado) requestAnimationFrame(function () { raiz.classList.remove("sin-animacion"); });
    }

    botones.forEach(function (b, i) {
      b.addEventListener("click", function (e) { seleccionar(i, e.detail === 0); });
      b.addEventListener("keydown", function (e) {
        var destino = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: total - 1 }[e.key];
        if (destino === undefined) return;
        e.preventDefault();
        seleccionar(destino, true);
        botones[actual].focus();
      });
    });
    puntos.forEach(function (g, i) {
      g.addEventListener("click", function () { seleccionar(i); });
    });
    area.querySelector('[data-r="ant"]').addEventListener("click", function (e) { seleccionar(actual - 1, e.detail === 0); });
    area.querySelector('[data-r="sig"]').addEventListener("click", function (e) { seleccionar(actual + 1, e.detail === 0); });

    raiz.classList.add("sin-animacion");
    seleccionar(0, true);
  }

  return { montar: montar };
})();
