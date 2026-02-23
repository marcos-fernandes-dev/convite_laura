function doGet(e) {
  return handleApiRequest_(e, true);
}

function doPost(e) {
  return handleApiRequest_(e, false);
}

function handleApiRequest_(e, isGet) {
  var params = (e && e.parameter) ? e.parameter : {};
  var action = String(params.action || "").toLowerCase().trim();
  var callback = String(params.callback || "").trim();

  try {
    if (action === "submit") {
      var payload = parsePayload_(e, isGet);
      var result = submitRsvp(payload);
      return buildApiResponse_({ ok: true, data: result }, callback);
    }

    if (action === "ping") {
      return buildApiResponse_({
        ok: true,
        data: {
          service: "rsvp-api",
          version: "1.0.0",
          timestamp: new Date().toISOString()
        }
      }, callback);
    }

    return buildApiResponse_({
      ok: false,
      message: "Use action=submit or action=ping."
    }, callback);
  } catch (err) {
    return buildApiResponse_({
      ok: false,
      message: (err && err.message) ? err.message : String(err)
    }, callback);
  }
}

function parsePayload_(e, isGet) {
  var params = (e && e.parameter) ? e.parameter : {};
  var payloadRaw = String(params.payload || "");

  if (isGet) {
    if (!payloadRaw) throw new Error("Payload is required.");
    return JSON.parse(payloadRaw);
  }

  var rawBody = (e && e.postData && e.postData.contents) ? String(e.postData.contents) : "";
  if (!rawBody && payloadRaw) return JSON.parse(payloadRaw);
  if (!rawBody) throw new Error("Request body is required.");

  var parsedBody = JSON.parse(rawBody);
  if (parsedBody && parsedBody.payload) return parsedBody.payload;
  return parsedBody;
}

function buildApiResponse_(data, callback) {
  var safeCallback = isValidCallbackName_(callback) ? callback : "";
  if (safeCallback) {
    var jsBody = safeCallback + "(" + JSON.stringify(data) + ");";
    return ContentService
      .createTextOutput(jsBody)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function isValidCallbackName_(name) {
  if (!name) return false;
  return /^[A-Za-z_$][0-9A-Za-z_$]{0,60}$/.test(name);
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function stripDiacritics_(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeChoice_(value) {
  var v = stripDiacritics_(String(value || "").toLowerCase().trim());
  if (v === "sim") return "Sim";
  if (v === "nao") return "Nao";
  return "";
}

function normalizeAttendeeType_(value) {
  var v = stripDiacritics_(String(value || "").toLowerCase().trim());
  if (v === "adulto") return "Adulto";
  if (v === "crianca") return "Crianca";
  return "";
}

function phoneAlreadySubmitted(sheet, phoneNormalized) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  // Column C = phone
  var values = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
  return values.some(function (row) {
    return normalizePhone(row[0]) === phoneNormalized;
  });
}

function submitRsvp(payload) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  var timestamp = new Date();
  var guestName = String(payload.guestName || "").trim();
  var phone = String(payload.phone || "").trim();
  var willAttend = normalizeChoice_(payload.willAttend);
  var hasCompanions = normalizeChoice_(payload.hasCompanions);

  if (!guestName) throw new Error("Nome e obrigatorio.");
  if (!phone) throw new Error("WhatsApp e obrigatorio.");
  if (!willAttend) throw new Error("Informe se ira comparecer.");

  var phoneNorm = normalizePhone(phone);
  if (phoneAlreadySubmitted(sheet, phoneNorm)) {
    throw new Error("Este WhatsApp ja enviou uma resposta.");
  }

  var attendees = Array.isArray(payload.attendees) ? payload.attendees : [];

  sheet.appendRow([
    timestamp,
    guestName,
    phone,
    willAttend,
    willAttend === "Sim" ? (hasCompanions || "Nao") : "",
    "",
    ""
  ]);

  if (willAttend !== "Sim") {
    return { status: "success", rowsAdded: 1 };
  }

  if (hasCompanions === "Sim") {
    var rowsAdded = 1;

    attendees.forEach(function (att) {
      var attendeeName = String(att.name || "").trim();
      var attendeeType = normalizeAttendeeType_(att.type);
      if (attendeeName && attendeeType) {
        sheet.appendRow([
          timestamp,
          guestName,
          phone,
          willAttend,
          hasCompanions,
          attendeeName,
          attendeeType
        ]);
        rowsAdded += 1;
      }
    });

    return { status: "success", rowsAdded: rowsAdded };
  }

  return { status: "success", rowsAdded: 1 };
}
