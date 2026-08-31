/**
 * SmartLink Input Verification Validator Module
 * Validates verification input before calling backend APIs.
 */

import { VerificationType } from "../types/verification";

export interface ValidationResult {
  valid: boolean;
  error?: string;
  formattedValue?: string;
  fieldErrors?: Record<string, string>;
}

export class VerificationValidator {
  /**
   * Validate NIN (National Identification Number)
   * Must be exactly 11 numeric digits
   */
  static validateNIN(nin: string): ValidationResult {
    const clean = nin.replace(/\s+/g, "").trim();
    if (!clean) {
      return { valid: false, error: "NIN is required." };
    }
    if (!/^\d{11}$/.test(clean)) {
      return {
        valid: false,
        error: "NIN must consist of exactly 11 numeric digits (e.g., 12345678901).",
      };
    }
    return { valid: true, formattedValue: clean };
  }

  /**
   * Validate BVN (Bank Verification Number)
   * Must be exactly 11 numeric digits
   */
  static validateBVN(bvn: string): ValidationResult {
    const clean = bvn.replace(/\s+/g, "").trim();
    if (!clean) {
      return { valid: false, error: "BVN is required." };
    }
    if (!/^\d{11}$/.test(clean)) {
      return {
        valid: false,
        error: "BVN must consist of exactly 11 numeric digits (e.g., 22233344455).",
      };
    }
    return { valid: true, formattedValue: clean };
  }

  /**
   * Validate NIN With Phone Number
   * Must be exact 11 digits starting with '0', digits only.
   */
  static validateNinPhone(phone: string): ValidationResult {
    const clean = phone.trim();
    if (!clean) {
      return { valid: false, error: "Phone number is required." };
    }
    if (!clean.startsWith("0")) {
      return { valid: false, error: "Phone number must start with 0." };
    }
    if (!/^\d{11}$/.test(clean)) {
      return {
        valid: false,
        error: "Phone number must be exactly 11 digits containing numbers only.",
      };
    }
    return { valid: true, formattedValue: clean };
  }

  /**
   * Validate Nigerian Phone Number
   * e.g., 08031234567, 07012345678, +2348031234567
   */
  static validatePhone(phone: string): ValidationResult {
    const clean = phone.replace(/[\s\-()]/g, "").trim();
    if (!clean) {
      return { valid: false, error: "Phone number is required." };
    }
    const ngPhoneRegex = /^(?:\+?234|0)[789][01]\d{8}$/;
    if (!ngPhoneRegex.test(clean)) {
      return {
        valid: false,
        error: "Please enter a valid Nigerian phone number (e.g., 08031234567 or +2348031234567).",
      };
    }
    return { valid: true, formattedValue: clean };
  }

  /**
   * Validate Email Address
   */
  static validateEmail(email: string): ValidationResult {
    const clean = email.trim();
    if (!clean) {
      return { valid: false, error: "Email address is required." };
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(clean)) {
      return { valid: false, error: "Please enter a valid email address (e.g., user@example.com)." };
    }
    return { valid: true, formattedValue: clean.toLowerCase() };
  }

  /**
   * Validate CAC Registration Number / Company Search
   * e.g. RC1234567, BN7654321, IT998877 or Search Query
   */
  static validateCAC(input: string): ValidationResult {
    const clean = input.trim();
    if (!clean) {
      return { valid: false, error: "CAC Registration Number or Business Name is required." };
    }
    if (clean.length < 3) {
      return { valid: false, error: "CAC Registration Number or Business Name must be at least 3 characters." };
    }
    return { valid: true, formattedValue: clean.toUpperCase() };
  }

  /**
   * Validate Tax Identification Number (TIN)
   * Usually 10 to 12 digits or formatted numbers
   */
  static validateTIN(tin: string): ValidationResult {
    const clean = tin.replace(/[\s\-]/g, "").trim();
    if (!clean) {
      return { valid: false, error: "Tax Identification Number (TIN) is required." };
    }
    if (!/^[a-zA-Z0-9]{8,14}$/.test(clean)) {
      return { valid: false, error: "TIN must be 8 to 14 alphanumeric characters (e.g., 12345678-0001)." };
    }
    return { valid: true, formattedValue: clean.toUpperCase() };
  }

