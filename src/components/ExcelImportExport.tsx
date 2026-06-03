import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ExcelImportExportProps {
  onImported: () => void;
}

const TEMPLATE_COLS = ["name", "name_bn", "generic_name", "manufacturer", "category", "price", "stock", "min_stock", "batch_number", "expiry_date", "requires_prescription", "description"];

export function ExcelImportExport({ onImported }: ExcelImportExportProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_COLS,
      ["Napa Extra", "নাপা এক্সট্রা", "Paracetamol 500mg", "analgesic", 12, 100, 10, "BATCH001", "2026-12-31", "false", "Pain relief tablet"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "Medsuite-eT_Product_Import_Template.xlsx");
    toast.success("Template downloaded!");
  };

  const exportProducts = async () => {
    const data = await api.products.list();
    if (!data || data.length === 0) { toast.error("No products to export"); return; }
    const rows = (data as any[]).map((p) => ({
      name: p.name,
      name_bn: p.name_bn,
      generic_name: p.generic_name,
      manufacturer: p.manufacturer,
      category: p.category,
      price: p.price,
      stock: p.stock,
      min_stock: p.min_stock,
      batch_number: p.batch_number,
      expiry_date: p.expiry_date,
      requires_prescription: p.requires_prescription,
      description: p.description,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, `Medsuite-eT_Products_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success(`Exported ${data.length} products`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);
        if (rows.length === 0) { toast.error("Empty file"); return; }

        let success = 0;
        let failed = 0;
        for (const row of rows) {
          if (!row.name) { failed++; continue; }
          try {
            const descParts: string[] = [];
            if (row.strength) descParts.push(`Strength: ${row.strength}`);
            if (row.dosage_form) descParts.push(`Form: ${row.dosage_form}`);
            if (row.drug_class) descParts.push(`Class: ${row.drug_class}`);
            if (row.indication) descParts.push(`Indication: ${row.indication}`);
            const baseDesc = row.description ? String(row.description) : "";
            const description = [baseDesc, ...descParts].filter(Boolean).join(" | ") || null;

            await api.products.create({
              name: String(row.name).trim(),
              name_bn: row.name_bn ? String(row.name_bn) : null,
              generic_name: row.generic_name ? String(row.generic_name) : null,
              manufacturer: row.manufacturer ? String(row.manufacturer) : null,
              category: row.category ? String(row.category) : null,
              price: Number(row.price) || 0,
              stock: Number(row.stock) || 0,
              min_stock: Number(row.min_stock) || 10,
              batch_number: row.batch_number ? String(row.batch_number) : null,
              expiry_date: row.expiry_date ? String(row.expiry_date) : null,
              requires_prescription: String(row.requires_prescription).toLowerCase() === "true",
              description,
            });
            success++;
          } catch {
            failed++;
          }
        }
        toast.success(`Imported ${success} products (${failed} failed)`);
        onImported();
      } catch (err: any) {
        toast.error("Import failed: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={downloadTemplate}>
        <Download className="mr-1 h-3.5 w-3.5" /> CSV Template
      </Button>
      <Button variant="outline" size="sm" onClick={exportProducts}>
        <Download className="mr-1 h-3.5 w-3.5" /> Export Excel
      </Button>
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
        <Upload className="mr-1 h-3.5 w-3.5" /> Bulk Import
      </Button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
    </div>
  );
}
