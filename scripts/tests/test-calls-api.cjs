#!/usr/bin/env node

/**
 * Test script to verify the updated calls API works with the calls table
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Mock request with organization ID
const mockUser = {
  organizationId: '2566d8c5-2245-4a3c-b539-4cea21a07d9b',
  primaryEmailAddress: { emailAddress: 'test@example.com' }
};

async function testCallsAPI() {
  try {
    console.log('🧪 Testing Calls API with real database data...\n');

    // Test the calls endpoint
    const response = await axios.get(`${API_BASE_URL}/calls`, {
      params: {
        page: 1,
        limit: 10
      },
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ API Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error testing calls API:', error.response?.data || error.message);
  }
}

testCallsAPI();