  /**
   * Validate Driver License Number (FRSC)
   * 12 alphanumeric characters (e.g. ABC123456789)
   */
  static validateDriverLicense(license: string): ValidationResult {
    const clean = license.replace(/[\s\-]/g, "").trim();
    if (!clean) {
      return { valid: false, error: "Driver License number is required." };
    }
    if (clean.length < 8 || clean.length > 15) {
      return { valid: false, error: "Driver License number must be between 8 and 15 alphanumeric characters." };
    }
    return { valid: true, formattedValue: clean.toUpperCase() };
  }

  /**
   * Validate International Passport Number (NIS)
   * e.g., A12345678 or B87654321
   */
  static validatePassport(passport: string): ValidationResult {
    const clean = passport.replace(/[\s\-]/g, "").trim();
    if (!clean) {
      return { valid: false, error: "International Passport Number is required." };
    }
    if (!/^[A-Z0-9]{7,10}$/i.test(clean)) {
      return { valid: false, error: "Passport number must be 7 to 10 alphanumeric characters (e.g., A12345678)." };
    }
    return { valid: true, formattedValue: clean.toUpperCase() };
  }

  /**
   * Validate Voter Identification Number (VIN)
   * 19 alphanumeric characters
   */
  static validateVoterCard(vin: string): ValidationResult {
    const clean = vin.replace(/[\s\-]/g, "").trim();
    if (!clean) {
      return { valid: false, error: "Voter Identification Number (VIN) is required." };
    }
    if (clean.length < 10 || clean.length > 20) {
      return { valid: false, error: "VIN must be between 10 and 20 alphanumeric characters (e.g., 90F5B12345678901234)." };
    }
    return { valid: true, formattedValue: clean.toUpperCase() };
  }

  /**
   * Universal Validation Dispatcher for any VerificationType
   */
  static validateInput(
    serviceType: VerificationType,
    primaryInput: string,
    additionalFields: Record<string, string> = {}
  ): ValidationResult {
    const fieldErrors: Record<string, string> = {};

    let primaryValidation: ValidationResult;

    switch (serviceType.toUpperCase()) {
      case "NIN":
        primaryValidation = this.validateNIN(primaryInput);
        break;
      case "BVN":
        primaryValidation = this.validateBVN(primaryInput);
        break;
      case "PHONE":
      case "NIN_PHONE":
        if (additionalFields?.searchMethod === "BY_PHONE_NUMBER") {
          primaryValidation = this.validateNinPhone(primaryInput);
        } else {
          primaryValidation = this.validatePhone(primaryInput);
        }
        break;
      case "EMAIL":
        primaryValidation = this.validateEmail(primaryInput);
        break;
      case "CAC":
        primaryValidation = this.validateCAC(primaryInput);
        break;
      case "TIN":
        primaryValidation = this.validateTIN(primaryInput);
        break;
      case "DRIVER_LICENSE":
        primaryValidation = this.validateDriverLicense(primaryInput);
        break;
      case "PASSPORT":
        primaryValidation = this.validatePassport(primaryInput);
        break;
      case "VOTER_CARD":
        primaryValidation = this.validateVoterCard(primaryInput);
        break;
      default:
        // Generic fallback validation
        if (!primaryInput || primaryInput.trim().length === 0) {
          primaryValidation = { valid: false, error: "Verification target ID is required." };
        } else {
          primaryValidation = { valid: true, formattedValue: primaryInput.trim() };
        }
        break;
    }

    if (!primaryValidation.valid && primaryValidation.error) {
      fieldErrors["primaryInput"] = primaryValidation.error;
    }

    // Validate additional required fields if any
    Object.entries(additionalFields).forEach(([key, val]) => {
      if (!val || val.trim() === "") {
        fieldErrors[key] = `${key.replace(/([A-Z])/g, " $1")} is required.`;
      }
    });

    const hasErrors = Object.keys(fieldErrors).length > 0;

    if (hasErrors) {
      return {
        valid: false,
        error: primaryValidation.error || "Please fill in all required fields accurately.",
        fieldErrors,
      };
    }

    return {
      valid: true,
      formattedValue: primaryValidation.formattedValue,
    };
  }

  /**
   * Utility to mask sensitive identity IDs (NIN, BVN, VIN, Passport)
   * e.g. 12345678901 -> 123****7890
   */
  static maskID(id: string): string {
    if (!id || id.length < 6) return id || "****";
    const start = id.substring(0, 3);
    const end = id.substring(id.length - 4);
    return `${start}${"*".repeat(Math.max(3, id.length - 7))}${end}`;
  }
}
