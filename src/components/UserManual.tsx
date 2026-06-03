import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ManualEntry {
  title: string;
  content: string;
}

interface UserManualProps {
  page: "products" | "inventory" | "pos" | "general";
}

const manuals: Record<string, ManualEntry[]> = {
  products: [
    { title: "How to Add a Product", content: "1. Click 'Add Product' button\n2. Fill in name, generic name, category, price, stock\n3. Optionally add batch number, expiry date, image\n4. Click 'Add Product' to save" },
    { title: "How to Edit a Product", content: "1. Find the product in the table\n2. Click the pencil ✏️ icon\n3. Update the fields\n4. Click 'Update' to save changes" },
    { title: "How to Delete a Product", content: "1. Click the trash 🗑️ icon next to the product\n2. Confirm deletion in the popup\n⚠️ This cannot be undone!" },
    { title: "Bulk Import via Excel", content: "1. Click 'CSV Template' to download the template\n2. Fill in your products in Excel\n3. Click 'Bulk Import' and select your file\n4. Products will be added automatically" },
    { title: "Bulk Export", content: "1. Click 'Export Excel'\n2. All products will be downloaded as an Excel file\n3. Use this for backup or reporting" },
    { title: "Barcode Generation", content: "1. Click 'Barcodes' button\n2. Select products to generate barcodes for\n3. Click 'Print' to print barcode labels\n4. Use batch numbers for barcode scanning" },
    { title: "Product Image Upload", content: "1. Open Add/Edit product dialog\n2. Click the image upload area\n3. Select an image file (JPG, PNG)\n4. Image will be uploaded and displayed in the shop" },
  ],
  inventory: [
    { title: "Understanding Stock Levels", content: "🟢 In Stock: Current stock ≥ minimum stock\n🟡 Low Stock: Current stock < minimum but > 0\n🔴 Out of Stock: Current stock = 0" },
    { title: "Expiry Tracking", content: "Products expiring within 30 days are marked with ⚠️\nExpired products are marked with 🔴\nRegularly check the 'Expiring Soon' count" },
    { title: "Barcode Scanning", content: "1. Go to QR Scanner page\n2. Click 'Start Scanner'\n3. Point camera at barcode/QR on product\n4. Product details will appear automatically" },
    { title: "Bulk Barcode Print", content: "1. Click 'Print Barcodes' button\n2. Select products\n3. Print on label paper for shelf/product labeling" },
  ],
  pos: [
    { title: "Making a Sale", content: "1. Search for products or scan barcode\n2. Click product to add to cart\n3. Adjust quantities with +/- buttons\n4. Set discount if applicable\n5. Select payment method\n6. Click 'Complete Sale'" },
    { title: "Printing Receipt", content: "1. After completing a sale, click 'Print Receipt'\n2. A thermal-printer-ready receipt will open\n3. Optimized for 80mm thermal printers\n4. Includes pharmacy info, items, totals" },
    { title: "Scanning Products", content: "1. Use a USB barcode scanner (acts as keyboard)\n2. Click the search field\n3. Scan the barcode — product auto-added to cart\n4. Or use camera scanner via QR Scanner page" },
    { title: "Payment Methods", content: "Cash — for walk-in customers\nbKash — mobile banking\nNagad — mobile banking\nCard — debit/credit card" },
  ],
  general: [
    { title: "Getting Started", content: "1. Sign up with your email\n2. Wait for Super Admin approval\n3. Once approved, log in to access the system\n4. Staff accounts get POS, inventory, products access\n5. Customers can browse shop and place orders" },
    { title: "Need Help?", content: "Contact Super Admin via WhatsApp:\n📱 +8801873722228\nOr use the Help button in the admin panel" },
  ],
};

export function UserManual({ page }: UserManualProps) {
  const [open, setOpen] = useState(false);
  const entries = manuals[page] || manuals.general;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1">
        <HelpCircle className="h-3.5 w-3.5" /> User Guide
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📖 User Manual — {page.charAt(0).toUpperCase() + page.slice(1)}</DialogTitle>
          </DialogHeader>
          <Accordion type="single" collapsible className="w-full">
            {entries.map((entry, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-sm">{entry.title}</AccordionTrigger>
                <AccordionContent>
                  <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">{entry.content}</pre>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </DialogContent>
      </Dialog>
    </>
  );
}
