import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Plus, 
  Truck, 
  User, 
  Phone, 
  Star, 
  Edit,
  Trash2,
  Search,
  Users
} from "lucide-react";

interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string | null;
  vehicle_number: string | null;
  is_available: boolean | null;
  rating: number | null;
  avatar_url: string | null;
  employment_type?: string;
  incentive_rate?: number;
}

const AdminDeliveryPartners: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<DeliveryPartner | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    vehicle_type: "Bike",
    vehicle_number: "",
    employment_type: "full_time",
    incentive_rate: 50,
    is_available: true,
  });

  const { data: partners, isLoading } = useQuery({
    queryKey: ["admin-delivery-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_partners")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as DeliveryPartner[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("delivery_partners").insert({
        name: data.name,
        phone: data.phone,
        vehicle_type: data.vehicle_type,
        vehicle_number: data.vehicle_number,
        employment_type: data.employment_type,
        incentive_rate: data.incentive_rate,
        is_available: data.is_available,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-partners"] });
      toast.success("Delivery partner added successfully!");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("delivery_partners")
        .update({
          name: data.name,
          phone: data.phone,
          vehicle_type: data.vehicle_type,
          vehicle_number: data.vehicle_number,
          employment_type: data.employment_type,
          incentive_rate: data.incentive_rate,
          is_available: data.is_available,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-partners"] });
      toast.success("Delivery partner updated!");
      resetForm();
      setIsDialogOpen(false);
      setEditingPartner(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("delivery_partners")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-partners"] });
      toast.success("Delivery partner deleted!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      vehicle_type: "Bike",
      vehicle_number: "",
      employment_type: "full_time",
      incentive_rate: 50,
      is_available: true,
    });
  };

  const handleEdit = (partner: DeliveryPartner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      phone: partner.phone,
      vehicle_type: partner.vehicle_type || "Bike",
      vehicle_number: partner.vehicle_number || "",
      employment_type: partner.employment_type || "full_time",
      incentive_rate: partner.incentive_rate || 50,
      is_available: partner.is_available ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPartner) {
      updateMutation.mutate({ id: editingPartner.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredPartners = partners?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm)
  );

  const stats = {
    total: partners?.length || 0,
    available: partners?.filter((p) => p.is_available).length || 0,
    fullTime: partners?.filter((p) => (p.employment_type || "full_time") === "full_time").length || 0,
    partTime: partners?.filter((p) => p.employment_type === "part_time").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Delivery Partners</h1>
          <p className="text-muted-foreground">Manage your delivery team</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingPartner(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Partner
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPartner ? "Edit Delivery Partner" : "Add Delivery Partner"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_type">Vehicle Type</Label>
                  <Select
                    value={formData.vehicle_type}
                    onValueChange={(v) => setFormData({ ...formData, vehicle_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bike">Bike</SelectItem>
                      <SelectItem value="Scooter">Scooter</SelectItem>
                      <SelectItem value="Bicycle">Bicycle</SelectItem>
                      <SelectItem value="Car">Car</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_number">Vehicle Number</Label>
                  <Input
                    id="vehicle_number"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                    placeholder="TN XX AB 1234"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employment_type">Employment Type</Label>
                  <Select
                    value={formData.employment_type}
                    onValueChange={(v) => setFormData({ ...formData, employment_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incentive_rate">Incentive (₹/delivery)</Label>
                  <Input
                    id="incentive_rate"
                    type="number"
                    value={formData.incentive_rate}
                    onChange={(e) => setFormData({ ...formData, incentive_rate: Number(e.target.value) })}
                    placeholder="50"
                    min={0}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="rounded border-border"
                />
                <Label htmlFor="is_available" className="font-normal">
                  Available for deliveries
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingPartner(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingPartner ? "Update" : "Add"} Partner
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Partners</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Truck className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.available}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.fullTime}</p>
                <p className="text-sm text-muted-foreground">Full Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <User className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.partTime}</p>
                <p className="text-sm text-muted-foreground">Part Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Delivery Partners</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredPartners && filteredPartners.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Incentive</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-medium">{partner.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {partner.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{partner.vehicle_type || "Bike"}</p>
                          {partner.vehicle_number && (
                            <p className="text-xs text-muted-foreground">{partner.vehicle_number}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={partner.employment_type === "part_time" ? "secondary" : "default"}>
                          {partner.employment_type === "part_time" ? "Part Time" : "Full Time"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">₹{partner.incentive_rate || 50}</span>
                        <span className="text-muted-foreground text-xs">/delivery</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={partner.is_available ? "default" : "secondary"}>
                          {partner.is_available ? "Available" : "Offline"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{partner.rating || "4.5"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(partner)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("Delete this partner?")) {
                                deleteMutation.mutate(partner.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No delivery partners found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDeliveryPartners;
