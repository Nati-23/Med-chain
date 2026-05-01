import { Request, Response, NextFunction } from "express";
import { User, UserRole } from "../models/User.js";
import { AppError } from "../middleware/errorHandler.js";
import { logger } from "../utils/logger.js";
import { getBlockchainService } from "../services/blockchain.js";
import { Prescription } from "../models/Prescription.js";

/**
 * Get pending users (doctors and pharmacists awaiting approval)
 */
export async function getPendingUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const doctors = await User.findMany({ role: "doctor", approved: false });
    const pharmacists = await User.findMany({ role: "pharmacist", approved: false });
    
    const pendingUsers = [...doctors, ...pharmacists].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({
      users: pendingUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        license: u.license,
        walletAddress: u.walletAddress,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Approve or reject user
 */
export async function approveUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, approved } = req.body as { userId: string; approved: boolean };

    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.role === "patient") {
      throw new AppError("Patients are auto-approved", 400);
    }

    const previousStatus = user.approved;
    await User.update(userId, { approved });

    // If approved and has wallet, authorize on blockchain
    if (approved && user.walletAddress) {
      try {
        const blockchain = getBlockchainService();
        await blockchain.authorizeIssuer(user.walletAddress.toLowerCase());
        logger.info("Wallet authorized on blockchain by admin", {
          userId,
          walletAddress: user.walletAddress,
        });
      } catch (error) {
        logger.error("Failed to authorize wallet on blockchain", { error, userId });
        // Don't fail the approval - can retry later
      }
    }

    logger.info("User approval status changed", {
      adminId: req.user?.id,
      userId,
      role: user.role,
      previousStatus,
      newStatus: approved,
    });

    res.json({
      message: approved ? "User approved successfully" : "User rejected",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        approved,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get system statistics
 */
export async function getStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const blockchain = getBlockchainService();

    // User stats
    const doctorsCount = await User.count({ role: "doctor" });
    const pharmacistsCount = await User.count({ role: "pharmacist" });
    const patientsCount = await User.count({ role: "patient" });
    const totalUsers = doctorsCount + pharmacistsCount + patientsCount;

    const userStats = [
      { _id: "doctor", count: doctorsCount },
      { _id: "pharmacist", count: pharmacistsCount },
      { _id: "patient", count: patientsCount },
    ];

    // Prescription stats
    const activeScripts = await Prescription.count({ status: "active" });
    const usedScripts = await Prescription.count({ status: "used" });
    const expiredScripts = await Prescription.count({ status: "expired" });
    const cancelledScripts = await Prescription.count({ status: "cancelled" });
    const totalPrescriptions = activeScripts + usedScripts + expiredScripts + cancelledScripts;

    const prescriptionStats = [
      { _id: "active", count: activeScripts },
      { _id: "used", count: usedScripts },
      { _id: "expired", count: expiredScripts },
      { _id: "cancelled", count: cancelledScripts },
    ];

    // Blockchain stats
    let blockchainStats = null;
    try {
      const connected = await blockchain.isConnected();
      const totalOnChain = await blockchain.getTotalPrescriptions();
      const balance = await blockchain.getBalance();
      
      blockchainStats = {
        connected,
        totalPrescriptions: totalOnChain,
        walletBalance: balance,
        walletAddress: blockchain.getWalletAddress(),
      };
    } catch (error) {
      logger.error("Failed to fetch blockchain stats", { error });
    }

    res.json({
      users: {
        byRole: userStats,
        total: totalUsers,
      },
      prescriptions: {
        byStatus: prescriptionStats,
        total: totalPrescriptions,
        active: activeScripts,
        used: usedScripts,
        expired: expiredScripts,
      },
      blockchain: blockchainStats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { role, approved, page = "1", limit = "50" } = req.query;

    const query: any = {};
    if (role) query.role = role as UserRole;
    if (approved !== undefined) query.approved = approved === "true";

    const users = await User.findMany(query);
    const total = await User.count(query);

    // Apply basic pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedUsers = users.slice(startIndex, startIndex + limitNum);

    res.json({
      users: paginatedUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        license: u.license,
        approved: u.approved,
        walletAddress: u.walletAddress,
        createdAt: u.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Revoke user access
 */
export async function revokeUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Revoke blockchain authorization if wallet exists
    if (user.walletAddress) {
      try {
        const blockchain = getBlockchainService();
        await blockchain.revokeIssuer(user.walletAddress.toLowerCase());
        logger.info("Wallet revoked on blockchain", {
          userId,
          walletAddress: user.walletAddress,
        });
      } catch (error) {
        logger.error("Failed to revoke wallet on blockchain", { error, userId });
      }
    }

    // Mark user as not approved
    await User.update(userId, { approved: false });

    logger.info("User access revoked", {
      adminId: req.user?.id,
      userId,
      role: user.role,
    });

    res.json({
      message: "User access revoked successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        approved: false,
      },
    });
  } catch (error) {
    next(error);
  }
}
