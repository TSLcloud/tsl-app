// ════════════════════════════════════════════════════════════════════════════
// TSL — Google Apps Script Backend
// Version: 1.0
// Deploy as: Web App | Execute as: Me | Access: Anyone
// ════════════════════════════════════════════════════════════════════════════

var SS_ID = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");

function getSheet(name) {
  return SpreadsheetApp.openById(SS_ID).getSheetByName(name);
}

// ── Entry point ───────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action  = payload.action;
    var result;

    switch (action) {
      case "writeProdEntry":    result = writeProdEntry(payload);    break;
      case "getProdEntries":    result = getProdEntries(payload);    break;
      case "getInventory":      result = getInventory(payload);      break;
      case "generateHairID":    result = generateHairID(payload);    break;
      case "validateMismatch":  result = validateMismatch(payload);  break;
      case "getKPIs":           result = getKPIs(payload);           break;
      case "getAnalytics":      result = getAnalytics(payload);      break;
      case "traceHairID":       result = traceHairID(payload);       break;
      case "adminAuth":         result = adminAuth(payload);         break;
      case "getConfig":         result = getConfig(payload);         break;
      case "saveConfig":        result = saveConfig(payload);        break;
      case "getAuditTrail":     result = getAuditTrail(payload);     break;
      case "getAllConfig":       result = getAllConfig(payload);      break;
      case "lookupHairID":      result = lookupHairID(payload);      break;
      case "completeSetup":     result = completeSetup(payload);     break;
      default:
        result = { success: false, error: "Unknown action: " + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "TSL API running" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ════════════════════════════════════════════════════════════════════════════
// WRITE PROD ENTRY
// ════════════════════════════════════════════════════════════════════════════
function writeProdEntry(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet(payload.sheet);
    if (!sheet) throw new Error("Sheet not found: " + payload.sheet);

    var row = payload.row;
    var headers = getHeaders(sheet);
    var newRow = headersToRow(headers, row);

    sheet.appendRow(newRow);
    var rowNum = sheet.getLastRow();

    // Update inventory sheet
    updateInventory(payload.sheet, row);

    // Mismatch validation for Lab and Ventilation
    if (payload.sheet === "Lab_Prod" || payload.sheet === "Ventilation_Prod") {
      validateMismatch({ sheet: payload.sheet, entry: row });
    }

    // Check Stylist balance
    if (payload.sheet === "Stylist_Prod") {
      checkStylistBalance();
    }

    writeAuditEntry("SYSTEM", "Prod Entry", payload.sheet, "", JSON.stringify(newRow), rowNum);

    return { success: true, rowNum: rowNum };
  } finally {
    lock.releaseLock();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READ PROD ENTRIES
// ════════════════════════════════════════════════════════════════════════════
function getProdEntries(payload) {
  var sheet = getSheet(payload.sheet);
  if (!sheet) return { success: false, error: "Sheet not found" };

  var data    = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };

  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rows    = [];
  var filters = payload.filters || {};

  for (var i = 1; i < data.length; i++) {
    var obj = {};
    headers.forEach(function(h, j) { obj[camelCase(h)] = data[i][j]; });
    obj._rowId  = i + 1;
    obj._rowNum = i + 1;

    // Apply filters
    if (filters.inOut   && obj.inOut   !== filters.inOut)   continue;
    if (filters.status  && obj.status  !== filters.status)  continue;
    if (filters.hairId  && obj.hairId  !== filters.hairId)  continue;
    if (filters.month   && obj.month   !== filters.month)   continue;
    if (filters.limit) { /* applied below */ }

    rows.push(obj);
  }

  // Sort desc if requested
  if (filters.sort === "desc") rows.reverse();
  if (filters.limit) rows = rows.slice(0, Number(filters.limit));

  return { success: true, data: rows };
}

// ════════════════════════════════════════════════════════════════════════════
// GET INVENTORY
// ════════════════════════════════════════════════════════════════════════════
function getInventory(payload) {
  var sheet = getSheet(payload.sheet);
  if (!sheet) return { success: false, error: "Sheet not found" };

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };

  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    headers.forEach(function(h, j) { obj[camelCase(h)] = data[i][j]; });
    rows.push(obj);
  }
  return { success: true, data: rows };
}

