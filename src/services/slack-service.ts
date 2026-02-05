interface SlackConfig {
  webhookUrl?: string;
  channel?: string;
  botToken?: string;
}

interface SlackMessage {
  text: string;
  channel?: string;
  attachments?: Array<{
    color?: string;
    title?: string;
    text?: string;
    fields?: Array<{
      title: string;
      value: string;
      short?: boolean;
    }>;
    footer?: string;
    ts?: number;
  }>;
  blocks?: Array<any>;
  thread_ts?: string;
  username?: string;
  icon_emoji?: string;
  link_names?: boolean;
}

interface SlackUser {
  id: string;
  name: string;
  real_name?: string;
  email?: string;
}

class SlackService {
  private config: SlackConfig = {};
  private configured = false;

  configure(config: SlackConfig) {
    this.config = config;
    this.configured = !!(config.webhookUrl || config.botToken);
  }

  async sendNotification(message: SlackMessage): Promise<boolean> {
    if (!this.configured || !this.config.webhookUrl) {
      console.warn('Slack integration not configured');
      return false;
    }

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      return false;
    }
  }

  async sendLeadNotification(lead: {
    name: string;
    status: string;
    campaign: string;
    assignedTo?: string;
    outcome?: string;
  }) {
    const color =
      lead.status === 'converted' ? 'good' : lead.status === 'interested' ? 'warning' : '#439FE0';

    const message: SlackMessage = {
      text: `Lead Update: ${lead.name}`,
      attachments: [
        {
          color,
          title: `Lead: ${lead.name}`,
          fields: [
            {
              title: 'Status',
              value: lead.status,
              short: true,
            },
            {
              title: 'Campaign',
              value: lead.campaign,
              short: true,
            },
            ...(lead.outcome
              ? [
                  {
                    title: 'Outcome',
                    value: lead.outcome,
                    short: true,
                  },
                ]
              : []),
            ...(lead.assignedTo
              ? [
                  {
                    title: 'Assigned To',
                    value: lead.assignedTo,
                    short: true,
                  },
                ]
              : []),
          ],
          footer: 'Trinity Labs AI Platform',
          ts: Date.now() / 1000,
        },
      ],
    };

    return this.sendNotification(message);
  }

  async sendCampaignNotification(campaign: {
    name: string;
    status: 'started' | 'completed' | 'paused';
    totalCalls?: number;
    successRate?: number;
  }) {
    const color =
      campaign.status === 'completed'
        ? 'good'
        : campaign.status === 'started'
          ? '#439FE0'
          : 'warning';

    const message: SlackMessage = {
      text: `Campaign ${campaign.status}: ${campaign.name}`,
      attachments: [
        {
          color,
          title: campaign.name,
          text: `Campaign has been ${campaign.status}`,
          fields: [
            ...(campaign.totalCalls !== undefined
              ? [
                  {
                    title: 'Total Calls',
                    value: campaign.totalCalls.toString(),
                    short: true,
                  },
                ]
              : []),
            ...(campaign.successRate !== undefined
              ? [
                  {
                    title: 'Success Rate',
                    value: `${campaign.successRate}%`,
                    short: true,
                  },
                ]
              : []),
          ],
          footer: 'Trinity Labs AI Platform',
          ts: Date.now() / 1000,
        },
      ],
    };

    return this.sendNotification(message);
  }

  async tagUser(username: string, message: string): Promise<boolean> {
    // In a real implementation, this would use Slack's API to find the user ID
    // and properly mention them in the message
    const taggedMessage: SlackMessage = {
      text: `<@${username}> ${message}`,
      link_names: true,
    };

    return this.sendNotification(taggedMessage);
  }

  async searchUsers(query: string): Promise<SlackUser[]> {
    // Mock implementation - in production this would use Slack's users.list API
    return [
      { id: 'U123456', name: 'john.doe', real_name: 'John Doe', email: 'john@example.com' },
      { id: 'U789012', name: 'jane.smith', real_name: 'Jane Smith', email: 'jane@example.com' },
    ].filter(
      (user) =>
        user.name.includes(query.toLowerCase()) ||
        user.real_name?.toLowerCase().includes(query.toLowerCase())
    );
  }

  formatLeadMention(leadId: string, leadName: string): string {
    // Creates a clickable link to the lead in Slack
    const baseUrl = window.location.origin;
    return `<${baseUrl}/leads/${leadId}|${leadName}>`;
  }

  isConfigured(): boolean {
    return this.configured;
  }
}

export const slackService = new SlackService();

// Helper function to initialize Slack from settings
export const initializeSlack = (webhookUrl?: string, botToken?: string) => {
  slackService.configure({
    webhookUrl,
    botToken,
    channel: '#sales-notifications',
  });
};
