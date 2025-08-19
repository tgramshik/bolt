// Vercel API Route to proxy WebApp requests to our backend
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  try {
    // Our backend server IP (replace with your actual server IP)
    const BACKEND_HOST = 'http://212.86.105.205:8081'
    const targetUrl = `${BACKEND_HOST}/webapp/inline`
    
    console.log('Proxying to:', targetUrl)
    console.log('Request body:', req.body)
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    })
    
    const data = await response.json()
    
    res.status(response.status).json(data)
    
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ 
      error: 'Proxy failed', 
      details: error.message 
    })
  }
}
