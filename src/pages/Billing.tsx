import { useState } from 'react'
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  Plus,
  Minus,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  BarChart3,
  Phone,
  Mic,
  Target,
  Users,
  Zap,
  Receipt,
  Wallet,
  Gift,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
// Removed useBalance import - using mock data instead

interface BillingData {
  currentBalance: number
  monthlyUsage: number
  monthlyBudget: number
  usageBreakdown: {
    campaigns: number
    vapi: number
    crm: number
    analytics: number
  }
  recentTransactions: {
    id: string
    type: 'credit' | 'debit'
    amount: number
    description: string
    date: string
    status: 'completed' | 'pending' | 'failed'
  }[]
  billingHistory: {
    month: string
    total: number
    calls: number
    successRate: number
  }[]
  plans: {
    id: string
    name: string
    price: number
    credits: number
    features: string[]
    popular?: boolean
  }[]
}

export function Billing() {
  // Mock balance data - in real app this would come from context
  const [balance, setBalance] = useState(1247.00)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [topUpAmount, setTopUpAmount] = useState('')
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  
  const [data, setData] = useState<BillingData>({
    currentBalance: balance,
    monthlyUsage: 647.50,
    monthlyBudget: 1000,
    usageBreakdown: {
      campaigns: 234.75,
      vapi: 189.50,
      crm: 156.25,
      analytics: 67.00
    },
    recentTransactions: [
      {
        id: '1',
        type: 'debit',
        amount: 23.50,
        description: 'Campaign: Sales Outreach Q4',
        date: '2024-12-30 14:30',
        status: 'completed'
      },
      {
        id: '2',
        type: 'credit',
        amount: 500.00,
        description: 'Credit top-up',
        date: '2024-12-29 09:15',
        status: 'completed'
      },
      {
        id: '3',
        type: 'debit',
        amount: 12.75,
        description: 'Vapi AI: Support Agent calls',
        date: '2024-12-28 16:45',
        status: 'completed'
      },
      {
        id: '4',
        type: 'debit',
        amount: 8.90,
        description: 'CRM: Contact sync',
        date: '2024-12-27 11:20',
        status: 'completed'
      }
    ],
    billingHistory: [
      { month: 'Dec 2024', total: 647.50, calls: 1247, successRate: 87 },
      { month: 'Nov 2024', total: 589.25, calls: 1156, successRate: 85 },
      { month: 'Oct 2024', total: 523.80, calls: 1023, successRate: 83 },
      { month: 'Sep 2024', total: 478.90, calls: 945, successRate: 81 }
    ],
    plans: [
      {
        id: 'starter',
        name: 'Starter',
        price: 99,
        credits: 1000,
        features: ['Up to 1,000 calls/month', 'Basic analytics', 'Email support', '5 team members']
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 299,
        credits: 5000,
        features: ['Up to 5,000 calls/month', 'Advanced analytics', 'Priority support', 'Unlimited team members', 'Custom integrations'],
        popular: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 999,
        credits: 25000,
        features: ['Unlimited calls', 'Custom AI models', 'Dedicated support', 'SLA guarantee', 'Advanced security', 'Custom development']
      }
    ]
  })

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount)
    if (amount > 0) {
      setBalance(balance + amount)
      setData({
        ...data,
        currentBalance: balance + amount,
        recentTransactions: [
          {
            id: Date.now().toString(),
            type: 'credit',
            amount: amount,
            description: 'Credit top-up',
            date: new Date().toISOString().replace('T', ' ').substring(0, 19),
            status: 'completed'
          },
          ...data.recentTransactions
        ]
      })
      setShowTopUpModal(false)
      setTopUpAmount('')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-900 text-green-400 border-green-800'
      case 'pending': return 'bg-yellow-900 text-yellow-400 border-yellow-800'
      case 'failed': return 'bg-red-900 text-red-400 border-red-800'
      default: return 'bg-gray-700 text-gray-300 border-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'failed': return <AlertCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
  const usagePercentage = (data.monthlyUsage / data.monthlyBudget) * 100

  return (
    <div className="max-w-7xl mx-auto w-full px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Billing & Credits</h1>
            <p className="text-gray-400">Manage your account balance, usage, and billing history</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Invoice
            </Button>
            <Button 
              className="bg-gradient-to-r from-brand-pink to-brand-magenta"
              onClick={() => setShowTopUpModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Credits
            </Button>
          </div>
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Current Balance</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(data.currentBalance)}</p>
                </div>
                <div className="w-12 h-12 bg-brand-pink/20 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-brand-pink" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-400">Available credits</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Monthly Usage</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(data.monthlyUsage)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-400">Budget: {formatCurrency(data.monthlyBudget)}</span>
              </div>
              <Progress value={usagePercentage} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">This Month</p>
                  <p className="text-2xl font-bold text-white">1,247</p>
                </div>
                <div className="w-12 h-12 bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400">+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Avg Cost/Call</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(data.monthlyUsage / 1247)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingDown className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400">-8% from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900 border-gray-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
              <CreditCard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="usage" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
              <Activity className="w-4 h-4 mr-2" />
              Usage
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
              <Receipt className="w-4 h-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="plans" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
              <Gift className="w-4 h-4 mr-2" />
              Plans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Usage Breakdown */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Usage Breakdown</CardTitle>
                  <CardDescription className="text-gray-400">
                    Credits used by feature this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(data.usageBreakdown).map(([feature, amount]) => (
                      <div key={feature} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-brand-pink/20 rounded-lg flex items-center justify-center">
                            {feature === 'campaigns' && <Target className="w-4 h-4 text-brand-pink" />}
                            {feature === 'vapi' && <Mic className="w-4 h-4 text-brand-pink" />}
                            {feature === 'crm' && <Users className="w-4 h-4 text-brand-pink" />}
                            {feature === 'analytics' && <BarChart3 className="w-4 h-4 text-brand-pink" />}
                          </div>
                          <span className="text-white capitalize">{feature}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">{formatCurrency(amount)}</p>
                          <p className="text-gray-400 text-sm">
                            {((amount / data.monthlyUsage) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Billing History */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Billing History</CardTitle>
                  <CardDescription className="text-gray-400">
                    Monthly spending trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.billingHistory.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{month.month}</p>
                          <p className="text-gray-400 text-sm">{month.calls.toLocaleString()} calls</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">{formatCurrency(month.total)}</p>
                          <p className="text-gray-400 text-sm">{month.successRate}% success</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Detailed Usage Analytics</CardTitle>
                <CardDescription className="text-gray-400">
                  Track your usage patterns and optimize costs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <Target className="w-5 h-5 text-brand-pink" />
                      <span className="text-white font-medium">Campaigns</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(data.usageBreakdown.campaigns)}</p>
                    <p className="text-gray-400 text-sm">36% of total usage</p>
                  </div>
                  
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <Mic className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-medium">Vapi AI</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(data.usageBreakdown.vapi)}</p>
                    <p className="text-gray-400 text-sm">29% of total usage</p>
                  </div>
                  
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <Users className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">CRM</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(data.usageBreakdown.crm)}</p>
                    <p className="text-gray-400 text-sm">24% of total usage</p>
                  </div>
                  
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-medium">Analytics</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(data.usageBreakdown.analytics)}</p>
                    <p className="text-gray-400 text-sm">11% of total usage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Recent Transactions</CardTitle>
                <CardDescription className="text-gray-400">
                  Your recent credit transactions and usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          transaction.type === 'credit' ? 'bg-green-900/20' : 'bg-red-900/20'
                        }`}>
                          {transaction.type === 'credit' ? (
                            <Plus className="w-5 h-5 text-green-400" />
                          ) : (
                            <Minus className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{transaction.description}</p>
                          <p className="text-gray-400 text-sm">{transaction.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className={`font-medium ${
                            transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(transaction.status)}>
                          {getStatusIcon(transaction.status)}
                          <span className="ml-1">{transaction.status}</span>
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.plans.map((plan) => (
                <Card key={plan.id} className={`bg-gray-900 border-gray-800 ${
                  plan.popular ? 'ring-2 ring-brand-pink' : ''
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{plan.name}</CardTitle>
                      {plan.popular && (
                        <Badge className="bg-brand-pink text-white">Popular</Badge>
                      )}
                    </div>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-3xl font-bold text-white">${plan.price}</span>
                      <span className="text-gray-400">/month</span>
                    </div>
                    <CardDescription className="text-gray-400">
                      {plan.credits.toLocaleString()} credits included
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      className={`w-full mt-6 ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-brand-pink to-brand-magenta' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {plan.id === 'enterprise' ? 'Contact Sales' : 'Choose Plan'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Top Up Modal */}
        {showTopUpModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Add Credits</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTopUpModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount" className="text-white">Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="100.00"
                    min="1"
                    step="0.01"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {[50, 100, 250, 500, 1000, 2500].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setTopUpAmount(amount.toString())}
                      className="border-gray-700 text-gray-300 hover:text-white"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowTopUpModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-brand-pink to-brand-magenta"
                  onClick={handleTopUp}
                  disabled={!topUpAmount || parseFloat(topUpAmount) <= 0}
                >
                  Add Credits
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 