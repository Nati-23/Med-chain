import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, IUser, UserRole } from "../models/User.js";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../middleware/errorHandler.js";
import { getBlockchainService } from "../services/blockchain.js";

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  license?: string;
  walletAddress?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

/**
 * Register new user
 * Doctors and pharmacists require admin approval
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password, role, license, walletAddress } = req.body as RegisterBody;

    // Check if email exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new AppError("Email already registered", 409);
    }

    // Validate license for doctors and pharmacists
    if ((role === "doctor" || role === "pharmacist") && !license) {
      throw new AppError(`${role} requires a license number`, 400);
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Determine approval status
    // Patients are auto-approved, doctors/pharmacists need admin approval
    const approved = role === "patient";

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      approved,
      license: (role === "doctor" || role === "pharmacist") ? license : undefined,
      facility: (req.body as any).facility || (role === "patient" ? undefined : "MedChain Facility"),
      walletAddress: walletAddress?.toLowerCase(),
      patientCode: role === "patient" ? `ETP-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
    });

    logger.info("New user registered", {
      userId: user.id,
      email,
      role,
      approved,
    });

    // If approved (patient), return token
    if (approved) {
      const token = generateToken(user);
      
      res.status(201).json({
        message: "Registration successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          approved: user.approved,
        },
        token,
      });
      return;
    }

    // Pending approval (doctor/pharmacist)
    res.status(201).json({
      message: "Registration successful. Pending admin approval.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        approved: user.approved,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login user
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as LoginBody;

    // Find user with password
    const user = await User.findByEmail(email);
    
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      // Log failed attempt
      logger.warn("Failed login attempt", { email, ip: req.ip });
      throw new AppError("Invalid credentials", 401);
    }

    // Check approval status
    if (!user.approved && user.role !== "admin") {
      throw new AppError("Account pending admin approval", 403);
    }

    // Generate token
    const token = generateToken(user);

    logger.info("User logged in", {
      userId: user.id,
      email,
      role: user.role,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        approved: user.approved,
        walletAddress: user.walletAddress,
        patientCode: user.patientCode,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user profile
 */
export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    
    if (!user) {
      throw new AppError("Not authenticated", 401);
    }

    // Get fresh user data
    const freshUser = await User.findById(user.id);
    
    if (!freshUser) {
      throw new AppError("User not found", 404);
    }

    res.json({
      user: {
        id: freshUser.id,
        name: freshUser.name,
        email: freshUser.email,
        role: freshUser.role,
        license: freshUser.license,
        approved: freshUser.approved,
        walletAddress: freshUser.walletAddress,
        createdAt: freshUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Link wallet address to user
 */
export async function linkWallet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    const { walletAddress } = req.body as { walletAddress: string };

    if (!user) {
      throw new AppError("Not authenticated", 401);
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      throw new AppError("Invalid wallet address", 400);
    }

    // Check if wallet is already linked
    const { data: existingData } = await (await import('../config/supabase.js')).supabase!.from('users').select('*').eq('wallet_address', walletAddress.toLowerCase()).single();
    if (existingData && existingData.id !== user.id) {
      throw new AppError("Wallet address already linked to another account", 409);
    }

    // For doctors/pharmacists, authorize on blockchain
    if (user.role === "doctor" || user.role === "pharmacist") {
      try {
        const blockchain = getBlockchainService();
        await blockchain.authorizeIssuer(walletAddress.toLowerCase());
        logger.info("Wallet authorized on blockchain", {
          userId: user.id,
          walletAddress,
        });
      } catch (error) {
        logger.error("Failed to authorize wallet on blockchain", { error });
        // Continue - admin can authorize later
      }
    }

    // Update user
    const updatedUser = await User.update(user.id, { walletAddress: walletAddress.toLowerCase() });

    res.json({
      message: "Wallet linked successfully",
      walletAddress: updatedUser?.walletAddress,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate JWT token
 */
function generateToken(user: IUser): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });
}
