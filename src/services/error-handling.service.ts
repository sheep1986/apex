import { notificationService } from './notification.service';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface ErrorDetails {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category:
    | 'network'
    | 'validation'
    | 'authentication'
    | 'authorization'
    | 'api'
    | 'system'
    | 'user';
  retryable: boolean;
  context?: ErrorContext;
}

export class ErrorHandlingService {
  private static readonly ERROR_CODES = {
    // Network Errors
    NETWORK_ERROR: {
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
      userMessage:
        'Unable to connect to the server. Please check your internet connection and try again.',
      severity: 'high' as const,
      category: 'network' as const,
      retryable: true,
    },
    TIMEOUT_ERROR: {
      code: 'TIMEOUT_ERROR',
      message: 'Request timed out',
      userMessage: 'The request took too long to complete. Please try again.',
      severity: 'medium' as const,
      category: 'network' as const,
      retryable: true,
    },

    // Authentication Errors
    AUTH_TOKEN_EXPIRED: {
      code: 'AUTH_TOKEN_EXPIRED',
      message: 'Authentication token has expired',
      userMessage: 'Your session has expired. Please sign in again.',
      severity: 'high' as const,
      category: 'authentication' as const,
      retryable: false,
    },
    AUTH_INVALID_CREDENTIALS: {
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Invalid credentials provided',
      userMessage: 'Invalid email or password. Please check your credentials and try again.',
      severity: 'medium' as const,
      category: 'authentication' as const,
      retryable: false,
    },
    AUTH_ACCOUNT_LOCKED: {
      code: 'AUTH_ACCOUNT_LOCKED',
      message: 'Account is locked',
      userMessage:
        'Your account has been locked due to multiple failed login attempts. Please contact support.',
      severity: 'high' as const,
      category: 'authentication' as const,
      retryable: false,
    },

    // Authorization Errors
    INSUFFICIENT_PERMISSIONS: {
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'User does not have sufficient permissions',
      userMessage:
        "You don't have permission to perform this action. Please contact your administrator.",
      severity: 'medium' as const,
      category: 'authorization' as const,
      retryable: false,
    },
    RESOURCE_NOT_FOUND: {
      code: 'RESOURCE_NOT_FOUND',
      message: 'Requested resource not found',
      userMessage: 'The requested resource could not be found. It may have been deleted or moved.',
      severity: 'medium' as const,
      category: 'api' as const,
      retryable: false,
    },

    // Voice Provider Errors
    VOICE_PROVIDER_KEY_INVALID: {
      code: 'VOICE_PROVIDER_KEY_INVALID',
      message: 'Voice provider API key is invalid',
      userMessage: 'Your voice provider API key is invalid. Please check your API key settings.',
      severity: 'high' as const,
      category: 'api' as const,
      retryable: false,
    },
    VOICE_INSUFFICIENT_CREDITS: {
      code: 'VOICE_INSUFFICIENT_CREDITS',
      message: 'Insufficient voice credits',
      userMessage:
        "You don't have enough credits to complete this action. Please add more credits.",
      severity: 'high' as const,
      category: 'api' as const,
      retryable: false,
    },
    VOICE_CALL_FAILED: {
      code: 'VOICE_CALL_FAILED',
      message: 'Voice call failed',
      userMessage:
        'The AI call failed to complete. This may be due to network issues or invalid phone numbers.',
      severity: 'medium' as const,
      category: 'api' as const,
      retryable: true,
    },
    VOICE_SYNC_FAILED: {
      code: 'VOICE_SYNC_FAILED',
      message: 'Voice data sync failed',
      userMessage: 'Failed to sync data from voice provider. Some information may be outdated.',
      severity: 'medium' as const,
      category: 'api' as const,
      retryable: true,
    },

    // Database Errors
    DATABASE_CONNECTION_ERROR: {
      code: 'DATABASE_CONNECTION_ERROR',
      message: 'Database connection failed',
      userMessage: 'Unable to connect to the database. Please try again later.',
      severity: 'critical' as const,
      category: 'system' as const,
      retryable: true,
    },
    DATABASE_CONSTRAINT_VIOLATION: {
      code: 'DATABASE_CONSTRAINT_VIOLATION',
      message: 'Database constraint violation',
      userMessage:
        "The data you're trying to save conflicts with existing records. Please check your input.",
      severity: 'medium' as const,
      category: 'validation' as const,
      retryable: false,
    },

    // Validation Errors
    VALIDATION_REQUIRED_FIELD: {
      code: 'VALIDATION_REQUIRED_FIELD',
      message: 'Required field is missing',
      userMessage: 'Please fill in all required fields.',
      severity: 'low' as const,
      category: 'validation' as const,
      retryable: false,
    },
    VALIDATION_INVALID_EMAIL: {
      code: 'VALIDATION_INVALID_EMAIL',
      message: 'Invalid email format',
      userMessage: 'Please enter a valid email address.',
      severity: 'low' as const,
      category: 'validation' as const,
      retryable: false,
    },
    VALIDATION_INVALID_PHONE: {
      code: 'VALIDATION_INVALID_PHONE',
      message: 'Invalid phone number format',
      userMessage: 'Please enter a valid phone number.',
      severity: 'low' as const,
      category: 'validation' as const,
      retryable: false,
    },
    VALIDATION_FILE_TOO_LARGE: {
      code: 'VALIDATION_FILE_TOO_LARGE',
      message: 'File size exceeds limit',
      userMessage: "The file you're trying to upload is too large. Please choose a smaller file.",
      severity: 'medium' as const,
      category: 'validation' as const,
      retryable: false,
    },
    VALIDATION_INVALID_FILE_TYPE: {
      code: 'VALIDATION_INVALID_FILE_TYPE',
      message: 'Invalid file type',
      userMessage: 'Please upload a file in the correct format (CSV, XLSX, or XLS).',
      severity: 'medium' as const,
      category: 'validation' as const,
      retryable: false,
    },

    // Billing Errors
    BILLING_PAYMENT_FAILED: {
      code: 'BILLING_PAYMENT_FAILED',
      message: 'Payment processing failed',
      userMessage:
        'Your payment could not be processed. Please check your payment method and try again.',
      severity: 'high' as const,
      category: 'api' as const,
      retryable: true,
    },
    BILLING_SUBSCRIPTION_EXPIRED: {
      code: 'BILLING_SUBSCRIPTION_EXPIRED',
      message: 'Subscription has expired',
      userMessage: 'Your subscription has expired. Please renew to continue using the service.',
      severity: 'high' as const,
      category: 'api' as const,
      retryable: false,
    },

    // Campaign Errors
    CAMPAIGN_INVALID_LEADS: {
      code: 'CAMPAIGN_INVALID_LEADS',
      message: 'Campaign contains invalid leads',
      userMessage:
        'Some leads in your campaign have invalid phone numbers. Please review and correct them.',
      severity: 'medium' as const,
      category: 'validation' as const,
      retryable: false,
    },
    CAMPAIGN_ALREADY_RUNNING: {
      code: 'CAMPAIGN_ALREADY_RUNNING',
      message: 'Campaign is already running',
      userMessage: 'This campaign is already running. Please stop it before making changes.',
      severity: 'medium' as const,
      category: 'user' as const,
      retryable: false,
    },

    // Generic Errors
    UNKNOWN_ERROR: {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      userMessage:
        'Something went wrong. Please try again or contact support if the problem persists.',
      severity: 'medium' as const,
      category: 'system' as const,
      retryable: true,
    },
  };

