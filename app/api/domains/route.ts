import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { DomainConfig } from '@/common/domains';

const DOMAINS_FILE_PATH = path.join(process.cwd(), 'common', 'domains.json');

// GET /api/domains - Load all AI-generated domains
export async function GET() {
  try {
    const fileContent = await fs.readFile(DOMAINS_FILE_PATH, 'utf-8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    console.error('Failed to read domains.json:', error);
    return NextResponse.json({ domains: [] });
  }
}

// POST /api/domains - Save a new AI-generated domain
export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json() as { domain: DomainConfig };

    if (!domain || !domain.id || !domain.name) {
      return NextResponse.json(
        { error: 'Invalid domain configuration' },
        { status: 400 }
      );
    }

    // Validate domain structure
    if (!domain.keywords || !Array.isArray(domain.keywords)) {
      return NextResponse.json(
        { error: 'Domain must have keywords array' },
        { status: 400 }
      );
    }

    if (!domain.questions || !Array.isArray(domain.questions)) {
      return NextResponse.json(
        { error: 'Domain must have questions array' },
        { status: 400 }
      );
    }

    // Read existing domains
    let existingDomains: DomainConfig[] = [];
    try {
      const fileContent = await fs.readFile(DOMAINS_FILE_PATH, 'utf-8');
      const data = JSON.parse(fileContent);
      existingDomains = data.domains || [];
    } catch (error) {
      // File doesn't exist yet, will create it
      console.log('Creating new domains.json file');
    }

    // Check for duplicate IDs
    const isDuplicate = existingDomains.some(d => d.id === domain.id);
    if (isDuplicate) {
      return NextResponse.json(
        { error: 'Domain with this ID already exists' },
        { status: 409 }
      );
    }

    // Add new domain
    existingDomains.push(domain);

    // Write back to file
    await fs.writeFile(
      DOMAINS_FILE_PATH,
      JSON.stringify({ domains: existingDomains }, null, 2),
      'utf-8'
    );

    return NextResponse.json({ 
      success: true, 
      domain,
      message: 'Domain saved successfully' 
    });
  } catch (error) {
    console.error('Failed to save domain:', error);
    return NextResponse.json(
      { error: 'Failed to save domain configuration' },
      { status: 500 }
    );
  }
}

