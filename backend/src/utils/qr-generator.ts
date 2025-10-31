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
