window.Graficas = (function () {
  "use strict";

  var COLORES = {
    principal: "#847dff",
    secundario: "#00b3dd",
    terciario: "#dd90d8",
    suave: "#90b8f0",
    negativo: "#ff8f8f",
    texto: "#9f9fa0",
    rejilla: "rgba(255,255,255,0.08)"
  };

  if (window.Chart) {
    Chart.defaults.color = COLORES.texto;
    Chart.defaults.font.family = "Inter, ui-sans-serif, system-ui, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.borderColor = COLORES.rejilla;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 8;
    Chart.defaults.plugins.tooltip.backgroundColor = "#2e2e2e";
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.maintainAspectRatio = false;
  }

  function compacto(n) {
    return new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  }

  function crear(canvas, config) {
    if (!window.Chart) {
      canvas.parentNode.innerHTML = '<p class="nota">No se pudo cargar la librería de gráficas.</p>';
      return null;
    }
    return new Chart(canvas, config);
  }

  function ejeMonto(divisa, extra) {
    var eje = {
      grid: { color: COLORES.rejilla },
      ticks: { callback: function (v) { return "$" + compacto(v); } },
      title: divisa ? { display: true, text: divisa } : undefined
    };
    return Object.assign(eje, extra || {});
  }

  return { COLORES: COLORES, crear: crear, ejeMonto: ejeMonto, compacto: compacto };
})();
