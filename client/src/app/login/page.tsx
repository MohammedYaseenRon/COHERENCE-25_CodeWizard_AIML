import LoginForm from '@/components/ui/login-form';
import { Suspense } from 'react';
import { Shield, Sparkles } from 'lucide-react';
 
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 animate-pulse blur-xl opacity-75"></div>
            
            <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl shadow-2xl">
              <div className="relative">
                <Shield className="w-8 h-8 text-white" />
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse" />
              </div>
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              SecureApp
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Your trusted platform
            </p>
          </div>
        </div>
        
        <Suspense fallback={
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}