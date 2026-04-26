const SCRIPT_URL = "https://script.google.com/a/macros/atiovar.com/s/AKfycby3O8T88fs20HIlzwXd0b6TY992Mt3C2JQJXbMc20kCSx53TC9NM0Np85vIbdtaAdVpmg/exec";
let fechaActual = "";

function initFecha() {
  const ahora = new Date();
  fechaActual = ahora.toLocaleString("es-PA", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
  document.getElementById("fechaBadge").textContent = fechaActual;
}

function htmlEquipo(n) {
  return `
  <div class="equipo-card" id="equipo-${n}">
    <div class="equipo-header">
      <div class="equipo-num">${n}</div>
      Equipo ${n}
    </div>
    <div class="equipo-body">
      <div class="serial-section" id="serialSection-${n}">
        <label>Serial del equipo</label>
        <input type="text" id="serial-${n}" placeholder="Ej: SN-1234567"/>
      </div>
      <label class="checkbox-wrap" onclick="toggleSerial(${n})">
        <input type="checkbox" id="sinSerial-${n}"/>
        <span>⚠️ Este equipo no tiene serial</span>
      </label>
      <hr class="sep"/>
      <div>
        <label>Placa Terpel</label>
        <input type="text" id="placa-${n}" placeholder="Ej: TPL-00123" required/>
      </div>
      <hr class="sep"/>
      <div class="foto-wrap" id="fotoSerialWrap-${n}">
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
      <div class="foto-wrap">
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

function toggleSerial(n) {
  const sinSerial = document.getElementById(`sinSerial-${n}`).checked;
  const section   = document.getElementById(`serialSection-${n}`);
  const fotoWrap  = document.getElementById(`fotoSerialWrap-${n}`);
  section.classList.toggle("disabled", sinSerial);
  if (fotoWrap) {
    fotoWrap.style.opacity       = sinSerial ? "0.4" : "1";
    fotoWrap.style.pointerEvents = sinSerial ? "none" : "auto";
  }
}

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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function mostrarToast(msg, tipo = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${tipo} show`;
  setTimeout(() => t.classList.remove("show"), 4000);
}

function setProgreso(pct) {
  const bar  = document.getElementById("progressBar");
  const fill = document.getElementById("progressFill");
  bar.classList.toggle("visible", pct > 0 && pct < 100);
  fill.style.width = pct + "%";
}

async function enviarFormulario() {
  const tecnico  = document.getElementById("tecnico").value.trim();
  const estacion = document.getElementById("estacion").value.trim();
  const ticket   = document.getElementById("ticket").value.trim();
  const cantidad = parseInt(document.getElementById("cantidadEquipos").value);

  if (!tecnico || !estacion || !ticket) {
    mostrarToast("⚠️ Completa los datos generales", "error");
    return;
  }

  const btn = document.getElementById("btnEnviar");
  btn.disabled = true;
  btn.innerHTML = "<span>⏳</span> Procesando fotos...";
  setProgreso(5);

  try {
    const equipos = [];
    for (let i = 1; i <= cantidad; i++) {
      const sinSerial = document.getElementById(`sinSerial-${i}`).checked;
      const serial    = sinSerial ? "" : document.getElementById(`serial-${i}`).value.trim();
      const placa     = document.getElementById(`placa-${i}`).value.trim();

      if (!placa) {
        mostrarToast(`⚠️ Equipo ${i}: falta la placa Terpel`, "error");
        btn.disabled = false;
        btn.innerHTML = "<span>📤</span> Enviar registro";
        setProgreso(0);
        return;
      }

      const inputsFile  = document.querySelectorAll(`#equipo-${i} input[type=file]`);
      const inputSerial = inputsFile[0];
      const inputPlaca  = inputsFile[1];

      let fotoSerialBase64 = "", fotoSerialTipo = "";
      let fotoPlacaBase64  = "", fotoPlacaTipo  = "";

      if (!sinSerial && inputSerial?.files[0]) {
        fotoSerialBase64 = await fileToBase64(inputSerial.files[0]);
        fotoSerialTipo   = inputSerial.files[0].type;
      }
      if (inputPlaca?.files[0]) {
        fotoPlacaBase64 = await fileToBase64(inputPlaca.files[0]);
        fotoPlacaTipo   = inputPlaca.files[0].type;
      }

      equipos.push({ sinSerial, serial, placa, fotoSerialBase64, fotoSerialTipo, fotoPlacaBase64, fotoPlacaTipo });
      setProgreso(5 + Math.round((i / cantidad) * 50));
    }

    btn.innerHTML = "<span>📡</span> Enviando a Google Sheets...";
    setProgreso(60);

    // Usamos un formulario oculto para evitar problemas de CORS con Apps Script
    const form = document.createElement("form");
    form.method = "GET";
    form.action = SCRIPT_URL;
    form.target = "hidden_iframe";

    const input = document.createElement("input");
    input.type  = "hidden";
    input.name  = "payload";
    input.value = JSON.stringify({ fecha: fechaActual, tecnico, estacion, ticket, equipos });
    form.appendChild(input);

    const iframe = document.createElement("iframe");
    iframe.name  = "hidden_iframe";
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    document.body.appendChild(form);
    form.submit();

    setTimeout(() => {
      document.body.removeChild(form);
      document.body.removeChild(iframe);
    }, 5000);

    setProgreso(100);
    mostrarToast("✅ Registro enviado con éxito", "success");

    setTimeout(() => {
      document.getElementById("tecnico").value         = "";
      document.getElementById("estacion").value        = "";
      document.getElementById("ticket").value          = "";
      document.getElementById("cantidadEquipos").value = 1;
      generarEquipos(1);
      setProgreso(0);
      btn.disabled = false;
      btn.innerHTML = "<span>📤</span> Enviar registro";
    }, 2000);

  } catch (err) {
    mostrarToast("❌ Error al enviar. Verifica tu conexión.", "error");
    btn.disabled = false;
    btn.innerHTML = "<span>📤</span> Enviar registro";
    setProgreso(0);
    console.error(err);
  }
}

initFecha();
generarEquipos(1);

document.getElementById("cantidadEquipos").addEventListener("change", function () {
  const val = Math.min(30, Math.max(1, parseInt(this.value) || 1));
  this.value = val;
  generarEquipos(val);
});