// ════════════════════════════════════════════════════════════════════════════
// GENERATE HAIR ID
// ════════════════════════════════════════════════════════════════════════════
function generateHairID(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var productCode = payload.productCode;
    var registry    = getSheet("HairID_Registry");
    if (!registry) throw new Error("HairID_Registry sheet not found");

    // Get initials for this product from config
    var mappings = getConfigValue("HAIRID_MAPPINGS");
    var initials = productCode; // fallback: use product code directly
    if (mappings && Array.isArray(mappings)) {
      var match = mappings.filter(function(m) {
        return m.product && m.product.toLowerCase() === productCode.toLowerCase();
      })[0];
      if (match) initials = match.initials;
    }

    // Generate unique Hair ID
    var hairId, attempts = 0, maxAttempts = 20;
    do {
      var suffix = String(Math.floor(1000 + Math.random() * 9000));
      hairId = initials + "-" + suffix;
      attempts++;
      if (attempts > maxAttempts) throw new Error("Could not generate unique Hair ID after " + maxAttempts + " attempts");
    } while (hairIdExists(registry, hairId));

    // Write to registry
    registry.appendRow([
      hairId,
      new Date().toISOString(),
      productCode,
      payload.staffName || "",
      "Submitted",
      ""
    ]);

    return { success: true, hairId: hairId };
  } finally {
    lock.releaseLock();
  }
}

function hairIdExists(registry, hairId) {
  var data = registry.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === hairId) return true;
  }
  return false;
}

// ════════════════════════════════════════════════════════════════════════════
// LOOKUP HAIR ID
// ════════════════════════════════════════════════════════════════════════════
function lookupHairID(payload) {
  var hairId   = payload.hairId;
  var registry = getSheet("HairID_Registry");
  if (!registry) return { success: false, error: "Registry not found" };

  var data = registry.getDataRange().getValues();
  var headers = data[0];

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === hairId) {
      var record = {
        hairId:       data[i][0],
        generatedAt:  data[i][1],
        product:      data[i][2],
        staff:        data[i][3],
        currentStatus:data[i][4],
        prodRowRef:   data[i][5],
      };

      // Check if outToStylist
      record.outToStylist   = checkOutToStylist(hairId);
      record.stylistQAPassed = checkStylistQAPassed(hairId);
      record.lastDept       = getLastDept(hairId);

      return { success: true, found: true, record: record };
    }
  }
  return { success: true, found: false };
}

function checkOutToStylist(hairId) {
  var sheet = getSheet("Stylist_Prod");
  if (!sheet) return false;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === hairId) return true;
  }
  return false;
}

function checkStylistQAPassed(hairId) {
  var sheet = getSheet("Stylist_Prod");
  if (!sheet) return false;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === hairId) {
      // inOut column (index 5) or status
      var inOut = String(data[i][5]).trim();
      if (inOut === "QA Pass" || inOut === "Out") return true;
    }
  }
  return false;
}

function getLastDept(hairId) {
  var depts = [
    { name: "Final Prod", sheet: "Final_Prod",     hairIdCol: 0 },
    { name: "Stylist",    sheet: "Stylist_Prod",   hairIdCol: 0 },
    { name: "Tailor/MS",  sheet: "TailorMS_Prod",  hairIdCol: 6 },
  ];
  for (var d = 0; d < depts.length; d++) {
    var sheet = getSheet(depts[d].sheet);
    if (!sheet) continue;
    var data = sheet.getDataRange().getValues();
    for (var i = data.length - 1; i >= 1; i--) {
      if (String(data[i][depts[d].hairIdCol]).trim() === hairId) return depts[d].name;
    }
  }
  return "";
}

