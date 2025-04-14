import React from 'react';
import { Button } from '@/components/ui/button';
import { File } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const Navbar: React.FC = () => {
  const router = useRouter();

  return (
    <nav className="glass-nav fixed w-full z-50 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6 py-4 grid grid-cols-3 items-center">
        {/* Logo Section */}
        <motion.div
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <File className="h-8 w-8 text-purple-500" />
          <span className="text-xl font-bold tracking-tight">ATS Rankify</span>
        </motion.div>

        {/* Center Navigation */}
        <div className="flex justify-center space-x-4">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-gray-800 hover:text-purple-300"
          >
            Features
          </Button>
          <Button 
            variant="ghost" 
            className="text-white hover:bg-gray-800 hover:text-purple-300"
          >
            Pricing
          </Button>
        </div>

        {/* Sign In Section */}
        <div className="flex justify-end">
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"
              onClick={() => router.push("/userpage")}
            >
              Get Started
            </Button>
          </motion.div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;