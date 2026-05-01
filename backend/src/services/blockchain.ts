import { ethers, JsonRpcProvider, Wallet, Contract } from "ethers";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

// ABI for PrescriptionRegistry contract (minimal for gas efficiency)
const CONTRACT_ABI = [
  "function createPrescription(bytes32 _hash) external",
  "function batchCreatePrescriptions(bytes32[] calldata _hashes) external",
  "function markAsUsed(bytes32 _hash) external",
  "function verifyPrescription(bytes32 _hash) external view returns (uint8 status, uint256 timestamp, address creator)",
  "function prescriptionExists(bytes32 _hash) external view returns (bool)",
  "function isPrescriptionUsed(bytes32 _hash) external view returns (bool)",
  "function isAuthorized(address _address) external view returns (bool)",
  "function authorizeIssuer(address _issuer) external",
  "function revokeIssuer(address _issuer) external",
  "function admin() external view returns (address)",
  "function totalPrescriptions() external view returns (uint256)",
  "event PrescriptionCreated(bytes32 indexed hash, address indexed creator, uint256 timestamp)",
  "event PrescriptionUsed(bytes32 indexed hash, address indexed dispenser, uint256 timestamp)",
];

// Enum matching contract
export enum PrescriptionStatus {
  NOT_FOUND = 0,
  ACTIVE = 1,
  USED = 2,
}

class BlockchainService {
  private provider: JsonRpcProvider;
  private wallet?: Wallet;
  private contract: Contract;

  constructor() {
    if (!config.blockchain.rpcUrl  !config.blockchain.contractAddress) {
      const missing = [];
      if (!config.blockchain.rpcUrl) missing.push('BASE_RPC_URL');
      if (!config.blockchain.contractAddress) missing.push('CONTRACT_ADDRESS');
      throw new Error(`❌ BLOCKCHAIN CONFIGURATION FAILED: Missing ${missing.join(' and ')} in environment variables.`);
    }

    this.provider = new JsonRpcProvider(config.blockchain.rpcUrl);
    
    if (config.blockchain.privateKey) {
      this.wallet = new Wallet(config.blockchain.privateKey, this.provider);
      this.contract = new Contract(
        config.blockchain.contractAddress,
        CONTRACT_ABI,
        this.wallet
      );
    } else {
      logger.warn("PRIVATE_KEY not configured. Write operations will fail.");
      this.contract = new Contract(
        config.blockchain.contractAddress,
        CONTRACT_ABI,
        this.provider
      );
    }

    logger.info(`Blockchain service initialized`, {
      contractAddress: config.blockchain.contractAddress,
      hasWallet: !!this.wallet,
    });
  }

  /**
   * Get wallet address (admin address)
   */
  getWalletAddress(): string {
    return this.wallet?.address  "0x0000000000000000000000000000000000000000";
  }

  /**
   * Check connection to blockchain
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.provider.getBlockNumber();
      return true;
    } catch {
      return false;
    }
  }

  /
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  /
   * Create a single prescription on blockchain
   */
  async createPrescription(hash: string): Promise<string> {
    try {
      // Ensure hash has 0x prefix and is bytes32
      const formattedHash = hash.startsWith("0x") ? hash : 0x${hash};
      
      logger.info("Creating prescription on blockchain", { hash: formattedHash });
      
      const tx = await this.contract.createPrescription(formattedHash);
      const receipt = await tx.wait();
      
      logger.info("Prescription created on blockchain", {
        hash: formattedHash,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      });
      
      return receipt.hash;
    } catch (error) {
      logger.error("Failed to create prescription on blockchain", { error, hash });
      throw new Error(Blockchain transaction failed: ${(error as Error).message});
    }
  }

/
   * Batch create prescriptions (gas efficient)
   */
  async batchCreatePrescriptions(hashes: string[]): Promise<string> {
    try {
      const formattedHashes = hashes.map(h => 
        h.startsWith("0x") ? h : `0x${h}`
      );
      
      logger.info("Batch creating prescriptions", { count: hashes.length });
      
      const tx = await this.contract.batchCreatePrescriptions(formattedHashes);
      const receipt = await tx.wait();
      
      logger.info("Batch prescriptions created", {
        count: hashes.length,
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
      });
      
      return receipt.hash;
    } catch (error) {
      logger.error("Failed to batch create prescriptions", { error, count: hashes.length });
      throw new Error(`Batch transaction failed: ${(error as Error).message}`);
    }
  }

