import { Table, Th, Td, Tr } from "../ui/Table";
import { LoadingState, EmptyState } from "../ui/Spinner";

export function InventoryTable({ columns, rows, loading, period }) {
  if (loading) return <LoadingState />;
  if (!rows?.length) return <EmptyState icon="📦" title="No inventory data" message="Inventory populates automatically from production entries." />;

  return (
    <div className="flex flex-col gap-2">
      {period && <p className="text-xs text-ink-muted">Period: <span className="text-ink font-medium">{period}</span></p>}
      <Table>
        <thead>
          <tr>{columns.map(c => <Th key={c.key}>{c.label}</Th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <Tr key={i}>
              {columns.map(c => (
                <Td key={c.key}>
                  {c.numeric
                    ? <span className={`font-mono text-sm ${Number(row[c.key]) < 0 ? "text-red-400" : ""}`}>{row[c.key] ?? 0}</span>
                    : row[c.key] ?? "—"}
                </Td>
              ))}
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
