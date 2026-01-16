import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FMP_API_KEY not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`FMP API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = data[0];
    
    // Return only MVP required fields
    return NextResponse.json({
      symbol: company.symbol,
      companyName: company.companyName,
      industry: company.industry || 'N/A',
      marketCap: company.mktCap || 0,
      description: company.description || '',
    });
  } catch (error) {
    console.error('Error fetching company data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company data' },
      { status: 500 }
    );
  }
}
