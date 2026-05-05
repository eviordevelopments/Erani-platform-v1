
// Using native fetch

async function testAnalyze() {
  const url = 'http://localhost:3000/api/forensic?action=analyze';
  const body = {
    projectId: 'PRJ-GCXVCAYTV',
    organizationId: 'org_erani_test',
    aiModel: 'gemini-2.5-flash-lite',
    aiTemperature: 0,
    allowStorage: true,
    historicalContext: true
  };

  console.log('Sending request to:', url);
  console.log('Body:', JSON.stringify(body, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testAnalyze();
