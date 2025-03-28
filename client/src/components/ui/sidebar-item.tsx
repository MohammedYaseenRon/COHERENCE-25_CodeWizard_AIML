"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

export function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      className={cn(
        "flex items-center w-full p-2 rounded-md transition-colors",
        active ? "bg-blue-600/20 text-blue-400" : "hover:bg-gray-800"
      )}
      onClick={onClick}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