  /**
   * Handle any error and provide appropriate user feedback
   */
  static handleError(error: any, context?: ErrorContext): ErrorDetails {
    const errorDetails = this.parseError(error, context);

    // Log error for debugging
    console.error('Error handled:', {
      ...errorDetails,
      originalError: error,
      context,
      timestamp: new Date().toISOString(),
    });

    // Send notification to user
    this.notifyUser(errorDetails);

    // Track error for analytics
    this.trackError(errorDetails);

    return errorDetails;
  }

  /**
   * Parse error into standardized format
   */
  private static parseError(error: any, context?: ErrorContext): ErrorDetails {
    let errorDetails: ErrorDetails;

    // Handle known error codes
    if (error?.code && this.ERROR_CODES[error.code as keyof typeof this.ERROR_CODES]) {
      errorDetails = {
        ...this.ERROR_CODES[error.code as keyof typeof this.ERROR_CODES],
        context,
      };
    }
    // Handle HTTP errors
    else if (error?.response?.status) {
      errorDetails = this.parseHttpError(error, context);
    }
    // Handle network errors
    else if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
      errorDetails = {
        ...this.ERROR_CODES.NETWORK_ERROR,
        context,
      };
    }
    // Handle timeout errors
    else if (error?.name === 'TimeoutError' || error?.code === 'TIMEOUT') {
      errorDetails = {
        ...this.ERROR_CODES.TIMEOUT_ERROR,
        context,
      };
    }
    // Handle validation errors
    else if (error?.name === 'ValidationError') {
      errorDetails = this.parseValidationError(error, context);
    }
    // Handle Voice Provider errors
    else if (error?.message?.includes('Voice') || error?.source === 'voice_provider') {
      errorDetails = this.parseVoiceProviderError(error, context);
    }
    // Handle Stripe errors
    else if (error?.type?.startsWith('Stripe') || error?.message?.includes('Stripe')) {
      errorDetails = this.parseStripeError(error, context);
    }
    // Handle generic errors
    else {
      errorDetails = {
        ...this.ERROR_CODES.UNKNOWN_ERROR,
        message: error?.message || 'Unknown error',
        context,
      };
    }

