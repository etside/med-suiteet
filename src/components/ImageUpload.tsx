import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
}

export function ImageUpload({ currentUrl, onUploaded }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max file size is 5MB"); return; }

    setUploading(true);
    try {
      const url = await api.upload(file);
      setPreview(url);
      onUploaded(url);
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    }
    setUploading(false);
  };

  const clearImage = () => {
    setPreview(null);
    onUploaded("");
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
          <img src={preview} alt="Product" className="w-full h-full object-cover" />
          <Button variant="destructive" size="icon" className="absolute top-0.5 right-0.5 h-5 w-5" onClick={clearImage}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <label className="flex items-center justify-center w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors">
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          <div className="text-center">
            <Upload className="h-5 w-5 mx-auto text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{uploading ? "..." : "Upload"}</span>
          </div>
        </label>
      )}
    </div>
  );
}
