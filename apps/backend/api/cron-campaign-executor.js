// Vercel Cron Job endpoint for campaign execution
// Add to vercel.json: { "crons": [{ "path": "/api/cron-campaign-executor", "schedule": "* * * * *" }] }

const { CampaignExecutor } = require('../services/campaign-executor');

module.exports = async (req, res) => {
  // Verify this is from Vercel Cron (add authentication as needed)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  console.log('⏰ Vercel Cron: Campaign executor triggered at', new Date().toISOString());
  
  try {
    // Create campaign executor instance
    const executor = new CampaignExecutor();
    
    // Process campaigns once
    await executor.processCampaigns();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Campaign processing completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Cron execution error:', error);
    return res.status(500).json({ 
      error: 'Campaign processing failed',
      message: error.message 
    });
  }
};