// ════════════════════════════════════════════════════════════════════════════
// VALIDATE MISMATCH
// ════════════════════════════════════════════════════════════════════════════
function validateMismatch(payload) {
  var sheet  = payload.sheet;
  var entry  = payload.entry;
  var mismatch = false;
  var message  = "";

  if (sheet === "Lab_Prod") {
    // Check Lab IN matches a ReXI OUT
    var rexiSheet = getSheet("ReXI_Prod");
    if (rexiSheet) {
      var rexiData = rexiSheet.getDataRange().getValues();
      var matchFound = false;
      for (var i = 1; i < rexiData.length; i++) {
        // inOut column
        if (String(rexiData[i][4]).trim() === "Out" &&
            String(rexiData[i][2]).trim() === (entry.sku || entry.processedItem)) {
          matchFound = true; break;
        }
      }
      if (!matchFound) {
        mismatch = true;
        message  = "Lab IN has no matching ReXI OUT for: " + (entry.sku || entry.processedItem);
      }
    }
  }

  if (sheet === "Ventilation_Prod" && entry.status === "In") {
    var labSheet = getSheet("Lab_Prod");
    if (labSheet) {
      var labData  = labSheet.getDataRange().getValues();
      var labTotal = 0;
      for (var j = 1; j < labData.length; j++) {
        if (String(labData[j][5]).trim() === "Ventilation") {
          labTotal += Number(labData[j][3]) || 0;
        }
      }
      var ventSheet = getSheet("Ventilation_Prod");
      var ventData  = ventSheet.getDataRange().getValues();
      var ventTotal = 0;
      for (var k = 1; k < ventData.length; k++) {
        if (String(ventData[k][3]).trim() === "In") {
          ventTotal += Number(ventData[k][2]) || 0;
        }
      }
      if (ventTotal + (Number(entry.count) || 0) > labTotal) {
        mismatch = true;
        message  = "Ventilation IN quantity exceeds Lab OUT to Ventilation.";
      }
    }
  }

  if (mismatch) {
    queueAlertEmail("MISMATCH", message);
    return { success: true, mismatch: true, message: message };
  }
  return { success: true, mismatch: false };
}

// ════════════════════════════════════════════════════════════════════════════
// INVENTORY UPDATE (called after every prod write)
// ════════════════════════════════════════════════════════════════════════════
function updateInventory(prodSheet, entry) {
  var invSheetName = {
    "ReXI_Prod":         "ReXI_Inventory",
    "Lab_Prod":          "Lab_Inventory",
    "Ventilation_Prod":  "Ventilation_Inventory",
    "TailorMS_Prod":     "MachineSewer_Inventory",
    "Stylist_Prod":      "Stylist_Inventory",
    "Final_Prod":        "Final_Inventory",
  }[prodSheet];

  if (!invSheetName) return;
  rebuildInventory(prodSheet, invSheetName, entry);
}

function rebuildInventory(prodSheet, invSheet, latestEntry) {
  // Full recalculation from prod data for accuracy
  var prod = getSheet(prodSheet);
  var inv  = getSheet(invSheet);
  if (!prod || !inv) return;

  var data    = prod.getDataRange().getValues();
  if (data.length < 2) return;

  var headers = data[0].map(function(h) { return String(h).trim(); });
  var skuCol  = headers.indexOf("SKU") !== -1 ? headers.indexOf("SKU")
              : headers.indexOf("Product Name") !== -1 ? headers.indexOf("Product Name")
              : headers.indexOf("Item") !== -1 ? headers.indexOf("Item") : 2;
  var qtyCol  = headers.indexOf("Quantity") !== -1 ? headers.indexOf("Quantity")
              : headers.indexOf("Count") !== -1 ? headers.indexOf("Count") : 3;
  var ioCol   = headers.indexOf("In/Out") !== -1 ? headers.indexOf("In/Out")
              : headers.indexOf("Status") !== -1 ? headers.indexOf("Status") : 4;

  var balances = {};
  for (var i = 1; i < data.length; i++) {
    var sku = String(data[i][skuCol]).trim();
    var qty = Number(data[i][qtyCol]) || 0;
    var io  = String(data[i][ioCol]).trim();
    if (!sku) continue;
    if (!balances[sku]) balances[sku] = { in: 0, out: 0, submitted: 0 };
    if (io === "In")         balances[sku].in        += qty;
    else if (io === "Out")   balances[sku].out       += qty;
    else if (io === "Submitted") balances[sku].submitted += qty;
  }

  // Rewrite inventory sheet
  inv.clearContents();
  inv.appendRow(["Product / SKU", "Count @ Start", "In", "Out", "Submitted", "Balance"]);
  Object.keys(balances).forEach(function(sku) {
    var b = balances[sku];
    inv.appendRow([sku, 0, b.in, b.out, b.submitted, b.in - b.out]);
  });
}

