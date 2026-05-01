import { Request, Response, NextFunction } from "express";
import { body, param, validationResult, ValidationChain } from "express-validator";

/**
 * Generic validation middleware
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      next();
      return;
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.type === "field" ? err.path : err.type,
      message: err.msg,
      value: err.type === "field" ? err.value : undefined,
    }));

    res.status(400).json({
      error: "Validation failed",
      details: extractedErrors,
    });
  };
}

/**
 * Auth validation rules
 */
export const authValidation = {
  register: [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be 2-100 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain number"),
    body("role")
      .isIn(["doctor", "patient", "pharmacist"])
      .withMessage("Role must be doctor, patient, or pharmacist"),
    body("license")
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("License must be 3-50 characters"),
  ],
  
  login: [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email required"),
    body("password")
      .notEmpty()
      .withMessage("Password required"),
  ],
};

/**
 * Prescription validation rules
 */
export const prescriptionValidation = {
  create: [
    body("patientId")
      .trim()
      .notEmpty()
      .withMessage("Patient ID required")
      .custom((value) => {
        // Accept ETP-XXXX patient codes or MongoDB ObjectIds
        if (/^ETP-\d{4,}$/i.test(value) || /^[0-9a-fA-F]{24}$/.test(value)) {
          return true;
        }
        throw new Error("Patient ID must be a patient code (e.g. ETP-1001) or valid ID");
      }),
    body("drugs")
      .isArray({ min: 1 })
      .withMessage("At least one drug required"),
    body("drugs.*.name")
      .trim()
      .notEmpty()
      .withMessage("Drug name required"),
    body("drugs.*.dosage")
      .trim()
      .notEmpty()
      .withMessage("Dosage required"),
    body("drugs.*.frequency")
      .trim()
      .notEmpty()
      .withMessage("Frequency required"),
    body("drugs.*.duration")
      .trim()
      .notEmpty()
      .withMessage("Duration required"),
    body("expiryDate")
      .isISO8601()
      .withMessage("Valid ISO 8601 date required")
      .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        if (date <= now) {
          throw new Error("Expiry date must be in the future");
        }
        if (date > new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)) {
          throw new Error("Expiry date cannot be more than 1 year in the future");
        }
        return true;
      }),
    body("notes")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Notes must be under 1000 characters"),
  ],
  
  verify: [
    body("hash")
      .trim()
      .notEmpty()
      .withMessage("Hash required")
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage("Invalid hash format (expected 0x + 64 hex chars)"),
    body("cid")
      .trim()
      .notEmpty()
      .withMessage("CID required")
      .isLength({ min: 46, max: 100 })
      .withMessage("Invalid CID format"),
  ],
  
  dispense: [
    body("hash")
      .trim()
      .notEmpty()
      .withMessage("Hash required")
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage("Invalid hash format"),
    body("prescriptionId")
      .notEmpty()
      .withMessage("Valid prescription ID required"),
  ],
};

/**
 * User validation rules
 */
export const userValidation = {
  approve: [
    body("userId")
      .notEmpty()
      .withMessage("User ID required"),
    body("approved")
      .isBoolean()
      .withMessage("Approved status must be boolean"),
  ],
  
  getById: [
    param("id")
      .notEmpty()
      .withMessage("User ID required"),
  ],
};
