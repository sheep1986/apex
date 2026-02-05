// Add this debug code to CampaignDetails.tsx temporarily
// Inside the handleCallClick function, after transformedCallData is created

console.log('📊 DEBUG: transformedCallData being passed to modal:', {
  id: transformedCallData.id,
  duration: transformedCallData.duration,
  cost: transformedCallData.cost,
  recording: transformedCallData.recording,
  customerName: transformedCallData.customerName,
  hasTranscript: !!transformedCallData.transcript,
  transcriptLength: transformedCallData.transcript?.length
});

// Also log the raw data from API
console.log('📊 DEBUG: Raw fullCallData from API:', {
  id: fullCallData.id,
  duration: fullCallData.duration,
  cost: fullCallData.cost,
  recording_url: fullCallData.recording_url,
  recordingUrl: fullCallData.recordingUrl,
  recording: fullCallData.recording
});