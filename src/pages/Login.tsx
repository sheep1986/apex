import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowRight,
  Phone,
  Zap,
  Shield
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate login process
    setTimeout(() => {
      setIsLoading(false)
      // Redirect to dashboard (in real app, this would handle actual authentication)
      window.location.href = '/'
    }, 2000)
  }

  const handleGoogleLogin = () => {
    // Handle Google OAuth login
    console.log('Google login clicked')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black opacity-50" />
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding & Features */}
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src="/am-web-logo-white.png" 
              alt="AI Calling Platform" 
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">AI Calling Platform</h1>
              <p className="text-gray-400 text-sm">Intelligent Voice Solutions</p>
            </div>
          </div>

          {/* Hero Text */}
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
              Transform Your
              <span className="block bg-gradient-to-r from-brand-pink to-brand-magenta bg-clip-text text-transparent">
                Business Calls
              </span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Join thousands of organizations using AI-powered calling to increase conversions, 
              reduce costs, and scale their outreach efforts.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-brand-pink/20 to-brand-magenta/20 rounded-lg border border-brand-pink/30">
                <Phone className="w-5 h-5 text-brand-pink" />
              </div>
              <div>
                <h3 className="text-white font-medium">Smart AI Agents</h3>
                <p className="text-gray-400 text-sm">Advanced conversation AI that adapts to your business needs</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Real-time Analytics</h3>
                <p className="text-gray-400 text-sm">Track performance and optimize campaigns with live insights</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Enterprise Security</h3>
                <p className="text-gray-400 text-sm">Bank-grade security with compliance features built-in</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
              <CardDescription className="text-gray-400">
                Sign in to your AI calling platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Login Button */}
              <Button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 border-0"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full bg-gray-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-900 px-2 text-gray-400">or</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-brand-pink focus:ring-brand-pink"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-brand-pink focus:ring-brand-pink"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 text-brand-pink bg-gray-800 border-gray-600 rounded focus:ring-brand-pink focus:ring-2"
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-300">
                      Remember me
                    </Label>
                  </div>
                  <Link to="/forgot-password" className="text-sm text-brand-pink hover:text-brand-magenta">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink text-white"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-brand-pink hover:text-brand-magenta font-medium">
                    Create account
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-xs">
              By signing in, you agree to our{' '}
              <Link to="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
