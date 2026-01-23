import React, { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import {
  useAllMenuItems,
  useAllRestaurants,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
} from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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

interface MenuItemForm {
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_veg: boolean;
  is_bestseller: boolean;
  is_available: boolean;
}

const defaultForm: MenuItemForm = {
  restaurant_id: "",
  name: "",
  description: "",
  price: 0,
  category: "",
  image_url: "",
  is_veg: true,
  is_bestseller: false,
  is_available: true,
};

const AdminMenuItems: React.FC = () => {
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");
  const { data: restaurants } = useAllRestaurants();
  const { data: menuItems, isLoading } = useAllMenuItems(selectedRestaurant || undefined);
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuItemForm>(defaultForm);

  const filteredItems = menuItems?.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      await updateMenuItem.mutateAsync({
        id: editingId,
        name: form.name,
        description: form.description || undefined,
        price: form.price,
        category: form.category,
        image_url: form.image_url || undefined,
        is_veg: form.is_veg,
        is_bestseller: form.is_bestseller,
        is_available: form.is_available,
      });
    } else {
      await createMenuItem.mutateAsync({
        restaurant_id: form.restaurant_id,
        name: form.name,
        description: form.description || undefined,
        price: form.price,
        category: form.category,
        image_url: form.image_url || undefined,
        is_veg: form.is_veg,
        is_bestseller: form.is_bestseller,
      });
    }

    setIsDialogOpen(false);
    setEditingId(null);
    setForm(defaultForm);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      restaurant_id: item.restaurant_id,
      name: item.name,
      description: item.description || "",
      price: item.price,
      category: item.category,
      image_url: item.image_url || "",
      is_veg: item.is_veg ?? true,
      is_bestseller: item.is_bestseller ?? false,
      is_available: item.is_available ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteMenuItem.mutateAsync(id);
  };

  const getRestaurantName = (restaurantId: string) => {
    return restaurants?.find((r) => r.id === restaurantId)?.name || "Unknown";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Menu Items</h2>
          <p className="text-muted-foreground">Manage menu items for all restaurants</p>
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
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Menu Item" : "Add New Menu Item"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingId && (
                <div className="space-y-2">
                  <Label htmlFor="restaurant">Restaurant *</Label>
                  <Select
                    value={form.restaurant_id}
                    onValueChange={(value) => setForm({ ...form, restaurant_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select restaurant" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants?.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Starters, Main Course, Desserts..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
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

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_veg"
                    checked={form.is_veg}
                    onCheckedChange={(checked) => setForm({ ...form, is_veg: checked })}
                  />
                  <Label htmlFor="is_veg">Vegetarian</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_bestseller"
                    checked={form.is_bestseller}
                    onCheckedChange={(checked) => setForm({ ...form, is_bestseller: checked })}
                  />
                  <Label htmlFor="is_bestseller">Bestseller</Label>
                </div>
                {editingId && (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_available"
                      checked={form.is_available}
                      onCheckedChange={(checked) => setForm({ ...form, is_available: checked })}
                    />
                    <Label htmlFor="is_available">Available</Label>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMenuItem.isPending || updateMenuItem.isPending}>
                  {editingId ? "Update" : "Create"} Item
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="pl-10"
          />
        </div>
        <Select 
          value={selectedRestaurant || "all"} 
          onValueChange={(value) => setSelectedRestaurant(value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="All Restaurants" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Restaurants</SelectItem>
            {restaurants?.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                <TableHead>Item</TableHead>
                <TableHead className="hidden md:table-cell">Restaurant</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No menu items found
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 border-2 rounded-sm ${
                          item.is_veg ? "border-swiggy-green" : "border-destructive"
                        }`}>
                          <div className={`w-1.5 h-1.5 m-0.5 rounded-full ${
                            item.is_veg ? "bg-swiggy-green" : "bg-destructive"
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          {item.is_bestseller && (
                            <span className="text-xs text-primary">★ Bestseller</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-sm text-muted-foreground">
                        {getRestaurantName(item.restaurant_id)}
                      </p>
                    </TableCell>
                    <TableCell>₹{item.price}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">{item.category}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.is_available 
                          ? "bg-swiggy-green-light text-swiggy-green"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {item.is_available ? "Available" : "Unavailable"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
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
                              <AlertDialogTitle>Delete Menu Item?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{item.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(item.id)}
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

export default AdminMenuItems;
