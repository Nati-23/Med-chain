import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "JWT_SECRET",
  "BASE_RPC_URL",
  "PRIVATE_KEY",
  "CONTRACT_ADDRESS",
];

function validateEnv(): void {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(
      `⚠️ Missing environment variables: ${missing.join(", ")}. Using defaults or throwing errors.`
    );
  }
}

validateEnv();

export const config = {
  server: {
    env: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "5000", 10),
    apiUrl: process.env.API_URL || "http://localhost:5000",
  },
  
  supabase: {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceKey: process.env.SUPABASE_SERVICE_KEY || "",
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },
  
  blockchain: {
    rpcUrl: process.env.BASE_RPC_URL || "https://sepolia.base.org",
    privateKey: process.env.PRIVATE_KEY || "",
    contractAddress: process.env.CONTRACT_ADDRESS || "",
    chainId: process.env.BASE_RPC_URL?.includes("sepolia") ? 84532 : 8453,
  },
  
  ipfs: {
    apiKey: process.env.PINATA_API_KEY || "",
    apiSecret: process.env.PINATA_API_SECRET || "",
    jwt: process.env.PINATA_JWT || "",
  },
  
  encryption: {
    key: process.env.ENCRYPTION_KEY || "default-32-char-encryption-key-",
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },
};

// Validate critical configuration
export function validateConfig(): void {
  if (config.server.env === "production") {
    if (config.jwt.secret === "dev-secret-change-in-production") {
      console.warn("⚠️ WARNING: JWT_SECRET is using the default value in production.");
    }
    if (!config.blockchain.privateKey) {
      console.warn("⚠️ WARNING: PRIVATE_KEY is missing in production.");
    }
  }
}