// ════════════════════════════════════════════════════════════════════════════
// STYLIST BALANCE CHECK
// ════════════════════════════════════════════════════════════════════════════
function checkStylistBalance() {
  var sheet = getSheet("Stylist_Prod");
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var totalIn = 0, totalOut = 0;
  for (var i = 1; i < data.length; i++) {
    var io = String(data[i][5]).trim(); // In/Out col
    var qty = Number(data[i][4]) || 0;
    if (io === "In")  totalIn  += qty;
    if (io === "Out") totalOut += qty;
  }
  var balance = totalIn - totalOut;
  if (balance !== 0) {
    queueAlertEmail("STYLIST_BALANCE",
      "Stylist balance is " + balance + " (should be 0). In=" + totalIn + " Out=" + totalOut);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// KPIs
// ════════════════════════════════════════════════════════════════════════════
function getKPIs() {
  var now       = new Date();
  var curMonth  = now.toLocaleString("default", { month: "long" });
  var prevDate  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var prevMonth = prevDate.toLocaleString("default", { month: "long" });

  var metrics = {
    "ReXI OUT":          { sheet: "ReXI_Prod",      io: "Out",       col: 4 },
    "Lab OUT":           { sheet: "Lab_Prod",        status: "Out",   col: 4 },
    "Machine Sewers":    { sheet: "TailorMS_Prod",   io: "Submitted", col: 5 },
    "Stylist Submitted": { sheet: "Stylist_Prod",    io: "Submitted", col: 5 },
    "Stylist QA Pass":   { sheet: "Stylist_Prod",    io: "QA Pass",   col: 5 },
    "Final OUT":         { sheet: "Final_Prod",      io: "Out",       col: 6 },
  };

  var result = {};
  Object.keys(metrics).forEach(function(label) {
    var m     = metrics[label];
    var sheet = getSheet(m.sheet);
    if (!sheet) { result[label] = { current: 0, previous: 0 }; return; }
    var data  = sheet.getDataRange().getValues();
    // month col = index 1
    var cur = 0, prev = 0;
    for (var i = 1; i < data.length; i++) {
      var month  = String(data[i][1]).trim();
      var io     = String(data[i][m.col]).trim();
      var target = m.io || m.status;
      var qty    = 1; // count rows
      if (month === curMonth  && io === target) cur++;
      if (month === prevMonth && io === target) prev++;
    }
    result[label] = { current: cur, previous: prev };
  });

  return { success: true, data: result };
}

// ════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ════════════════════════════════════════════════════════════════════════════
function getAnalytics(payload) {
  var f = payload.filters || {};
  var allSheets = {
    "ReXI":       "ReXI_Prod",
    "Lab":        "Lab_Prod",
    "Ventilation":"Ventilation_Prod",
    "Tailor/MS":  "TailorMS_Prod",
    "Stylist":    "Stylist_Prod",
    "Final Prod": "Final_Prod",
  };

  var sheetsToQuery = f.dept && f.dept !== "All" ? { [f.dept]: allSheets[f.dept] } : allSheets;
  var results = [];

  Object.keys(sheetsToQuery).forEach(function(dept) {
    var sheetName = sheetsToQuery[dept];
    var sheet     = getSheet(sheetName);
    if (!sheet) return;

    var data    = sheet.getDataRange().getValues();
    var headers = data[0].map(function(h) { return String(h).trim(); });

    for (var i = 1; i < data.length; i++) {
      var row = {};
      headers.forEach(function(h, j) { row[camelCase(h)] = data[i][j]; });
      row.dept = dept;

      // Apply filters
      if (f.dateFrom && row.date && new Date(row.date) < new Date(f.dateFrom)) continue;
      if (f.dateTo   && row.date && new Date(row.date) > new Date(f.dateTo))   continue;
      if (f.staff    && f.staff.trim() &&
          String(row.staff || "").toLowerCase().indexOf(f.staff.toLowerCase()) === -1) continue;
      if (f.sku && f.sku.trim() &&
          String(row.sku || row.productName || row.item || "").toLowerCase()
            .indexOf(f.sku.toLowerCase()) === -1) continue;
      if (f.status && f.status !== "All" &&
          String(row.inOut || row.status || "").trim() !== f.status) continue;
      if (f.hairId && f.hairId.trim() &&
          String(row.hairId || "").toLowerCase()
            .indexOf(f.hairId.toLowerCase()) === -1) continue;

      // Normalise for output
      results.push({
        dept:    dept,
        date:    row.date,
        hairId:  row.hairId || "",
        product: row.sku || row.productName || row.processedItem || row.item || "",
        count:   row.quantity || row.count || "",
        status:  row.inOut || row.status || "",
        staff:   row.staff || row.supervisor || "",
        team:    row.team || "",
        why:     row.why || "",
      });
    }
  });

  return { success: true, data: results };
}

// ════════════════════════════════════════════════════════════════════════════
// TRACE HAIR ID — full production lineage
// ════════════════════════════════════════════════════════════════════════════
function traceHairID(payload) {
  var hairId = payload.hairId;
  var trace  = [];

  // TailorMS (born here)
  var tms = getSheet("TailorMS_Prod");
  if (tms) {
    var d = tms.getDataRange().getValues();
    for (var i = 1; i < d.length; i++) {
      if (String(d[i][6]).trim() === hairId) { // hairId col = 6
        trace.push({ dept: "tailorms", date: d[i][0], status: d[i][5], staff: d[i][7] });
      }
    }
  }

  // Stylist
  var sty = getSheet("Stylist_Prod");
  if (sty) {
    var ds = sty.getDataRange().getValues();
    for (var j = 1; j < ds.length; j++) {
      if (String(ds[j][0]).trim() === hairId) {
        trace.push({ dept: "stylist", date: ds[j][1], status: ds[j][5], staff: ds[j][7] });
      }
    }
  }

  // Final
  var fin = getSheet("Final_Prod");
  if (fin) {
    var df = fin.getDataRange().getValues();
    for (var k = 1; k < df.length; k++) {
      if (String(df[k][0]).trim() === hairId) {
        trace.push({ dept: "final", date: df[k][1], status: df[k][6], staff: df[k][7] });
      }
    }
  }

  // Sort by date
  trace.sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
  return { success: true, trace: trace };
}

// ════════════════════════════════════════════════════════════════════════════
// ADMIN AUTH
// ════════════════════════════════════════════════════════════════════════════
function adminAuth(payload) {
  var provided = payload.password;
  var stored   = getConfigValue("ADMIN_PASSWORD");
  if (!stored) return { success: false, error: "No admin password set" };

  // Compare (plain text comparison — in production use hashed comparison)
  if (provided === stored) {
    var token = Utilities.base64Encode(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
        provided + new Date().getTime() + Math.random())
    );
    // Store token temporarily
    PropertiesService.getScriptProperties().setProperty("ADMIN_TOKEN_" + token.substring(0, 16), String(new Date().getTime()));
    return { success: true, token: token.substring(0, 32) };
  }
  return { success: false, error: "Invalid password" };
}

function validateAdminToken(token) {
  if (!token) return false;
  var stored = PropertiesService.getScriptProperties().getProperty("ADMIN_TOKEN_" + token.substring(0, 16));
  if (!stored) return false;
  // Token valid for 8 hours
  return (new Date().getTime() - Number(stored)) < 8 * 3600 * 1000;
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════════════════
function getConfigValue(key) {
  var sheet = getSheet("Config_Admin");
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === key) {
      var val = data[i][1];
      try { return JSON.parse(val); } catch(e) { return val; }
    }
  }
  return null;
}

