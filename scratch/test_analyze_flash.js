
// Using native fetch
async function testAnalyzeFlash() {
  const url = 'http://localhost:3000/api/forensic?action=analyze';
  const body = {
    projectId: 'PRJ-GCXVCAYTV',
    organizationId: 'org_erani_test',
    aiModel: 'gemini-1.5-flash',
    aiTemperature: 0,
    allowStorage: true,
    historicalContext: true
  };

  console.log('Sending request to:', url);
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
    if (!data.success) {
      console.log('Error Data:', JSON.stringify(data, null, 2));
    } else {
      console.log('Response Summary:', {
        success: data.success,
        reportMetadata: data.report?.report_metadata,
        impacto: data.report?.slide_1_impacto_directo,
        top5Count: data.report?.slide_2_analisis_forense?.top_5_tickets?.length
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testAnalyzeFlash();
