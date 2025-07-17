/**
 * Data Display Service
 * Handles consistent N/A display and data formatting across the platform
 */

export interface DataDisplayOptions {
  showZeroAs?: 'zero' | 'na' | 'dash';
  showNullAs?: 'na' | 'dash' | 'empty';
  showEmptyArrayAs?: 'na' | 'dash' | 'empty';
  showEmptyStringAs?: 'na' | 'dash' | 'empty';
  naText?: string;
  dashText?: string;
  emptyText?: string;
  prefix?: string;
  suffix?: string;
  formatNumber?: boolean;
  formatCurrency?: boolean;
  formatPercentage?: boolean;
  decimalPlaces?: number;
}

export class DataDisplayService {
  private static readonly DEFAULT_OPTIONS: DataDisplayOptions = {
    showZeroAs: 'zero',
    showNullAs: 'na',
    showEmptyArrayAs: 'na',
    showEmptyStringAs: 'na',
    naText: 'N/A',
    dashText: '—',
    emptyText: '',
    formatNumber: false,
    formatCurrency: false,
    formatPercentage: false,
    decimalPlaces: 2,
  };

  /**
   * Format any value for display with N/A handling
   */
  static formatValue(value: any, options: DataDisplayOptions = {}): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    // Handle null/undefined
    if (value === null || value === undefined) {
      return this.getDisplayText(opts.showNullAs!, opts);
    }

    // Handle empty string
    if (value === '') {
      return this.getDisplayText(opts.showEmptyStringAs!, opts);
    }

    // Handle empty arrays
    if (Array.isArray(value) && value.length === 0) {
      return this.getDisplayText(opts.showEmptyArrayAs!, opts);
    }

    // Handle zero
    if (value === 0) {
      if (opts.showZeroAs === 'na') {
        return this.getDisplayText('na', opts);
      }
      if (opts.showZeroAs === 'dash') {
        return this.getDisplayText('dash', opts);
      }
    }

    // Handle numbers
    if (typeof value === 'number') {
      return this.formatNumber(value, opts);
    }

    // Handle strings
    if (typeof value === 'string') {
      return this.formatString(value, opts);
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.length.toString();
    }

    // Handle objects
    if (typeof value === 'object') {
      return this.getDisplayText('na', opts);
    }

