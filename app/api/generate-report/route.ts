import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq client only if API key is available (runtime)
const groq = process.env.GROQ_API_KEY 
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

async function fetchWebsiteContext(url: string): Promise<string> {
  if (!url) return '';
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ReportBuilder/1.0)',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    if (!response.ok) return '';
    
    const html = await response.text();
    
    // Simple text extraction (remove HTML tags)
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000); // Limit to 2000 chars
    
    return text;
  } catch (error) {
    console.error('Error fetching website:', error);
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Groq client is initialized
    if (!groq) {
      return NextResponse.json(
        { error: 'API key not configured', details: 'GROQ_API_KEY environment variable is missing' },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));
    
    const { customer, businessName, businessType, businessContext, businessUrl, theme } = body;

    // Fetch website context if URL provided
    let websiteInfo = '';
    if (businessUrl) {
      websiteInfo = await fetchWebsiteContext(businessUrl);
    }

    // Build metadata context
    let metadataContext = '';
    if (customer.metadata && Object.keys(customer.metadata).length > 0) {
      metadataContext = '\nAdditional Customer Stats (use these for creative comparisons!):\n' +
        Object.entries(customer.metadata)
          .map(([key, value]) => `- ${key}: ${value}`)
          .join('\n');
    }

    const gradients = (theme && theme.gradients) ? theme.gradients : [
      'bg-gradient-to-br from-purple-600 to-blue-600',
      'bg-gradient-to-br from-orange-500 to-pink-600',
      'bg-gradient-to-br from-green-500 to-teal-600',
      'bg-gradient-to-br from-yellow-500 to-red-600',
      'bg-gradient-to-br from-indigo-600 to-purple-700',
    ];

    console.log('Using gradients:', gradients);

    const prompt = `You are creating a fun, visual "Year Wrapped" style report for a customer. Generate a JSON structure with 6-8 slides that tell their story through data.

Business Context:
- Business Type: ${businessType || "Service Business"}
- Business Name: ${businessName || "Our Business"}
- Report Period: November 2024
${businessContext ? `- About the Business: ${businessContext}` : ''}

Customer Data:
Name: ${customer.name}
${metadataContext}

Create a JSON array of slides with various types. You MUST use the actual numbers from the metadata above!

Available slide types and their structures:

1. INTRO slide:
{
  "type": "intro",
  "title": "Your November Wrapped",
  "subtitle": "${customer.name.split(' ')[0]}, let's celebrate!",
  "icon": "🎉",
  "gradient": "${gradients[0]}"
}

2. STAT slide (big number):
{
  "type": "stat",
  "mainStat": "45",
  "statLabel": "Workouts Completed",
  "icon": "💪",
  "gradient": "${gradients[1]}"
}

3. CHART slide (with visual chart):
{
  "type": "chart",
  "title": "Your Activity Breakdown",
  "gradient": "${gradients[2]}",
  "chartData": {
    "type": "bars",
    "data": [
      {"label": "Strength", "value": 25},
      {"label": "Cardio", "value": 18},
      {"label": "Yoga", "value": 10}
    ]
  }
}

OR progress ring:
{
  "type": "chart",
  "title": "Consistency Score",
  "gradient": "${gradients[2]}",
  "chartData": {
    "type": "progress",
    "percentage": 85,
    "label": "Monthly Goal"
  }
}

4. GRID slide (2x2 stats):
{
  "type": "grid",
  "title": "Your Stats at a Glance",
  "gradient": "${gradients[3]}",
  "chartData": {
    "items": [
      {"icon": "🔥", "value": "28", "label": "Day Streak"},
      {"icon": "⚡", "value": "3.2k", "label": "Kg Lifted"},
      {"icon": "🏆", "value": "Top 10%", "label": "Rank"},
      {"icon": "⭐", "value": "16", "label": "Classes"}
    ]
  }
}

5. LEADERBOARD slide:
{
  "type": "leaderboard",
  "gradient": "${gradients[4]}",
  "chartData": {
    "position": 45,
    "total": 500,
    "category": "Workout Consistency"
  }
}

6. COMPARISON slide:
{
  "type": "comparison",
  "title": "That's like lifting",
  "mainStat": "2 Elephants!",
  "comparison": "3,200kg = 2 baby elephants 🐘",
  "icon": "🐘",
  "gradient": "${gradients[0]}"
}

7. ACHIEVEMENT slide:
{
  "type": "achievement",
  "title": "Elite Status Unlocked!",
  "subtitle": "Only 12% hit 30+ days",
  "icon": "🏆",
  "gradient": "${gradients[1]}"
}

8. CLOSING slide:
{
  "type": "closing",
  "title": "December Awaits!",
  "subtitle": "Let's make it even better",
  "icon": "🚀",
  "gradient": "${gradients[2]}"
}

RULES:
1. Create 6-8 slides using a MIX of the above types
2. Use ACTUAL numbers from metadata - be specific!
3. Include at least 1-2 chart/grid/leaderboard slides for visual interest
4. Use creative comparisons for fun facts
5. Vary gradients - cycle through: ${gradients.join(', ')}
6. Use emojis that match the content
7. Make stats shareable and brag-worthy!
8. Keep text SHORT and PUNCHY

Return ONLY the JSON array, nothing else.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 2048,
    });

    let reportContent = completion.choices[0]?.message?.content || 'Error generating report';
    
    // Try to parse as JSON for visual slides
    let slides = null;
    try {
      // Remove markdown code blocks if present
      reportContent = reportContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      slides = JSON.parse(reportContent);
      
      // Validate and sanitize slide data
      if (Array.isArray(slides)) {
        slides = slides.map((slide: any) => {
          // Fix leaderboard data types
          if (slide.type === 'leaderboard' && slide.chartData) {
            slide.chartData.position = parseInt(String(slide.chartData.position).replace(/\D/g, '')) || 1;
            slide.chartData.total = parseInt(String(slide.chartData.total).replace(/\D/g, '')) || 100;
          }
          
          // Fix chart data
          if (slide.type === 'chart' && slide.chartData) {
            if (slide.chartData.type === 'progress') {
              slide.chartData.percentage = parseFloat(String(slide.chartData.percentage).replace(/[^\d.]/g, '')) || 0;
            }
            if (slide.chartData.type === 'bars' && Array.isArray(slide.chartData.data)) {
              slide.chartData.data = slide.chartData.data.map((item: any) => ({
                ...item,
                value: parseFloat(String(item.value).replace(/[^\d.]/g, '')) || 0,
              }));
            }
          }
          
          return slide;
        });
      }
    } catch (e) {
      console.log('Could not parse as JSON, returning as text');
    }

    return NextResponse.json({ 
      report: reportContent,
      slides: slides 
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to generate report', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}
