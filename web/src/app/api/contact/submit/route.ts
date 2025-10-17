import { NextRequest, NextResponse } from 'next/server';

// You can configure these environment variables for email sending
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = process.env.SMTP_PORT || '587';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@wasgeurtje.nl';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
  orderNumber?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ContactFormData = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.subject || !data.message) {
      return NextResponse.json(
        { message: 'Alle verplichte velden moeten ingevuld zijn' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { message: 'Ongeldig e-mailadres' },
        { status: 400 }
      );
    }

    // Store in WordPress as a comment or custom post type
    // For now, we'll log it and return success
    console.log('Contact form submission:', {
      ...data,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    // Here you would typically:
    // 1. Send email notification to admin
    // 2. Send confirmation email to user
    // 3. Store in database or CRM
    // 4. Create a ticket in support system

    // For WordPress integration, you could create a custom post type 'contact_submission'
    // or use Contact Form 7 REST API if that plugin is installed

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Bedankt voor je bericht! We nemen binnen 24 uur contact met je op.',
      reference: `CONTACT-${Date.now()}`
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Er is een fout opgetreden. Probeer het later opnieuw.' 
      },
      { status: 500 }
    );
  }
}


