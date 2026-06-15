import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Input";
import { Table, Th, Td, Tr } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { LoadingState } from "../components/ui/Spinner";
import { toast } from "../components/ui/Toast";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { getAllConfig, saveConfig, getAuditTrail } from "../lib/api";
import { formatDateTime } from "../lib/utils";
import { WHY_OPTIONS, TEAM_OPTIONS } from "../lib/constants";

// ── Login screen ─────────────────────────────────────────────────────────────
function AdminLogin({ onLogin, error, locked, loading }) {
  const [pw, setPw] = useState("");
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-sm">
        <CardHeader title="Admin Dashboard" subtitle="Enter admin password to continue" />
        {locked ? (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-700/30 rounded px-3 py-2">
            Too many failed attempts. Please wait 5 minutes before trying again.
          </p>
        ) : (
          <form onSubmit={e => { e.preventDefault(); onLogin(pw); }} className="flex flex-col gap-4">
            <Input label="Password" type="password" value={pw}
              onChange={e => setPw(e.target.value)} autoFocus error={error} />
            <Button type="submit" loading={loading} className="w-full">Unlock Dashboard</Button>
          </form>
        )}
      </Card>
    </div>
  );
}

// ── Config editor for a simple list (dropdowns, staff, etc.) ─────────────────
function ListConfigEditor({ title, configKey, items, token, onSaved }) {
  const [list, setList]     = useState(items || []);
  const [newItem, setNewItem] = useState("");
  const [saving, setSaving] = useState(false);

  const add = () => {
    if (!newItem.trim() || list.includes(newItem.trim())) return;
    setList(l => [...l, newItem.trim()]); setNewItem("");
  };
  const remove = (item) => setList(l => l.filter(x => x !== item));

  const save = async () => {
    setSaving(true);
    try {
      await saveConfig(configKey, list, token);
      toast(`${title} saved.`, "success");
      onSaved?.();
    } catch { toast("Save failed.", "error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">{title}</p>
      <div className="flex gap-2">
        <input value={newItem} onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
          className="flex-1 bg-surface-2 border border-surface-4 rounded px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          placeholder={`Add ${title.toLowerCase()}…`} />
        <Button size="sm" variant="outline" onClick={add}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {list.map(item => (
          <span key={item} className="flex items-center gap-1 px-2 py-0.5 bg-surface-3 rounded text-xs text-ink">
            {item}
            <button onClick={() => remove(item)} className="text-ink-faint hover:text-red-400 transition-colors ml-0.5">×</button>
          </span>
        ))}
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={save} loading={saving}>Save {title}</Button>
      </div>
    </div>
  );
}

// ── Hair ID Shorthand Mapping editor ─────────────────────────────────────────
function HairIDMappingEditor({ mappings, token, onSaved }) {
  const [list, setList] = useState(mappings || []);
  const [product, setProduct] = useState("");
  const [initials, setInitials] = useState("");
  const [saving, setSaving] = useState(false);

  const add = () => {
    if (!product.trim() || !initials.trim()) return;
    setList(l => [...l.filter(x => x.product !== product.trim()), { product: product.trim(), initials: initials.trim() }]);
    setProduct(""); setInitials("");
  };
  const remove = (p) => setList(l => l.filter(x => x.product !== p));

  const save = async () => {
    setSaving(true);
    try {
      await saveConfig("HAIRID_MAPPINGS", list, token);
      toast("Hair ID mappings saved.", "success");
      onSaved?.();
    } catch { toast("Save failed.", "error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Hair ID Shorthand Mappings</p>
      <p className="text-xs text-ink-muted">Product name → initials prefix used in Hair IDs (e.g. Spicy Icon Black/Merlot → SPYC-BL/M)</p>
      <div className="flex gap-2">
        <input value={product} onChange={e => setProduct(e.target.value)}
          className="flex-1 bg-surface-2 border border-surface-4 rounded px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          placeholder="Product name" />
        <input value={initials} onChange={e => setInitials(e.target.value)}
          className="w-36 bg-surface-2 border border-surface-4 rounded px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          placeholder="Initials (e.g. SPYC-BL/M)" />
        <Button size="sm" variant="outline" onClick={add}>Add</Button>
      </div>
      <Table>
        <thead><tr><Th>Product</Th><Th>Initials</Th><Th></Th></tr></thead>
        <tbody>
          {list.map(row => (
            <Tr key={row.product}>
              <Td>{row.product}</Td>
              <Td><span className="font-mono text-xs text-brand-300">{row.initials}</span></Td>
              <Td><button onClick={() => remove(row.product)} className="text-xs text-red-400 hover:text-red-300">Remove</button></Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <div className="flex justify-end">
        <Button size="sm" onClick={save} loading={saving}>Save Mappings</Button>
      </div>
    </div>
  );
}

// ── Lab SKU Mapping editor ────────────────────────────────────────────────────
function LabSKUMappingEditor({ mappings, token, onSaved }) {
  const [list, setList] = useState(mappings || []);
  const [rexiSku, setRexiSku] = useState("");
  const [labName, setLabName] = useState("");
  const [saving, setSaving] = useState(false);

  const add = () => {
    if (!rexiSku.trim() || !labName.trim()) return;
    setList(l => [...l.filter(x => x.rexiSku !== rexiSku.trim()), { rexiSku: rexiSku.trim(), labName: labName.trim() }]);
    setRexiSku(""); setLabName("");
  };
  const save = async () => {
    setSaving(true);
    try {
      await saveConfig("LAB_SKU_MAPPINGS", list, token);
      toast("Lab SKU mappings saved.", "success");
      onSaved?.();
    } catch { toast("Save failed.", "error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Lab SKU Mappings</p>
      <p className="text-xs text-ink-muted">Maps ReXI SKU → Lab processed output name</p>
      <div className="flex gap-2">
        <input value={rexiSku} onChange={e => setRexiSku(e.target.value)}
          className="flex-1 bg-surface-2 border border-surface-4 rounded px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          placeholder="ReXI SKU" />
        <input value={labName} onChange={e => setLabName(e.target.value)}
          className="flex-1 bg-surface-2 border border-surface-4 rounded px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          placeholder="Lab output name" />
        <Button size="sm" variant="outline" onClick={add}>Add</Button>
      </div>
      <Table>
        <thead><tr><Th>ReXI SKU</Th><Th>Lab Name</Th></tr></thead>
        <tbody>
          {list.map(row => (
            <Tr key={row.rexiSku}>
              <Td className="font-mono text-xs">{row.rexiSku}</Td>
              <Td>{row.labName}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <div className="flex justify-end">
        <Button size="sm" onClick={save} loading={saving}>Save Lab Mappings</Button>
      </div>
    </div>
  );
}

// ── Audit Trail table ─────────────────────────────────────────────────────────
function AuditTrailTable({ entries }) {
  if (!entries?.length) return <p className="text-sm text-ink-muted text-center py-6">No audit entries yet.</p>;
  return (
    <Table>
      <thead>
        <tr>
          <Th>Timestamp</Th><Th>Admin</Th><Th>Section</Th>
          <Th>Field</Th><Th>Old Value</Th><Th>New Value</Th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => (
          <Tr key={i}>
            <Td><span className="font-mono text-xs text-ink-muted">{formatDateTime(e.timestamp)}</span></Td>
            <Td>{e.adminUser}</Td>
            <Td><Badge variant="brand" size="xs">{e.section}</Badge></Td>
            <Td>{e.field}</Td>
            <Td><span className="text-red-400 text-xs">{e.oldValue || "—"}</span></Td>
            <Td><span className="text-green-400 text-xs">{e.newValue || "—"}</span></Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

// ── Password change ────────────────────────────────────────────────────────────
function PasswordChange({ token, onSaved }) {
  const [pw, setPw]   = useState("");
  const [conf, setConf] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (pw.length < 8) { toast("Password must be at least 8 characters.", "warning"); return; }
    if (pw !== conf)   { toast("Passwords do not match.", "warning"); return; }
    setSaving(true);
    try {
      await saveConfig("ADMIN_PASSWORD", pw, token);
      toast("Admin password updated.", "success");
      setPw(""); setConf(""); onSaved?.();
    } catch { toast("Failed to update password.", "error"); }
    finally { setSaving(false); }
  };
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Change Admin Password</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="New Password" type="password" value={pw} onChange={e => setPw(e.target.value)} />
        <Input label="Confirm Password" type="password" value={conf} onChange={e => setConf(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={save} loading={saving}>Update Password</Button>
      </div>
    </div>
  );
}

// ── Main Admin page ───────────────────────────────────────────────────────────
export default function Admin() {
  const { token, locked, error, login, logout, isAuthenticated } = useAdminAuth();
  const [loginLoading, setLoginLoading] = useState(false);
  const [config, setConfig]   = useState(null);
  const [audit, setAudit]     = useState([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dropdowns");

  const handleLogin = async (pw) => {
    setLoginLoading(true);
    await login(pw);
    setLoginLoading(false);
  };

  const loadAll = useCallback(async () => {
    if (!token) return;
    setConfigLoading(true);
    try {
      const [cfgRes, auditRes] = await Promise.all([getAllConfig(token), getAuditTrail(200)]);
      setConfig(cfgRes.data || {});
      setAudit(auditRes.data || []);
    } catch { toast("Failed to load admin config.", "error"); }
    finally { setConfigLoading(false); }
  }, [token]);

  useEffect(() => { if (isAuthenticated) loadAll(); }, [isAuthenticated, loadAll]);

  if (!isAuthenticated) {
    return (
      <PageLayout title="Admin Dashboard" subtitle="Password protected">
        <AdminLogin onLogin={handleLogin} error={error} locked={locked} loading={loginLoading} />
      </PageLayout>
    );
  }

  const TABS = [
    { key: "dropdowns", label: "Dropdowns" },
    { key: "staff",     label: "Staff & Teams" },
    { key: "hairid",    label: "Hair ID Mappings" },
    { key: "lab",       label: "Lab SKU Mappings" },
    { key: "alerts",    label: "Email Alerts" },
    { key: "password",  label: "Password" },
    { key: "audit",     label: "Audit Trail" },
  ];

  return (
    <PageLayout
      title="Admin Dashboard"
      subtitle="System configuration — all changes are logged"
      actions={
        <div className="flex items-center gap-3">
          <Badge variant="success">Authenticated</Badge>
          <Button size="sm" variant="outline" onClick={logout}>Log Out</Button>
        </div>
      }
    >
      {configLoading ? <LoadingState /> : (
        <div className="flex flex-col gap-5">
          {/* Tab nav */}
          <div className="flex gap-1 bg-surface-2 p-1 rounded-lg w-fit">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  activeTab === t.key ? "bg-brand-500 text-white" : "text-ink-muted hover:text-ink"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "dropdowns" && (
            <Card>
              <CardHeader title="Dropdown Lists" subtitle="All editable — changes take effect immediately" />
              <div className="flex flex-col gap-6 divide-y divide-surface-3">
                <div className="pt-4 first:pt-0">
                  <ListConfigEditor title="Why Options" configKey="WHY_OPTIONS"
                    items={config?.WHY_OPTIONS || WHY_OPTIONS} token={token} onSaved={loadAll} />
                </div>
                <div className="pt-4">
                  <ListConfigEditor title="Team Options" configKey="TEAM_OPTIONS"
                    items={config?.TEAM_OPTIONS || TEAM_OPTIONS} token={token} onSaved={loadAll} />
                </div>
                <div className="pt-4">
                  <ListConfigEditor title="Product Codes" configKey="PRODUCT_CODES"
                    items={config?.PRODUCT_CODES || []} token={token} onSaved={loadAll} />
                </div>
              </div>
            </Card>
          )}

          {activeTab === "staff" && (
            <Card>
              <CardHeader title="Staff & Teams" />
              <div className="flex flex-col gap-6 divide-y divide-surface-3">
                <div className="pt-4 first:pt-0">
                  <ListConfigEditor title="All Staff" configKey="STAFF_LIST"
                    items={config?.STAFF_LIST || []} token={token} onSaved={loadAll} />
                </div>
                <div className="pt-4">
                  <ListConfigEditor title="Alert Email Addresses" configKey="ALERT_EMAILS"
                    items={config?.ALERT_EMAILS || []} token={token} onSaved={loadAll} />
                </div>
              </div>
            </Card>
          )}

          {activeTab === "hairid" && (
            <Card>
              <CardHeader title="Hair ID Configuration" subtitle="Product shorthand initials used in auto-generated Hair IDs" />
              <HairIDMappingEditor mappings={config?.HAIRID_MAPPINGS || []} token={token} onSaved={loadAll} />
            </Card>
          )}

          {activeTab === "lab" && (
            <Card>
              <CardHeader title="Lab SKU Mappings" subtitle="ReXI SKU → Lab processed output name" />
              <LabSKUMappingEditor mappings={config?.LAB_SKU_MAPPINGS || []} token={token} onSaved={loadAll} />
            </Card>
          )}

          {activeTab === "alerts" && (
            <Card>
              <CardHeader title="Email Alert Settings" subtitle="Alerts batch every 30 minutes (max 100/day quota)" />
              <ListConfigEditor title="Alert Email Addresses" configKey="ALERT_EMAILS"
                items={config?.ALERT_EMAILS || []} token={token} onSaved={loadAll} />
            </Card>
          )}

          {activeTab === "password" && (
            <Card>
              <CardHeader title="Admin Password" subtitle="Minimum 8 characters" />
              <PasswordChange token={token} onSaved={loadAll} />
            </Card>
          )}

          {activeTab === "audit" && (
            <Card padding={false}>
              <div className="p-5 border-b border-surface-3">
                <CardHeader title="Audit Trail" subtitle="Immutable — all admin actions logged automatically" />
              </div>
              <div className="p-5">
                <AuditTrailTable entries={audit} />
              </div>
            </Card>
          )}
        </div>
      )}
    </PageLayout>
  );
}
