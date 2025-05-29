'use client';

import {
  AtSymbolIcon,
  KeyIcon,
  UserIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActionState } from 'react';
import { signUp } from '@/lib/actions';
import { useState } from 'react';
import Link from 'next/link';

export default function SignupForm() {
  const [state, formAction, isPending] = useActionState(signUp, undefined);
  const [role, setRole] = useState<string>('');

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Create your account
        </CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Join our platform as an HR or candidate
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                name="name"
                placeholder="Enter your full name"
                className="pl-10"
                required
              />
            </div>
          </div>

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
            <Label htmlFor="role">I am a</Label>
            <Select name="role" value={role} onValueChange={setRole} required>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="candidate">Job Candidate</SelectItem>
                <SelectItem value="hr">HR Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Create a password"
                className="pl-10"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                className="pl-10"
                required
                minLength={6}
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isPending}
          >
            {isPending ? "Creating account..." : "Create Account"}
          </Button>
          
          {state?.message && (
            <Alert variant={state.success ? "default" : "destructive"}>
              {state.success ? (
                <CheckCircleIcon className="h-4 w-4" />
              ) : (
                <ExclamationCircleIcon className="h-4 w-4" />
              )}
              <AlertDescription>
                {state.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}