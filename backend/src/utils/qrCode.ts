import QRCode from "qrcode";
import { logger } from "./logger.js";

export interface QRCodeData {
  hash: string;
  cid: string;
  txHash: string;
  apiUrl: string;
}

export interface QRCodeResult {
  dataUri: string;
  rawData: QRCodeData;
}

/**
 * Generate QR code for prescription verification
 * Contains minimal data needed for pharmacist verification
 */
export async function generatePrescriptionQR(
  data: QRCodeData
): Promise<QRCodeResult> {
  try {
    // Create compact verification payload
    const payload = {
      h: data.hash.slice(0, 20), // Truncated hash for QR size
      c: data.cid.slice(0, 20),  // Truncated CID for QR size
      v: "1", // Version
    };

    // Also include full verification URL
    const verificationUrl = `${data.apiUrl}/verify?hash=${data.hash}&cid=${data.cid}`;

    // Generate QR code with medium error correction (suitable for scanning in pharmacies)
    const qrCodeDataUri = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: "M",
      type: "image/png",
      margin: 2,
      width: 400,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    logger.info("QR code generated successfully", {
      hash: data.hash.slice(0, 20),
      cid: data.cid.slice(0, 20),
    });

    return {
      dataUri: qrCodeDataUri,
      rawData: data,
    };
  } catch (error) {
    logger.error("Failed to generate QR code", { error, hash: data.hash });
    throw new Error(`QR code generation failed: ${(error as Error).message}`);
  }
}

/**
 * Parse QR code data from scan
 */
export function parseQRCodeData(url: string): { hash: string; cid: string } | null {
  try {
    const urlObj = new URL(url);
    const hash = urlObj.searchParams.get("hash");
    const cid = urlObj.searchParams.get("cid");

    if (!hash || !cid) {
      return null;
    }

    return { hash, cid };
  } catch {
    return null;
  }
}

/**
 * Generate compact QR for small displays (mobile view)
 */
export async function generateCompactQR(
  hash: string,
  apiUrl: string
): Promise<string> {
  const shortUrl = `${apiUrl}/v/${hash.slice(0, 16)}`;
  
  return QRCode.toDataURL(shortUrl, {
    errorCorrectionLevel: "L",
    type: "image/png",
    margin: 1,
    width: 200,
  });
}
