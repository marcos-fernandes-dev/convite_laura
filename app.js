const CONFIG = {
  // Deploy > Web app > Execute as: Me, Who has access: Anyone
  // Example: https://script.google.com/macros/s/AKfycb.../exec
  apiUrl: "https://script.google.com/macros/s/AKfycbwUo32MUCTm-2n0iNTcUSZ9Uz1maumW83dZx38yUmh7xFKI1EsLiOjdbJK_g037pTgsaA/exec",
  apiTransport: "jsonp", // "jsonp" (recommended for GitHub Pages) or "post"
  heroImageUrl: "https://lh3.googleusercontent.com/pw/AP1GczN9wtACqhMA4FUcWWQahz0MbDEZnZJRrOevmn1XX929KJXOY9Dm5Y-vwE5ipAWX-5YPit0MFxLaSPqySb8E0Ek0Xy6pM3ESQccWiYun_quDDzm7FEi2dTZdYaZ1uyBpYBwZBuT3H2ZNZPaGuLj_WlL_fw=w1200"
};

const el = {
  heroImage: document.getElementById("heroImage"),
  form: document.getElementById("rsvpForm"),
  statusBox: document.getElementById("statusBox"),
  successView: document.getElementById("successView"),
  successTitle: document.getElementById("successTitle"),
  successMessage: document.getElementById("successMessage"),
  guestName: document.getElementById("guestName"),
  phone: document.getElementById("phone"),
  willAttend: document.getElementById("willAttend"),
  companionsQuestion: document.getElementById("companionsQuestion"),
  hasCompanions: document.getElementById("hasCompanions"),
  companionsSection: document.getElementById("companionsSection"),
  attendees: document.getElementById("attendees"),
  btnAdd: document.getElementById("btnAdd"),
  btnSubmit: document.getElementById("btnSubmit")
};

function getApiUrl() {
  const fromQuery = new URLSearchParams(window.location.search).get("api");
  return (fromQuery || CONFIG.apiUrl || "").trim();
}

function maskPhone(v) {
  const d = String(v || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function setStatus(message, type = "info") {
  if (!message) {
    el.statusBox.className = "status hidden";
    el.statusBox.textContent = "";
    return;
  }
  el.statusBox.className = `status ${type}`;
  el.statusBox.textContent = message;
}

function setSubmitting(isSubmitting) {
  const controls = el.form.querySelectorAll("input, select, button");
  controls.forEach((c) => {
    c.disabled = isSubmitting;
  });
  el.btnSubmit.textContent = isSubmitting ? "Enviando..." : "Enviar confirmacao";
}

function resetCompanions() {
  el.attendees.innerHTML = "";
}

function syncVisibility() {
  const willAttend = el.willAttend.value;
  const hasCompanions = el.hasCompanions.value;

  const showCompanionQuestion = willAttend === "Sim";
  el.companionsQuestion.classList.toggle("hidden", !showCompanionQuestion);

  if (!showCompanionQuestion) {
    el.hasCompanions.value = "";
    el.companionsSection.classList.add("hidden");
    resetCompanions();
    return;
  }

  const showCompanions = hasCompanions === "Sim";
  el.companionsSection.classList.toggle("hidden", !showCompanions);

  if (showCompanions && el.attendees.children.length === 0) {
    addAttendee();
  }

  if (!showCompanions) {
    resetCompanions();
  }
}

function addAttendee() {
  const item = document.createElement("div");
  item.className = "attendee";
  item.innerHTML = `
    <label class="label">Nome</label>
    <input type="text" class="field attendee-name" placeholder="Nome do acompanhante">
    <label class="label">Tipo</label>
    <select class="field attendee-type">
      <option value="Adulto">Adulto</option>
      <option value="Crianca">Criança</option>
    </select>
    <div class="attendee-actions">
      <button type="button" class="btn btn-danger attendee-remove">Remover</button>
    </div>
  `;

  const removeBtn = item.querySelector(".attendee-remove");
  removeBtn.addEventListener("click", () => item.remove());

  const nameInput = item.querySelector(".attendee-name");
  nameInput.addEventListener("input", () => nameInput.classList.remove("error"));

  el.attendees.appendChild(item);
  item.scrollIntoView({ block: "center", behavior: "smooth" });
  setTimeout(() => {
    nameInput.focus({ preventScroll: false });
  }, 140);
}

function clearErrors() {
  el.form.querySelectorAll(".error").forEach((x) => x.classList.remove("error"));
}

function buildPayload() {
  const guestName = el.guestName.value.trim();
  const phone = el.phone.value.trim();
  const willAttend = el.willAttend.value.trim();
  const hasCompanions = el.hasCompanions.value.trim();

  const payload = {
    guestName,
    phone,
    willAttend,
    hasCompanions: willAttend === "Sim" ? hasCompanions : "",
    attendees: []
  };

  if (willAttend === "Sim" && hasCompanions === "Sim") {
    const attendeeRows = [...el.attendees.querySelectorAll(".attendee")];
    attendeeRows.forEach((row) => {
      const nameField = row.querySelector(".attendee-name");
      const typeField = row.querySelector(".attendee-type");
      const name = nameField.value.trim();
      const type = typeField.value.trim();
      if (!name) {
        nameField.classList.add("error");
      } else {
        payload.attendees.push({ name, type });
      }
    });
  }

  return payload;
}

function validatePayload(payload) {
  if (!payload.guestName) {
    el.guestName.classList.add("error");
    return "Preencha seu nome.";
  }
  if (!payload.phone) {
    el.phone.classList.add("error");
    return "Preencha seu WhatsApp.";
  }
  if (!payload.willAttend) {
    el.willAttend.classList.add("error");
    return "Informe se ira comparecer.";
  }
  if (payload.willAttend === "Sim" && !payload.hasCompanions) {
    el.hasCompanions.classList.add("error");
    return "Informe se havera acompanhantes.";
  }
  if (payload.willAttend === "Sim" && payload.hasCompanions === "Sim") {
    const totalRows = el.attendees.querySelectorAll(".attendee").length;
    if (totalRows === 0) return "Adicione ao menos um acompanhante ou selecione Não.";
    if (payload.attendees.length !== totalRows) return "Preencha o nome de todos os acompanhantes.";
  }
  return "";
}

function showSuccess(willAttend) {
  if (willAttend === "Sim") {
    el.successTitle.textContent = "Confirmado!";
    el.successMessage.textContent = "Sua presença foi confirmada. Te esperamos! 💕";
  } else {
    el.successTitle.textContent = "Obrigado por avisar";
    el.successMessage.textContent = "Registramos que você não poderá comparecer.";
  }

  el.form.classList.add("hidden");
  setStatus("");
  el.successView.classList.remove("hidden");
}

async function submitWithPost(apiUrl, payload) {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "submit", payload })
  });

  const rawText = await response.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (err) {
    throw new Error("Resposta invalida da API.");
  }

  if (!data.ok) throw new Error(data.message || "Falha ao enviar.");
  return data;
}

