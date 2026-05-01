import axios from "axios";
import FormData from "form-data";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

// Interfaces for IPFS operations
export interface PrescriptionData {
  patientId: string;
  doctorId: string;
  drugs: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  notes?: string;
  createdAt: string;
  expiryDate: string;
}

export interface IPFSUploadResult {
  cid: string;
  url: string;
}

export interface IPFSResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate?: boolean;
}

class IPFSService {
  private apiKey: string;
  private apiSecret: string;
  private jwt: string;
  private baseURL: string = "https://api.pinata.cloud";

  constructor() {
    this.apiKey = config.ipfs.apiKey  "";
    this.apiSecret = config.ipfs.apiSecret  "";
    this.jwt = config.ipfs.jwt  "";

    if (!this.apiKey  !this.apiSecret) {
      logger.warn("IPFS credentials not fully configured");
    }
  }

  /
   * Upload prescription data to IPFS via Pinata
   * Data is encrypted before upload for privacy
   */
  async uploadPrescription(
    data: PrescriptionData,
    encryptionKey: string
  ): Promise<IPFSUploadResult> {
    try {
      // Check if IPFS credentials are configured
      if (!this.jwt && (!this.apiKey || !this.apiSecret)) {
        throw new Error("IPFS credentials not configured. Please set PINATA_API_KEY, PINATA_API_SECRET, and PINATA_JWT in your .env file");
      }

      // Encrypt sensitive data before upload
      const encryptedData = this.encryptData(data, encryptionKey);

      logger.info("Uploading to IPFS via pinJSONToIPFS", { 
        patientId: data.patientId,
        doctorId: data.doctorId 
      });

      // Use pinJSONToIPFS — works reliably in Node.js (no Blob/FormData needed)
      const response = await axios.post<IPFSResponse>(
        `${this.baseURL}/pinning/pinJSONToIPFS`,
        {
          pinataContent: encryptedData,
          pinataMetadata: {
            name: `Prescription-${data.patientId.slice(-8)}`,
            keyvalues: {
              patientId: data.patientId,
              doctorId: data.doctorId,
              type: "prescription",
              createdAt: data.createdAt,
            },
          },
          pinataOptions: {
            cidVersion: 1,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.jwt}`,
          },
          timeout: 30000,
        }
      );

      logger.info("Successfully uploaded to IPFS", {
        cid: response.data.IpfsHash,
        patientId: data.patientId,
      });

      return {
        cid: response.data.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
      };
    } catch (error) {
      logger.error("Failed to upload to IPFS", { error, patientId: data.patientId });
      
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.error?.details || error.response?.data?.error || error.message;
        throw new Error(`IPFS upload failed: ${detail}`);
      }
      throw new Error(`IPFS upload failed: ${(error as Error).message}`);
    }
  }

  /
   * Check if CID is pinned
   */
  async isPinned(cid: string): Promise<boolean> {
    try {
      const response = await axios.get(
        ${this.baseURL}/data/pinList?hashContains=${cid},
        {
          headers: {
            Authorization: Bearer ${this.jwt},
          },
          timeout: 10000,
        }
      );

      return response.data.count > 0;
    } catch (error) {
      logger.error("Failed to check pin status", { error, cid });
      return false;
    }
  }

/
   * Get IPFS URL for a CID
   */
  getIPFSUrl(cid: string): string {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }

  /
   * Fetch prescription data from IPFS and decrypt it
   */
  async fetchPrescription(cid: string, key: string): Promise<PrescriptionData> {
    try {
      const response = await axios.get(https://gateway.pinata.cloud/ipfs/${cid});
      return this.decryptData(response.data, key);
    } catch (error) {
      logger.error("Failed to fetch prescription from IPFS", { error, cid });
      throw new Error(Failed to fetch from IPFS: ${(error as Error).message});
    }
  }

  /**
   * Simple encryption for prescription data
   */
  private encryptData(data: PrescriptionData, key: string): { iv: string; encrypted: string } {
    const iv = this.generateIV();
    const encrypted = this.xorEncrypt(JSON.stringify(data), key, iv);
    
    return {
      iv: Buffer.from(iv).toString("base64"),
      encrypted: Buffer.from(encrypted).toString("base64"),
    };
  }

  private decryptData(encryptedData: { iv: string; encrypted: string }, key: string): PrescriptionData {
    const iv = Buffer.from(encryptedData.iv, "base64");
    const encrypted = Buffer.from(encryptedData.encrypted, "base64");
    const decrypted = this.xorDecrypt(encrypted, key, iv);
    
    return JSON.parse(decrypted);
  }

  private generateIV(): Uint8Array {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint8Array(16));
    }
    // Fallback for Node.js environment
    const iv = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      iv[i] = Math.floor(Math.random() * 256);
    }
    return iv;
  }

  private xorEncrypt(data: string, key: string, iv: Uint8Array): Uint8Array {
    const dataBytes = new TextEncoder().encode(data);
    const keyBytes = new TextEncoder().encode(key.slice(0, 32).padEnd(32, "0"));
    const result = new Uint8Array(dataBytes.length);
    
    for (let i = 0; i < dataBytes.length; i++) {
      const keyIndex = i % keyBytes.length;
      const ivIndex = i % iv.length;
      result[i] = dataBytes[i] ^ keyBytes[keyIndex] ^ iv[ivIndex];
    }
    
    return result;
  }

  private xorDecrypt(data: Buffer, key: string, iv: Uint8Array): string {
    const keyBytes = new TextEncoder().encode(key.slice(0, 32).padEnd(32, "0"));
    const result = new Uint8Array(data.length);
    
    for (let i = 0; i < data.length; i++) {
      const keyIndex = i % keyBytes.length;
      const ivIndex = i % iv.length;
      result[i] = data[i] ^ keyBytes[keyIndex] ^ iv[ivIndex];
    }
    
    return new TextDecoder().decode(result);
  }
}

// Singleton instance
let ipfsService: IPFSService | null = null;

export function getIPFSService(): IPFSService {
  if (!ipfsService) {
    ipfsService = new IPFSService();
  }
  return ipfsService;
}
