import { parsePhoneNumber } from 'libphonenumber-js';

/**
 * Normalize phone number to E.164 format
 * @param {string} phone - Phone number (with or without country code)
 * @param {string} defaultCountry - Default country code (e.g., 'US')
 * @returns {string} - Normalized phone number in E.164 format
 */
export const normalizePhone = (phone, defaultCountry = 'US') => {
  try {
    // Remove spaces and common separators
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    
    // Try to parse with country code
    let phoneNumber;
    if (cleaned.startsWith('+')) {
      phoneNumber = parsePhoneNumber(cleaned);
    } else {
      phoneNumber = parsePhoneNumber(cleaned, defaultCountry);
    }
    
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.number; // Returns E.164 format
    }
    
    // If parsing fails, return cleaned version with + prefix if not present
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  } catch (error) {
    // Fallback: just clean and add + if missing
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }
};

/**
 * Validate phone number
 * @param {string} phone - Phone number
 * @returns {boolean} - True if valid
 */
export const isValidPhone = (phone) => {
  try {
    const normalized = normalizePhone(phone);
    const phoneNumber = parsePhoneNumber(normalized);
    return phoneNumber?.isValid() || false;
  } catch (error) {
    return false;
  }
};
