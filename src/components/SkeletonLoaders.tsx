import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const RestaurantCardSkeleton: React.FC = () => (
  <div className="bg-card rounded-2xl overflow-hidden swiggy-shadow">
    <Skeleton className="h-40 sm:h-48 w-full" />
    <div className="p-3 sm:p-4 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);

export const MenuItemSkeleton: React.FC = () => (
  <div className="flex gap-4 p-4 bg-card rounded-xl">
    <div className="flex-1 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <Skeleton className="w-24 h-24 rounded-lg" />
  </div>
);

export const OrderCardSkeleton: React.FC = () => (
  <div className="bg-card rounded-2xl p-4 space-y-4 swiggy-shadow">
    <div className="flex items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-9 flex-1 rounded-lg" />
      <Skeleton className="h-9 flex-1 rounded-lg" />
    </div>
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <Skeleton className="w-20 h-20 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

export const DashboardStatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-card rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <Skeleton className="w-12 h-4" />
        </div>
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="bg-card rounded-xl p-6 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
    <div className="h-[300px] flex items-end gap-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t"
          style={{ height: `${Math.random() * 80 + 20}%` }}
        />
      ))}
    </div>
  </div>
);
