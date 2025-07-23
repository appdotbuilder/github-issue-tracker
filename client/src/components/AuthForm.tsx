
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { LoginUserInput, RegisterUserInput } from '../../../server/src/schema';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: LoginUserInput | RegisterUserInput) => Promise<void>;
  isLoading?: boolean;
}

export function AuthForm({ mode, onSubmit, isLoading = false }: AuthFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await onSubmit(formData);
    } catch {
      setError(mode === 'login' ? 'Invalid credentials' : 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          placeholder="Enter your email"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, password: e.target.value }))
          }
          placeholder="Enter your password"
          minLength={mode === 'register' ? 6 : undefined}
          required
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
      </Button>
    </form>
  );
}
