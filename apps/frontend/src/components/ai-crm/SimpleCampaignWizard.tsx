import React, { useState, useEffect } from 'react';
import { X, Upload, Clock, ChevronLeft, BarChart3, Users, Settings, Phone, Bot, Target, Calendar, Globe, DollarSign, Zap, Info, AlertTriangle, Zap as ZapIcon, PhoneOutgoing, Mic, Wallet, CheckCircle, AlertCircle, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { useApiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { vapiOutboundService } from '@/services/vapi-outbound.service';
import { CampaignTeamManager, TeamMember, TeamInvitation } from './CampaignTeamManager';
import { organizationSettingsService } from '@/services/organization-settings.service';

interface SimpleCampaignWizardProps {
  onCampaignCreated: (campaign: any) => void;
  onCancel: () => void;
}

export const SimpleCampaignWizard: React.FC<SimpleCampaignWizardProps> = ({ 
  onCampaignCreated, 
  onCancel 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState('manual');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [assistant, setAssistant] = useState('');
  const [whenToSend, setWhenToSend] = useState('later');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('today');
  const [scheduleTime, setScheduleTime] = useState('06:32 PM');
  const [timezone, setTimezone] = useState('Europe/Malta (GMT+2)');
  const [csvData, setCsvData] = useState<any[]>([]);
  
  // Rate limiting state
  const [callsPerMinute, setCallsPerMinute] = useState(5);
  const [callsPerHour, setCallsPerHour] = useState(20);
  const [enableRateLimiting, setEnableRateLimiting] = useState(true);
  const [customConcurrency, setCustomConcurrency] = useState(10);
  const [delayBetweenCalls, setDelayBetweenCalls] = useState(1);
  
  // Retry logic state (simplified)
  const [retryStrategy, setRetryStrategy] = useState('smart'); // 'basic', 'smart', 'conservative'
  
  // Working hours and timezone state
  const [workingHoursEnabled, setWorkingHoursEnabled] = useState(true);
  const [defaultTimezone, setDefaultTimezone] = useState('America/New_York');
  const [useContactTimezone, setUseContactTimezone] = useState(true);
  const [workingHours, setWorkingHours] = useState({
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '17:00' },
    sunday: { enabled: false, start: '09:00', end: '17:00' }
  });
  const [excludeHolidays, setExcludeHolidays] = useState(true);
  const [customHolidays, setCustomHolidays] = useState<string[]>([]);
  const [respectDST, setRespectDST] = useState(true);
  
  // Advanced timezone-aware scheduling engine state
  const [enablePreFiltering, setEnablePreFiltering] = useState(true);
  const [bufferMinutes, setBufferMinutes] = useState(30); // Buffer before/after working hours
  const [holidayRegions, setHolidayRegions] = useState<string[]>(['US']);
  const [csvPreFilterEnabled, setCsvPreFilterEnabled] = useState(true);
  const [excludedContactsCount, setExcludedContactsCount] = useState(0);
  
  // Help panel state
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [helpContent, setHelpContent] = useState('');

  // Team management state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamInvitations, setTeamInvitations] = useState<TeamInvitation[]>([]);
  const [enableTeamManagement, setEnableTeamManagement] = useState(false);

  // Review section state
  const [avgCallDuration, setAvgCallDuration] = useState(2); // minutes
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [costPerMinute, setCostPerMinute] = useState(0.18); // default
  const [concurrentCalls, setConcurrentCalls] = useState(10); // default from Vapi
  const [estimatedMetrics, setEstimatedMetrics] = useState<{
    totalAttempts: number;
    totalMinutes: number;
    totalCost: number;
    campaignDays: number;
    recommendedTopUp: number;
    balanceStatus: 'healthy' | 'warning' | 'critical';
  } | null>(null);

  // Auto-show help content for each step
  useEffect(() => {
    if (currentStep > 1) {
      setShowHelpPanel(true);
      if (currentStep === 2) {
        setHelpContent('rateLimiting');
      } else if (currentStep === 3) {
        setHelpContent('retryLogic');
      } else if (currentStep === 4) {
        setHelpContent('workingHours');
      } else if (currentStep === 5) {
        setHelpContent('teamManagement');
      } else if (currentStep === 6) {
        setHelpContent('review');
      }
    } else {
      setShowHelpPanel(false);
      setHelpContent('');
    }
  }, [currentStep]);
  
  const { toast } = useToast();

  // Load organization defaults on component mount
  useEffect(() => {
    loadOrganizationDefaults();
  }, []);

  const loadOrganizationDefaults = async () => {
    try {
      const defaults = await organizationSettingsService.getCampaignDefaults();
      
      // Update state with organization defaults
      setConcurrentCalls(defaults.maxConcurrentCalls);
      
      if (defaults.defaultWorkingHours.enabled) {
        setWorkingHoursEnabled(true);
        setDefaultTimezone(defaults.defaultWorkingHours.timezone);
        setWorkingHours(defaults.defaultWorkingHours.hours);
      }
      
      // Set cost per minute based on organization's VAPI pricing (if available)
      // This could be fetched from VAPI API or stored in org settings
      
      toast({
        title: 'Organization Settings Loaded',
        description: 'Campaign defaults loaded from organization settings',
      });
    } catch (error) {
      console.error('Error loading organization defaults:', error);
      // Continue with built-in defaults
    }
  };

  // Calculate review metrics whenever relevant values change
  useEffect(() => {
    if (currentStep === 6 && csvData.length > 0) {
      calculateReviewMetrics();
    }
  }, [currentStep, csvData.length, avgCallDuration, currentBalance, costPerMinute, concurrentCalls]);

  const calculateReviewMetrics = () => {
    const leads = csvData.length;
    const retryAttempts = retryStrategy === 'basic' ? 2 : retryStrategy === 'smart' ? 3 : 5;
    const workingHoursPerDay = workingHoursEnabled ? 8 : 24; // Simplified for now
    
    // Core calculations
    const totalAttempts = leads * (1 + retryAttempts);
    const totalMinutes = totalAttempts * avgCallDuration;
    const throughputRate = concurrentCalls / avgCallDuration; // calls per minute
    const runtimeMinutes = (totalAttempts * avgCallDuration) / concurrentCalls * 1.1; // 10% buffer
    const campaignDays = (runtimeMinutes / 60) / workingHoursPerDay;
    const totalCost = totalMinutes * costPerMinute;
    
    // Balance calculations
    let balanceStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    let recommendedTopUp = 0;
    
    if (currentBalance !== null) {
      if (currentBalance < totalCost * 0.5) {
        balanceStatus = 'critical';
        recommendedTopUp = Math.ceil((totalCost * 1.2 - currentBalance) / 10) * 10; // Round up to nearest $10
      } else if (currentBalance < totalCost) {
        balanceStatus = 'warning';
        recommendedTopUp = Math.ceil((totalCost * 1.2 - currentBalance) / 10) * 10;
      }
    }
    
    setEstimatedMetrics({
      totalAttempts,
      totalMinutes: Math.round(totalMinutes),
      totalCost: Math.round(totalCost * 100) / 100,
      campaignDays: Math.round(campaignDays * 10) / 10,
      recommendedTopUp,
      balanceStatus
    });
  };

  // Help content definitions
  const helpSections = {
    rateLimiting: {
      title: "📊 Rate Limiting Controls",
      description: "🛡️ Prevent carrier blocks and optimize delivery rates",
      content: `
## ⚡ What is Rate Limiting?

Rate limiting controls how quickly your campaign makes calls to prevent overwhelming phone carriers and triggering spam protection systems.

### 🎯 Why It Matters

**🏢 Carrier Protection**
- 📱 Phone carriers monitor call patterns and flag accounts that make too many calls too quickly
- 🚨 Spam flags can result in your phone numbers being blocked or marked as suspicious
- 🤖 Rate limiting mimics human calling patterns to maintain good sender reputation

**⚙️ API Optimization**
- 🚫 Prevents hitting VAPI's API rate limits which could pause your campaign
- 📈 Distributes calls evenly over time for better system performance
- 🌐 Reduces network congestion and improves call quality

### 🎯 Recommended Settings

**🐌 Conservative Approach (Recommended for new accounts)**
- 📞 3-5 calls per minute
- ⏰ 15-25 calls per hour  
- 🔄 Lower concurrency (5-8 simultaneous calls)

**🚀 Aggressive Approach (For established accounts)**
- 📞 8-12 calls per minute
- ⏰ 40-60 calls per hour
- 🔄 Higher concurrency (10-15 simultaneous calls)

### 📊 Key Metrics

**📞 Calls Per Minute**
The maximum number of calls to initiate within any 60-second window. This prevents rapid-fire calling that triggers carrier flags.

**⏰ Calls Per Hour** 
The total call volume limit within any 60-minute period. This ensures sustainable call rates throughout your campaign.

**🔄 Concurrent Calls**
How many calls can be active simultaneously. Higher concurrency improves speed but requires more system resources.

**⏱️ Delay Between Calls**
Minimum wait time between individual call attempts. Even small delays (1-2 seconds) help maintain natural calling patterns.

### ✨ Best Practices

✅ **🎯 Start Conservative**: Begin with lower limits and gradually increase based on performance
✅ **📊 Monitor Metrics**: Watch for delivery rate drops that indicate carrier blocking  
✅ **🌍 Respect Time Zones**: Combine with working hours controls for optimal results
✅ **🧪 Test Gradually**: Increase limits slowly to find your account's optimal rates

⚠️ **🚨 Warning Signs**: If you notice suddenly dropped answer rates or delivery failures, reduce your rate limits immediately.
      `
    },
    retryLogic: {
      title: "🔄 Retry Logic Enhancements",
      description: "🧠 Intelligent failure handling to maximize contact rates",
      content: `
## 🎯 Understanding Retry Logic

Retry logic determines how your campaign responds to different types of call failures. Instead of giving up after one attempt, intelligent retries can significantly improve your contact rates.

### 📋 The Four Failure Types

**1. 📞 No Answer**
- **💭 What It Means**: Phone rings but nobody picks up
- **🤔 Common Causes**: Contact is busy, away from phone, or screening calls
- **🎯 Best Strategy**: Try again when they might be available
- **✅ Recommended**: 2-3 attempts with 30-60 minute delays

**2. 🎙️ Voicemail**
- **💭 What It Means**: Call was answered by voicemail system
- **🤔 Common Causes**: Contact is unavailable but message was delivered
- **🎯 Best Strategy**: Give them time to respond before trying again
- **✅ Recommended**: 1-2 attempts with 1-2 hour delays

**3. ❌ Dead/Disconnected Line**
- **💭 What It Means**: Number is no longer in service or unreachable
- **🤔 Common Causes**: Changed numbers, disconnected service, or technical issues
- **🎯 Best Strategy**: Minimal retries since issue is usually permanent
- **✅ Recommended**: 1 attempt after 24 hours (for technical issues)

**4. ⏰ Busy Signal**
- **💭 What It Means**: Line is currently occupied by another call
- **🤔 Common Causes**: Contact is on another call
- **🎯 Best Strategy**: Quick retries since busy signals clear fast
- **✅ Recommended**: 3-4 attempts with 5-10 minute delays

### 🚀 Advanced Features

**📈 Exponential Backoff**
Gradually increases delays between retries:
- 🥇 Attempt 1: Wait 30 minutes
- 🥈 Attempt 2: Wait 60 minutes  
- 🥉 Attempt 3: Wait 120 minutes

This prevents appearing too persistent while maximizing chances of contact.

**🛡️ Global Retry Limit**
Sets a hard cap on total attempts per contact across all failure types. Prevents harassment and maintains compliance with calling regulations.

### ⚖️ Legal Compliance

**📋 Calling Best Practices**
- 🚫 Limits excessive calling to prevent harassment complaints
- 🔒 Respects consumer privacy and calling preferences
- 💼 Maintains professional calling practices

**🏛️ Industry Standards**
- 📞 Follows telecommunications best practices
- ⭐ Aligns with carrier requirements for good sender reputation
- 🔐 Prevents account suspension due to aggressive calling

### 📊 Performance Impact

**📈 Higher Contact Rates**
- 🎯 Well-timed retries can improve contact rates by 40-60%
- 🔄 Different failure types have different success probabilities
- ⏰ Smart timing maximizes availability windows

**⚡ Resource Efficiency**
- 🚫 Prevents wasted calls on permanently unreachable numbers
- 💰 Optimizes campaign duration and costs
- 🎯 Focuses efforts on contacts most likely to connect

### 💡 Configuration Tips

**🎯 Start with Defaults**: The recommended settings are based on industry data and compliance requirements.

**📊 Monitor Results**: Track which failure types have the best retry success rates for your specific campaigns.

**🔧 Adjust Gradually**: Make small changes and measure impact before major adjustments.

**👥 Consider Your Audience**: B2B contacts may have different availability patterns than B2C contacts.
      `
    },
    callsPerMinute: {
      title: "📞 Calls Per Minute Control",
      description: "⏱️ Manage call frequency to prevent carrier blocks",
      content: `
## 📊 Calls Per Minute Settings

The "Calls Per Minute" setting controls how many outbound calls your campaign can initiate within any 60-second window. This is one of the most critical settings for maintaining good sender reputation with phone carriers.

### ❓ Why This Matters

**🛡️ Carrier Protection**
- 📱 Phone carriers actively monitor calling patterns from business numbers
- 🚨 Too many calls in a short time triggers automatic spam detection systems
- 🚫 Once flagged, your phone number may be blocked or marked as suspicious
- ⏳ Recovery from carrier blocks can take weeks or months

**⚡ Optimal Call Distribution**
- 🌊 Spreading calls over time mimics natural human calling patterns
- 🏗️ Prevents overwhelming carrier infrastructure
- 📶 Maintains consistent call quality and connection rates
- ✅ Reduces the risk of calls being automatically rejected

### 🎯 Recommended Settings

**🐌 Conservative (1-3 calls/minute)**
- 🆕 Best for new phone numbers or accounts
- 🛡️ Lowest risk of carrier flags
- 🐢 Slower campaign completion but highest success rates
- 🏛️ Recommended for highly regulated industries

**⚖️ Moderate (4-6 calls/minute)**  
- ⚡ Good balance of speed and safety
- 🏢 Suitable for established phone numbers
- 📊 Most commonly used setting across industries
- 🎯 Good starting point for most campaigns

**🚀 Aggressive (7-12 calls/minute)**
- ⭐ Only for well-established, high-reputation numbers
- 👀 Requires careful monitoring of delivery rates
- ⏰ Best for time-sensitive campaigns
- ⚠️ Higher risk but faster completion

### 🔧 Technical Implementation

The system enforces this limit by:
- 🗂️ Queuing calls when the limit is reached
- 📊 Distributing calls evenly across the minute window
- 🔄 Automatically adjusting for any failed or rejected calls
- 📈 Providing real-time monitoring of call rates

### 🚨 Warning Signs

**🔻 Reduce your rate immediately if you notice:**
- 📉 Sudden drops in answer rates (below 15-20%)
- ❌ Increased "failed to connect" errors
- 📧 Calls going straight to voicemail more frequently
- 😡 Recipients reporting they never received calls

### ✨ Best Practices

✅ **🎯 Start Low**: Begin with 3-5 calls/minute for new numbers
✅ **👀 Monitor Closely**: Watch delivery rates daily for first week
✅ **📈 Scale Gradually**: Increase by 1-2 calls/minute weekly if performance holds
✅ **📝 Document Results**: Track optimal rates for different phone numbers
      `
    },
    callsPerHour: {
      title: "⏰ Calls Per Hour Limit", 
      description: "📊 Set hourly call volume caps for sustainable campaigns",
      content: `
## ⏰ Calls Per Hour Management

The "Calls Per Hour" setting establishes the maximum number of calls your campaign can make within any 60-minute period. This works alongside the per-minute limit to provide comprehensive rate control.

### 🔧 How It Works

**📊 Hierarchical Limiting**
- 🔗 The system respects BOTH per-minute and per-hour limits
- ⏸️ Whichever limit is reached first will pause calling
- 💡 Example: 5 calls/minute (300/hour) but 100/hour limit = 100 calls maximum
- 🛡️ Provides multiple layers of protection against over-calling

**🔄 Rolling Window**
- ⏱️ Calculated on a rolling 60-minute basis, not fixed hours
- 📊 If you made 80 calls in the past hour, only 20 more are allowed
- 🔄 Automatically resets as older calls fall outside the window
- 📈 Ensures consistent, sustainable calling rates

### 🎯 Strategic Applications

**⏰ Campaign Duration Control**
- 🐢 Lower hourly limits extend campaign duration
- 🚀 Higher limits complete campaigns faster
- 🎛️ Useful for managing resource allocation across multiple campaigns
- ⚖️ Helps balance speed vs. deliverability

**📋 Compliance Requirements**
- 🏛️ Some industries have specific hourly calling limits
- 📝 Helps maintain compliance with internal policies
- 🔍 Provides audit trail for regulatory requirements
- ⚖️ Supports fair calling practices

### 📊 Recommended Ranges

**🐌 Low Volume (20-50 calls/hour)**
- 💎 Ideal for high-value, personalized outreach
- 📈 Maximum deliverability and answer rates
- 🎯 Best for small, targeted contact lists
- 🏢 Suitable for premium or enterprise prospects

**⚖️ Medium Volume (60-120 calls/hour)**
- ⚡ Balanced approach for most business campaigns
- 🎯 Good mix of speed and quality
- 🏢 Suitable for established phone numbers
- 📊 Most common setting for B2B outreach

**🚀 High Volume (150-300 calls/hour)**
- 🏭 For large-scale campaigns with proven infrastructure
- ⭐ Requires excellent phone number reputation
- ⏰ Best for time-sensitive or promotional campaigns
- 👀 Needs constant monitoring and optimization

### 🔗 Interaction with Other Settings

**📊 Per-Minute Relationship**
- 🧮 5 calls/minute = 300 theoretical calls/hour
- 🚫 Hour limit of 100 would cap actual volume
- 🤖 System automatically calculates effective rates
- 📈 Displayed in real-time performance estimates

**🔄 Concurrent Calls Impact**
- 📈 Higher concurrency can help achieve hourly targets
- ⚖️ Must balance with carrier capacity
- 💻 More concurrent calls = higher resource usage
- 💰 Affects overall campaign cost structure

### 📊 Monitoring and Optimization

**📈 Key Metrics to Watch**
- 📊 Actual calls per hour vs. target
- 📶 Answer rate consistency throughout day
- 💰 Cost per successful connection
- ⏰ Overall campaign completion time

**🎯 Adjustment Strategies**
- 🎯 Start with conservative limits and increase gradually
- 👀 Monitor answer rates - drops indicate limits too high
- ⏰ Consider time-of-day variations in success rates
- 📝 Document optimal settings for future campaigns

### 🔧 Troubleshooting

**🛑 If calls stop before hourly limit:**
- 🔍 Check if per-minute limit is more restrictive
- 📋 Verify sufficient contacts remain in queue
- ⏰ Ensure working hours settings aren't blocking calls
- ⚠️ Check for system errors or API limits

**📉 If performance degrades:**
- 🔻 Reduce hourly limit by 20-30%
- 👀 Monitor recovery of answer rates
- 📅 Consider spreading calls across more hours
- 📊 Review carrier feedback and delivery reports
      `
    },
    concurrentCalls: {
      title: "🔄 Concurrent Calls Limit",
      description: "⚡ Control simultaneous active calls for optimal performance", 
      content: `
## 🔄 Concurrent Calls Management

The "Concurrent Calls Limit" determines how many calls can be active simultaneously at any given moment. This setting directly impacts campaign speed, resource usage, and call quality.

### 🧠 Understanding Concurrency

**🔄 What "Concurrent" Means**
- 🕐 Number of calls happening at exactly the same time
- 📞 Includes dialing, ringing, connected, and wrapping up calls
- ➡️ Different from calls per minute (which is about initiation rate)
- 🎛️ Affects both system resources and carrier load

**💻 System Resource Impact**
- 🖥️ Each concurrent call uses server resources
- 📈 Higher concurrency = more CPU, memory, and bandwidth
- ⚠️ Too high can degrade call quality for all calls
- ⚖️ Must balance speed with system stability

### 🔧 Technical Considerations

**🌐 Network Capacity**
- 📡 Your internet connection has finite bandwidth
- 🎵 Each call typically uses 64-100 kbps for audio
- 📊 10 concurrent calls ≈ 1 Mbps bandwidth minimum
- 📶 Poor connections may require lower concurrency

**🔌 VAPI API Limits**
- 🏢 VAPI may have account-specific concurrency limits
- ❌ Exceeding limits results in rejected call attempts
- 🔍 Check your account tier for maximum allowed
- ⬆️ Higher tiers typically support more concurrent calls

**📞 Carrier Relationships**
- 🏢 Some carriers limit simultaneous calls per number
- 💼 Business lines typically support 5-20+ concurrent calls
- 🏠 Residential lines may be limited to 1-3
- 🚫 Carrier-specific limits override system settings

### 🎯 Recommended Settings

**🐌 Conservative (1-5 concurrent)**
- 🆕 Best for new accounts or limited infrastructure
- ⭐ Highest call quality and reliability
- 🐢 Slower campaign completion
- 🛡️ Safest option for testing and optimization

**⚖️ Moderate (6-12 concurrent)**
- ⚡ Good balance for most business applications
- 🏢 Suitable for established systems
- 🎯 Reasonable speed with maintained quality
- 📊 Most common setting for professional campaigns

**🚀 Aggressive (15-25+ concurrent)**
- 🏭 For high-capacity systems and urgent campaigns
- 💪 Requires robust infrastructure and monitoring
- ⚡ Maximum speed but higher complexity
- 🎯 Best for experienced users with proven setups

### 📊 Impact on Campaign Performance

**🚀 Speed Benefits**
- ⚡ Higher concurrency = faster campaign completion
- 📈 More calls attempted per minute
- ⏰ Better utilization of available calling windows
- 📊 Improved overall efficiency

**⚖️ Quality Trade-offs**
- 💻 System resources spread across more calls
- 📡 Potential for increased latency or audio issues
- 🔧 More complex error handling and recovery
- ⚠️ Higher chance of simultaneous failures

### 🎯 Optimization Strategies

**🎯 Finding Your Sweet Spot**
1. 🎯 Start with 5-8 concurrent calls
2. 👀 Monitor call quality and connection rates
3. 📈 Gradually increase if performance remains stable
4. 🔻 Back down immediately if quality degrades

**📊 Performance Monitoring**
- 📶 Track connection success rates
- 🎵 Monitor audio quality reports
- ⚠️ Watch for timeout or error increases
- ⏱️ Measure actual vs. expected campaign duration

### 🔧 Troubleshooting Common Issues

**❌ Calls Failing to Connect**
- ⚠️ May indicate concurrency set too high
- 🔍 Check VAPI account limits
- 🌐 Verify internet bandwidth capacity
- 📞 Review carrier-specific restrictions

**🎵 Poor Audio Quality**
- 💻 Often caused by resource contention
- 🔻 Reduce concurrent calls by 20-30%
- 🌐 Check network congestion
- ⬆️ Consider upgrading internet connection

**🐌 Slower Than Expected Performance**
- 🎛️ System may be throttling due to resource limits
- 📊 Concurrent setting might be lower than displayed  
- 💻 Check for background processes using resources
- ✅ Verify all calls are actually being initiated

### ⚙️ Advanced Configuration

**⏰ Time-Based Adjustments**
- 📈 Higher concurrency during peak efficiency hours
- 📉 Lower during known network congestion periods
- 🤖 Automatic scaling based on system performance
- 🕐 Integration with working hours for optimal timing

**🎯 Campaign-Specific Settings**
- ⬆️ Higher for simple, short calls
- ⬇️ Lower for complex, longer conversations
- 👥 Adjust based on target audience availability
- 🎯 Consider call outcome requirements

### ✨ Best Practices

✅ **👀 Monitor Continuously**: Watch performance metrics in real-time
✅ **📈 Test Incrementally**: Increase concurrency slowly with monitoring
✅ **📝 Document Optimal Settings**: Record best configurations for reuse
✅ **⏰ Plan for Peak Times**: Account for varying system loads throughout day
✅ **🔄 Have Fallback Plans**: Be ready to reduce if performance degrades
      `
    },
    delayBetweenCalls: {
      title: "⏱️ Delay Between Calls",
      description: "⏰ Set minimum wait time between consecutive call attempts",
      content: `
## ⏱️ Call Delay Management

The "Delay Between Calls" setting establishes a minimum wait time between consecutive call attempts. This subtle but important feature helps maintain natural calling patterns and prevents rapid-fire calling that can trigger spam detection.

### 🎯 Purpose and Benefits

**🤖 Natural Calling Patterns**
- 👨 Human agents naturally have small pauses between calls
- 🕐 Even 1-2 second delays help mimic human behavior
- 🚫 Prevents the "machine gun" calling pattern that carriers flag
- ✅ Creates more realistic call timing for better acceptance

**🔧 System Stability**
- ⏰ Gives the system time to properly close previous calls
- 🚫 Prevents resource conflicts between rapid successive calls
- 🧹 Allows proper cleanup of call sessions
- 📈 Reduces system errors and improves reliability

**📞 Carrier Relationship Management**
- 🤝 Even small delays show respect for carrier infrastructure
- 🚫 Prevents overwhelming carrier switching equipment
- 💼 Demonstrates professional calling practices
- ⭐ Helps maintain good sender reputation

### Technical Implementation

**How Delays Work**
- Timer starts when previous call attempt completes
- Delay applies regardless of call outcome (success, failure, busy, etc.)
- Measured from call termination to next call initiation
- Works in conjunction with rate limiting, not instead of it

**Interaction with Other Settings**
- Delays can effectively reduce your maximum calls per minute
- Example: 1-second delay + 10 calls/minute may actually achieve 8-9/minute
- System automatically adjusts calculations for realistic estimates
- Performance projections account for delay overhead

### Recommended Settings

**No Delay (0 seconds)**
- Maximum campaign speed
- Only recommended for high-reputation numbers
- Requires careful monitoring for carrier acceptance
- Best for urgent, time-sensitive campaigns

**Minimal Delay (1-2 seconds)**
- Good balance of speed and naturalness
- Recommended for most business campaigns
- Slight speed reduction for significant deliverability improvement
- Most common professional setting

**Moderate Delay (3-5 seconds)**
- More natural, human-like calling pattern
- Better for sensitive or regulated industries
- Improved answer rates due to less aggressive appearance
- Good for high-value prospect lists

**Extended Delay (10+ seconds)**
- Maximum naturalness and deliverability
- Best for premium prospects or compliance-heavy industries
- Significantly slower campaign completion
- Often combined with other conservative settings

### Strategic Applications

**List Quality Considerations**
- Shorter delays for verified, opted-in contacts
- Longer delays for cold outreach or purchased lists
- Adjust based on expected contact receptivity
- Consider source and age of contact data

**Industry-Specific Needs**
- Healthcare: Longer delays show respect for busy professionals
- Finance: Compliance often favors more conservative timing
- Sales: Balance speed with relationship preservation
- Emergency services: May require immediate successive calls

### Performance Impact Analysis

**Speed vs. Quality Trade-off**
- Each second of delay reduces hourly call capacity
- 2-second delay ≈ 10-15% reduction in call volume
- 5-second delay ≈ 25-30% reduction in call volume
- Must weigh speed loss against deliverability gains

**Answer Rate Improvements**
- Studies show 1-3 second delays can improve answer rates by 5-15%
- Recipients less likely to perceive calls as automated
- Reduced likelihood of being sent directly to voicemail
- Better first impression for successful connections

### Monitoring and Optimization

**Key Metrics to Track**
- Answer rate changes with different delay settings
- Overall campaign completion time
- Carrier feedback and delivery success rates
- Cost per successful connection

**A/B Testing Approach**
- Test different delay settings on similar contact segments
- Measure both speed and quality metrics
- Find optimal delay for your specific use case
- Document results for future campaign planning

### Advanced Delay Strategies

**Dynamic Delays**
- Shorter delays during peak answer times
- Longer delays for follow-up or retry attempts
- Automatic adjustment based on recent call outcomes
- Integration with AI to optimize timing

**Contact-Specific Delays**
- Longer delays for high-value prospects
- Shorter delays for time-sensitive promotions
- Adjustment based on contact timezone or preferences
- Personalization based on historical response patterns

### Troubleshooting

**If Campaign Seems Too Slow**
- Check if delay setting is higher than intended
- Verify delays aren't compounding with other throttling
- Consider reducing delay while monitoring answer rates
- Balance speed needs with quality requirements

**If Getting Spam Flags**
- Increase delay to 2-3 seconds minimum
- Monitor carrier feedback for improvements
- Consider combining with other conservative settings
- Review overall calling pattern and volume

### ✨ Best Practices

✅ **🎯 Start Conservative**: Begin with 1-2 second delays
✅ **📊 Monitor Answer Rates**: Track improvements vs. speed loss
✅ **🏢 Industry Appropriate**: Adjust for your target audience expectations
✅ **📝 Document Optimal Settings**: Record best delays for different campaign types
✅ **🔄 Regular Review**: Reassess delay needs as phone reputation improves
      `
    },
    workingHours: {
      title: "🌍 Working Hours & Timezone Management",
      description: "⏰ Timezone-aware scheduling for compliance and better results",
      content: `
## 🌍 Timezone-Aware Scheduling

Working hours management ensures your calls are made at appropriate times in each contact's local timezone, improving answer rates and maintaining legal compliance.

### ❓ Why Timezone Management Matters

**🌟 Professional Standards**
- **📋 Calling Hours**: Best practice is to call during reasonable hours (typically 9 AM - 8 PM local time)
- **🌍 Regional Considerations**: Different regions may have varying acceptable calling times
- **💼 Business Impact**: Poor timing can damage your brand reputation

**📈 Better Results**
- **📞 Higher Answer Rates**: People are more likely to answer during business hours
- **💼 Professional Image**: Respecting time zones shows consideration
- **😊 Reduced Complaints**: Appropriate timing reduces negative responses

### 🌐 Timezone Settings

**Default Campaign Timezone**
- 🕐 Set the primary timezone for your campaign
- 🎯 All calls will be scheduled according to this timezone
- 🏠 Perfect for local or regional campaigns
- 📊 Can use contact-specific timezones if available in your data

### Weekly Schedule Configuration

**Flexible Day Selection**
- Enable/disable individual days of the week
- Set different hours for different days
- Account for varying business schedules

**Time Zone Considerations**
- All times are automatically converted to contact's local timezone
- System handles Daylight Saving Time transitions
- Respects regional time zone variations

### Advanced Features

**Holiday Exclusion**
- Automatically skips major holidays
- Improves answer rates and contact satisfaction
- Maintains professional calling practices
- Includes: New Year's Day, Memorial Day, Independence Day, Labor Day, Thanksgiving, Christmas

**DST (Daylight Saving Time) Handling**
- Automatically adjusts for spring/fall time changes
- Maintains consistent local calling hours
- Prevents confusion during transition periods

**Custom Holiday Rules**
- Add company-specific holidays or regional observances
- Account for industry-specific closure dates
- Maintain flexibility for different business calendars

### ✨ Best Practices

**💼 Business Hours Guidelines**
- **🏢 B2B Contacts**: 9 AM - 5 PM local time, Monday-Friday
- **🏠 B2C Contacts**: 9 AM - 8 PM local time, including some weekend hours
- **🏥 Healthcare**: Avoid meal times (12-1 PM) and shift changes
- **🛍️ Retail**: Consider evening hours when customers are home

**🎯 Contact Strategy Tips**
✅ **🕐 Respect reasonable calling hours** to maintain good relationships
✅ **🌅 Avoid early mornings and late evenings** for better contact rates
✅ **🌍 Consider cultural differences** in international campaigns
✅ **📝 Honor customer preferences** and communication requests

**📊 Performance Optimization**
- **🧪 Test different time windows** to find optimal contact rates
- **📈 Analyze answer rate patterns** by time of day and day of week
- **📅 Adjust for seasonal variations** in contact availability
- **🏢 Consider industry-specific schedules** (healthcare, education, etc.)

### 🌍 Common Time Zones

**🇺🇸 United States**
- 🕐 Eastern Time (ET): UTC-5/-4
- 🕐 Central Time (CT): UTC-6/-5  
- 🕐 Mountain Time (MT): UTC-7/-6
- 🕐 Pacific Time (PT): UTC-8/-7

**🌍 International**
- 🇬🇧 GMT (London): UTC+0/+1
- 🇫🇷 CET (Paris): UTC+1/+2
- 🇯🇵 JST (Tokyo): UTC+9
- 🇦🇺 AEDT (Sydney): UTC+10/+11

### ⚙️ Technical Implementation

The system automatically:
- 🔍 Filters contacts based on current local time
- 📅 Schedules calls for appropriate hours
- 🔄 Handles timezone conversions
- 🌄 Manages DST transitions
- 🎄 Respects holiday calendars
- 📋 Maintains compliance records
      `
    },
    teamManagement: {
      title: "👥 Team Management",
      description: "🤝 Collaborate with team members on campaign execution",
      content: `
## 🎯 What is Team Management?

Team management allows you to invite colleagues to collaborate on your campaigns with specific roles and permissions.

### 🏆 **Team Roles:**

**👑 Owner:** Full control over campaign, team, and CRM
- Edit campaign settings
- Manage team members
- Full CRM lead access (all leads)
- View all analytics and start/stop campaigns

**🛡️ Manager:** Campaign and team management + CRM access
- Edit campaign settings
- Invite/remove team members
- Full CRM access to all leads
- Assign leads to team members
- Control campaign execution

**⚡ Agent:** Campaign execution + CRM lead management
- View campaign details
- Manage campaign-specific leads in CRM
- Edit assigned leads and add notes
- Start/stop campaigns with permissions

**👁️ Viewer:** Read-only campaign + limited CRM viewing
- View campaign information
- Limited CRM viewing (no editing)
- See basic analytics
- Cannot control execution or edit leads

### ✨ **Key Benefits:**

- 📧 **Email Invitations:** Send secure invites with expiration
- 🔄 **Real-time Collaboration:** Changes sync instantly
- 🎚️ **Granular Permissions:** Control campaign and CRM access precisely
- 📊 **CRM Integration:** Team members get appropriate lead access
- 🎯 **Lead Assignment:** Assign specific leads to team members
- 📈 **Audit Trail:** Track all team and lead changes
- 🚀 **Easy Onboarding:** One-click team member setup

### 💡 **Best Practices:**

- 🎯 Assign roles based on responsibility levels
- 📧 Use business email addresses for invitations
- 🔐 Limit CRM access to necessary leads only
- 🎯 Use "Assigned Only" for focused lead management
- 🔄 Review team access and lead assignments regularly
- 📋 Document role responsibilities and CRM permissions clearly
      `
    },
    review: {
      title: "📊 Campaign Review & Estimates",
      description: "💰 Pre-launch cost and timeline analysis",
      content: `
## 🎯 What is Campaign Review?

The review section provides detailed estimates for your campaign including duration, costs, and resource requirements based on your configuration.

### 📈 **Key Metrics Calculated:**

**⏱️ Campaign Timeline:**
- Total call attempts (leads × retries)
- Estimated runtime in hours/days
- Working hours consideration
- Concurrent call throughput

**💵 Cost Breakdown:**
- Vapi hosting fees ($0.05/min)
- Speech-to-Text costs ($0.01/min)
- Text-to-Speech costs ($0.05/min)
- Language Model costs ($0.07/min)
- Total estimated campaign cost

**🔋 Credit Management:**
- Current balance check
- Required credits calculation
- Top-up recommendations
- Overage warnings

### 🧮 **Calculation Formulas:**

**Total Attempts** = Leads × (1 + Retry Attempts)
**Total Minutes** = Total Attempts × Avg Call Duration
**Campaign Days** = Total Minutes ÷ (Concurrent Calls × Working Hours × 60)
**Total Cost** = Total Minutes × Cost per Minute

### ⚡ **Key Factors:**

- 📞 **Average Call Duration:** Default 2 minutes (adjustable)
- 🔄 **Concurrent Calls:** Based on Vapi plan (10 default)
- 🔁 **Retry Logic:** Impacts total attempts significantly
- ⏰ **Working Hours:** Affects campaign timeline
- 💳 **Credit Balance:** Determines if top-up needed

### 💡 **Best Practices:**

- 🎯 Review all estimates before launching
- 💰 Maintain 20% buffer in credit balance
- 📊 Use historical data for accurate duration
- 🔄 Adjust concurrency for optimal throughput
- 📈 Monitor actual vs. estimated costs
- 🚨 Set up balance alerts in Vapi dashboard
      `
    }
  };

  const showHelp = (section: keyof typeof helpSections) => {
    setHelpContent(section);
    setShowHelpPanel(true);
  };

  const downloadTemplate = () => {
    const csvContent = `number,name,another_var
+1 (234) 567-8901,John Doe,Hello
12344543210,Jane Smith,World
+1-234-423-4567,Bob Johnson,Test`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'campaign-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      
      // Parse CSV file
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0]?.split(',').map(h => h.trim()) || [];
        
        const data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim());
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            return row;
          });
        
        setCsvData(data);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate step 1 fields
      if (!campaignName || !phoneNumber || !assistant || !csvFile) {
        toast({
          title: 'Missing information',  
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    } else if (currentStep === 5) {
      setCurrentStep(6);
    }
  };

  const handleBack = () => {
    if (currentStep === 6) {
      setCurrentStep(5);
    } else if (currentStep === 5) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      onCancel();
    }
  };

  const handleCreateCampaign = async () => {
    setIsLoading(true);
    try {
      // Get organization VAPI credentials
      const orgDefaults = await organizationSettingsService.getCampaignDefaults();
      
      // Automatically add current user as campaign owner
      const currentUserAsMember: TeamMember = {
        id: userContext?.id || 'current-user',
        email: userContext?.email || '',
        role: 'owner',
        status: 'active',
        firstName: userContext?.firstName,
        lastName: userContext?.lastName,
        joinedAt: new Date().toISOString(),
        crmAccessLevel: 'all_leads',
        leadPermissions: {
          view: true,
          edit: true,
          delete: true,
          export: true,
          assign: true
        }
      };

      const allTeamMembers = [currentUserAsMember, ...teamMembers];

      // Create campaign with rate limiting and retry policy settings
      const campaignData = {
        name: campaignName,
        assistantId: assistant,
        phoneNumberId: phoneNumber,
        settings: {
          callsPerHour: enableRateLimiting ? callsPerHour : 60,
          callsPerMinute: enableRateLimiting ? callsPerMinute : 10,
          retryAttempts: 2,
          timeZone: defaultTimezone,
          workingHours: {
            enabled: workingHoursEnabled,
            start: '09:00',
            end: '17:00',
            defaultTimezone,
            useContactTimezone,
            schedule: workingHours,
            excludeHolidays,
            customHolidays,
            respectDST
          },
          rateLimiting: {
            enabled: enableRateLimiting,
            callsPerMinute,
            callsPerHour,
            customConcurrency: concurrentCalls, // Use org default
            delayBetweenCalls
          },
          retryStrategy
        },
        teamManagement: {
          enabled: enableTeamManagement || allTeamMembers.length > 1,
          members: allTeamMembers,
          invitations: teamInvitations
        },
        organizationSettings: {
          vapiCredentials: orgDefaults.vapiCredentials,
          maxConcurrentCalls: orgDefaults.maxConcurrentCalls,
          complianceSettings: orgDefaults.complianceSettings
        }
      };

      const campaign = await vapiOutboundService.createCampaign(campaignData);

      // Upload leads
      if (csvFile) {
        await vapiOutboundService.uploadLeads(campaign.id, csvFile);
      }

      // Start campaign if "Send Now" is selected
      if (whenToSend === 'now') {
        await vapiOutboundService.startCampaign(campaign.id);
      }

      toast({
        title: 'Campaign created',
        description: `Campaign "${campaignName}" has been created successfully!`,
      });

      onCampaignCreated(campaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to create campaign. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex">
      {/* Header */}
      <div className="flex-1 flex flex-col">
        <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <button onClick={handleBack} className="text-gray-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">
              New campaign {currentStep === 2 && '- Rate Limiting'}{currentStep === 3 && '- Retry Logic'}{currentStep === 4 && '- Working Hours'}{currentStep === 5 && '- Team Management'}{currentStep === 6 && '- Review & Launch'}
            </h1>
          </div>
          <div></div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Form Section */}
          <div className={`${currentStep === 1 ? 'w-1/2' : showHelpPanel ? 'w-1/2' : 'w-full'} flex flex-col transition-all duration-300`}>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {currentStep === 1 && (
              <div className="space-y-6">
            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="campaign-name" className="text-gray-300">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Campaign Name"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Campaign Type */}
            <div className="space-y-4">
              <Label className="text-gray-300 text-sm font-medium">Campaign Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`cursor-pointer border-2 rounded-lg p-4 transition-colors ${
                    campaignType === 'manual' 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setCampaignType('manual')}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      campaignType === 'manual' ? 'border-emerald-500' : 'border-gray-600'
                    }`}>
                      {campaignType === 'manual' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </div>
                    <Label className="text-white font-medium">Manual</Label>
                  </div>
                  <p className="text-sm text-gray-400">Start campaign now or schedule for later.</p>
                </div>
                
                <div 
                  className="border-2 rounded-lg p-4 border-gray-800 bg-gray-800/30 opacity-60 cursor-not-allowed"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-600 flex items-center justify-center">
                      {/* Always empty since it's disabled */}
                    </div>
                    <Label className="text-gray-500 font-medium">Live</Label>
                    <span className="text-xs text-gray-600 bg-gray-700 px-2 py-0.5 rounded">Coming soon</span>
                  </div>
                  <p className="text-sm text-gray-500">Triggered via webhooks from your website or forms.</p>
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone-number" className="text-gray-300">
                Phone Number
              </Label>
              <Select value={phoneNumber} onValueChange={setPhoneNumber}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="number1">+1 (555) 123-4567</SelectItem>
                  <SelectItem value="number2">+1 (555) 987-6543</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 rounded-full bg-gray-500"></div>
                  <span className="font-medium">Best Practices</span>
                </div>
                <p>Learn how to avoid spam flagging and optimize your calling strategy for better success rates. <a href="#" className="text-blue-400 hover:underline">Spam flagging best practices</a></p>
              </div>
            </div>

            {/* Upload CSV */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Upload CSV</Label>
                <Button 
                  variant="link" 
                  onClick={downloadTemplate}
                  className="text-blue-400 hover:text-blue-300 p-0 h-auto text-sm"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Download template
                </Button>
              </div>
              
              {csvFile ? (
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-white text-sm">{csvFile.name}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setCsvFile(null);
                      setCsvData([]);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-gray-600 transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gray-800 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-400">Drag and drop a CSV file here or click to select file locally</p>
                    <p className="text-xs text-gray-500 mt-1">Maximum file size: 5MB</p>
                  </label>
                </div>
              )}
            </div>

            {/* Assistant */}
            <div className="space-y-2">
              <Label htmlFor="assistant" className="text-gray-300">Assistant</Label>
              <Select value={assistant} onValueChange={setAssistant}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="assistant1">Sales Assistant</SelectItem>
                  <SelectItem value="assistant2">Support Assistant</SelectItem>
                  <SelectItem value="assistant3">Survey Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Choose when to send */}
            <div className="space-y-4">
              <Label className="text-gray-300">Choose when to send</Label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`cursor-pointer border-2 rounded-lg p-4 transition-colors ${
                    whenToSend === 'now' 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setWhenToSend('now')}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      whenToSend === 'now' ? 'border-emerald-500' : 'border-gray-600'
                    }`}>
                      {whenToSend === 'now' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </div>
                    <Label className="text-white cursor-pointer">Send Now</Label>
                  </div>
                </div>
                
                <div 
                  className={`cursor-pointer border-2 rounded-lg p-4 transition-colors ${
                    whenToSend === 'later' 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setWhenToSend('later')}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      whenToSend === 'later' ? 'border-emerald-500' : 'border-gray-600'
                    }`}>
                      {whenToSend === 'later' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </div>
                    <Label className="text-white cursor-pointer">Schedule for later</Label>
                  </div>
                </div>
              </div>

              {/* Schedule fields when "Schedule for later" is selected */}
              {whenToSend === 'later' && (
                <div className="space-y-3">
                  <Label className="text-gray-300">Start at:</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Date */}
                    <div className="space-y-1">
                      <Label className="text-gray-500 text-xs">Date</Label>
                      <Select value={scheduleDate} onValueChange={setScheduleDate}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="tomorrow">Tomorrow</SelectItem>
                          <SelectItem value="custom">Custom Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Time */}
                    <div className="space-y-1">
                      <Label className="text-gray-500 text-xs">Time</Label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white pr-8 h-9"
                        />
                      </div>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-1">
                      <Label className="text-gray-500 text-xs">Timezone</Label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="America/New_York">Eastern (EST)</SelectItem>
                          <SelectItem value="America/Chicago">Central (CST)</SelectItem>
                          <SelectItem value="America/Denver">Mountain (MST)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific (PST)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Europe/Malta (GMT+2)">Europe/Malta (GMT+2)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Campaign Execution Info */}
            {whenToSend === 'later' && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-1 h-1 rounded-full bg-gray-500"></div>
                  <span className="text-gray-300 text-sm font-medium">Campaign Execution</span>
                </div>
                <p className="text-xs text-gray-400">
                  Calls will start at the scheduled time and continue until your organization's concurrency limit is reached. Remaining 
                  calls will be retried for up to 1 hour as capacity becomes available. <a href="#" className="text-blue-400 hover:underline">Increase concurrency limits</a>
                </p>
              </div>
            )}
              </div>
            )}

            {/* Step 2: Rate Limiting Controls */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b border-gray-800 pb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <ZapIcon className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-xl font-semibold text-white">Rate Limiting Controls</h2>
                  </div>
                  <p className="text-sm text-gray-400">
                    Configure call throttling to prevent carrier blocks and optimize delivery rates
                  </p>
                </div>

                {/* Enable Rate Limiting */}
                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <ZapIcon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Label className="text-white font-medium">Enable Rate Limiting</Label>
                        <button
                          onClick={() => showHelp('rateLimiting')}
                          className="text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                        >
                          <Info className="w-4 h-4 cursor-pointer drop-shadow-[0_0_3px_rgba(52,211,153,0.3)] hover:drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Throttle API calls to prevent spam flags and carrier blocks
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={enableRateLimiting}
                    onCheckedChange={setEnableRateLimiting}
                  />
                </div>

                {enableRateLimiting && (
                  <>
                    {/* Calls Per Minute */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300 flex items-center space-x-2">
                          <span>Calls Per Minute</span>
                          <button
                            onClick={() => showHelp('callsPerMinute')}
                            className="text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                          >
                            <Info className="w-4 h-4 cursor-pointer drop-shadow-[0_0_3px_rgba(52,211,153,0.3)] hover:drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                          </button>
                        </Label>
                        <span className="text-emerald-400 font-medium">{callsPerMinute} calls/min</span>
                      </div>
                      <Slider
                        value={[callsPerMinute]}
                        onValueChange={(value) => setCallsPerMinute(value[0])}
                        max={20}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>1 call/min</span>
                        <span>Conservative</span>
                        <span>Aggressive</span>
                        <span>20 calls/min</span>
                      </div>
                    </div>

                    {/* Calls Per Hour */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300 flex items-center space-x-2">
                          <span>Calls Per Hour</span>
                          <button
                            onClick={() => showHelp('callsPerHour')}
                            className="text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                          >
                            <Info className="w-4 h-4 cursor-pointer drop-shadow-[0_0_3px_rgba(52,211,153,0.3)] hover:drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                          </button>
                        </Label>
                        <span className="text-emerald-400 font-medium">{callsPerHour} calls/hr</span>
                      </div>
                      <Slider
                        value={[callsPerHour]}
                        onValueChange={(value) => setCallsPerHour(value[0])}
                        max={200}
                        min={5}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>5 calls/hr</span>
                        <span>Standard: 20-60</span>
                        <span>200 calls/hr</span>
                      </div>
                    </div>

                    {/* Custom Concurrency */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300 flex items-center space-x-2">
                          <span>Concurrent Calls Limit</span>
                          <button
                            onClick={() => showHelp('concurrentCalls')}
                            className="text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                          >
                            <Info className="w-4 h-4 cursor-pointer drop-shadow-[0_0_3px_rgba(52,211,153,0.3)] hover:drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                          </button>
                        </Label>
                        <span className="text-emerald-400 font-medium">{customConcurrency} concurrent</span>
                      </div>
                      <Slider
                        value={[customConcurrency]}
                        onValueChange={(value) => setCustomConcurrency(value[0])}
                        max={50}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>1 concurrent</span>
                        <span>Default: 10</span>
                        <span>50 concurrent</span>
                      </div>
                    </div>

                    {/* Delay Between Calls */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300 flex items-center space-x-2">
                          <span>Delay Between Calls</span>
                          <button
                            onClick={() => showHelp('delayBetweenCalls')}
                            className="text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                          >
                            <Info className="w-4 h-4 cursor-pointer drop-shadow-[0_0_3px_rgba(52,211,153,0.3)] hover:drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                          </button>
                        </Label>
                        <span className="text-emerald-400 font-medium">{delayBetweenCalls}s delay</span>
                      </div>
                      <Slider
                        value={[delayBetweenCalls]}
                        onValueChange={(value) => setDelayBetweenCalls(value[0])}
                        max={10}
                        min={0}
                        step={0.5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>No delay</span>
                        <span>Recommended: 1-3s</span>
                        <span>10s delay</span>
                      </div>
                    </div>

                    {/* Estimated Performance */}
                    <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-300 font-medium text-sm">Estimated Performance</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Expected Calls/Hour:</p>
                          <p className="text-white font-medium">
                            {Math.min(callsPerMinute * 60, callsPerHour)} calls
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">With {csvData.length} contacts:</p>
                          <p className="text-white font-medium">
                            {csvData.length > 0 
                              ? `~${Math.max(1, Math.ceil(csvData.length / Math.min(callsPerMinute * 60, callsPerHour)))} hours`
                              : '0 hours'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-700/30">
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <p className="text-gray-500">Per Minute:</p>
                            <p className="text-blue-300 font-medium">{callsPerMinute}/min</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Concurrent:</p>
                            <p className="text-blue-300 font-medium">{customConcurrency}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Delay:</p>
                            <p className="text-blue-300 font-medium">{delayBetweenCalls}s</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Warning for aggressive settings */}
                    {(callsPerMinute > 10 || customConcurrency > 20) && (
                      <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span className="text-amber-300 font-medium text-sm">High Volume Warning</span>
                        </div>
                        <p className="text-amber-200 text-xs">
                          Aggressive rate limits may trigger carrier spam filters. Consider starting with conservative settings and gradually increasing based on performance.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 3: Retry Logic Enhancements */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b border-gray-800 pb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-xl font-semibold text-white">Retry Logic Enhancements</h2>
                  </div>
                  <p className="text-sm text-gray-400">
                    Configure intelligent retry policies for different call outcomes to maximize contact rates while avoiding harassment
                  </p>
                </div>

                {/* Simplified Retry Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>Smart Retry Settings</span>
                    <button
                      onClick={() => showHelp('retryLogic')}
                      className="text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                    >
                      <Info className="w-4 h-4 cursor-pointer drop-shadow-[0_0_3px_rgba(52,211,153,0.3)] hover:drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                    </button>
                  </h3>

                  {/* Simple Retry Mode Selection */}
                  <div className="bg-gray-800/30 rounded-lg border border-gray-700 p-4">
                    <Label className="text-white text-sm mb-3 block">Choose your retry strategy</Label>
                    <RadioGroup
                      value={retryStrategy}
                      onValueChange={(value) => setRetryStrategy(value)}
                      className="space-y-3"
                    >
                      <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                        <RadioGroupItem value="basic" id="basic" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="basic" className="text-white font-medium cursor-pointer">
                            🎯 Basic (1-2 retries)
                          </Label>
                          <p className="text-xs text-gray-400 mt-1">
                            Minimal retries for simple campaigns. Good for cold calling.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                        <RadioGroupItem value="smart" id="smart" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="smart" className="text-white font-medium cursor-pointer">
                            🧠 Smart (3-5 retries)
                          </Label>
                          <p className="text-xs text-gray-400 mt-1">
                            Intelligent retry logic with exponential backoff. Recommended for most campaigns.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                        <RadioGroupItem value="conservative" id="conservative" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="conservative" className="text-white font-medium cursor-pointer">
                            🛡️ Conservative (2-3 retries)
                          </Label>
                          <p className="text-xs text-gray-400 mt-1">
                            Respectful retry pattern. Perfect for warm leads and existing customers.
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Summary of Selected Strategy */}
                  <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300 font-medium text-sm">Retry Strategy Summary</span>
                    </div>
                    <div className="space-y-2 text-xs text-emerald-200">
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <span className="text-gray-400">Selected Strategy:</span>{' '}
                          {retryStrategy === 'basic' && 'Basic (1-2 retries)'}
                          {retryStrategy === 'smart' && 'Smart (3-5 retries) - Recommended'}
                          {retryStrategy === 'conservative' && 'Conservative (2-3 retries)'}
                        </div>
                        <div>
                          <span className="text-gray-400">Automatic Handling:</span> Failed calls, no answers, busy signals, and voicemails
                        </div>
                        <div>
                          <span className="text-gray-400">Compliance:</span> Respects working hours and daily limits
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Working Hours and Timezone Management */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b border-gray-800 pb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Globe className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-xl font-semibold text-white">Working Hours & Timezone Management</h2>
                  </div>
                  <p className="text-sm text-gray-400">
                    Configure timezone-aware scheduling to respect local working hours and improve compliance with calling regulations
                  </p>
                </div>

                {/* Enable Working Hours */}
                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <Globe className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Label className="text-white font-medium">Enable Working Hours</Label>
                        <button
                          onClick={() => showHelp('workingHours')}
                          className="text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                        >
                          <Info className="w-4 h-4 cursor-pointer drop-shadow-[0_0_3px_rgba(52,211,153,0.3)] hover:drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Automatically schedule calls within appropriate local business hours
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={workingHoursEnabled}
                    onCheckedChange={setWorkingHoursEnabled}
                  />
                </div>

                {workingHoursEnabled && (
                  <div className="space-y-6">

                    {/* Weekly Schedule */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Weekly Schedule</span>
                      </h3>

                      <div className="bg-gray-800/20 rounded-lg p-4 border border-gray-700">
                        <div className="space-y-4">
                          {Object.entries(workingHours).map(([day, schedule]) => (
                            <div key={day} className="flex items-center space-x-4">
                              <div className="w-20">
                                <Switch
                                  checked={schedule.enabled}
                                  onCheckedChange={(checked) => 
                                    setWorkingHours(prev => ({
                                      ...prev,
                                      [day]: { ...prev[day], enabled: checked }
                                    }))
                                  }
                                />
                              </div>
                              <div className="w-24 text-white font-medium capitalize">
                                {day}
                              </div>
                              {schedule.enabled && (
                                <div className="flex items-center space-x-2 flex-1">
                                  <Input
                                    type="text"
                                    value={schedule.start}
                                    onChange={(e) => 
                                      setWorkingHours(prev => ({
                                        ...prev,
                                        [day]: { ...prev[day], start: e.target.value }
                                      }))
                                    }
                                    placeholder="09:00"
                                    pattern="[0-9]{2}:[0-9]{2}"
                                    className="bg-gray-900 border-gray-600 text-white w-32"
                                  />
                                  <span className="text-gray-400">to</span>
                                  <Input
                                    type="text"
                                    value={schedule.end}
                                    onChange={(e) => 
                                      setWorkingHours(prev => ({
                                        ...prev,
                                        [day]: { ...prev[day], end: e.target.value }
                                      }))
                                    }
                                    placeholder="17:00"
                                    pattern="[0-9]{2}:[0-9]{2}"
                                    className="bg-gray-900 border-gray-600 text-white w-32"
                                  />
                                  <span className="text-gray-400 text-sm">
                                    (local time)
                                  </span>
                                </div>
                              )}
                              {!schedule.enabled && (
                                <div className="flex-1 text-gray-500 text-sm">
                                  No calls scheduled
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Holiday and DST Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                        <Settings className="w-4 h-4" />
                        <span>Advanced Settings</span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Holiday Exclusion */}
                        <div className="bg-gray-800/20 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Label className="text-white font-medium">Exclude Holidays</Label>
                              <div className="group relative">
                                <Info className="w-3 h-3 text-gray-400 cursor-help hover:text-emerald-400 drop-shadow-[0_0_2px_rgba(52,211,153,0.2)] hover:drop-shadow-[0_0_3px_rgba(52,211,153,0.4)] transition-colors duration-200" />
                                <div className="invisible group-hover:visible absolute left-0 top-6 w-64 p-3 bg-gray-800 border border-gray-600 rounded-lg text-xs text-gray-300 z-20 shadow-lg">
                                  <p>Automatically skip calls on major holidays to respect contact preferences and improve success rates.</p>
                                </div>
                              </div>
                            </div>
                            <Switch
                              checked={excludeHolidays}
                              onCheckedChange={setExcludeHolidays}
                            />
                          </div>
                          <p className="text-xs text-gray-400">
                            Skip calls on major holidays (New Year's, Christmas, etc.)
                          </p>
                        </div>

                        {/* DST Respect */}
                        <div className="bg-gray-800/20 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Label className="text-white font-medium">Respect DST</Label>
                              <div className="group relative">
                                <Info className="w-3 h-3 text-gray-400 cursor-help hover:text-emerald-400 drop-shadow-[0_0_2px_rgba(52,211,153,0.2)] hover:drop-shadow-[0_0_3px_rgba(52,211,153,0.4)] transition-colors duration-200" />
                                <div className="invisible group-hover:visible absolute left-0 top-6 w-64 p-3 bg-gray-800 border border-gray-600 rounded-lg text-xs text-gray-300 z-20 shadow-lg">
                                  <p>Automatically adjust for Daylight Saving Time changes to maintain consistent local calling hours.</p>
                                </div>
                              </div>
                            </div>
                            <Switch
                              checked={respectDST}
                              onCheckedChange={setRespectDST}
                            />
                          </div>
                          <p className="text-xs text-gray-400">
                            Auto-adjust for Daylight Saving Time transitions
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Summary */}
                    <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300 font-medium text-sm">Schedule Summary</span>
                      </div>
                      <div className="space-y-2 text-xs text-emerald-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-gray-400">Default Timezone:</span> {defaultTimezone.replace('_', ' ')}
                          </div>
                          <div>
                            <span className="text-gray-400">Active Days:</span> {
                              Object.entries(workingHours).filter(([_, schedule]) => schedule.enabled).length
                            } days/week
                          </div>
                          <div>
                            <span className="text-gray-400">Typical Hours:</span> {
                              workingHours.monday.enabled ? 
                                `${workingHours.monday.start} - ${workingHours.monday.end}` : 
                                'Varies by day'
                            }
                          </div>
                        </div>
                        <div className="pt-2 border-t border-emerald-700/50">
                          <span className="text-gray-400">Special Rules:</span> {
                            [
                              excludeHolidays && 'Holiday exclusion',
                              respectDST && 'DST adjustment'
                            ].filter(Boolean).join(', ') || 'None'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Advanced Timezone-Aware Scheduling Engine */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span>Timezone-Aware Scheduling Engine</span>
                        <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-300 font-medium">
                          ADVANCED
                        </div>
                      </h3>

                      {/* Pre-filtering Engine */}
                      <div className="bg-gray-800/30 rounded-lg border border-gray-700">
                        <div className="p-4 border-b border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Target className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <Label className="text-white font-medium">CSV Pre-filtering</Label>
                                  <button
                                    onClick={() => showHelp('workingHours')}
                                    className="text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                                  >
                                    <Info className="w-4 h-4 cursor-pointer drop-shadow-[0_0_3px_rgba(52,211,153,0.3)] hover:drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                                  </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  Filter out contacts before sending to VAPI based on their local time
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={csvPreFilterEnabled}
                              onCheckedChange={setCsvPreFilterEnabled}
                            />
                          </div>
                        </div>
                        {csvPreFilterEnabled && (
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-white text-sm">Buffer Time (minutes)</Label>
                                <div className="flex items-center space-x-2 mt-2">
                                  <span className="text-emerald-400 font-medium text-sm">{bufferMinutes}</span>
                                  <Slider
                                    value={[bufferMinutes]}
                                    onValueChange={(value) => setBufferMinutes(value[0])}
                                    min={0}
                                    max={120}
                                    step={15}
                                    className="flex-1"
                                  />
                                  <span className="text-gray-400 text-xs">mins</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  Safety buffer before/after working hours
                                </p>
                              </div>
                            </div>
                            {excludedContactsCount > 0 && (
                              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                                <div className="flex items-center space-x-2">
                                  <Info className="w-4 h-4 text-blue-400" />
                                  <span className="text-blue-300 text-sm font-medium">
                                    {excludedContactsCount} contacts excluded from current time window
                                  </span>
                                </div>
                                <p className="text-blue-200 text-xs mt-1">
                                  These contacts will be scheduled for their next available working hours
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>



                      {/* Holiday Management */}
                      <div className="bg-gray-800/30 rounded-lg border border-gray-700">
                        <div className="p-4 border-b border-gray-700">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                              <Calendar className="w-4 h-4 text-green-400" />
                            </div>
                            <div>
                              <Label className="text-white font-medium">Holiday Calendar Management</Label>
                              <p className="text-xs text-gray-400 mt-1">
                                Manage regional holidays and custom exclusions
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 space-y-4">
                          <div>
                            <Label className="text-white text-sm mb-3 block">Holiday Regions</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {['US', 'CA', 'UK', 'AU', 'DE', 'FR'].map((region) => (
                                <label key={region} className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={holidayRegions.includes(region)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setHolidayRegions(prev => [...prev, region]);
                                      } else {
                                        setHolidayRegions(prev => prev.filter(r => r !== region));
                                      }
                                    }}
                                    className="rounded border-gray-600 bg-gray-900 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <span className="text-white text-sm">{region}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label className="text-white text-sm">Custom Holiday Dates</Label>
                            <Input
                              type="text"
                              placeholder="2024-12-25, 2024-01-01 (comma-separated)"
                              className="bg-gray-900 border-gray-600 text-white mt-2"
                              onChange={(e) => {
                                const dates = e.target.value.split(',').map(d => d.trim()).filter(d => d);
                                setCustomHolidays(dates);
                              }}
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              Add custom dates in YYYY-MM-DD format
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Summary */}
                    <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300 font-medium text-sm">Schedule Summary</span>
                      </div>
                      <div className="space-y-2 text-xs text-emerald-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-gray-400">Default Timezone:</span> {defaultTimezone}
                          </div>
                          <div>
                            <span className="text-gray-400">Holiday Regions:</span> {
                              holidayRegions.length > 0 ? holidayRegions.join(', ') : 'None'
                            }
                          </div>
                        </div>
                        <div className="pt-2 border-t border-emerald-700/50">
                          <span className="text-gray-400">Active Features:</span> {
                            [
                              excludeHolidays && 'Holiday exclusion',
                              respectDST && 'DST adjustment'
                            ].filter(Boolean).join(', ') || 'Basic scheduling only'
                          }
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* Step 5: Team Management */}
            {currentStep === 5 && (
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b border-gray-800 pb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-xl font-semibold text-white">Team Management</h2>
                  </div>
                  <p className="text-sm text-gray-400">
                    Invite team members to collaborate on this campaign with specific roles and permissions
                  </p>
                </div>

                {/* Enable Team Management */}
                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <Users className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Label className="text-white font-medium">Enable Team Collaboration</Label>
                        <button
                          onClick={() => showHelp('teamManagement')}
                          className="text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                        >
                          <Info className="w-4 h-4 cursor-pointer drop-shadow-[0_0_3px_rgba(52,211,153,0.3)] hover:drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Allow team members to collaborate on this campaign
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={enableTeamManagement}
                    onCheckedChange={setEnableTeamManagement}
                  />
                </div>

                {/* Team Management Component */}
                {enableTeamManagement ? (
                  <CampaignTeamManager
                    teamMembers={teamMembers}
                    invitations={teamInvitations}
                    onAddMember={async (email: string, role: string) => {
                      // Create mock invitation for demo
                      const newInvitation: TeamInvitation = {
                        id: `inv-${Date.now()}`,
                        email,
                        role: role as 'manager' | 'agent' | 'viewer',
                        status: 'pending',
                        invitationToken: `token-${Date.now()}`,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        createdAt: new Date().toISOString(),
                        crmAccessLevel: role === 'manager' ? 'all_leads' : role === 'agent' ? 'campaign_leads' : 'no_access',
                        leadPermissions: {
                          view: true,
                          edit: role === 'manager' || role === 'agent',
                          delete: role === 'manager',
                          export: role === 'manager' || role === 'agent',
                          assign: role === 'manager'
                        }
                      };
                      setTeamInvitations(prev => [...prev, newInvitation]);
                    }}
                    onRemoveMember={async (memberId: string) => {
                      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
                    }}
                    onUpdateRole={async (memberId: string, role: string) => {
                      setTeamMembers(prev => prev.map(m => 
                        m.id === memberId 
                          ? { 
                              ...m, 
                              role: role as 'owner' | 'manager' | 'agent' | 'viewer',
                              crmAccessLevel: role === 'manager' ? 'all_leads' : role === 'agent' ? 'campaign_leads' : 'no_access',
                              leadPermissions: {
                                view: true,
                                edit: role === 'manager' || role === 'agent',
                                delete: role === 'manager',
                                export: role === 'manager' || role === 'agent',
                                assign: role === 'manager'
                              }
                            }
                          : m
                      ));
                    }}
                    onResendInvitation={async (invitationId: string) => {
                      // Mock resend logic
                      console.log('Resending invitation:', invitationId);
                    }}
                    onCancelInvitation={async (invitationId: string) => {
                      setTeamInvitations(prev => prev.filter(i => i.id !== invitationId));
                    }}
                    isEditable={true}
                  />
                ) : (
                  <div className="text-center py-12 bg-gray-800/20 rounded-lg border border-gray-700">
                    <Users className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                    <h3 className="text-lg font-medium text-white mb-2">Team Collaboration Disabled</h3>
                    <p className="text-gray-400 mb-4">
                      This campaign will only be accessible by you. Enable team management to invite collaborators.
                    </p>
                    <Button
                      onClick={() => setEnableTeamManagement(true)}
                      variant="outline"
                      className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Enable Team Management
                    </Button>
                  </div>
                )}

                {/* Team Summary */}
                {enableTeamManagement && (
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-300 font-medium text-sm">Team Summary</span>
                    </div>
                    <div className="space-y-2 text-xs text-blue-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-400">Active Members:</span> {teamMembers.length}
                        </div>
                        <div>
                          <span className="text-gray-400">Pending Invites:</span> {teamInvitations.length}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-blue-700/50">
                        <span className="text-gray-400">Collaboration Level:</span> {
                          teamMembers.length + teamInvitations.length > 0 
                            ? 'Multi-user campaign' 
                            : 'Single-user campaign'
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Review & Launch */}
            {currentStep === 6 && (
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b border-gray-800 pb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-xl font-semibold text-white">Review & Launch</h2>
                  </div>
                  <p className="text-sm text-gray-400">
                    Review your campaign estimates and costs before launching
                  </p>
                </div>

                {/* Campaign Summary */}
                <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-emerald-400" />
                    Campaign: {campaignName}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Total Leads</p>
                      <p className="text-xl font-semibold text-white">{csvData.length.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Retry Strategy</p>
                      <p className="text-xl font-semibold text-white capitalize">{retryStrategy}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Working Hours</p>
                      <p className="text-xl font-semibold text-white">{workingHoursEnabled ? '8 hrs/day' : '24/7'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Team Members</p>
                      <p className="text-xl font-semibold text-white">{teamMembers.length + teamInvitations.length}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline Estimates */}
                {estimatedMetrics && (
                  <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-emerald-300 mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Timeline Estimates
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Total Attempts</p>
                        <p className="text-xl font-semibold text-white">{estimatedMetrics.totalAttempts.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">Including retries</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Total Minutes</p>
                        <p className="text-xl font-semibold text-white">{estimatedMetrics.totalMinutes.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">Call time</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Campaign Length</p>
                        <p className="text-xl font-semibold text-white">{estimatedMetrics.campaignDays} days</p>
                        <p className="text-xs text-gray-500 mt-1">Working hours</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Throughput</p>
                        <p className="text-xl font-semibold text-white">{(concurrentCalls / avgCallDuration).toFixed(1)} calls/min</p>
                        <p className="text-xs text-gray-500 mt-1">Concurrent: {concurrentCalls}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cost Breakdown */}
                <div className="bg-pink-900/20 border border-pink-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-pink-300 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Cost Breakdown
                  </h3>
                  
                  {/* Average Call Duration Input */}
                  <div className="mb-4 flex items-center space-x-4">
                    <div className="flex-1">
                      <Label className="text-sm text-gray-400">Average Call Duration (minutes)</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          type="number"
                          value={avgCallDuration}
                          onChange={(e) => setAvgCallDuration(Number(e.target.value))}
                          min="0.5"
                          max="10"
                          step="0.5"
                          className="w-24 bg-gray-900 border-gray-600 text-white"
                        />
                        <span className="text-xs text-gray-400">Default based on industry average</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost per minute breakdown */}
                  <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-gray-300 mb-3">Cost per Minute Breakdown</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vapi Hosting</span>
                        <span className="text-white">$0.05</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Transcription (STT)</span>
                        <span className="text-white">$0.01</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Text-to-Speech (TTS)</span>
                        <span className="text-white">$0.05</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Language Model (LLM)</span>
                        <span className="text-white">$0.07</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-700 font-medium">
                        <span className="text-white">Total per Minute</span>
                        <span className="text-emerald-400">${costPerMinute.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Total Cost Estimate */}
                  {estimatedMetrics && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-400 mb-2">Total Estimated Cost</p>
                      <p className="text-4xl font-bold text-white">${estimatedMetrics.totalCost.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {estimatedMetrics.totalMinutes.toLocaleString()} minutes × ${costPerMinute}/min
                      </p>
                    </div>
                  )}
                </div>

                {/* Balance Check */}
                <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                    <Wallet className="w-5 h-5 mr-2 text-blue-400" />
                    Credit Balance Check
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-400">Current Vapi Credit Balance</Label>
                      <div className="flex items-center space-x-3 mt-1">
                        <Input
                          type="number"
                          placeholder="Enter your current balance"
                          value={currentBalance || ''}
                          onChange={(e) => setCurrentBalance(e.target.value ? Number(e.target.value) : null)}
                          className="w-48 bg-gray-900 border-gray-600 text-white"
                        />
                        <a
                          href="https://dashboard.vapi.ai/org/billing/credits"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center"
                        >
                          Check Balance
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>

                    {currentBalance !== null && estimatedMetrics && (
                      <div className="space-y-3">
                        {/* Balance Status */}
                        <div className={`p-4 rounded-lg border ${
                          estimatedMetrics.balanceStatus === 'healthy' 
                            ? 'bg-emerald-900/20 border-emerald-700/50' 
                            : estimatedMetrics.balanceStatus === 'warning'
                            ? 'bg-yellow-900/20 border-yellow-700/50'
                            : 'bg-red-900/20 border-red-700/50'
                        }`}>
                          <div className="flex items-center space-x-2">
                            {estimatedMetrics.balanceStatus === 'healthy' ? (
                              <CheckCircle className="w-5 h-5 text-emerald-400" />
                            ) : estimatedMetrics.balanceStatus === 'warning' ? (
                              <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-400" />
                            )}
                            <p className={`font-medium ${
                              estimatedMetrics.balanceStatus === 'healthy' 
                                ? 'text-emerald-300' 
                                : estimatedMetrics.balanceStatus === 'warning'
                                ? 'text-yellow-300'
                                : 'text-red-300'
                            }`}>
                              {estimatedMetrics.balanceStatus === 'healthy' 
                                ? 'Balance Healthy' 
                                : estimatedMetrics.balanceStatus === 'warning'
                                ? 'Balance Warning'
                                : 'Insufficient Balance'}
                            </p>
                          </div>
                          <p className="text-sm text-gray-300 mt-2">
                            Current: ${currentBalance.toLocaleString()} | 
                            Required: ${estimatedMetrics.totalCost.toLocaleString()} | 
                            {estimatedMetrics.balanceStatus === 'healthy' 
                              ? ` Surplus: $${(currentBalance - estimatedMetrics.totalCost).toLocaleString()}`
                              : ` Deficit: $${(estimatedMetrics.totalCost - currentBalance).toLocaleString()}`
                            }
                          </p>
                        </div>

                        {/* Top-up Recommendation */}
                        {estimatedMetrics.recommendedTopUp > 0 && (
                          <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                            <p className="text-sm font-medium text-blue-300 mb-1">Recommended Top-Up</p>
                            <p className="text-2xl font-bold text-white">${estimatedMetrics.recommendedTopUp}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Includes 20% buffer for variations in call duration
                            </p>
                            <a
                              href="https://dashboard.vapi.ai/org/billing/credits"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center text-sm text-blue-400 hover:text-blue-300"
                            >
                              Add Credits in Vapi Dashboard
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Important Notes */}
                <div className="bg-gray-800/20 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="text-sm text-gray-400">
                      <p className="font-medium text-gray-300 mb-2">Important Notes:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Estimates assume scrubbed contact lists and may vary based on actual call outcomes</li>
                        <li>No-answer and voicemail attempts count toward total minutes but may be shorter</li>
                        <li>Consider upgrading your Vapi plan for better per-minute rates on high-volume campaigns</li>
                        <li>Monitor campaign progress to adjust estimates based on actual performance</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Final Summary */}
                {estimatedMetrics && (
                  <div className="bg-emerald-900/10 border border-emerald-700/30 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-emerald-300 mb-4 flex items-center">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Launch Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-3xl font-bold text-white">{estimatedMetrics.campaignDays}</p>
                        <p className="text-sm text-gray-400">Days to Complete</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-white">${estimatedMetrics.totalCost}</p>
                        <p className="text-sm text-gray-400">Total Cost</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-white">{estimatedMetrics.totalAttempts.toLocaleString()}</p>
                        <p className="text-sm text-gray-400">Total Call Attempts</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
            
            {/* Bottom Button */}
            <div className="p-6 border-t border-gray-800 bg-gray-900">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  {currentStep === 1 ? 'Cancel' : 'Back'}
                </Button>
                <Button 
                  onClick={currentStep === 6 ? handleCreateCampaign : handleNext}
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {currentStep === 6 ? (isLoading ? 'Creating...' : 'Launch campaign') : 'Next'}
                </Button>
              </div>
            </div>
          </div>

          {/* Right side - CSV Preview (Step 1 only) */}
          {currentStep === 1 && (
            <div className="w-1/2 bg-gray-950 border-l border-gray-800">
            {csvFile && csvData.length > 0 ? (
              <div className="h-full flex flex-col">
                <div className="px-6 py-4 border-b border-gray-800 bg-gray-900">
                  <h3 className="text-lg font-semibold text-white">
                    CSV Preview ({csvData.length} contacts)
                  </h3>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="h-full overflow-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
                    <table className="w-full border-separate border-spacing-0">
                      <thead className="sticky top-0 z-10">
                        <tr>
                          {Object.keys(csvData[0] || {}).map((header, index) => (
                            <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-400 bg-gray-800 border-b border-gray-700 first:pl-6 last:pr-6">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.map((row, index) => (
                          <tr key={index} className="group hover:bg-gray-800/30 transition-colors">
                            {Object.values(row).map((value: any, cellIndex) => (
                              <td key={cellIndex} className="px-4 py-2.5 text-sm text-gray-300 border-b border-gray-800/50 first:pl-6 last:pr-6 group-hover:text-white transition-colors">
                                <div className="truncate max-w-[200px]" title={value}>
                                  {value}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {csvData.length > 100 && (
                  <div className="px-6 py-3 border-t border-gray-800 bg-gray-900">
                    <p className="text-xs text-gray-500">
                      Displaying all {csvData.length} contacts • Scroll to view more
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Upload a CSV file to preview contacts</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Help Panel - Shows for steps 2-4 */}
          {currentStep > 1 && (
            <div className={`${showHelpPanel ? 'w-1/2' : 'w-0'} flex flex-col border-l border-gray-800 bg-gray-950 transition-all duration-300 overflow-hidden`}>
              {showHelpPanel && helpContent && (
                <>
                  {/* Help Panel Header */}
                  <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{helpSections[helpContent as keyof typeof helpSections]?.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">{helpSections[helpContent as keyof typeof helpSections]?.description}</p>
                      </div>
                      <button
                        onClick={() => setShowHelpPanel(false)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Help Panel Content */}
                  <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
                    <div className="prose prose-invert max-w-none">
                      <div 
                        className="text-gray-300 text-sm leading-relaxed space-y-4"
                        dangerouslySetInnerHTML={{ 
                          __html: helpSections[helpContent as keyof typeof helpSections]?.content
                            .replace(/## /g, '<h2 class="text-lg font-semibold text-white mt-6 mb-3">')
                            .replace(/### /g, '<h3 class="text-base font-medium text-white mt-5 mb-2">')
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-medium">$1</strong>')
                            .replace(/- (.*?)$/gm, '<li class="ml-4">$1</li>')
                            .replace(/✅ \*\*(.*?)\*\*/g, '<div class="flex items-start space-x-2 my-2"><span class="text-green-400 text-sm">✅</span><span class="text-green-300 font-medium">$1</span></div>')
                            .replace(/⚠️ \*\*(.*?)\*\*/g, '<div class="flex items-start space-x-2 my-2 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg"><span class="text-amber-400 text-sm">⚠️</span><span class="text-amber-200 font-medium">$1</span></div>')
                            .replace(/\n\n/g, '</div><div class="mt-4">')
                            .replace(/^/, '<div>')
                            .replace(/$/, '</div>')
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="p-4 border-t border-gray-800 bg-gray-900">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        Need more help? Check our documentation
                      </div>
                      <button
                        onClick={() => setShowHelpPanel(false)}
                        className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};