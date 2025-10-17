import { getWooCommerceAuthHeader, getJWTToken } from './auth-api';

const WOOCOMMERCE_API_URL = 'https://wasgeurtje.nl/wp-json/wc/v3';

export interface CheckoutFormData {
  // Personal details
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  
  // Billing address
  billingAddress: string;
  billingPostcode: string;
  billingCity: string;
  billingCountry: string;
  
  // Shipping address
  useShippingAddress: boolean;
  shippingAddress: string;
  shippingPostcode: string;
  shippingCity: string;
  shippingCountry: string;
  
  // Additional
  companyName: string;
  notes: string;
  
  // Items
  items: {
    product_id: number;
    quantity: number;
    variation_id?: number;
  }[];
  
  // Shipping
  shipping_lines: {
    method_id: string;
    method_title: string;
    total: string;
  }[];
  
  // Payment
  paymentMethod: string;
}

export interface OrderResponse {
  id: number;
  order_key: string;
  status: string;
  total: string;
  payment_url?: string;
}

export const createOrder = async (formData: CheckoutFormData): Promise<OrderResponse> => {
  try {
    console.log('Creating order with data:', formData);
    
    // Prepare WooCommerce order data
    const orderData = {
      payment_method: formData.paymentMethod,
      payment_method_title: getPaymentMethodTitle(formData.paymentMethod),
      set_paid: false,
      billing: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        address_1: formData.billingAddress,
        address_2: '',
        city: formData.billingCity,
        state: '',
        postcode: formData.billingPostcode,
        country: formData.billingCountry,
        email: formData.email,
        phone: formData.phone,
        company: formData.companyName
      },
      shipping: formData.useShippingAddress ? {
        first_name: formData.firstName,
        last_name: formData.lastName,
        address_1: formData.shippingAddress,
        address_2: '',
        city: formData.shippingCity,
        state: '',
        postcode: formData.shippingPostcode,
        country: formData.shippingCountry
      } : {
        first_name: formData.firstName,
        last_name: formData.lastName,
        address_1: formData.billingAddress,
        address_2: '',
        city: formData.billingCity,
        state: '',
        postcode: formData.billingPostcode,
        country: formData.billingCountry
      },
      line_items: formData.items,
      shipping_lines: formData.shipping_lines,
      customer_note: formData.notes
    };
    
    // If user is logged in, add customer_id
    const jwtToken = getJWTToken();
    if (jwtToken) {
      // Extract user ID from JWT or session
      // For now, we'll skip this as it requires JWT parsing
    }
    
    // Use the server-side proxy to avoid CORS issues
    const response = await fetch('/api/woocommerce/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Order creation failed:', errorData);
      throw new Error(errorData.message || 'Failed to create order');
    }
    
    const order = await response.json();
    console.log('Order created successfully:', order);
    
    return {
      id: order.id,
      order_key: order.order_key,
      status: order.status,
      total: order.total,
      payment_url: order.payment_url
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

function getPaymentMethodTitle(method: string): string {
  switch (method) {
    case 'ideal':
      return 'iDEAL';
    case 'creditcard':
      return 'Credit Card';
    case 'paypal':
      return 'PayPal';
    case 'bancontact':
      return 'Bancontact';
    default:
      return method;
  }
}


