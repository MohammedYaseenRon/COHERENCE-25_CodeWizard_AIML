"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import { useRouter } from "next/navigation";
interface SidebarLayoutProps {
  children: React.ReactNode;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${activeTab}`);
  }
  , [activeTab]);

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isExpanded={isSidebarExpanded}
        onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      <div 
        className={`flex-1 overflow-auto transition-all duration-300 
        ${isSidebarExpanded ? 'ml-64' : 'ml-16'}`}
      >
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;