  /
   * Mark prescription as used (dispensed)
   */
  async markAsUsed(hash: string): Promise<string> {
    try {
      const formattedHash = hash.startsWith("0x") ? hash : 0x${hash};
      
      logger.info("Marking prescription as used", { hash: formattedHash });
      
      const tx = await this.contract.markAsUsed(formattedHash);
      const receipt = await tx.wait();
      
      logger.info("Prescription marked as used", {
        hash: formattedHash,
        txHash: receipt.hash,
      });
      
      return receipt.hash;
    } catch (error) {
      logger.error("Failed to mark prescription as used", { error, hash });
      throw new Error(Dispense transaction failed: ${(error as Error).message});
    }
  }

  /
   * Verify prescription status on blockchain
   */
  async verifyPrescription(hash: string): Promise<{
    status: PrescriptionStatus;
    timestamp: number;
    creator: string;
    exists: boolean;
    isUsed: boolean;
  }> {
    try {
      const formattedHash = hash.startsWith("0x") ? hash : `0x${hash}`;
      
      const [status, timestamp, creator] = await this.contract.verifyPrescription(formattedHash);
      const exists = await this.contract.prescriptionExists(formattedHash);
      const isUsed = await this.contract.isPrescriptionUsed(formattedHash);
      
      return {
        status: Number(status) as PrescriptionStatus,
        timestamp: Number(timestamp),
        creator,
        exists,
        isUsed,
      };
    } catch (error) {
      logger.error("Failed to verify prescription on blockchain", { error, hash });
      throw new Error(`Verification failed: ${(error as Error).message}`);
    }
  }

  /
   * Check if address is authorized issuer
   */
  async isAuthorized(address: string): Promise<boolean> {
    try {
      return await this.contract.isAuthorized(address);
    } catch (error) {
      logger.error("Failed to check authorization", { error, address });
      return false;
    }
  }

  /
   * Authorize a new issuer (doctor)
   */
  async authorizeIssuer(address: string): Promise<string> {
    try {
      logger.info("Authorizing issuer", { address });
      
      const tx = await this.contract.authorizeIssuer(address);
      const receipt = await tx.wait();
      
      logger.info("Issuer authorized", { address, txHash: receipt.hash });
      return receipt.hash;
    } catch (error) {
      logger.error("Failed to authorize issuer", { error, address });
      throw new Error(`Authorization failed: ${(error as Error).message}`);
    }
  }

  /
   * Revoke issuer authorization
   */
  async revokeIssuer(address: string): Promise<string> {
    try {
      logger.info("Revoking issuer", { address });
      
      const tx = await this.contract.revokeIssuer(address);
      const receipt = await tx.wait();
      
      logger.info("Issuer revoked", { address, txHash: receipt.hash });
      return receipt.hash;
    } catch (error) {
      logger.error("Failed to revoke issuer", { error, address });
      throw new Error(Revocation failed: ${(error as Error).message});
    }
  }

/
   * Get total prescriptions count
   */
  async getTotalPrescriptions(): Promise<number> {
    try {
      const count = await this.contract.totalPrescriptions();
      return Number(count);
    } catch (error) {
      logger.error("Failed to get total prescriptions", { error });
      return 0;
    }
  }

  /
   * Generate prescription hash
   */
  generateHash(cid: string, doctorId: string, timestamp: number): string {
    const data = ethers.toUtf8Bytes(${cid}:${doctorId}:${timestamp});
    return ethers.keccak256(data);
  }

  /
   * Get gas price estimate
   */
  async getGasPrice(): Promise<bigint> {
    return this.provider.getFeeData().then((fee) => fee.gasPrice || BigInt(0));
  }

  /
   * Get wallet balance
   */
  async getBalance(): Promise<string> {
    if (!this.wallet) return "0.0";
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }
}

// Singleton instance
let blockchainService: BlockchainService | null = null;

export function getBlockchainService(): BlockchainService {
  if (!blockchainService) {
    blockchainService = new BlockchainService();
  }
  return blockchainService;
}

export { BlockchainService };
