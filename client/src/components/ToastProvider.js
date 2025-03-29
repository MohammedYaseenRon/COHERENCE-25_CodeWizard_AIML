// app/components/ToastProvider.js
'use client';

import * as Toast from '@radix-ui/react-toast';
import { useState } from 'react';

const ToastProvider = ({ children }) => {
  const [open, setOpen] = useState(false);

  const showToast = () => {
    setOpen(true);
    setTimeout(() => setOpen(false), 3000); // Close after 3 seconds
  };

  return (
    <Toast.Provider>
      {children}
      <Toast.Root open={open} onOpenChange={setOpen}>
        <Toast.Title>Success!</Toast.Title>
        <Toast.Description>This is a toast message from Radix UI</Toast.Description>
        <Toast.Close />
      </Toast.Root>
    </Toast.Provider>
  );
};

export default ToastProvider;
