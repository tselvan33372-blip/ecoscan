/**
 * OPTIONAL: Vercel Serverless Function for AI Detection
 * 
 * Usage: Create a "api" folder in your project root
 * Then create "api/analyze.js" with this code
 * 
 * This keeps your API key secure (not exposed to browser)
 * Access: POST https://your-site.vercel.app/api/analyze
 */

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Get API key from environment variables (secure!)
    const API_KEY = process.env.HF_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Call Hugging Face API
    const response = await fetch(
      'https://api-inference.huggingface.co/models/google/vit-base-patch16-224',
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
        method: 'POST',
        body: Buffer.from(image.split(',')[1], 'base64'),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    // Classify waste based on predictions
    const classification = classifyWaste(result);

    res.status(200).json({
      success: true,
      predictions: result,
      classification: classification,
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}

function classifyWaste(predictions) {
  if (!predictions || predictions.length === 0) {
    return { type: 'unknown', confidence: 0 };
  }

  const topPrediction = predictions[0].label.toLowerCase();
  const confidence = (predictions[0].score * 100).toFixed(1);

  const biodegradableKeywords = [
    'apple', 'banana', 'orange', 'fruit', 'vegetable', 'leaf', 'leaves',
    'grass', 'wood', 'paper', 'cardboard', 'food', 'organic', 'compost'
  ];

  const nonBiodegradableKeywords = [
    'plastic', 'bottle', 'bag', 'foam', 'styrofoam', 'metal', 'aluminum',
    'can', 'glass', 'tire', 'battery', 'electronics'
  ];

  let type = 'unknown';

  for (let keyword of biodegradableKeywords) {
    if (topPrediction.includes(keyword)) {
      type = 'biodegradable';
      break;
    }
  }

  for (let keyword of nonBiodegradableKeywords) {
    if (topPrediction.includes(keyword)) {
      type = 'non-biodegradable';
      break;
    }
  }

  return {
    type: type,
    item: topPrediction,
    confidence: confidence,
  };
}

/**
 * HOW TO USE:
 * 
 * 1. Create folder: api/
 * 2. Create file: api/analyze.js (paste this code)
 * 3. Add this to your HTML JavaScript:
 * 
 *    // Instead of calling HF API directly:
 *    const response = await fetch('/api/analyze', {
 *      method: 'POST',
 *      headers: { 'Content-Type': 'application/json' },
 *      body: JSON.stringify({ image: imageData })
 *    });
 * 
 * BENEFITS:
 * ✓ API key stays secure (not in browser)
 * ✓ Can add rate limiting
 * ✓ Can log requests
 * ✓ Professional production setup
 */