function setConfigValue(key, value, adminUser) {
  var sheet = getSheet("Config_Admin");
  if (!sheet) throw new Error("Config_Admin sheet not found");
  var data = sheet.getDataRange().getValues();
  var oldVal = null;

  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === key) {
      oldVal = data[i][1];
      sheet.getRange(i + 1, 2).setValue(typeof value === "object" ? JSON.stringify(value) : value);
      writeAuditEntry(adminUser || "Admin", "Config", key, oldVal, typeof value === "object" ? JSON.stringify(value) : value, i + 1);
      return;
    }
  }
  // New key
  sheet.appendRow([key, typeof value === "object" ? JSON.stringify(value) : value]);
  writeAuditEntry(adminUser || "Admin", "Config", key, "", typeof value === "object" ? JSON.stringify(value) : value, sheet.getLastRow());
}

function getConfig(payload) {
  var val = getConfigValue(payload.key);
  return { success: true, value: val };
}

function saveConfig(payload) {
  if (!validateAdminToken(payload.adminToken)) return { success: false, error: "Unauthorized" };
  setConfigValue(payload.key, payload.value, "Admin");
  return { success: true };
}

function getAllConfig(payload) {
  if (!validateAdminToken(payload.adminToken)) return { success: false, error: "Unauthorized" };
  var sheet = getSheet("Config_Admin");
  if (!sheet) return { success: false, error: "Config_Admin not found" };
  var data   = sheet.getDataRange().getValues();
  var result = {};
  data.forEach(function(row) {
    if (!row[0]) return;
    var key = String(row[0]).trim();
    var val = row[1];
    try { result[key] = JSON.parse(val); } catch(e) { result[key] = val; }
  });
  return { success: true, data: result };
}