function submitWithJsonp(apiUrl, payload) {
  return new Promise((resolve, reject) => {
    const callbackName = `rsvpCb_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const script = document.createElement("script");
    let timeoutId;

    const cleanup = () => {
      clearTimeout(timeoutId);
      delete window[callbackName];
      script.remove();
    };

    window[callbackName] = (data) => {
      cleanup();
      if (!data || !data.ok) {
        reject(new Error((data && data.message) || "Falha ao enviar."));
        return;
      }
      resolve(data);
    };

    const url = new URL(apiUrl);
    url.searchParams.set("action", "submit");
    url.searchParams.set("callback", callbackName);
    url.searchParams.set("payload", JSON.stringify(payload));

    if (url.toString().length > 1900) {
      cleanup();
      reject(new Error("Muitos dados para envio via JSONP. Use transporte POST."));
      return;
    }

    script.src = url.toString();
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error("Nao foi possivel conectar com a API."));
    };

    timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Tempo de resposta da API esgotado."));
    }, 15000);

    document.body.appendChild(script);
  });
}

async function submitPayload(payload) {
  const apiUrl = getApiUrl();
  if (!apiUrl || apiUrl.includes("COLE_AQUI")) {
    throw new Error("Configure CONFIG.apiUrl em app.js com a URL /exec do Apps Script.");
  }

  if (CONFIG.apiTransport === "post") {
    return submitWithPost(apiUrl, payload);
  }
  return submitWithJsonp(apiUrl, payload);
}

async function onSubmit(evt) {
  evt.preventDefault();
  clearErrors();
  setStatus("");

  const payload = buildPayload();
  const validationError = validatePayload(payload);
  if (validationError) {
    setStatus(validationError, "error");
    return;
  }

  try {
    setSubmitting(true);
    await submitPayload(payload);
    showSuccess(payload.willAttend);
  } catch (err) {
    setStatus(err.message || "Erro ao enviar confirmacao.", "error");
  } finally {
    setSubmitting(false);
  }
}

function bootstrap() {
  el.heroImage.src = CONFIG.heroImageUrl;
  el.phone.addEventListener("input", (evt) => {
    evt.target.value = maskPhone(evt.target.value);
  });
  el.willAttend.addEventListener("change", syncVisibility);
  el.hasCompanions.addEventListener("change", syncVisibility);
  el.btnAdd.addEventListener("click", addAttendee);
  el.form.addEventListener("submit", onSubmit);
  syncVisibility();

  if (!getApiUrl() || getApiUrl().includes("COLE_AQUI")) {
    setStatus("Defina a URL do Apps Script em app.js (CONFIG.apiUrl).", "info");
  }
}

bootstrap();
