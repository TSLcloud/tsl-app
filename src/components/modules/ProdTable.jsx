import { Table, Th, Td, Tr } from "../ui/Table";
import { Badge } from "../ui/Badge";
import { formatDate } from "../../lib/utils";
import { Button } from "../ui/Button";

function statusVariant(s) {
  const map = {
    "In": "info", "Out": "success", "Submitted": "brand", "Assigned": "warning",
    "QA Pass": "success", "QA Fail": "danger", "Raw": "default", "Processed": "brand",
  };
  return map[s] || "default";
}

export function ProdTable({ columns, rows, onReprint, emptyMessage = "No entries yet." }) {
  if (!rows?.length) {
    return <p className="text-sm text-ink-muted text-center py-8">{emptyMessage}</p>;
  }
  return (
    <Table>
      <thead>
        <tr>
          {columns.map(c => <Th key={c.key}>{c.label}</Th>)}
          {onReprint && <Th>Label</Th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <Tr key={i} flagged={row._flagged}>
            {columns.map(c => (
              <Td key={c.key} flagged={row._flagged && c.key === "_flag_col"}>
                {c.key === "status" || c.key === "inOut" || c.key === "type" ? (
                  <Badge variant={statusVariant(row[c.key])}>{row[c.key]}</Badge>
                ) : c.key === "date" ? formatDate(row[c.key])
                  : c.key === "hairId" ? (
                    <span className="font-mono text-xs text-brand-300">{row[c.key]}</span>
                  ) : row[c.key] ?? "—"}
              </Td>
            ))}
            {onReprint && row._needsReprint && (
              <Td>
                <Button size="xs" variant="outline" onClick={() => onReprint(row)}>Reprint</Button>
              </Td>
            )}
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}
