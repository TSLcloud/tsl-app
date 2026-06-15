// ─── WHY OPTIONS ─────────────────────────────────────────────────────────────
export const WHY_OPTIONS = [
  "Curling","Sewing","Styling","Experiment","Steaming","Touch Up",
  "Cannot be Used/Bad Items","Returned - Daily Capacity Exceeded","Ventilation",
  "Order Fulfilment","Photo shoot","Inventory Purchase","Stitching","Re-Stitching","Training"
];

// ─── TEAM OPTIONS ────────────────────────────────────────────────────────────
export const TEAM_OPTIONS = [
  "Texture Tech","Machine Sewers","Styling Team","Operations Team",
  "Lab Tech","Content Team","Ventilators","Shipping Team","Tailors"
];

// ─── STATUS OPTIONS PER MODULE ───────────────────────────────────────────────
export const VENTILATION_STATUSES = ["In","Assigned","Submitted","Out"];
export const TAILORMS_STATUSES    = ["In","Submitted","Out"];
export const STYLIST_STATUSES     = ["In","Submitted","QA Pass","QA Fail","Out"];
export const FINAL_STATUSES       = ["In","Out"];

// ─── IN/OUT OPTIONS ──────────────────────────────────────────────────────────
export const INOUT_OPTIONS = ["In","Out"];

// ─── FINAL PROD ORDER ID EXCEPTIONS ─────────────────────────────────────────
export const FINAL_ORDER_ID_EXCEPTIONS = ["Restyling","Photo shoot","Send to UK"];

// ─── SHEET NAMES ─────────────────────────────────────────────────────────────
export const SHEETS = {
  REXI_PROD:              "ReXI_Prod",
  LAB_PROD:               "Lab_Prod",
  VENTILATION_PROD:       "Ventilation_Prod",
  TAILORMS_PROD:          "TailorMS_Prod",
  STYLIST_PROD:           "Stylist_Prod",
  FINAL_PROD:             "Final_Prod",
  REXI_INVENTORY:         "ReXI_Inventory",
  LAB_INVENTORY:          "Lab_Inventory",
  VENTILATION_INVENTORY:  "Ventilation_Inventory",
  TAILOR_INVENTORY:       "Tailor_Inventory",
  MACHINESEWER_INVENTORY: "MachineSewer_Inventory",
  STYLIST_INVENTORY:      "Stylist_Inventory",
  FINAL_INVENTORY:        "Final_Inventory",
  AUDIT_TRAIL:            "Audit_Trail",
  CONFIG_ADMIN:           "Config_Admin",
  HAIRID_REGISTRY:        "HairID_Registry",
};

// ─── KPI METRIC DEFINITIONS ──────────────────────────────────────────────────
export const KPI_METRICS = [
  { label: "ReXI OUT",           dept: "ReXI",        sheet: "REXI_PROD",      measure: "OUT" },
  { label: "Lab OUT",            dept: "Lab",          sheet: "LAB_PROD",       measure: "OUT" },
  { label: "Machine Sewers",     dept: "Machine Sewer",sheet: "TAILORMS_PROD",  measure: "Submitted" },
  { label: "Stylist Submitted",  dept: "Stylist",      sheet: "STYLIST_PROD",   measure: "Submitted" },
  { label: "Stylist QA Pass",    dept: "Stylist",      sheet: "STYLIST_PROD",   measure: "QA Pass" },
  { label: "Final OUT",          dept: "Final Prod",   sheet: "FINAL_PROD",     measure: "OUT" },
];

// ─── MONTHS ──────────────────────────────────────────────────────────────────
export const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