// ════════════════════════════════════════════════════════════════════════════
// AUDIT TRAIL
// ════════════════════════════════════════════════════════════════════════════
function writeAuditEntry(adminUser, section, field, oldValue, newValue, rowRef) {
  var sheet = getSheet("Audit_Trail");
  if (!sheet) return;
  sheet.appendRow([
    new Date().toISOString(),
    adminUser,
    section,
    field,
    oldValue || "",
    newValue || "",
    rowRef   || ""
  ]);
}

function getAuditTrail(payload) {
  var sheet = getSheet("Audit_Trail");
  if (!sheet) return { success: true, data: [] };
  var data    = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rows    = [];
  var limit   = Number(payload.limit) || 200;
  var start   = Math.max(1, data.length - limit);
  for (var i = data.length - 1; i >= start; i--) {
    var obj = {};
    headers.forEach(function(h, j) { obj[camelCase(h)] = data[i][j]; });
    rows.push(obj);
  }
  return { success: true, data: rows };
}

// ════════════════════════════════════════════════════════════════════════════
// EMAIL ALERTS — batched queue (30-min trigger)
// ════════════════════════════════════════════════════════════════════════════
var EMAIL_QUEUE_KEY = "EMAIL_ALERT_QUEUE";

function queueAlertEmail(type, message) {
  var queue = [];
  try {
    var raw = PropertiesService.getScriptProperties().getProperty(EMAIL_QUEUE_KEY);
    if (raw) queue = JSON.parse(raw);
  } catch(e) {}
  queue.push({ type: type, message: message, ts: new Date().toISOString() });
  PropertiesService.getScriptProperties().setProperty(EMAIL_QUEUE_KEY, JSON.stringify(queue));
}

// Run this every 30 minutes via Apps Script trigger (set up manually)
function flushAlertEmails() {
  var raw = PropertiesService.getScriptProperties().getProperty(EMAIL_QUEUE_KEY);
  if (!raw) return;
  var queue = [];
  try { queue = JSON.parse(raw); } catch(e) { return; }
  if (!queue.length) return;

  var emails = getConfigValue("ALERT_EMAILS");
  if (!emails || !emails.length) return;

  var body = queue.map(function(item) {
    return "[" + item.type + "] " + item.ts + "\n" + item.message;
  }).join("\n\n---\n\n");

  var emailList = Array.isArray(emails) ? emails : [emails];
  emailList.forEach(function(email) {
    try {
      MailApp.sendEmail({
        to: email,
        subject: "TSL Alert Summary — " + queue.length + " item(s)",
        body: "TSL Automated Alerts\n" + new Date().toISOString() + "\n\n" + body,
      });
    } catch(e) {
      Logger.log("Email failed to " + email + ": " + e.message);
    }
  });

  // Clear queue
  PropertiesService.getScriptProperties().deleteProperty(EMAIL_QUEUE_KEY);
}

