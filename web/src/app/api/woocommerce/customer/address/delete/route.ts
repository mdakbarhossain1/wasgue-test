import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, addressId } = await request.json();
    
    if (!email || !addressId) {
      return NextResponse.json(
        { error: 'Email and addressId are required' },
        { status: 400 }
      );
    }
    
    // Check if WordPress API URL is configured
    const baseUrl = process.env.WOOCOMMERCE_API_URL?.replace('/wp-json/wc/v3', '') || process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
    
    if (!baseUrl) {
      console.error('WOOCOMMERCE_API_URL or NEXT_PUBLIC_WORDPRESS_API_URL is not configured');
      return NextResponse.json(
        { error: 'WordPress API URL is not configured' },
        { status: 500 }
      );
    }
    
    console.log('🔗 Using base URL for WordPress API:', baseUrl);
    
    // Try multiple endpoints in order
    const endpoints = [
      `${baseUrl}/wp-json/custom/v1/delete-address`,
      `${baseUrl}/wp-json/wp-loyalty-rules/v1/customer/address/delete`,
      `${baseUrl}/wp-admin/admin-ajax.php`
    ];
    
    let response: Response | null = null;
    let lastError: any = null;
    
    // Try REST endpoints first
    for (const endpoint of endpoints.slice(0, 2)) {
      try {
        console.log('🔗 Trying endpoint:', endpoint);
        console.log('📧 Email:', email, 'Address ID:', addressId);
        
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            addressId
          }),
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (response.ok) {
          console.log('✅ Endpoint succeeded:', endpoint);
          break; // Success, exit loop
        } else {
          const errorText = await response.text();
          console.log('❌ Endpoint failed:', endpoint, 'Error:', errorText);
        }
      } catch (error) {
        console.error('🚨 Request failed for endpoint:', endpoint, error);
        lastError = error;
      }
    }
    
    // If REST endpoints fail, try AJAX endpoint
    if (!response || !response.ok) {
      const ajaxUrl = endpoints[2];
      const formData = new FormData();
      formData.append('action', 'delete_customer_address');
      formData.append('email', email);
      formData.append('addressId', addressId);
      
      try {
        response = await fetch(ajaxUrl, {
          method: 'POST',
          body: formData,
        });
      } catch (error) {
        lastError = error;
      }
    }
    
    if (!response || !response.ok) {
      let errorMessage = 'Failed to delete address - WordPress endpoints not available';
      let statusCode = 503;
      
      if (response) {
        statusCode = response.status;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          try {
            errorMessage = await response.text();
          } catch {
            errorMessage = `HTTP ${response.status} error`;
          }
        }
      }
      
      console.error('❌ All WordPress API endpoints failed');
      console.error('Last error:', lastError);
      
      // Since address deletion works locally, return success but with warning
      return NextResponse.json(
        { 
          success: true, 
          message: 'Address deleted locally (WordPress API unavailable)',
          warning: errorMessage,
          localOnly: true
        },
        { status: 200 }
      );
    }
    
    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
