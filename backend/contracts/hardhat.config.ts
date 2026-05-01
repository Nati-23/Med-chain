import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

// Load environment variables from parent directory
dotenv.config({ path: "../.env" });

/**
 * Validate and format private key
 * Private key must be 64 hex characters (32 bytes), with or without 0x prefix
 */
function getPrivateKeys(): string[] {
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error("\n❌ ERROR: PRIVATE_KEY not found in .env file");
    console.error("   Please add your private key to the backend/.env file:\n");
    console.error("   PRIVATE_KEY=abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678");
    console.error("\n   To get a private key:");
    console.error("   1. Create a new wallet with MetaMask");
    console.error("   2. Export the private key (64 hex characters)");
    console.error("   3. Get free Base Sepolia ETH from https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    console.error("\n   ⚠️  NEVER use a mainnet wallet with real funds for testing!\n");
    return [];
  }
  
  // Remove 0x prefix if present
  let cleanKey = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
  
  // Validate length
  if (cleanKey.length !== 64) {
    console.error(`\n❌ ERROR: PRIVATE_KEY has invalid length: ${cleanKey.length} characters`);
    console.error("   Expected: 64 hex characters (32 bytes)");
    console.error(`   Your key has ${cleanKey.length} characters`);
    console.error("\n   Example valid format:");
    console.error("   PRIVATE_KEY=abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678");
    console.error("\n   Or with 0x prefix:");
    console.error("   PRIVATE_KEY=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678\n");
    return [];
  }
  
  // Validate hex characters
  if (!/^[a-fA-F0-9]+$/.test(cleanKey)) {
    console.error("\n❌ ERROR: PRIVATE_KEY contains invalid characters");
    console.error("   Private key must contain only hex characters (0-9, a-f, A-F)");
    return [];
  }
  
  return ["0x" + cleanKey.toLowerCase()];
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    baseSepolia: {
      url: process.env.BASE_RPC_URL || "https://sepolia.base.org",
      accounts: getPrivateKeys(),
      chainId: 84532,
      gasPrice: "auto",
    },
    baseMainnet: {
      url: "https://mainnet.base.org",
      accounts: getPrivateKeys(),
      chainId: 8453,
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      baseSepolia: "PLACEHOLDER",
      baseMainnet: "PLACEHOLDER",
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "baseMainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },
  typechain: {
    outDir: "./typechain-types",
    target: "ethers-v6",
  },
  mocha: {
    timeout: 40000,
  },
};

export default config;
