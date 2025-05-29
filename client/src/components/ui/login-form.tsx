'use client';
 
import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useActionState } from 'react';
import { authenticate } from '@/lib/actions';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
 
export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );
 
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Welcome back
        </CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Sign in to your account
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <AtSymbolIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Enter password"
                className="pl-10"
                required
                minLength={6}
              />
            </div>
          </div>
          
          <input type="hidden" name="redirectTo" value={callbackUrl} />
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isPending}
          >
            {isPending ? (
              "Signing in..."
            ) : (
              <>
                Sign in 
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          
          {errorMessage && (
            <Alert variant="destructive">
              <ExclamationCircleIcon className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="text-blue-600 hover:underline font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}