    return errorDetails;
  }

  /**
   * Parse HTTP errors
   */
  private static parseHttpError(error: any, context?: ErrorContext): ErrorDetails {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    switch (status) {
      case 400:
        return {
          code: 'BAD_REQUEST',
          message: message || 'Bad request',
          userMessage: 'Invalid request. Please check your input and try again.',
          severity: 'medium',
          category: 'validation',
          retryable: false,
          context,
        };
      case 401:
        return {
          ...this.ERROR_CODES.AUTH_TOKEN_EXPIRED,
          context,
        };
      case 403:
        return {
          ...this.ERROR_CODES.INSUFFICIENT_PERMISSIONS,
          context,
        };
      case 404:
        return {
          ...this.ERROR_CODES.RESOURCE_NOT_FOUND,
          context,
        };
      case 429:
        return {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
          userMessage: 'Too many requests. Please wait a moment and try again.',
          severity: 'medium',
          category: 'api',
          retryable: true,
          context,
        };
      case 500:
        return {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
          userMessage: 'A server error occurred. Please try again later.',
          severity: 'high',
          category: 'system',
          retryable: true,
          context,
        };
      default:
        return {
          code: `HTTP_${status}`,
          message: message || `HTTP ${status} error`,
          userMessage: 'An error occurred while processing your request. Please try again.',
          severity: 'medium',
          category: 'api',
          retryable: true,
          context,
        };
    }
  }

  /**
   * Parse validation errors
   */
  private static parseValidationError(error: any, context?: ErrorContext): ErrorDetails {
    const message = error.message || 'Validation failed';

    if (message.includes('email')) {
      return { ...this.ERROR_CODES.VALIDATION_INVALID_EMAIL, context };
    }
    if (message.includes('phone')) {
      return { ...this.ERROR_CODES.VALIDATION_INVALID_PHONE, context };
    }
    if (message.includes('required')) {
      return { ...this.ERROR_CODES.VALIDATION_REQUIRED_FIELD, context };
    }

    return {
      code: 'VALIDATION_ERROR',
      message,
      userMessage: 'Please check your input and try again.',
      severity: 'low',
      category: 'validation',
      retryable: false,
      context,
    };
  }

  /**
   * Parse Voice Provider errors
   */
  private static parseVoiceProviderError(error: any, context?: ErrorContext): ErrorDetails {
    const message = error.message || 'Voice provider error';

    if (message.includes('API key') || message.includes('unauthorized')) {
      return { ...this.ERROR_CODES.VOICE_PROVIDER_KEY_INVALID, context };
    }
    if (message.includes('credits') || message.includes('insufficient')) {
      return { ...this.ERROR_CODES.VOICE_INSUFFICIENT_CREDITS, context };
    }
    if (message.includes('call failed')) {
      return { ...this.ERROR_CODES.VOICE_CALL_FAILED, context };
    }

    return {
      code: 'VOICE_ERROR',
      message,
      userMessage: 'An error occurred with the AI calling service. Please try again.',
      severity: 'medium',
      category: 'api',
      retryable: true,
      context,
    };
  }

  /**
   * Parse Stripe payment errors
   */
  private static parseStripeError(error: any, context?: ErrorContext): ErrorDetails {
    const message = error.message || 'Payment error';

    if (message.includes('declined') || message.includes('insufficient')) {
      return { ...this.ERROR_CODES.BILLING_PAYMENT_FAILED, context };
    }

    return {
      code: 'STRIPE_ERROR',
      message,
      userMessage: 'A payment error occurred. Please check your payment method and try again.',
      severity: 'high',
      category: 'api',
      retryable: true,
      context,
    };
  }

  /**
   * Notify user about the error
   */
  private static notifyUser(errorDetails: ErrorDetails): void {
    notificationService.notifyError({
      title: this.getErrorTitle(errorDetails),
      message: errorDetails.userMessage,
      component: errorDetails.context?.component,
      userId: errorDetails.context?.userId,
      action: errorDetails.retryable
        ? {
            label: 'Retry',
            callback: () => {
              // Retry logic would be implemented by the calling component
              // Retry requested
            },
          }
        : undefined,
    });
  }

  /**
   * Get appropriate error title based on category
   */
  private static getErrorTitle(errorDetails: ErrorDetails): string {
    switch (errorDetails.category) {
      case 'network':
        return 'Connection Error';
      case 'authentication':
        return 'Authentication Error';
      case 'authorization':
        return 'Permission Error';
      case 'validation':
        return 'Validation Error';
      case 'api':
        return 'Service Error';
      case 'system':
        return 'System Error';
      case 'user':
        return 'Action Error';
      default:
        return 'Error';
    }
  }

  /**
   * Track error for analytics
   */
  private static trackError(errorDetails: ErrorDetails): void {
    // In a real app, this would send to analytics service
    // TODO: Send error to analytics service
  }

  /**
   * Create error boundary handler
   */
  static createErrorBoundaryHandler(componentName: string) {
    return (error: Error, errorInfo: any) => {
      this.handleError(error, {
        component: componentName,
        action: 'render',
        metadata: errorInfo,
      });
    };
  }

  /**
   * Create async error handler
   */
  static createAsyncErrorHandler(componentName: string, action: string) {
    return (error: any) => {
      return this.handleError(error, {
        component: componentName,
        action,
      });
    };
  }

  /**
   * Validate and handle form submission errors
   */
  static handleFormError(error: any, formName: string): ErrorDetails {
    return this.handleError(error, {
      component: formName,
      action: 'form_submission',
    });
  }

  /**
   * Handle API call errors
   */
  static handleApiError(error: any, endpoint: string, method: string): ErrorDetails {
    return this.handleError(error, {
      component: 'api',
      action: `${method} ${endpoint}`,
    });
  }
}

// Export convenience functions
export const handleError = ErrorHandlingService.handleError.bind(ErrorHandlingService);
export const handleFormError = ErrorHandlingService.handleFormError.bind(ErrorHandlingService);
export const handleApiError = ErrorHandlingService.handleApiError.bind(ErrorHandlingService);
export const createErrorBoundaryHandler =
  ErrorHandlingService.createErrorBoundaryHandler.bind(ErrorHandlingService);
export const createAsyncErrorHandler =
  ErrorHandlingService.createAsyncErrorHandler.bind(ErrorHandlingService);
