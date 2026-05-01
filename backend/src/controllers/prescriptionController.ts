import { Request, Response, NextFunction } from "express";
import { Prescription } from "../models/Prescription.js";
import { User } from "../models/User.js";
import { AppError } from "../middleware/errorHandler.js";
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";
import { getBlockchainService, PrescriptionStatus as ChainStatus } from "../services/blockchain.js";
import { getIPFSService, PrescriptionData } from "../services/ipfs.js";
import { generatePrescriptionQR } from "../utils/qrCode.js";

interface CreatePrescriptionBody {
  patientId: string;
  drugs: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  expiryDate: string;
  notes?: string;
}

/**
 * Create new prescription
 * - Encrypt and upload to IPFS
 * - Generate hash
 * - Store hash on blockchain
 * - Generate QR code
 */
export async function createPrescription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const doctor = req.user;
    const { patientId, drugs, expiryDate, notes } = req.body as CreatePrescriptionBody;

    if (!doctor) {
      throw new AppError("Authentication required", 401);
    }

    // Verify patient exists — accept patientCode (ETP-XXXX) or ID
    let patient;
    if (/^ETP-/i.test(patientId)) {
      patient = await User.findByPatientCode(patientId.toUpperCase());
    } else {
      patient = await User.findById(patientId);
    }
    if (!patient || patient.role !== "patient") {
      throw new AppError("Patient not found. Use patient code like ETP-1001", 404);
    }

    // Prepare prescription data for IPFS
    const now = new Date();
    const timestamp = now.getTime();
    const isoTimestamp = now.toISOString();

    const prescriptionData: PrescriptionData = {
      patientId: patient.id,
      doctorId: doctor.id,
      drugs,
      notes,
      createdAt: isoTimestamp,
      expiryDate: new Date(expiryDate).toISOString(),
    };

    // Upload to IPFS (encrypted)
    const ipfs = getIPFSService();
    const { cid } = await ipfs.uploadPrescription(
      prescriptionData,
      config.encryption.key
    );

    // Generate hash: keccak256(CID + doctorId + timestamp)
    const blockchain = getBlockchainService();
    const hash = blockchain.generateHash(cid, doctor.id, timestamp);

    // Store hash on blockchain
    const txHash = await blockchain.createPrescription(hash);

    // Generate QR code
    const { dataUri: qrCodeDataUri } = await generatePrescriptionQR({
      hash,
      cid,
      txHash,
      apiUrl: config.server.apiUrl,
    });

    // Save to Database
    const drug = drugs && drugs.length > 0 ? drugs[0] : { name: "Unknown", dosage: "-", frequency: "-", duration: "-" };
    
    const prescription = await Prescription.create({
      prescriptionId: `RX-${Date.now()}`,
      doctorId: doctor.id,
      patientId: patient.id,
      ipfsCid: cid,
      ipfsHash: hash,
      txHash,
      expiresAt: new Date(expiryDate).toISOString(),
      issuedAt: new Date().toISOString(),
      drug: drug.name,
      dosage: drug.dosage,
      frequency: drug.frequency,
      duration: drug.duration,
      notes,
      status: "active",
    } as any);

    logger.info("Prescription created", {
      prescriptionId: prescription.id,
      doctorId: doctor.id,
      patientId,
      hash: hash.slice(0, 20),
      txHash: txHash.slice(0, 20),
    });

    res.status(201).json({
      message: "Prescription created successfully",
      prescription: {
        id: prescription.id,
        hash: prescription.ipfsHash,
        cid: prescription.ipfsCid,
        txHash: prescription.txHash,
        explorerUrl: `https://sepolia.basescan.org/tx/${prescription.txHash}`,
        expiryDate: prescription.expiresAt,
        status: prescription.status,
        qrCode: qrCodeDataUri, // The QR code is generated but not saved to the DB in Supabase schema
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPrescriptions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    
    if (!user) {
      throw new AppError("Authentication required", 401);
    }

    let filter: any = {};

    switch (user.role) {
      case "doctor":
        filter.doctorId = user.id;
        break;
      
      case "patient":
        filter.patientId = user.id;
        break;
      
      case "pharmacist":
      case "admin":
        // Pharmacists and admins can see all prescriptions
        break;
      
      default:
        throw new AppError("Invalid role", 400);
    }

    const prescriptions = await Prescription.findMany(filter);

    res.json({
      prescriptions: prescriptions.map(p => ({
        id: p.id,
        hash: p.ipfsHash,
        cid: p.ipfsCid,
        txHash: p.txHash,
        status: p.status,
        drugs: [{ name: p.drug, dosage: p.dosage, frequency: p.frequency, duration: p.duration }],
        notes: p.notes,
        expiryDate: p.expiresAt,
        createdAt: p.createdAt,
        doctor: p.doctor || p.doctorId,
        patient: p.patient || p.patientId,
      })),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single prescription by ID
 */
export async function getPrescriptionById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      throw new AppError("Authentication required", 401);
    }

    const prescription = await Prescription.findById(id);

    if (!prescription) {
      throw new AppError("Prescription not found", 404);
    }

    const doctor = await User.findById(prescription.doctorId);
    const patient = await User.findById(prescription.patientId);

    // Check access permissions
    const isAuthorized =
      user.role === "admin" ||
      user.role === "pharmacist" ||
      prescription.doctorId === user.id ||
      prescription.patientId === user.id;

    if (!isAuthorized) {
      throw new AppError("Access denied", 403);
    }

    res.json({
      prescription: {
        id: prescription.id,
        hash: prescription.ipfsHash,
        cid: prescription.ipfsCid,
        txHash: prescription.txHash,
        status: prescription.status,
        expiryDate: prescription.expiresAt,
        drugs: [{ name: prescription.drug, dosage: prescription.dosage, frequency: prescription.frequency, duration: prescription.duration }],
        notes: prescription.notes,
        doctor: doctor ? { id: doctor.id, name: doctor.name } : prescription.doctorId,
        patient: patient ? { id: patient.id, name: patient.name } : prescription.patientId,
        createdAt: prescription.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel prescription (doctor only)
 */
export async function cancelPrescription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user || user.role !== "doctor") {
      throw new AppError("Doctor access required", 403);
    }

    const prescription = await Prescription.findById(id);

    if (!prescription || prescription.doctorId !== user.id || prescription.status !== "active") {
      throw new AppError("Prescription not found or cannot be cancelled", 404);
    }

    await Prescription.updateStatus(id, "cancelled");

    logger.info("Prescription cancelled", {
      prescriptionId: id,
      doctorId: user.id,
    });

    res.json({
      message: "Prescription cancelled successfully",
      prescription: {
        id: prescription.id,
        status: "cancelled",
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify prescription via hash and CID
 * Used by pharmacists scanning QR codes
 */
export async function verifyPrescription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { hash, cid } = req.body as { hash: string; cid: string };

    // 1. Verify on blockchain
    const blockchain = getBlockchainService();
    const chainData = await blockchain.verifyPrescription(hash);

    if (!chainData.exists) {
      res.status(404).json({
        valid: false,
        reason: "INVALID",
        message: "Prescription not found on blockchain",
      });
      return;
    }

    // 2. Fetch from IPFS
    const ipfs = getIPFSService();
    let prescriptionData: PrescriptionData;
    
    try {
      prescriptionData = await ipfs.fetchPrescription(cid, config.encryption.key);
    } catch (error) {
      logger.error("Failed to fetch from IPFS during verification", { error, cid });
      res.status(404).json({
        valid: false,
        reason: "IPFS_ERROR",
        message: "Could not retrieve prescription data",
      });
      return;
    }

    // 3. Recompute and verify hash
    const blockchain2 = getBlockchainService();
    const recomputedHash = blockchain2.generateHash(
      cid,
      prescriptionData.doctorId,
      new Date(prescriptionData.createdAt).getTime()
    );

    if (recomputedHash !== hash) {
      res.status(400).json({
        valid: false,
        reason: "INVALID",
        message: "Hash mismatch - possible tampering",
      });
      return;
    }

    // 4. Check expiry
    const now = new Date();
    const expiryDate = new Date(prescriptionData.expiryDate);
    const isExpired = now > expiryDate;

    // 5. Check blockchain status
    const isUsed = chainData.isUsed;

    // Determine result
    let result: { valid: boolean; reason: string; message: string };
    
    if (isUsed) {
      result = {
        valid: false,
        reason: "USED",
        message: "Prescription has already been dispensed",
      };
    } else if (isExpired) {
      result = {
        valid: false,
        reason: "EXPIRED",
        message: `Prescription expired on ${expiryDate.toLocaleDateString()}`,
      };
    } else {
      result = {
        valid: true,
        reason: "VALID",
        message: "Prescription is valid and ready for dispensing",
      };
    }

    // Get doctor and patient info
    const doctor = await User.findById(prescriptionData.doctorId);
    const patient = await User.findById(prescriptionData.patientId);

    logger.info("Prescription verified", {
      hash: hash.slice(0, 20),
      valid: result.valid,
      reason: result.reason,
    });

    // Get database info for tx_hash
    const dbPrescription = await Prescription.findByHash(hash);
    const txHash = dbPrescription?.txHash;
    const explorerUrl = txHash ? `https://sepolia.basescan.org/tx/${txHash}` : null;

    res.json({
      ...result,
      prescription: {
        hash,
        cid,
        txHash,
        explorerUrl,
        drugs: prescriptionData.drugs,
        notes: prescriptionData.notes,
        expiryDate: prescriptionData.expiryDate,
        createdAt: prescriptionData.createdAt,
        patientId: prescriptionData.patientId,
        patientName: patient ? patient.name : "—",
        doctor: doctor ? {
          name: doctor.name,
          license: doctor.license,
        } : null,
        blockchain: {
          status: chainData.status,
          timestamp: chainData.timestamp,
          creator: chainData.creator,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Dispense prescription (pharmacist only)
 */
export async function dispensePrescription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pharmacist = req.user;
    const { hash, prescriptionId } = req.body as { hash: string; prescriptionId: string };

    if (!pharmacist || pharmacist.role !== "pharmacist") {
      throw new AppError("Pharmacist access required", 403);
    }

    // Find prescription in database
    const prescription = await Prescription.findById(prescriptionId);
    
    if (!prescription) {
      throw new AppError("Prescription not found", 404);
    }

    // Check if already used
    if (prescription.status === "used") {
      throw new AppError("Prescription has already been dispensed", 409);
    }

    // Check expiry
    if (new Date() > new Date(prescription.expiresAt)) {
      throw new AppError("Prescription has expired", 400);
    }

    // Mark as used on blockchain
    const blockchain = getBlockchainService();
    const txHash = await blockchain.markAsUsed(hash);

    // Update database
    const updated = await Prescription.updateStatus(prescription.id, "used");

    logger.info("Prescription dispensed", {
      prescriptionId,
      hash: hash.slice(0, 20),
      pharmacistId: pharmacist.id,
      txHash: txHash.slice(0, 20),
    });

    res.json({
      message: "Prescription dispensed successfully",
      dispensed: {
        prescriptionId,
        hash,
        dispensedAt: updated.updatedAt,
        dispensedBy: pharmacist.id,
        blockchainTx: txHash,
      },
    });
  } catch (error) {
    next(error);
  }
}
