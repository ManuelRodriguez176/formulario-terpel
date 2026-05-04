// ── CONFIG ───────────────────────────────────────────────
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3O8T88fs20HIlzwXd0b6TY992Mt3C2JQJXbMc20kCSx53TC9NM0Np85vIbdtaAdVpmg/exec";
let fechaActual = "";

// ── FECHA ────────────────────────────────────────────────
function initFecha() {
  const ahora = new Date();
  fechaActual = ahora.toLocaleString("es-PA", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
  document.getElementById("fechaBadge").textContent = fechaActual;
}

// ── HTML DE CADA EQUIPO ──────────────────────────────────
function htmlEquipo(n) {
  return `
  <div class="equipo-card" id="equipo-${n}">
    <div class="equipo-header">
      <div class="equipo-num">${n}</div>
      Equipo ${n}
    </div>
    <div class="equipo-body">

      <!-- SERIAL -->
      <div>
        <label>Serial del equipo</label>
        <div class="scan-row">
          <div>
            <input type="text" id="serial-${n}" placeholder="Ej: SN-1234567"/>
          </div>
          <button class="btn-scan" id="btnScanSerial-${n}" title="Escanear serial con cámara (OCR)" type="button">
            🔍
            <input type="file" accept="image/*" capture="environment"
                   onchange="escanearOCR(this, 'serial-${n}', 'ocrStatusSerial-${n}', ${n}, 'serial')"/>
          </button>
        </div>
        <div class="ocr-status" id="ocrStatusSerial-${n}"></div>
      </div>

      <hr class="sep"/>

      <!-- PLACA -->
      <div id="placaSection-${n}">
        <label>Placa Terpel</label>
        <div class="scan-row">
          <div>
            <input type="text" id="placa-${n}" placeholder="Ej: TPL-00123"/>
          </div>
          <button class="btn-scan" id="btnScanPlaca-${n}" title="Escanear placa con cámara (OCR)" type="button">
            🔍
            <input type="file" accept="image/*" capture="environment"
                   onchange="escanearOCR(this, 'placa-${n}', 'ocrStatusPlaca-${n}', ${n}, 'placa')"/>
          </button>
        </div>
        <div class="ocr-status" id="ocrStatusPlaca-${n}"></div>
      </div>

      <label class="checkbox-wrap" onclick="togglePlaca(${n})">
        <input type="checkbox" id="sinPlaca-${n}"/>
        <span>⚠️ Este equipo no tiene placa</span>
      </label>

      <hr class="sep"/>

      <!-- FOTO SERIAL -->
      <div class="foto-wrap">
        <span class="foto-label-text">📷 Foto del serial</span>
        <div class="foto-drop">
          <input type="file" accept="image/*" capture="environment"
                 onchange="previsualizarFoto(this, 'prevSerial-${n}', 'nameSerial-${n}')"/>
          <div class="foto-icon">🖼️</div>
          <div class="foto-text">Toca para tomar foto o seleccionar</div>
        </div>
        <img class="foto-preview" id="prevSerial-${n}" alt="Preview serial"/>
        <span class="foto-name" id="nameSerial-${n}"></span>
      </div>

      <!-- FOTO PLACA -->
      <div class="foto-wrap" id="fotoPlacaWrap-${n}">
        <span class="foto-label-text">📷 Foto de la placa Terpel</span>
        <div class="foto-drop">
          <input type="file" accept="image/*" capture="environment"
                 onchange="previsualizarFoto(this, 'prevPlaca-${n}', 'namePlaca-${n}')"/>
          <div class="foto-icon">🖼️</div>
          <div class="foto-text">Toca para tomar foto o seleccionar</div>
        </div>
        <img class="foto-preview" id="prevPlaca-${n}" alt="Preview placa"/>
        <span class="foto-name" id="namePlaca-${n}"></span>
      </div>

    </div>
  </div>`;
}

function generarEquipos(cantidad) {
  const container = document.getElementById("equipos-container");
  container.innerHTML = "";
  for (let i = 1; i <= cantidad; i++) {
    container.insertAdjacentHTML("beforeend", htmlEquipo(i));
  }
}

// ── OCR CON TESSERACT ────────────────────────────────────
async function escanearOCR(input, campoId, statusId, n, tipo) {
  const file = input.files[0];
  if (!file) return;

  const statusEl = document.getElementById(statusId);
  const btnId    = tipo === "serial" ? `btnScanSerial-${n}` : `btnScanPlaca-${n}`;
  const btnEl    = document.getElementById(btnId);

  statusEl.textContent = "⏳ Analizando imagen...";
  statusEl.classList.add("visible");
  btnEl.classList.add("scanning");

  try {
    const { data: { text } } = await Tesseract.recognize(file, "eng", {
      logger: m => {
        if (m.status === "recognizing text") {
          statusEl.textContent = `⏳ Procesando... ${Math.round(m.progress * 100)}%`;
        }
      }
    });

    let resultado = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

    if (tipo === "placa") {
      const match = resultado.match(/[T7][P][L\-]\s*[\-]?\s*\d{3,6}/i);
      if (match) resultado = match[0].replace(/\s/g, "").toUpperCase();
    }

    if (tipo === "serial") {
      const match = resultado.match(/[A-Z0-9]{4,}[\-]?[A-Z0-9]*/i);
      if (match) resultado = match[0].toUpperCase();
    }

    if (resultado && resultado.length > 1) {
      document.getElementById(campoId).value = resultado;
      statusEl.textContent = `✅ Detectado: ${resultado}`;
      statusEl.style.color = "var(--verde)";
    } else {
      statusEl.textContent = "⚠️ No se pudo detectar texto. Ingresa manualmente.";
      statusEl.style.color = "var(--amarillo)";
    }

  } catch (err) {
    statusEl.textContent = "❌ Error al procesar imagen.";
    statusEl.style.color = "#ff6b6b";
    console.error(err);
  } finally {
    btnEl.classList.remove("scanning");
    input.value = "";
    setTimeout(() => {
      statusEl.style.color = "";
      statusEl.classList.remove("visible");
    }, 6000);
  }
}

// ── TOGGLE PLACA ─────────────────────────────────────────
function togglePlaca(n) {
  const sinPlaca   = document.getElementById(`sinPlaca-${n}`).checked;
  const inputPlaca = document.getElementById(`placa-${n}`);
  const fotoWrap   = document.getElementById(`fotoPlacaWrap-${n}`);
  const btnScan    = document.getElementById(`btnScanPlaca-${n}`);

  inputPlaca.disabled     = sinPlaca;
  inputPlaca.placeholder  = sinPlaca ? "Sin placa" : "Ej: TPL-00123";
  if (sinPlaca) inputPlaca.value = "";

  if (btnScan) {
    btnScan.style.opacity       = sinPlaca ? "0.3" : "1";
    btnScan.style.pointerEvents = sinPlaca ? "none" : "auto";
  }

  if (fotoWrap) {
    fotoWrap.style.opacity       = sinPlaca ? "0.4" : "1";
    fotoWrap.style.pointerEvents = sinPlaca ? "none" : "auto";
    if (sinPlaca) {
      const fileInput = fotoWrap.querySelector("input[type=file]");
      const preview   = document.getElementById(`prevPlaca-${n}`);
      const name      = document.getElementById(`namePlaca-${n}`);
      if (fileInput) fileInput.value = "";
      if (preview)   { preview.src = ""; preview.classList.remove("visible"); }
      if (name)      { name.textContent = ""; name.classList.remove("visible"); }
    }
  }
}

// ── PREVIEW FOTO ─────────────────────────────────────────
function previsualizarFoto(input, previewId, nameId) {
  const file = input.files[0];
  if (!file) return;
  const preview = document.getElementById(previewId);
  const name    = document.getElementById(nameId);
  const reader  = new FileReader();
  reader.onload = (e) => {
    preview.src = e.target.result;
    preview.classList.add("visible");
    name.textContent = file.name;
    name.classList.add("visible");
  };
  reader.readAsDataURL(file);
}

// ── TOAST ────────────────────────────────────────────────
function mostrarToast(msg, tipo = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${tipo} show`;
  setTimeout(() => t.classList.remove("show"), 4000);
}

// ── PROGRESO ─────────────────────────────────────────────
function setProgreso(pct) {
  const bar  = document.getElementById("progressBar");
  const fill = document.getElementById("progressFill");
  bar.classList.toggle("visible", pct > 0 && pct < 100);
  fill.style.width = pct + "%";
}

// ── REDIMENSIONAR IMAGEN ─────────────────────────────────
function redimensionarImagen(file, maxWidth = 800) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width  = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width  = maxWidth;
        }
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
        resolve({ base64, tipo: "image/jpeg" });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── ENVIAR POST ──────────────────────────────────────────
async function enviarPOST(payload) {
  await fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload)
  });
}

// ── ENVIAR FORMULARIO (un POST por equipo) ───────────────
async function enviarFormulario() {
  const tecnico  = document.getElementById("tecnico").value.trim();
  const estacion = document.getElementById("estacion").value.trim();
  const ticket   = document.getElementById("ticket").value.trim();
  const cantidad = parseInt(document.getElementById("cantidadEquipos").value);

  if (!tecnico || !estacion || !ticket) {
    mostrarToast("⚠️ Completa los datos generales", "error");
    return;
  }

  const btn      = document.getElementById("btnEnviar");
  const resultEl = document.getElementById("envioResult");
  btn.disabled   = true;
  resultEl.innerHTML = "";
  resultEl.classList.remove("visible");
  setProgreso(2);

  let exitos = 0;
  const fallos = [];
  const log    = [];

  for (let i = 1; i <= cantidad; i++) {
    btn.innerHTML = `<span>📡</span> Enviando equipo ${i} de ${cantidad}...`;
    setProgreso(Math.round(5 + (i / cantidad) * 88));

    try {
      const sinPlaca = document.getElementById(`sinPlaca-${i}`).checked;
      const serial   = document.getElementById(`serial-${i}`).value.trim();
      const placa    = sinPlaca ? "SIN PLACA" : document.getElementById(`placa-${i}`).value.trim();

      if (!sinPlaca && !placa) {
        log.push(`<span class="envio-err">✗ Equipo ${i}: falta placa Terpel (omitido)</span>`);
        fallos.push(i);
        continue;
      }

      const inputsFile  = document.querySelectorAll(`#equipo-${i} .foto-wrap input[type=file]`);
      const inputSerial = inputsFile[0];
      const inputPlaca  = inputsFile[1];

      let fotoSerialBase64 = "", fotoSerialTipo = "";
      let fotoPlacaBase64  = "", fotoPlacaTipo  = "";

      if (inputSerial?.files[0]) {
        const r = await redimensionarImagen(inputSerial.files[0]);
        fotoSerialBase64 = r.base64;
        fotoSerialTipo   = r.tipo;
      }
      if (!sinPlaca && inputPlaca?.files[0]) {
        const r = await redimensionarImagen(inputPlaca.files[0]);
        fotoPlacaBase64 = r.base64;
        fotoPlacaTipo   = r.tipo;
      }

      const payload = {
        fecha:           fechaActual,
        tecnico,
        estacion,
        ticket,
        equipoNumero:    i,
        totalEquipos:    cantidad,
        sinPlaca,
        serial,
        placa,
        fotoSerialBase64,
        fotoSerialTipo,
        fotoPlacaBase64: sinPlaca ? "" : fotoPlacaBase64,
        fotoPlacaTipo:   sinPlaca ? "" : fotoPlacaTipo
      };

      await enviarPOST(payload);

      exitos++;
      log.push(`<span class="envio-ok">✓ Equipo ${i} — ${serial || "sin serial"} / ${placa}</span>`);

    } catch (err) {
      console.error(`Error equipo ${i}:`, err);
      fallos.push(i);
      log.push(`<span class="envio-err">✗ Equipo ${i}: error de red</span>`);
    }
  }

  setProgreso(100);
  resultEl.innerHTML = log.join("<br>");
  resultEl.classList.add("visible");

  if (fallos.length === 0) {
    mostrarToast(`✅ ${exitos} equipo(s) enviado(s) correctamente`, "success");
  } else if (exitos > 0) {
    mostrarToast(`⚠️ ${exitos} OK · ${fallos.length} con error`, "info");
  } else {
    mostrarToast("❌ No se pudo enviar ningún equipo", "error");
  }

  setTimeout(() => {
    document.getElementById("tecnico").value         = "";
    document.getElementById("estacion").value        = "";
    document.getElementById("ticket").value          = "";
    document.getElementById("cantidadEquipos").value = 1;
    generarEquipos(1);
    setProgreso(0);
    btn.disabled  = false;
    btn.innerHTML = "<span>📤</span> Enviar registro";
  }, 5000);
}

// ── INIT ─────────────────────────────────────────────────
initFecha();
generarEquipos(1);

document.getElementById("cantidadEquipos").addEventListener("change", function () {
  const val = Math.min(30, Math.max(1, parseInt(this.value) || 1));
  this.value = val;
  generarEquipos(val);
});