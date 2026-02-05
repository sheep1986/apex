interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
  lastUpdated: Date;
  helpful: number;
  notHelpful: number;
  featured?: boolean;
}

interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  articleCount: number;
  order: number;
}

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  duration: number;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  views: number;
  likes: number;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  order: number;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
  responses: Array<{
    id: string;
    message: string;
    author: string;
    timestamp: Date;
    isStaff: boolean;
  }>;
}

class HelpService {
  // Get help categories
  async getHelpCategories(): Promise<HelpCategory[]> {
    return [
      {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Everything you need to know to get up and running',
        icon: '🚀',
        articleCount: 8,
        order: 1,
      },
      {
        id: 'integrations',
        name: 'Integrations',
        description: 'Connect Trinity, Cloud Database, Automation Tools and other services',
        icon: '🔗',
        articleCount: 12,
        order: 2,
      },
      {
        id: 'ai-assistants',
        name: 'AI Assistants',
        description: 'Create and manage your AI calling assistants',
        icon: '🤖',
        articleCount: 15,
        order: 3,
      },
      {
        id: 'campaigns',
        name: 'Campaigns',
        description: 'Launch and manage your calling campaigns',
        icon: '📞',
        articleCount: 10,
        order: 4,
      },
      {
        id: 'analytics',
        name: 'Analytics & Reporting',
        description: 'Understanding your call performance and metrics',
        icon: '📊',
        articleCount: 7,
        order: 5,
      },
      {
        id: 'billing',
        name: 'Billing & Credits',
        description: 'Manage your subscription and credit usage',
        icon: '💳',
        articleCount: 6,
        order: 6,
      },
      {
        id: 'troubleshooting',
        name: 'Troubleshooting',
        description: 'Common issues and how to resolve them',
        icon: '🔧',
        articleCount: 9,
        order: 7,
      },
      {
        id: 'api-reference',
        name: 'API Reference',
        description: 'Technical documentation for developers',
        icon: '⚡',
        articleCount: 20,
        order: 8,
      },
    ];
  }