    // Default to string conversion
    return String(value);
  }

  /**
   * Format numbers with proper localization and options
   */
  static formatNumber(value: number, options: DataDisplayOptions = {}): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    if (isNaN(value)) {
      return this.getDisplayText('na', opts);
    }

    let formatted: string;

    if (opts.formatCurrency) {
      formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: opts.decimalPlaces,
        maximumFractionDigits: opts.decimalPlaces,
      }).format(value);
    } else if (opts.formatPercentage) {
      formatted = new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: opts.decimalPlaces,
        maximumFractionDigits: opts.decimalPlaces,
      }).format(value / 100);
    } else if (opts.formatNumber) {
      formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: opts.decimalPlaces,
        maximumFractionDigits: opts.decimalPlaces,
      }).format(value);
    } else {
      formatted = value.toString();
    }

    return this.applyPrefixSuffix(formatted, opts);
  }

  /**
   * Format strings with options
   */
  static formatString(value: string, options: DataDisplayOptions = {}): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    if (value.trim() === '') {
      return this.getDisplayText(opts.showEmptyStringAs!, opts);
    }

    return this.applyPrefixSuffix(value, opts);
  }

  /**
   * Get display text based on type
   */
  private static getDisplayText(
    type: 'na' | 'dash' | 'empty',
    options: DataDisplayOptions
  ): string {
    switch (type) {
      case 'na':
        return options.naText || this.DEFAULT_OPTIONS.naText!;
      case 'dash':
        return options.dashText || this.DEFAULT_OPTIONS.dashText!;
      case 'empty':
        return options.emptyText || this.DEFAULT_OPTIONS.emptyText!;
      default:
        return options.naText || this.DEFAULT_OPTIONS.naText!;
    }
  }

  /**
   * Apply prefix and suffix to formatted value
   */
  private static applyPrefixSuffix(value: string, options: DataDisplayOptions): string {
    const prefix = options.prefix || '';
    const suffix = options.suffix || '';
    return `${prefix}${value}${suffix}`;
  }

  /**
   * Format credit amounts consistently
   */
  static formatCredits(credits: number | null | undefined): string {
    return this.formatValue(credits, {
      formatNumber: true,
      decimalPlaces: 0,
      showZeroAs: 'na',
      showNullAs: 'na',
    });
  }

  /**
   * Format currency amounts consistently
   */
  static formatCurrency(amount: number | null | undefined): string {
    return this.formatValue(amount, {
      formatCurrency: true,
      decimalPlaces: 2,
      showZeroAs: 'zero',
      showNullAs: 'na',
    });
  }

  /**
   * Format percentages consistently
   */
  static formatPercentage(percentage: number | null | undefined): string {
    return this.formatValue(percentage, {
      formatPercentage: true,
      decimalPlaces: 1,
      showZeroAs: 'zero',
      showNullAs: 'na',
    });
  }

  /**
   * Format call counts consistently
   */
  static formatCallCount(count: number | null | undefined): string {
    return this.formatValue(count, {
      formatNumber: true,
      decimalPlaces: 0,
      showZeroAs: 'na',
      showNullAs: 'na',
    });
  }

  /**
   * Format duration consistently
   */
  static formatDuration(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
      return 'N/A';
    }

    if (seconds === 0) {
      return 'N/A';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  /**
   * Format phone numbers consistently
   */
  static formatPhoneNumber(phone: string | null | undefined): string {
    if (!phone || phone.trim() === '') {
      return 'N/A';
    }

    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Format US phone numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }

    // Return original if can't format
    return phone;
  }

  /**
   * Format dates consistently
   */
  static formatDate(
    date: Date | string | null | undefined,
    options: Intl.DateTimeFormatOptions = {}
  ): string {
    if (!date) {
      return 'N/A';
    }

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;

      if (isNaN(dateObj.getTime())) {
        return 'N/A';
      }

      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options,
      };

      return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
    } catch (error) {
      return 'N/A';
    }
  }

  /**
   * Format time consistently
   */
  static formatTime(date: Date | string | null | undefined): string {
    if (!date) {
      return 'N/A';
    }

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;

      if (isNaN(dateObj.getTime())) {
        return 'N/A';
      }

      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(dateObj);
    } catch (error) {
      return 'N/A';
    }
  }

  /**
   * Format email addresses consistently
   */
  static formatEmail(email: string | null | undefined): string {
    if (!email || email.trim() === '') {
      return 'N/A';
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Invalid Email';
    }

    return email.toLowerCase();
  }

  /**
   * Format names consistently
   */
  static formatName(
    firstName: string | null | undefined,
    lastName: string | null | undefined
  ): string {
    const first = firstName?.trim() || '';
    const last = lastName?.trim() || '';

    if (!first && !last) {
      return 'N/A';
    }

    return `${first} ${last}`.trim();
  }

  /**
   * Format status consistently
   */
  static formatStatus(status: string | null | undefined): string {
    if (!status || status.trim() === '') {
      return 'N/A';
    }

    // Capitalize first letter of each word
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Format arrays consistently
   */
  static formatArray(array: any[] | null | undefined, separator: string = ', '): string {
    if (!array || array.length === 0) {
      return 'N/A';
    }

    return array
      .filter((item) => item !== null && item !== undefined && item !== '')
      .map((item) => String(item))
      .join(separator);
  }

  /**
   * Format boolean values consistently
   */
  static formatBoolean(
    value: boolean | null | undefined,
    trueText: string = 'Yes',
    falseText: string = 'No'
  ): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    return value ? trueText : falseText;
  }

  /**
   * Format conversion rates consistently
   */
  static formatConversionRate(
    converted: number | null | undefined,
    total: number | null | undefined
  ): string {
    if (!converted || !total || converted === 0 || total === 0) {
      return 'N/A';
    }

    const rate = (converted / total) * 100;
    return this.formatPercentage(rate);
  }

  /**
   * Format lead scores consistently
   */
  static formatLeadScore(score: number | null | undefined): string {
    if (score === null || score === undefined || isNaN(score)) {
      return 'N/A';
    }

    // Clamp score between 0 and 100
    const clampedScore = Math.max(0, Math.min(100, score));
    return `${clampedScore}/100`;
  }

  /**
   * Format campaign names consistently
   */
  static formatCampaignName(name: string | null | undefined): string {
    if (!name || name.trim() === '') {
      return 'Untitled Campaign';
    }

    return name.trim();
  }

  /**
   * Format organization names consistently
   */
  static formatOrganizationName(name: string | null | undefined): string {
    if (!name || name.trim() === '') {
      return 'N/A';
    }

    return name.trim();
  }

  /**
   * Format API key names consistently
   */
  static formatApiKeyName(name: string | null | undefined): string {
    if (!name || name.trim() === '') {
      return 'Unnamed API Key';
    }

    return name.trim();
  }

  /**
   * Format file sizes consistently
   */
  static formatFileSize(bytes: number | null | undefined): string {
    if (!bytes || bytes === 0) {
      return 'N/A';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

// Export convenience functions
export const {
  formatValue,
  formatCredits,
  formatCurrency,
  formatPercentage,
  formatCallCount,
  formatDuration,
  formatPhoneNumber,
  formatDate,
  formatTime,
  formatEmail,
  formatName,
  formatStatus,
  formatArray,
  formatBoolean,
  formatConversionRate,
  formatLeadScore,
  formatCampaignName,
  formatOrganizationName,
  formatApiKeyName,
  formatFileSize,
} = DataDisplayService;
