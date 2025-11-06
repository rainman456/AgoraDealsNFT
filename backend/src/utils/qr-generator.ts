import QRCode from 'qrcode';

export interface QRCodeOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  quality?: number;
  margin?: number;
  width?: number;
}

export async function generateQRCode(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const defaultOptions: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    type: 'image/png',
    margin: options.margin || 1,
    width: options.width || 300
  };

  try {
    return await QRCode.toDataURL(data, defaultOptions);
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error}`);
  }
}

export async function generateQRCodeBuffer(
  data: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const defaultOptions: QRCode.QRCodeToBufferOptions = {
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    type: 'png',
    margin: options.margin || 1,
    width: options.width || 300
  };

  try {
    return await QRCode.toBuffer(data, defaultOptions);
  } catch (error) {
    throw new Error(`Failed to generate QR code buffer: ${error}`);
  }
}

export interface QRCodeData {
  couponId: string;
  promotionId: string;
  merchantId: string;
  timestamp: number;
  expiresAt: number;
  [key: string]: any;
}

export interface QRCodeVerificationResult {
  valid: boolean;
  error?: string;
  data?: QRCodeData;
}

export function verifyQRCode(qrData: string): QRCodeVerificationResult {
  try {
    const data = JSON.parse(qrData) as QRCodeData;
    
    // Check required fields
    if (!data.couponId || !data.promotionId || !data.merchantId || !data.timestamp || !data.expiresAt) {
      return {
        valid: false,
        error: 'Missing required fields',
      };
    }

    const now = Date.now();
    
    // Check if timestamp is in the future
    if (data.timestamp > now) {
      return {
        valid: false,
        error: 'QR code has future timestamp',
      };
    }

    // Check if expired
    if (data.expiresAt < now) {
      return {
        valid: false,
        error: 'QR code has expired',
      };
    }

    return {
      valid: true,
      data,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid JSON format',
    };
  }
}
