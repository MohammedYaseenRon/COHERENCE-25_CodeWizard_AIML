import React, { useState } from 'react';
import { 
  Home, 
  FileText, 
  Briefcase, 
  Users, 
  MessageSquare, 
  BarChart, 
  Settings 
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon, 
  label, 
  active = false, 
  onClick 
}) => {
  return (
    <div 
      className={`
        flex items-center p-3 cursor-pointer 
        hover:bg-gray-700 transition-all duration-200 
        ${active ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}
      `}
      onClick={onClick}
    >
      {React.cloneElement(icon as React.ReactElement, {
        className: 'mr-3 w-5 h-5'
      })}
      <span className="text-sm font-medium hidden md:inline">{label}</span>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState('Dashboard');

  const sidebarItems = [
    { icon: <Home />, label: 'Dashboard' },
    { icon: <FileText />, label: 'Resumes' },
    { icon: <Briefcase />, label: 'Jobs' },
    { icon: <Users />, label: 'Candidates' },
    { icon: <MessageSquare />, label: 'Messages' },
    { icon: <BarChart />, label: 'Analytics' }
  ];

  return (
    <div 
      className={`
        fixed left-0 top-0 h-full 
        bg-gray-800 
        transition-all duration-300 
        ${isExpanded ? 'w-64' : 'w-16'}
        z-50 shadow-lg
      `}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 text-white font-bold text-center">
          <span className={`
            transition-opacity duration-300 
            ${isExpanded ? 'opacity-100' : 'opacity-0'}
          `}>
            ResumeScan
          </span>
        </div>

        <nav className="flex-grow">
          {sidebarItems.map((item) => (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              active={activeItem === item.label}
              onClick={() => setActiveItem(item.label)}
            />
          ))}
        </nav>

        <div className="p-3 border-t border-gray-700">
          <SidebarItem 
            icon={<Settings />} 
            label="Settings"
            onClick={() => setActiveItem('Settings')}
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;