import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { categories } from "@/data/categories";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
  onSaved: () => void;
}

const defaultProduct = {
  name: "", name_bn: "", generic_name: "", category: "analgesic",
  price: 0, stock: 0, min_stock: 10, batch_number: "", expiry_date: "",
  requires_prescription: false, description: "", description_bn: "", image_url: "",
};

export function ProductDialog({ open, onOpenChange, product, onSaved }: ProductDialogProps) {
  const [form, setForm] = useState(defaultProduct);
  const [saving, setSaving] = useState(false);
  const isEdit = !!product;

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "", name_bn: product.name_bn || "",
        generic_name: product.generic_name || "", category: product.category || "analgesic",
        price: product.price || 0, stock: product.stock || 0, min_stock: product.min_stock || 10,
        batch_number: product.batch_number || "", expiry_date: product.expiry_date || "",
        requires_prescription: product.requires_prescription || false,
        description: product.description || "", description_bn: product.description_bn || "",
        image_url: product.image_url || "",
      });
    } else {
      setForm(defaultProduct);
    }
  }, [product, open]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    setSaving(true);

    const payload = {
      name: form.name, name_bn: form.name_bn || null, generic_name: form.generic_name || null,
      category: form.category, price: Number(form.price), stock: Number(form.stock),
      min_stock: Number(form.min_stock), batch_number: form.batch_number || null,
      expiry_date: form.expiry_date || null, requires_prescription: form.requires_prescription,
      description: form.description || null, description_bn: form.description_bn || null,
      image_url: form.image_url || null,
    };

    try {
      if (isEdit) {
        await api.products.update(product.id, payload);
      } else {
        await api.products.create(payload);
      }
    } catch (e: any) {
      setSaving(false);
      toast.error("Failed: " + (e.message || ""));
      return;
    }

    setSaving(false);
    toast.success(isEdit ? "Product updated!" : "Product added!");
    onOpenChange(false);
    onSaved();
  };

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Product Image</Label>
            <ImageUpload currentUrl={form.image_url} onUploaded={(url) => set("image_url", url)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name (English) *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Name (বাংলা)</Label>
              <Input value={form.name_bn} onChange={(e) => set("name_bn", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Generic Name</Label>
            <Input value={form.generic_name} onChange={(e) => set("generic_name", e.target.value)} placeholder="e.g. Paracetamol 500mg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Price (৳)</Label>
              <Input type="number" min={0} step={0.01} value={form.price} onChange={(e) => set("price", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Current Stock</Label>
              <Input type="number" min={0} value={form.stock} onChange={(e) => set("stock", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Min Stock</Label>
              <Input type="number" min={0} value={form.min_stock} onChange={(e) => set("min_stock", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Batch No.</Label>
              <Input value={form.batch_number} onChange={(e) => set("batch_number", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input type="date" value={form.expiry_date} onChange={(e) => set("expiry_date", e.target.value)} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={form.requires_prescription} onCheckedChange={(v) => set("requires_prescription", v)} />
              <Label>Requires Prescription</Label>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description (English)</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description (বাংলা)</Label>
            <Textarea rows={2} value={form.description_bn} onChange={(e) => set("description_bn", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : isEdit ? "Update" : "Add Product"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
