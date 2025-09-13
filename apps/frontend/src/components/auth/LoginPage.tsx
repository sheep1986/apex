import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn } = useSupabaseAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setError('');
    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Redirect to dashboard on success
      navigate('/dashboard');
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Sign In
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="bg-red-900/20 border-red-900 text-red-400">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-emerald-500"
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-emerald-500 pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Sign In
              </Button>
            </form>
            
            <div className="mt-4 text-center text-sm text-gray-400">
              <Link
                to="/forgot-password"
                className="text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
            
            <div className="mt-2 text-center text-sm text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}