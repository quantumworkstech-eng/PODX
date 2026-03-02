"use client";

import { useState, useEffect, useRef } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Users,
  DollarSign,
  Image as ImageIcon,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Studio {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  price_per_hour: number;
  capacity: number;
  equipment?: string[];
  images: string[];
  status: "active" | "inactive";
}

const equipmentOptions = [
  "Microphones",
  "Headphones",
  "Audio Interface",
  "Mixer",
  "Pop Filters",
  "Boom Arm",
  "Acoustic Panels",
  "Video Camera",
  "Lighting Kit",
  "Green Screen",
  "Teleprompter",
  "Monitor",
];


export default function PartnerStudiosPage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Studio> & { status?: "active" | "inactive" }>({
    name: "",
    description: "",
    address: "",
    city: "",
    price_per_hour: 0,
    capacity: 2,
    equipment: [],
    images: [],
    status: "active",
  });

  useEffect(() => {
    fetch("/api/partner/studios")
      .then((r) => r.json())
      .then((d) => setStudios(d.studios || []))
      .catch(console.error)
      .finally(() => setIsFetching(false));
  }, []);

  const handleOpenModal = (studio?: Studio) => {
    if (studio) {
      setEditingStudio(studio);
      setFormData(studio);
    } else {
      setEditingStudio(null);
      setFormData({
        name: "",
        description: "",
        address: "",
        city: "",
        price_per_hour: 0,
        capacity: 2,
        equipment: [],
        images: [],
        status: "active",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudio(null);
    setFormData({
      name: "",
      description: "",
      address: "",
      city: "",
      price_per_hour: 0,
      capacity: 2,
      equipment: [],
      images: [],
      status: "active",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingStudio) {
        await fetch(`/api/partner/studios/${editingStudio.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            address: formData.address,
            city: formData.city,
            pricePerHour: formData.price_per_hour,
            capacity: formData.capacity,
            images: formData.images,
            is_active: formData.status !== "inactive",
          }),
        });
      }
      // Refresh list from API
      const r = await fetch("/api/partner/studios");
      const d = await r.json();
      setStudios(d.studios || []);
    } catch (err) {
      console.error("Failed to save studio:", err);
    }

    setIsLoading(false);
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/partner/studios/${id}`, { method: "DELETE" });
      setStudios((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete studio:", err);
    }
    setDeleteConfirm(null);
  };

  const handleToggleStatus = async (id: string) => {
    const studio = studios.find((s) => s.id === id);
    if (!studio) return;
    const newActive = studio.status !== "active";
    try {
      await fetch(`/api/partner/studios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newActive }),
      });
      setStudios((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: (newActive ? "active" : "inactive") as "active" | "inactive" } : s
        )
      );
    } catch (err) {
      console.error("Failed to toggle studio status:", err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          newImages.push(reader.result as string);
          if (newImages.length === files.length) {
            setFormData((prev) => ({ ...prev, images: [...(prev.images || []), ...newImages] }));
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images?.filter((_, i) => i !== index) }));
  };

  const toggleEquipment = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment?.includes(item) ? prev.equipment.filter((e) => e !== item) : [...(prev.equipment || []), item],
    }));
  };

  const nextImage = (studioId: string, totalImages: number) => {
    setCurrentImageIndex((prev) => ({ ...prev, [studioId]: ((prev[studioId] || 0) + 1) % totalImages }));
  };

  const prevImage = (studioId: string, totalImages: number) => {
    setCurrentImageIndex((prev) => ({ ...prev, [studioId]: ((prev[studioId] || 0) - 1 + totalImages) % totalImages }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Studios</h2>
          <p className="text-white/40">Manage your podcast studio listings</p>
        </div>
        <Link href="/partner/studios/create" className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold px-4 py-2 rounded-full inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add Studio
        </Link>
      </div>

      {isFetching ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : studios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studios.map((studio) => (
            <div key={studio.id} className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all group">
              <div className="relative h-48 bg-white/5">
                {studio.images && studio.images.length > 0 ? (
                  <>
                    <img src={studio.images[currentImageIndex[studio.id] || 0]} alt={studio.name} className="w-full h-full object-cover" />
                    {studio.images.length > 1 && (
                      <>
                        <button onClick={() => prevImage(studio.id, studio.images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => nextImage(studio.id, studio.images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {studio.images.map((_, idx) => (
                            <div key={idx} className={cn("w-1.5 h-1.5 rounded-full", idx === currentImageIndex[studio.id] ? "bg-[#D9FC67]" : "bg-white/30")} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-white/20" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button onClick={() => handleToggleStatus(studio.id)} className={cn("p-2 rounded-lg backdrop-blur-sm transition-colors", studio.status === "active" ? "bg-green-400/20 text-green-400" : "bg-white/10 text-white/40")}>
                    {studio.status === "active" ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">{studio.name}</h3>
                  <span className={cn("text-xs px-2 py-1 rounded-full", studio.status === "active" ? "bg-green-400/10 text-green-400" : "bg-white/10 text-white/40")}>
                    {studio.status}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-white/40 text-sm mb-3">
                  <MapPin className="w-4 h-4" />
                  {studio.address ? `${studio.address}, ` : ""}{studio.city}
                </div>

                <p className="text-white/60 text-sm line-clamp-2 mb-4">{studio.description}</p>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1 text-white/60 text-sm">
                    <Users className="w-4 h-4" />
                    {studio.capacity}
                  </div>
                  <div className="flex items-center gap-1 text-[#D9FC67] font-semibold">
                    <DollarSign className="w-4 h-4" />
                    {studio.price_per_hour}/hr
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleOpenModal(studio)} variant="outline" size="sm" className="flex-1 border-white/10 text-white hover:bg-white/5">
                    <Pencil className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button onClick={() => setDeleteConfirm(studio.id)} variant="outline" size="sm" className="border-red-500/20 text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#141414] border border-white/5 rounded-2xl">
          <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No studios yet</h3>
          <p className="text-white/40 mb-6">Start by adding your first podcast studio</p>
          <Button onClick={() => handleOpenModal()} className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black">
            <Plus className="w-4 h-4 mr-2" /> Add Your First Studio
          </Button>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#141414] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">{editingStudio ? "Edit Studio" : "Add New Studio"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Studio Name *</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Nest Studio" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" required />
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe your studio..." className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-[#D9FC67] focus:outline-none resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">City *</label>
                  <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="e.g., Mumbai" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" required />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Address</label>
                  <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Full address" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Price per Hour (₹) *</label>
                  <Input type="number" value={formData.price_per_hour} onChange={(e) => setFormData({ ...formData, price_per_hour: parseInt(e.target.value) || 0 })} placeholder="1500" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" required />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Capacity *</label>
                  <Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 2 })} placeholder="4" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" required />
                </div>
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Equipment</label>
                <div className="flex flex-wrap gap-2">
                  {equipmentOptions.map((item) => (
                    <button key={item} type="button" onClick={() => toggleEquipment(item)} className={cn("px-3 py-1.5 rounded-full text-sm transition-colors", formData.equipment?.includes(item) ? "bg-[#D9FC67] text-black" : "bg-white/5 text-white/60 hover:bg-white/10")}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Studio Photos</label>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center">
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[#D9FC67] hover:text-[#E8FF8A]">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm">Click to upload or drag and drop</span>
                  </button>
                </div>
                {formData.images && formData.images.length > 0 && (
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img src={img} alt={`Upload ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                        <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal} className="border-white/10 text-white hover:bg-white/5">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black">
                {isLoading ? "Saving..." : editingStudio ? "Update Studio" : "Create Studio"}
                {!isLoading && <Check className="w-4 h-4 ml-2" />}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-[#141414] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Studio</DialogTitle>
          </DialogHeader>
          <p className="text-white/60">Are you sure you want to delete this studio? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="border-white/10 text-white hover:bg-white/5">Cancel</Button>
            <Button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-500 hover:bg-red-600 text-white">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
