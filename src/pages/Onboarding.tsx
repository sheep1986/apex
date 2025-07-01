import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Zap,
  Globe,
  Mic,
  Phone,
  Settings,
  Users,
  Target,
  Rocket,
  Clock,
  Award,
  Building,
  FileText,
  BarChart3,
  CreditCard,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const onboardingSteps = [
  {
    id: 1,
    title: 'Welcome to Apex',
    subtitle: 'Your AI calling platform setup',
    icon: Rocket,
    description: 'Get started in under 5 minutes'
  },
  {
    id: 2,
    title: 'Organization Setup',
    subtitle: 'Tell us about your business',
    icon: Building,
    description: 'Basic information to personalize your experience'
  },
  {
    id: 3,
    title: 'Use Case Selection',
    subtitle: 'What will you use AI calling for?',
    icon: Target,
    description: 'Choose your primary use case'
  },
  {
    id: 4,
    title: 'Quick Setup',
    subtitle: 'Essential configuration',
    icon: Zap,
    description: 'Phone numbers and basic settings'
  },
  {
    id: 5,
    title: 'Ready to Launch',
    subtitle: 'Your platform is configured',
    icon: Award,
    description: 'Start making intelligent calls'
  }
]

const useCases = [
  {
    id: 'lead-generation',
    name: 'Lead Generation',
    description: 'Generate and qualify sales leads',
    icon: Target,
    features: ['Cold calling', 'Lead qualification', 'Appointment booking'],
    complexity: 'Beginner'
  },
  {
    id: 'customer-service',
    name: 'Customer Service',
    description: 'Handle customer inquiries and support',
    icon: Users,
    features: ['FAQ handling', 'Issue resolution', 'Follow-up calls'],
    complexity: 'Beginner'
  },
  {
    id: 'appointment-booking',
    name: 'Appointment Booking',
    description: 'Schedule and manage appointments',
    icon: Calendar,
    features: ['Calendar integration', 'Reminder calls', 'Rescheduling'],
    complexity: 'Intermediate'
  },
  {
    id: 'surveys-feedback',
    name: 'Surveys & Feedback',
    description: 'Collect customer feedback and insights',
    icon: BarChart3,
    features: ['Survey calls', 'Response collection', 'Analytics'],
    complexity: 'Beginner'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Solutions',
    description: 'Custom AI calling for large organizations',
    icon: Building,
    features: ['Custom integrations', 'Advanced analytics', 'Multi-team support'],
    complexity: 'Advanced'
  }
]

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    organizationName: '',
    industry: '',
    phoneNumber: '',
    useCase: '',
    teamSize: '',
    monthlyCallVolume: '',
    primaryGoal: ''
  })
  const navigate = useNavigate()

  const progress = (currentStep / onboardingSteps.length) * 100

  const handleNext = () => {
    if (currentStep < onboardingSteps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding and redirect to dashboard
      navigate('/')
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              <div className="flex justify-center">
                <img 
                  src="/am-web-logo-white.png" 
                  alt="Apex AI Calling Platform" 
                  className="h-16 w-auto"
                />
              </div>
              <h2 className="text-3xl font-bold text-white">Welcome to Apex AI Calling Platform</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                The most user-friendly AI calling platform for agencies and businesses. 
                Get started in under 5 minutes and start making intelligent calls today.
              </p>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6 text-center">
                  <Zap className="w-8 h-8 text-brand-pink mx-auto mb-3" />
                  <h3 className="text-white font-semibold mb-2">5-Minute Setup</h3>
                  <p className="text-gray-400 text-sm">From signup to first call in under 5 minutes</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <h3 className="text-white font-semibold mb-2">No Technical Skills</h3>
                  <p className="text-gray-400 text-sm">Visual interface, no coding required</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-8 h-8 text-green-400 mx-auto mb-3" />
                  <h3 className="text-white font-semibold mb-2">Instant Results</h3>
                  <p className="text-gray-400 text-sm">Start seeing results from day one</p>
                </CardContent>
              </Card>
            </div>

            {/* Comparison */}
            <Card className="bg-gray-900/90 border-gray-700/60">
              <CardContent className="p-6">
                <h3 className="text-white font-bold text-lg mb-4 text-center">Why Choose Apex?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-brand-pink font-semibold mb-3">Apex AI Calling Platform</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center text-gray-300">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                        5-minute setup
                      </li>
                      <li className="flex items-center text-gray-300">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                        No coding required
                      </li>
                      <li className="flex items-center text-gray-300">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                        Pre-built templates
                      </li>
                      <li className="flex items-center text-gray-300">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                        Live support
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-gray-400 font-semibold mb-3">Other Platforms</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center text-gray-400">
                        <Clock className="w-4 h-4 mr-2 text-red-400" />
                        2+ weeks setup
                      </li>
                      <li className="flex items-center text-gray-400">
                        <FileText className="w-4 h-4 mr-2 text-red-400" />
                        JSON/Python coding
                      </li>
                      <li className="flex items-center text-gray-400">
                        <Settings className="w-4 h-4 mr-2 text-red-400" />
                        Build from scratch
                      </li>
                      <li className="flex items-center text-gray-400">
                        <Users className="w-4 h-4 mr-2 text-red-400" />
                        Discord support only
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Tell us about your organization</h2>
              <p className="text-gray-400">This helps us customize your AI calling experience</p>
            </div>
            
            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <Label className="text-gray-300">Organization Name *</Label>
                <Input 
                  value={formData.organizationName}
                  onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
                  placeholder="Enter your organization name"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Industry</Label>
                <Select value={formData.industry} onValueChange={(value) => setFormData({...formData, industry: value})}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="financial-services">Financial Services</SelectItem>
                    <SelectItem value="e-commerce">E-commerce</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="legal">Legal Services</SelectItem>
                    <SelectItem value="marketing-agency">Marketing Agency</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Team Size</Label>
                <Select value={formData.teamSize} onValueChange={(value) => setFormData({...formData, teamSize: value})}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select team size" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="1-5">1-5 people</SelectItem>
                    <SelectItem value="6-20">6-20 people</SelectItem>
                    <SelectItem value="21-50">21-50 people</SelectItem>
                    <SelectItem value="51-100">51-100 people</SelectItem>
                    <SelectItem value="100+">100+ people</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Monthly Call Volume</Label>
                <Select value={formData.monthlyCallVolume} onValueChange={(value) => setFormData({...formData, monthlyCallVolume: value})}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select expected call volume" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="0-100">0-100 calls</SelectItem>
                    <SelectItem value="101-500">101-500 calls</SelectItem>
                    <SelectItem value="501-1000">501-1,000 calls</SelectItem>
                    <SelectItem value="1001-5000">1,001-5,000 calls</SelectItem>
                    <SelectItem value="5000+">5,000+ calls</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">What's your primary use case?</h2>
              <p className="text-gray-400">Choose the main way you'll use AI calling</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {useCases.map((useCase) => (
                <div 
                  key={useCase.id}
                  className={`p-6 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                    formData.useCase === useCase.id 
                      ? 'border-brand-pink bg-brand-pink/10 shadow-lg shadow-brand-pink/20' 
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                  onClick={() => setFormData({...formData, useCase: useCase.id})}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${
                      formData.useCase === useCase.id 
                        ? 'bg-brand-pink/20' 
                        : 'bg-gray-700'
                    }`}>
                      <useCase.icon className="w-6 h-6 text-brand-pink" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-white font-semibold">{useCase.name}</h3>
                        <Badge className={`text-xs ${
                          useCase.complexity === 'Beginner' ? 'bg-green-900 text-green-400 border-green-800' :
                          useCase.complexity === 'Intermediate' ? 'bg-yellow-900 text-yellow-400 border-yellow-800' :
                          'bg-red-900 text-red-400 border-red-800'
                        }`}>
                          {useCase.complexity}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{useCase.description}</p>
                      <ul className="space-y-1">
                        {useCase.features.map((feature, index) => (
                          <li key={index} className="text-gray-300 text-xs flex items-center">
                            <CheckCircle className="w-3 h-3 mr-2 text-green-400" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Quick Setup</h2>
              <p className="text-gray-400">Let's configure the essentials</p>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Setup Progress */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Phone Number', status: 'ready', desc: 'We\'ll provision a number for you' },
                  { name: 'AI Voice', status: 'ready', desc: 'Professional voice selected' },
                  { name: 'Call Flow', status: 'ready', desc: 'Template based on your use case' },
                  { name: 'Analytics', status: 'ready', desc: 'Real-time tracking enabled' }
                ].map((item, index) => (
                  <div key={index} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{item.name}</span>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
              
              {/* Primary Goal */}
              <div className="space-y-2">
                <Label className="text-gray-300">What's your primary goal with AI calling?</Label>
                <Select value={formData.primaryGoal} onValueChange={(value) => setFormData({...formData, primaryGoal: value})}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select your primary goal" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="increase-sales">Increase Sales</SelectItem>
                    <SelectItem value="reduce-costs">Reduce Costs</SelectItem>
                    <SelectItem value="improve-efficiency">Improve Efficiency</SelectItem>
                    <SelectItem value="better-customer-service">Better Customer Service</SelectItem>
                    <SelectItem value="scale-operations">Scale Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Test Call Option */}
              <Card className="bg-gradient-to-r from-brand-pink/10 to-brand-magenta/10 border-brand-pink/20">
                <CardContent className="p-6 text-center">
                  <h3 className="text-white font-bold text-lg mb-2">Ready to test your setup?</h3>
                  <p className="text-gray-300 mb-4">
                    Make a test call to verify everything is working perfectly
                  </p>
                  <Button className="bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink">
                    <Phone className="w-4 h-4 mr-2" />
                    Start Test Call
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-green-500/20 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white">You're All Set!</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Your Apex AI Calling Platform is configured and ready to use. 
                Start making intelligent calls immediately.
              </p>
            </div>

            {/* What's Next */}
            <div className="max-w-2xl mx-auto">
              <Card className="bg-gradient-to-r from-brand-pink/10 to-brand-magenta/10 border-brand-pink/20">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold text-lg mb-4">What's Next?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-brand-pink/20 rounded-lg">
                          <Phone className="w-4 h-4 text-brand-pink" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-white font-medium">Start Making Calls</h4>
                          <p className="text-gray-400 text-sm">Begin your first campaign</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <BarChart3 className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-white font-medium">Monitor Performance</h4>
                          <p className="text-gray-400 text-sm">Track results in real-time</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <Settings className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-white font-medium">Customize Flows</h4>
                          <p className="text-gray-400 text-sm">Optimize for your needs</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <Users className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-white font-medium">Invite Team</h4>
                          <p className="text-gray-400 text-sm">Add team members</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <Button variant="outline" className="h-auto p-4 flex-col space-y-2 border-gray-700 text-gray-300 hover:text-white">
                <Phone className="w-6 h-6" />
                <span>Create Campaign</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col space-y-2 border-gray-700 text-gray-300 hover:text-white">
                <FileText className="w-6 h-6" />
                <span>Upload Leads</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col space-y-2 border-gray-700 text-gray-300 hover:text-white">
                <BarChart3 className="w-6 h-6" />
                <span>View Analytics</span>
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gray-925 border-b border-gray-800 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="/am-web-logo-white.png" 
              alt="Apex AI Calling Platform" 
              className="h-8 w-auto"
            />
            <div>
              <h1 className="text-lg font-bold text-white">Apex Setup</h1>
              <p className="text-sm text-gray-400">Step {currentStep} of {onboardingSteps.length}</p>
            </div>
          </div>
          <Badge className="bg-green-900 text-green-400 border-green-800">
            5-minute setup
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-925 px-6 pb-6">
        <div className="max-w-4xl mx-auto">
          <Progress value={progress} className="h-2 bg-gray-800" />
          <div className="flex justify-between mt-2">
            {onboardingSteps.map((step) => (
              <div 
                key={step.id}
                className={`flex items-center space-x-2 ${
                  step.id <= currentStep ? 'text-brand-pink' : 'text-gray-400'
                }`}
              >
                <step.icon className="w-4 h-4" />
                <span className="text-xs hidden md:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {renderStepContent()}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-925 border-t border-gray-800 p-6">
        <div className="max-w-4xl mx-auto flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="border-gray-700 text-gray-300 hover:text-white disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              {currentStep === onboardingSteps.length 
                ? 'Ready to launch!' 
                : `${Math.round(progress)}% complete`
              }
            </p>
          </div>
          
          <Button 
            onClick={handleNext}
            className="bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink"
          >
            {currentStep === onboardingSteps.length ? 'Launch Dashboard' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
} 