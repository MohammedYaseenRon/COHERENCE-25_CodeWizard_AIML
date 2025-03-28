"use client";

import React, { useState } from 'react';
import {
  Home,
  FileText,
  Briefcase,
  Users,
  MessageSquare,
  BarChart,
  Settings,
  X,
  Menu
} from 'lucide-react';

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab = 'dashboard',
  onTabChange = () => {}
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const sidebarItems = [
    { icon: <Home />, label: 'Dashboard', key: 'dashboard' },
    { icon: <FileText />, label: 'Resumes', key: 'resumes' },
    { icon: <Briefcase />, label: 'Jobs', key: 'jobs' },
    { icon: <Users />, label: 'Candidates', key: 'candidates' },
    { icon: <MessageSquare />, label: 'Messages', key: 'messages' },
    { icon: <BarChart />, label: 'Analytics', key: 'analytics' }
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        onClick={toggleSidebar} 
        className="
          fixed 
          top-4 
          left-4 
          z-50 
          bg-gray-800 
          p-2 
          rounded-md 
          text-white 
          lg:hidden
        "
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <div
        className={`
          w-16 lg:w-64
          bg-gray-800
          h-full
          fixed
          left-0
          top-0
          z-40
          transition-all
          duration-300
          overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full relative">
          {/* Close Button for Large Screens */}
          <button 
            onClick={toggleSidebar} 
            className="
              absolute 
              top-4 
              right-4 
              hidden 
              lg:block 
              text-white 
              hover:text-gray-300
            "
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-4 text-white font-bold text-center">
            <span className="hidden lg:inline">ResumeScan</span>
          </div>

          <nav className="flex-grow">
            {sidebarItems.map((item) => (
              <div
                key={item.key}
                className={`
                  flex items-center p-3 cursor-pointer
                  ${activeTab === item.key ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}
                  hover:bg-gray-700 transition-colors
                `}
                onClick={() => onTabChange(item.key)}
              >
                {React.cloneElement(item.icon as React.ReactElement, {
                  className: 'mr-3 w-5 h-5'
                })}
                <span className="text-sm font-medium hidden lg:inline">{item.label}</span>
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-700">
            <div
              className={`
                flex items-center p-3 cursor-pointer
                ${activeTab === 'settings' ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}
                hover:bg-gray-700 transition-colors
              `}
              onClick={() => onTabChange('settings')}
            >
              <Settings className="mr-3 w-5 h-5" />
              <span className="text-sm font-medium hidden lg:inline">Settings</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;