// ════════════════════════════════════════════════════════════════════════════
// SCHEDULED FLAGS (run daily at 12:00 via time-driven trigger)
// ════════════════════════════════════════════════════════════════════════════
function runDailyChecks() {
  checkStylistUnsubmittedBy12pm();
  checkStylistBalanceByNextDay();
}

function checkStylistUnsubmittedBy12pm() {
  var sheet = getSheet("Stylist_Prod");
  if (!sheet) return;
  var data  = sheet.getDataRange().getValues();
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var hasSubmitted = false;
  for (var i = 1; i < data.length; i++) {
    var rowDate = Utilities.formatDate(new Date(data[i][1]), Session.getScriptTimeZone(), "yyyy-MM-dd");
    var status  = String(data[i][5]).trim();
    if (rowDate === today && status === "Submitted") { hasSubmitted = true; break; }
  }
  if (!hasSubmitted) {
    queueAlertEmail("STYLIST_NO_SUBMITTED", "No Submitted entries recorded for today by 12pm.");
  }
}

function checkStylistBalanceByNextDay() {
  checkStylistBalance();
}

// ════════════════════════════════════════════════════════════════════════════
// SETUP WIZARD
// ════════════════════════════════════════════════════════════════════════════
function completeSetup(payload) {
  var cfg = payload.config;
  // Store spreadsheet ID in Script Properties
  if (cfg.spreadsheetId) {
    PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", cfg.spreadsheetId);
  }
  // Save all config values
  if (cfg.alertEmails)    setConfigValue("ALERT_EMAILS",    cfg.alertEmails,    "Setup");
  if (cfg.rexiSkus)       setConfigValue("REXI_SKUS",       cfg.rexiSkus,       "Setup");
  if (cfg.labMappings)    setConfigValue("LAB_SKU_MAPPINGS", cfg.labMappings,   "Setup");
  if (cfg.ventItems)      setConfigValue("VENT_ITEMS",       cfg.ventItems,     "Setup");
  if (cfg.hairIdMappings) setConfigValue("HAIRID_MAPPINGS",  cfg.hairIdMappings,"Setup");
  if (cfg.stylistProducts)setConfigValue("STYLIST_PRODUCTS", cfg.stylistProducts,"Setup");
  if (cfg.finalProducts)  setConfigValue("FINAL_PRODUCTS",   cfg.finalProducts, "Setup");
  if (cfg.whyOptions)     setConfigValue("WHY_OPTIONS",      cfg.whyOptions,    "Setup");
  if (cfg.staff)          setConfigValue("STAFF_LIST",        cfg.staff,        "Setup");
  if (cfg.teams)          setConfigValue("TEAM_OPTIONS",      cfg.teams,        "Setup");
  if (cfg.adminPassword)  setConfigValue("ADMIN_PASSWORD",    cfg.adminPassword,"Setup");

  // Create time-driven triggers
  try {
    ScriptApp.newTrigger("flushAlertEmails")
      .timeBased().everyMinutes(30).create();
    ScriptApp.newTrigger("runDailyChecks")
      .timeBased().atHour(12).everyDays(1).create();
  } catch(e) {
    Logger.log("Trigger creation failed: " + e.message);
  }

  writeAuditEntry("Setup Wizard", "Setup", "Initial setup", "", "Complete", 0);
  return { success: true };
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════
function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
    return String(h).trim();
  });
}

function headersToRow(headers, obj) {
  return headers.map(function(h) {
    var key = camelCase(h);
    var val = obj[key];
    return val !== undefined && val !== null ? val : "";
  });
}

function camelCase(str) {
  if (!str) return "";
  return str
    .replace(/[^a-zA-Z0-9 \/]/g, "")
    .split(/[\s\/]+/)
    .map(function(w, i) {
      return i === 0
        ? w.charAt(0).toLowerCase() + w.slice(1)
        : w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join("");
}
