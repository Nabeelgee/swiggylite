import React, { useState } from "react";
import { Search, Eye, UserPlus } from "lucide-react";
import { useAllOrders, useUpdateOrderStatus } from "@/hooks/useAdmin";
import { useAvailableDeliveryPartners, useAssignDeliveryPartner, useOrderTrackingInfo } from "@/hooks/useDeliveryPartners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const ORDER_STATUSES = [
  { value: "placed", label: "Placed", color: "bg-yellow-100 text-yellow-700" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-700" },
  { value: "preparing", label: "Preparing", color: "bg-purple-100 text-purple-700" },
  { value: "ready_for_pickup", label: "Ready", color: "bg-indigo-100 text-indigo-700" },
  { value: "picked_up", label: "Picked Up", color: "bg-cyan-100 text-cyan-700" },
  { value: "on_the_way", label: "On the Way", color: "bg-orange-100 text-orange-700" },
  { value: "arriving", label: "Arriving", color: "bg-amber-100 text-amber-700" },
  { value: "delivered", label: "Delivered", color: "bg-swiggy-green-light text-swiggy-green" },
  { value: "cancelled", label: "Cancelled", color: "bg-destructive/10 text-destructive" },
];

interface AssignPartnerDialogProps {
  orderId: string;
  onClose: () => void;
}

const AssignPartnerDialog: React.FC<AssignPartnerDialogProps> = ({ orderId, onClose }) => {
  const { data: partners, isLoading: partnersLoading } = useAvailableDeliveryPartners();
  const { data: trackingInfo } = useOrderTrackingInfo(orderId);
  const assignPartner = useAssignDeliveryPartner();
  const [selectedPartner, setSelectedPartner] = useState<string>("");

  const handleAssign = async () => {
    if (!selectedPartner) return;
    
    await assignPartner.mutateAsync({
      orderId,
      partnerId: selectedPartner,
    });
    
    onClose();
  };

  const currentPartner = trackingInfo?.delivery_partners;

  return (
    <div className="space-y-4">
      {currentPartner && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Currently Assigned</p>
          <div className="flex items-center gap-2">
            <span className="text-lg">🛵</span>
            <div>
              <p className="font-medium text-foreground">{currentPartner.name}</p>
              <p className="text-xs text-muted-foreground">
                {currentPartner.vehicle_type} • {currentPartner.vehicle_number}
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          {currentPartner ? "Reassign to" : "Select Delivery Partner"}
        </label>
        <Select value={selectedPartner} onValueChange={setSelectedPartner}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a partner..." />
          </SelectTrigger>
          <SelectContent>
            {partnersLoading ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : partners?.length === 0 ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                No available partners
              </div>
            ) : (
              partners?.map((partner) => (
                <SelectItem key={partner.id} value={partner.id}>
                  <div className="flex items-center gap-2">
                    <span>🛵</span>
                    <span>{partner.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({partner.vehicle_type})
                    </span>
                    {partner.rating && (
                      <span className="text-xs text-yellow-600">
                        ★ {partner.rating}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          disabled={!selectedPartner || assignPartner.isPending}
        >
          {assignPartner.isPending ? "Assigning..." : "Assign Partner"}
        </Button>
      </div>
    </div>
  );
};

const AdminOrders: React.FC = () => {
  const { data: orders, isLoading } = useAllOrders();
  const updateOrderStatus = useUpdateOrderStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [assignDialogOrder, setAssignDialogOrder] = useState<string | null>(null);

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.restaurant_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (orderId: string, status: string) => {
    await updateOrderStatus.mutateAsync({ 
      orderId, 
      status: status as any 
    });
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = ORDER_STATUSES.find((s) => s.value === status);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo?.color || "bg-muted"}`}>
        {statusInfo?.label || status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Orders</h2>
        <p className="text-muted-foreground">View and manage all customer orders</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID or restaurant..."
            className="pl-10"
          />
        </div>
        <Select 
          value={statusFilter || "all"} 
          onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
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
                <TableHead>Order ID</TableHead>
                <TableHead className="hidden md:table-cell">Restaurant</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <p className="font-mono text-sm">#{order.id.slice(0, 8)}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-sm">{order.restaurant_name}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">₹{order.total_amount}</p>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-[130px] h-8 border-0 p-0 bg-transparent">
                          {getStatusBadge(order.status)}
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), "MMM d, h:mm a")}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Assign Partner Button */}
                        <Dialog 
                          open={assignDialogOrder === order.id}
                          onOpenChange={(open) => setAssignDialogOrder(open ? order.id : null)}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Assign Delivery Partner"
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Assign Delivery Partner</DialogTitle>
                              <DialogDescription>
                                Order #{order.id.slice(0, 8)} • {order.restaurant_name}
                              </DialogDescription>
                            </DialogHeader>
                            <AssignPartnerDialog 
                              orderId={order.id}
                              onClose={() => setAssignDialogOrder(null)}
                            />
                          </DialogContent>
                        </Dialog>

                        {/* View Order Button */}
                        <Link to={`/order/${order.id}`}>
                          <Button variant="ghost" size="icon" title="View Order">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
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

export default AdminOrders;
