// Stripe configuration utilities for development
export const suppressStripeDevWarnings = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Suppress Apple Pay and Google Pay domain warnings in development
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      
      // Skip specific Stripe development warnings
      if (
        message.includes('You have not registered or verified the domain') ||
        message.includes('Apple Pay') ||
        message.includes('Google Pay') ||
        message.includes('If you are testing Apple Pay or Google Pay') ||
        message.includes('domain registration')
      ) {
        return; // Skip these warnings in development
      }
      
      // Show all other warnings
      originalWarn(...args);
    };
  }
};

export const stripeDefaultOptions = {
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#814e1e',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      spacingUnit: '6px',
      borderRadius: '8px',
    },
  },
  locale: 'nl' as const,
};

