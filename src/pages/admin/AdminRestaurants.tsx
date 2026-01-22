import React, { useState } from "react";
import { Plus, Pencil, Trash2, Search, Star, MapPin } from "lucide-react";
import {
  useAllRestaurants,
  useCreateRestaurant,
  useUpdateRestaurant,
  useDeleteRestaurant,
} from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RestaurantForm {
  name: string;
  address: string;
  cuisines: string;
  cost_for_two: string;
  delivery_time: string;
  image_url: string;
  is_veg: boolean;
  rating: number;
  discount: string;
  latitude: number;
  longitude: number;
}

const defaultForm: RestaurantForm = {
  name: "",
  address: "",
  cuisines: "",
  cost_for_two: "₹500 for two",
  delivery_time: "25-30 mins",
  image_url: "",
  is_veg: false,
  rating: 4.0,
  discount: "",
  latitude: 12.9716,
  longitude: 77.5946,
};

const AdminRestaurants: React.FC = () => {
  const { data: restaurants, isLoading } = useAllRestaurants();
  const createRestaurant = useCreateRestaurant();
  const updateRestaurant = useUpdateRestaurant();
  const deleteRestaurant = useDeleteRestaurant();

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RestaurantForm>(defaultForm);

  const filteredRestaurants = restaurants?.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: form.name,
      address: form.address || undefined,
      cuisines: form.cuisines ? form.cuisines.split(",").map((c) => c.trim()) : undefined,
      cost_for_two: form.cost_for_two || undefined,
      delivery_time: form.delivery_time || undefined,
      image_url: form.image_url || undefined,
      is_veg: form.is_veg,
      rating: form.rating,
      discount: form.discount || undefined,
      latitude: form.latitude,
      longitude: form.longitude,
    };

    if (editingId) {
      await updateRestaurant.mutateAsync({ id: editingId, ...data });
    } else {
      await createRestaurant.mutateAsync(data);
    }

    setIsDialogOpen(false);
    setEditingId(null);
    setForm(defaultForm);
  };

  const handleEdit = (restaurant: any) => {
    setEditingId(restaurant.id);
    setForm({
      name: restaurant.name,
      address: restaurant.address || "",
      cuisines: restaurant.cuisines?.join(", ") || "",
      cost_for_two: restaurant.cost_for_two || "",
      delivery_time: restaurant.delivery_time || "",
      image_url: restaurant.image_url || "",
      is_veg: restaurant.is_veg || false,
      rating: restaurant.rating || 4.0,
      discount: restaurant.discount || "",
      latitude: restaurant.latitude || 12.9716,
      longitude: restaurant.longitude || 77.5946,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteRestaurant.mutateAsync(id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Restaurants</h2>
          <p className="text-muted-foreground">Manage all restaurants</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setForm(defaultForm);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Restaurant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Restaurant" : "Add New Restaurant"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuisines">Cuisines (comma-separated)</Label>
                  <Input
                    id="cuisines"
                    value={form.cuisines}
                    onChange={(e) => setForm({ ...form, cuisines: e.target.value })}
                    placeholder="Indian, Chinese, Italian"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost_for_two">Cost for Two</Label>
                  <Input
                    id="cost_for_two"
                    value={form.cost_for_two}
                    onChange={(e) => setForm({ ...form, cost_for_two: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_time">Delivery Time</Label>
                  <Input
                    id="delivery_time"
                    value={form.delivery_time}
                    onChange={(e) => setForm({ ...form, delivery_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount</Label>
                  <Input
                    id="discount"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    placeholder="20% OFF up to ₹50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_veg"
                  checked={form.is_veg}
                  onCheckedChange={(checked) => setForm({ ...form, is_veg: checked })}
                />
                <Label htmlFor="is_veg">Pure Veg Restaurant</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createRestaurant.isPending || updateRestaurant.isPending}>
                  {editingId ? "Update" : "Create"} Restaurant
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search restaurants..."
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead className="hidden md:table-cell">Cuisines</TableHead>
                <TableHead className="hidden sm:table-cell">Rating</TableHead>
                <TableHead className="hidden lg:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRestaurants?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No restaurants found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRestaurants?.map((restaurant) => (
                  <TableRow key={restaurant.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={restaurant.image_url || "/placeholder.svg"}
                          alt={restaurant.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-foreground">{restaurant.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {restaurant.address?.slice(0, 30) || "No address"}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-sm text-muted-foreground">
                        {restaurant.cuisines?.slice(0, 2).join(", ") || "N/A"}
                      </p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>{restaurant.rating || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        restaurant.is_active 
                          ? "bg-swiggy-green-light text-swiggy-green"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {restaurant.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(restaurant)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Restaurant?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{restaurant.name}" and all its menu items.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(restaurant.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminRestaurants;
