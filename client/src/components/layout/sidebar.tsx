import React from 'react';
import { Button } from '@/components/ui/button';
import dynamic from "next/dynamic";
import { 
  Home, 
  FileText, 
  Briefcase, 
  Users, 
  MessageSquare, 
  BarChart, 
  Settings,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  isExpanded: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon, 
  label, 
  active = false, 
  isExpanded,
  onClick 
}) => {
  return (
    <div 
      className={`
        flex items-center p-3 cursor-pointer 
        hover:bg-gray-700 transition-all duration-300
        ${active ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}
        relative
      `}
      onClick={onClick}
    >
      {React.cloneElement(icon as React.ReactElement, {
        className: 'mr-3 w-5 h-5'
      })}
      <span className={`
        text-sm font-medium 
        absolute left-16 whitespace-nowrap
        transition-all duration-300
        ${isExpanded ? 'opacity-100 visible' : 'opacity-0 invisible'}
      `}>
        {label}
      </span>
    </div>
  );
};

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  isExpanded, 
  onToggleExpand 
}) => {
  const sidebarItems = [
    { icon: <Home />, label: 'Dashboard', key: 'dashboard' },
    { icon: <FileText />, label: 'Resumes', key: 'resumes' },
    { icon: <Briefcase />, label: 'Jobs', key: 'jobs' },
    { icon: <Users />, label: 'Candidates', key: 'candidates' },
    { icon: <MessageSquare />, label: 'Messages', key: 'messages' },
    { icon: <BarChart />, label: 'Analytics', key: 'analytics' }
  ];

  

  return (
    <div 
      className={`
        fixed left-0 top-0 h-full 
        bg-gray-800 
        transition-all duration-300 
        ${isExpanded ? 'w-64' : 'w-16'}
        z-50 shadow-lg
        flex flex-col
        overflow-hidden
      `}
    >
      <div className="p-4 text-white font-bold text-center relative flex items-center justify-between">
        <div className={`
          transition-all duration-300 flex-grow
          ${isExpanded ? 'opacity-100' : 'opacity-0'}
        `}>
          <span className="whitespace-nowrap">ResumeScan</span>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="
            text-white hover:bg-gray-700 
            w-8 h-8 
            flex items-center justify-center
            absolute right-2 top-1/2 -translate-y-1/2
          "
          onClick={onToggleExpand}
        >
          {isExpanded ? <ChevronsLeft className="w-5 h-5" /> : <ChevronsRight className="w-5 h-5" />}
        </Button>
      </div>

      <nav className="flex-grow">
        {sidebarItems.map((item) => (
          <SidebarItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            isExpanded={isExpanded}
            active={activeTab === item.label.toLowerCase()}
            onClick={() => onTabChange(item.label.toLowerCase())}
          />
        ))}
      </nav>

      <div className="p-3 border-t border-gray-700">
        <SidebarItem 
          icon={<Settings />} 
          label="Settings"
          isExpanded={isExpanded}
          onClick={() => onTabChange('settings')}
        />
      </div>
    </div>
  );
};

export default Sidebar;