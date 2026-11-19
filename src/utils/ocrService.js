import { isNativeMobile } from './platform';
import { parseReceiptText } from './receiptParser';

/**
 * Checks whether native on-device receipt scanning is supported.
 * Only returns true on native mobile (Android / iOS).
 */
export function isReceiptScanSupported() {
  return isNativeMobile();
}

/**
 * Captures or selects a receipt image and performs offline on-device OCR.
 *
 * @returns {Promise<{
 *   success: boolean,
 *   cancelled?: boolean,
 *   parsed?: {
 *     merchant: string,
 *     totalAmount: number | null,
 *     currency: string | null,
 *     candidateItems: Array<{ title: string, amount: number, raw: string }>,
 *     rawLines: string[]
 *   },
 *   rawText?: string,
 *   error?: string
 * }>}
 */
export async function scanReceipt() {
  if (!isNativeMobile()) {
    return {
      success: false,
      error: 'Receipt scanning is only supported on mobile devices.',
    };
  }

  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const { TextRecognition } = await import('@capacitor-mlkit/text-recognition');

    // 1. Capture photo or select from gallery directly without external edit intent chooser
    const photo = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      correctOrientation: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
    });

    if (!photo || !photo.path) {
      return { cancelled: true };
    }

    // 2. Perform native on-device text recognition (Google ML Kit on Android, Apple Vision on iOS)
    const ocrResult = await TextRecognition.processImage({
      path: photo.path,
    });

    if (!ocrResult || !ocrResult.text) {
      return {
        success: false,
        error: 'No text could be recognized from the image.',
      };
    }

    // 3. Parse receipt data locally
    const parsed = parseReceiptText(ocrResult.text, ocrResult.blocks || []);

    return {
      success: true,
      parsed,
      rawText: ocrResult.text,
    };
  } catch (err) {
    // Check if user dismissed the photo picker
    if (
      err.message?.includes('User cancelled') ||
      err.message?.includes('cancelled') ||
      err.code === 'OS-PLUG-CAMR-0006' ||
      err.code === 'OS-PLUG-CAMR-0020'
    ) {
      return { cancelled: true };
    }

    console.error('Receipt scan error:', err);
    return {
      success: false,
      error: err.message || 'Failed to scan receipt image.',
    };
  }
}
