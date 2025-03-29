// components/layout/SidebarLayout.tsx
"use client";
import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

interface SidebarLayoutProps {
  children: React.ReactNode;
  userInitials: string;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children, userInitials }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isExpanded={isSidebarExpanded}
        onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      {/* Main content with dynamic margin based on sidebar width */}
      <div 
        className={`flex-1 overflow-auto transition-all duration-300 
        ${isSidebarExpanded ? 'ml-64' : 'ml-16'}`}
      >
        {/* Header */}
        {/* <Header userInitials={userInitials} /> */}

        {/* Main Content Area */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;