  // Get help articles
  async getHelpArticles(category?: string, search?: string): Promise<HelpArticle[]> {
    const allArticles: HelpArticle[] = [
      // Getting Started Articles
      {
        id: 'quick-start-guide',
        title: 'Quick Start Guide: Your First AI Call in 5 Minutes',
        content: `
# Quick Start Guide: Your First AI Call in 5 Minutes

Welcome to Trinity Labs AI! This guide will help you make your first AI call in under 5 minutes.

## Step 1: Complete Your Profile
Set up your basic information including:
- Name and company details
- Industry and timezone
- Contact information

## Step 2: Connect Your Integrations
You'll need to connect:
- **Trinity Voice** (Required): Powers the AI voice calls
- **Airtable** (Required): Stores call results and lead data
- **Make.com** (Optional): Automates follow-up workflows

### Getting Your API Keys:
1. **Trinity**: Go to your Trinity dashboard → API Keys
2. **Airtable**: Visit [airtable.com/create/tokens](https://airtable.com/create/tokens)
3. **Make.com**: Create a webhook in your Make.com account

## Step 3: Create Your AI Assistant
Configure your AI with:
- Professional voice selection
- Custom conversation tone
- Working hours and availability
- Key information to collect

## Step 4: Make Your First Test Call
- Upload a test contact
- Review the generated script
- Click "Start Test Call"
- Verify everything works perfectly

## Step 5: Launch Your Campaign
Once your test call succeeds:
- Upload your contact list
- Set your campaign parameters
- Launch and monitor in real-time

🎉 **Congratulations!** You're now ready to scale your AI calling.

Need help? Contact our support team anytime.
        `,
        category: 'getting-started',
        tags: ['setup', 'onboarding', 'first-call'],
        difficulty: 'beginner',
        estimatedReadTime: 3,
        lastUpdated: new Date('2024-01-15'),
        helpful: 47,
        notHelpful: 2,
        featured: true,
      },
      {
        id: 'voice-engine-integration',
        title: 'Trinity Voice Engine: Setup Guide',
        content: `
# Trinity Voice Engine: Setup Guide

Trinity Labs AI manages your voice infrastructure centrally. This guide explains how to verify your connection.

## Voice Engine Status

Your voice engine is pre-configured by the Trinity Labs AI team appropriately for your organization's plan.

1. Navigate to **Settings > Account Setup**
2. Check for the "Voice Engine Active" indicator
3. If not connected, contact your account manager

## Voice Configuration Options

### Voice Selection
- **Professional**: Best for business calls
- **Friendly**: Great for customer service
- **Authoritative**: Ideal for sales calls

### Model Settings
- **Standard**: Faster and cost-effective
- **Advanced**: Most intelligent (recommended for complex sales)

### Advanced Settings
- **Recording**: Always enabled for quality assurance
- **Transcription**: Real-time conversation transcripts
- **Interruption Handling**: Optimized for natural flow

## Troubleshooting

### Connection Issues
- Verify your internet connection
- Clear browser cache
- Ensure no firewall blocks websocket connections

### Call Quality
- Check your microphone settings
- Use a headset for best results
- Run a speed test to ensure stable connectivity

## Best Practices

1. **Test First**: Always test with internal numbers
2. **Monitor**: Watch live transcripts in the dashboard
3. **Optimize**: Refine scripts based on call analytics

Need specific help? Contact our support team directly.
        `,
        category: 'integrations',
        tags: ['voice-engine', 'setup', 'voice-ai'],
        difficulty: 'beginner',
        estimatedReadTime: 3,
        lastUpdated: new Date('2026-02-01'),
        helpful: 34,
        notHelpful: 1,
      },
      {
        id: 'airtable-setup',
        title: 'Airtable Integration: Automatic Base Creation',
        content: `
# Airtable Integration: Automatic Base Creation

Airtable stores all your call results and lead data automatically. Here's how to set it up.

## Getting Your Airtable API Key

1. Go to [airtable.com/create/tokens](https://airtable.com/create/tokens)
2. Click "Create new token"
3. Name it "Trinity Labs Integration"
4. Select these scopes:
   - data.records:read
   - data.records:write
   - schema.bases:read
   - schema.bases:write

## What Gets Created Automatically

When you complete onboarding, Trinity automatically creates:

### Base Structure
- **Base Name**: "[Your Assistant Name] - Call Results"
- **Multiple Tables**: Organized by call outcomes

### Table 1: Interested Prospects
- Name, Phone, Email
- Company and Interest Level
- Call Date and Duration
- Recording URL and Transcript
- Next Action Required

### Table 2: Callback Requests
- Contact Information
- Preferred Callback Time
- Reason for Callback
- Status Tracking

### Table 3: Not Interested / DNC
- Contact Details
- Reason for Disinterest
- Do Not Call Date
- Compliance Tracking

### Table 4: Appointments Scheduled
- Contact Information
- Appointment Date/Time
- Meeting Type
- Calendar Integration

## Data Flow

1. **Call Completes** → AI analyzes conversation
2. **Outcome Determined** → Categorized automatically
3. **Data Stored** → Appropriate Airtable table
4. **Notifications Sent** → Real-time updates
5. **Follow-ups Triggered** → If Make.com connected

## Customization Options

### Field Modifications
- Add custom fields for your industry
- Modify field types (text, select, date)
- Set up formulas and calculations

### View Configurations
- Filter by date ranges
- Sort by priority or status
- Create custom views for different teams

### Automation Rules
- Auto-assign leads to team members
- Send notifications for hot prospects
- Update CRM systems automatically

## Best Practices

1. **Regular Cleanup**: Archive old records
2. **Consistent Naming**: Use standard naming conventions
3. **Access Control**: Limit who can edit data
4. **Backup**: Export important data regularly

## Troubleshooting

### "Permission Denied" Error
- Check your API token scopes
- Verify workspace access
- Refresh your token if expired

### Missing Data
- Ensure webhook URLs are correct
- Check your internet connection during calls
- Verify AI assistant is active

### Slow Performance
- Reduce the number of fields
- Use filtered views instead of full tables
- Consider upgrading your Airtable plan

Need help? Our support team can assist with Airtable setup and optimization.
        `,
        category: 'integrations',
        tags: ['airtable', 'database', 'automation'],
        difficulty: 'intermediate',
        estimatedReadTime: 7,
        lastUpdated: new Date('2024-01-12'),
        helpful: 28,
        notHelpful: 3,
      },
    ];

    let filtered = allArticles;

    if (category) {
      filtered = filtered.filter((article) => article.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchLower) ||
          article.content.toLowerCase().includes(searchLower) ||
          article.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    return filtered.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.helpful - a.helpful;
    });
  }

  // Get video tutorials
  async getVideoTutorials(category?: string): Promise<VideoTutorial[]> {
    const tutorials: VideoTutorial[] = [
      {
        id: 'onboarding-walkthrough',
        title: 'Complete Onboarding Walkthrough',
        description: 'Step-by-step guide through the entire setup process',
        videoUrl: 'https://youtu.be/demo-onboarding',
        thumbnail: '/videos/thumbnails/onboarding.jpg',
        duration: 480, // 8 minutes
        category: 'getting-started',
        difficulty: 'beginner',
        views: 1247,
        likes: 112,
      },
      {
        id: 'ai-assistant-creation',
        title: 'Creating Your First AI Assistant',
        description: 'Learn how to configure voice, tone, and conversation flow',
        videoUrl: 'https://youtu.be/demo-assistant',
        thumbnail: '/videos/thumbnails/assistant.jpg',
        duration: 360, // 6 minutes
        category: 'ai-assistants',
        difficulty: 'beginner',
        views: 892,
        likes: 87,
      },
      {
        id: 'advanced-scripting',
        title: 'Advanced AI Scripting Techniques',
        description: 'Create complex conversation flows and handle objections',
        videoUrl: 'https://youtu.be/demo-scripting',
        thumbnail: '/videos/thumbnails/scripting.jpg',
        duration: 720, // 12 minutes
        category: 'ai-assistants',
        difficulty: 'advanced',
        views: 456,
        likes: 67,
      },
    ];

    if (category) {
      return tutorials.filter((tutorial) => tutorial.category === category);
    }

    return tutorials.sort((a, b) => b.views - a.views);
  }

  // Get FAQ items
  async getFAQItems(category?: string): Promise<FAQItem[]> {
    const faqs: FAQItem[] = [
      {
        id: 'faq-cost-per-call',
        question: 'How much does each AI call cost?',
        answer:
          'Each AI call costs approximately $0.75 regardless of duration, with an additional $0.05 per minute after the first minute. Most calls average 2-4 minutes, so typical cost is $0.80-$0.95 per call.',
        category: 'billing',
        helpful: 45,
        order: 1,
      },
      {
        id: 'faq-call-quality',
        question: 'How natural do the AI voices sound?',
        answer:
          'Our AI voices are powered by our advanced voice synthesis technology. Most people cannot distinguish them from human voices. We offer multiple voice options to match your brand and audience.',
        category: 'ai-assistants',
        helpful: 38,
        order: 2,
      },
      {
        id: 'faq-lead-handling',
        question: 'What happens when someone is interested?',
        answer:
          'When the AI detects interest, it automatically captures their information, schedules callbacks or appointments, and stores everything in your Airtable base. You can set up automatic notifications and follow-up sequences.',
        category: 'campaigns',
        helpful: 42,
        order: 3,
      },
      {
        id: 'faq-compliance',
        question: 'Is AI calling legal and compliant?',
        answer:
          'Yes, when done correctly. Our platform includes built-in compliance features like Do Not Call list management, consent tracking, and call recording disclosures. Always ensure you have proper consent before calling.',
        category: 'troubleshooting',
        helpful: 33,
        order: 4,
      },
      {
        id: 'faq-integration-time',
        question: 'How long does setup take?',
        answer:
          'Most users complete the full setup in under 10 minutes. The onboarding wizard guides you through each step, and our API integrations happen automatically once you provide your keys.',
        category: 'getting-started',
        helpful: 29,
        order: 5,
      },
    ];

    let filtered = faqs;
    if (category) {
      filtered = filtered.filter((faq) => faq.category === category);
    }

    return filtered.sort((a, b) => a.order - b.order);
  }

  // Search help content
  async searchHelp(query: string): Promise<{
    articles: HelpArticle[];
    videos: VideoTutorial[];
    faqs: FAQItem[];
  }> {
    const [articles, videos, faqs] = await Promise.all([
      this.getHelpArticles(undefined, query),
      this.getVideoTutorials(),
      this.getFAQItems(),
    ]);

    const searchLower = query.toLowerCase();

    const filteredVideos = videos.filter(
      (video) =>
        video.title.toLowerCase().includes(searchLower) ||
        video.description.toLowerCase().includes(searchLower)
    );

    const filteredFAQs = faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(searchLower) ||
        faq.answer.toLowerCase().includes(searchLower)
    );

    return {
      articles: articles.slice(0, 5), // Limit results
      videos: filteredVideos.slice(0, 3),
      faqs: filteredFAQs.slice(0, 5),
    };
  }

  // Submit support ticket
  async submitSupportTicket(ticket: {
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
  }): Promise<SupportTicket> {
    try {
      const newTicket: SupportTicket = {
        id: `ticket_${Math.random().toString(36).substr(2, 9)}`,
        subject: ticket.subject,
        description: ticket.description,
        status: 'open',
        priority: ticket.priority,
        createdAt: new Date(),
        updatedAt: new Date(),
        responses: [],
      };

      console.log('Support ticket submitted:', newTicket);

      // In production, this would save to your backend
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return newTicket;
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      throw error;
    }
  }

  // Get user's support tickets
  async getUserTickets(): Promise<SupportTicket[]> {
    // Mock user tickets
    return [
      {
        id: 'ticket_123',
        subject: 'Trinity integration not working',
        description: "I'm getting an invalid API key error when trying to connect Trinity.",
        status: 'resolved',
        priority: 'medium',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-11'),
        responses: [
          {
            id: 'resp_1',
            message:
              'Thanks for reaching out! Can you please double-check that you copied the complete API key from your Trinity dashboard?',
            author: 'Sarah (Support)',
            timestamp: new Date('2024-01-10T14:30:00'),
            isStaff: true,
          },
          {
            id: 'resp_2',
            message: 'I checked and the key was correct. Still getting the same error.',
            author: 'You',
            timestamp: new Date('2024-01-10T16:45:00'),
            isStaff: false,
          },
          {
            id: 'resp_3',
            message:
              "I found the issue - there was a trailing space in your API key. I've updated it and everything should work now. Please try again!",
            author: 'Sarah (Support)',
            timestamp: new Date('2024-01-11T09:15:00'),
            isStaff: true,
          },
        ],
      },
    ];
  }

  // Rate help content
  async rateHelpful(contentId: string, type: 'article' | 'faq', helpful: boolean): Promise<void> {
    try {
      console.log(`Rating ${type} ${contentId} as ${helpful ? 'helpful' : 'not helpful'}`);

      // In production, this would update the rating in your backend
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('Rating submitted successfully');
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw error;
    }
  }

  // Get quick help suggestions based on user context
  async getQuickHelp(context: {
    currentPage: string;
    userPlan: string;
    setupCompleted: boolean;
  }): Promise<HelpArticle[]> {
    const suggestions: { [key: string]: string[] } = {
      onboarding: ['quick-start-guide', 'voice-engine-integration'],
      dashboard: ['analytics-guide', 'campaign-optimization'],
      campaigns: ['campaign-best-practices', 'lead-management'],
      billing: ['billing-faq', 'credit-management'],
      settings: ['account-settings', 'notification-setup'],
    };

    const articleIds = suggestions[context.currentPage] || ['quick-start-guide'];
    const allArticles = await this.getHelpArticles();

    return allArticles.filter((article) => articleIds.includes(article.id));
  }

  // Format duration for videos
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

export const helpService = new HelpService();
export type { FAQItem, HelpArticle, HelpCategory, SupportTicket, VideoTutorial };

