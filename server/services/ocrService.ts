import OpenAI from "openai";
import { Buffer } from "buffer";
import path from "path";
import sharp from "sharp";
import { createWorker, createScheduler } from "tesseract.js";
import { InsertOcrResult, InsertOcrProcessingLog, OcrResult } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (error) {
    console.log('⚠️ OpenAI not available - using free Tesseract OCR only');
  }
} else {
  console.log('🆓 Using free Tesseract OCR (no OpenAI API key provided)');
}

// OCR Method Types
type OcrMethod = 'tesseract' | 'openai' | 'auto';

type DocumentType = 'invoice' | 'bill' | 'receipt' | 'fuel_slip' | 'travel_ticket' | 'accommodation' | 'food_bill' | 'unknown';

interface ConfidenceScores {
  amount?: number;
  date?: number;
  vendor?: number;
  invoiceNumber?: number;
  overall?: number;
}

interface AmbiguousField {
  field: string;
  possibleValues: string[];
  reason: string;
}

interface ExtractedData {
  amount?: number;
  date?: string;
  vendorName?: string;
  invoiceNumber?: string;
  description?: string;
  items?: Array<{
    description: string;
    amount: number;
    quantity?: number;
  }>;
  taxAmount?: number;
  totalAmount?: number;
  paymentMethod?: string;
  merchantAddress?: string;
  phoneNumber?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  // GST Details for Indian bills/invoices
  cgst?: number;
  sgst?: number;
  igst?: number;
  gstTotal?: number;
  // Enhanced OCR features
  documentType?: DocumentType;
  confidence?: ConfidenceScores;
  ambiguousFields?: AmbiguousField[];
  [key: string]: any; // Add index signature for dynamic access
}

interface OcrProcessingResult {
  success: boolean;
  extractedData?: ExtractedData;
  confidence?: number;
  processingTimeMs: number;
  tokensUsed?: number;
  errorMessage?: string;
  rawResponse?: any;
}

export class OcrService {
  private tesseractScheduler: any = null;

  /**
   * Initialize Tesseract scheduler for better performance
   */
  private async initTesseract() {
    if (!this.tesseractScheduler) {
      this.tesseractScheduler = createScheduler();
      const worker = await createWorker("eng");
      this.tesseractScheduler.addWorker(worker);
      console.log("🔤 Tesseract OCR initialized");
    }
  }

  /**
   * Process an image file and extract structured data
   * Uses FREE Tesseract by default, OpenAI as premium option
   */
  async processImage(
    fileBuffer: Buffer,
    fileName: string,
    fileType: string,
    module: string,
    method: OcrMethod = 'tesseract' // Default to FREE option
  ): Promise<OcrProcessingResult> {
    const startTime = Date.now();

    try {
      // Choose processing method
      if (method === 'tesseract' || (method === 'auto' && !process.env.OPENAI_API_KEY)) {
        return await this.processTesseractOcr(fileBuffer, fileName, fileType, module, startTime);
      } else if (method === 'openai' || method === 'auto') {
        return await this.processOpenAiOcr(fileBuffer, fileName, fileType, module, startTime);
      } else {
        throw new Error(`Unsupported OCR method: ${method}`);
      }
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      console.error(`❌ OCR: Failed to process ${fileName}:`, errorMessage);

      return {
        success: false,
        processingTimeMs,
        errorMessage,
      };
    }
  }

  /**
   * FREE Tesseract OCR processing - No API costs!
   */
  private async processTesseractOcr(
    fileBuffer: Buffer,
    fileName: string,
    fileType: string,
    module: string,
    startTime: number
  ): Promise<OcrProcessingResult> {
    try {
      console.log(`🆓 OCR: Processing ${fileName} with FREE Tesseract for module ${module}`);

      // Initialize Tesseract if needed
      await this.initTesseract();

      // Preprocess image for better OCR results
      const processedBuffer = await this.preprocessImage(fileBuffer, fileType);

      // Run Tesseract OCR
      const { data: { text } } = await this.tesseractScheduler.addJob('recognize', processedBuffer);

      const processingTimeMs = Date.now() - startTime;

      // First classify the document type
      const documentType = this.classifyDocument(text);
      console.log(`📋 Document classified as: ${documentType}`);

      // Extract structured data from raw text with document-specific patterns
      const extractedData = this.extractStructuredDataFromText(text, module, documentType);

      console.log(`✅ FREE OCR: Successfully extracted data from ${fileName}`, extractedData);

      return {
        success: true,
        extractedData,
        processingTimeMs,
        confidence: this.calculateConfidence(extractedData),
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      console.error(`❌ FREE OCR: Failed to process ${fileName}:`, errorMessage);

      return {
        success: false,
        processingTimeMs,
        errorMessage,
      };
    }
  }

  /**
   * OpenAI OCR processing (Premium option with costs)
   */
  private async processOpenAiOcr(
    fileBuffer: Buffer,
    fileName: string,
    fileType: string,
    module: string,
    startTime: number
  ): Promise<OcrProcessingResult> {
    try {
      // Convert buffer to base64
      const base64Image = fileBuffer.toString('base64');
      
      // Get module-specific extraction prompt
      const prompt = this.getExtractionPrompt(module);

      console.log(`💰 OCR: Processing ${fileName} with OpenAI (Premium) for module ${module}`);

      if (!openai) {
        throw new Error('OpenAI client not available');
      }
      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
        messages: [
          {
            role: "system",
            content: `You are an expert OCR assistant that extracts structured data from receipts, bills, and invoices. 
                     Always respond with valid JSON in the exact format specified. If a field cannot be found, use null.
                     Extract amounts as numbers without currency symbols. Extract dates in YYYY-MM-DD format.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${fileType};base64,${base64Image}`
                }
              }
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const processingTimeMs = Date.now() - startTime;
      const rawResponse = response.choices[0].message.content;

      if (!rawResponse) {
        throw new Error("Empty response from OpenAI");
      }

      // Parse the JSON response
      const extractedData: ExtractedData = JSON.parse(rawResponse);

      // Validate and clean the extracted data
      const cleanedData = this.validateAndCleanData(extractedData);

      console.log(`✅ Premium OCR: Successfully extracted data from ${fileName}`, cleanedData);

      return {
        success: true,
        extractedData: cleanedData,
        processingTimeMs,
        tokensUsed: response.usage?.total_tokens,
        rawResponse: response,
      };

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      console.error(`❌ Premium OCR: Failed to process ${fileName}:`, errorMessage);

      return {
        success: false,
        processingTimeMs,
        errorMessage,
      };
    }
  }

  /**
   * Preprocess image for better OCR results
   */
  private async preprocessImage(fileBuffer: Buffer, fileType: string): Promise<Buffer> {
    try {
      let processedBuffer = fileBuffer;

      // If it's an image, enhance it for better OCR
      if (fileType && fileType.startsWith('image/')) {
        processedBuffer = await sharp(fileBuffer)
          .grayscale() // Convert to grayscale
          .normalize() // Normalize contrast
          .sharpen() // Sharpen text
          .png() // Convert to PNG for better OCR
          .toBuffer();
      }

      return processedBuffer;
    } catch (error) {
      console.warn('Image preprocessing failed, using original:', error);
      return fileBuffer;
    }
  }

  /**
   * 🎯 DOCUMENT CLASSIFICATION - Detect document type for better extraction
   */
  private classifyDocument(text: string): DocumentType {
    const cleanText = text.toLowerCase();
    
    // Classification keywords for different document types
    const documentClassifiers = {
      invoice: ['tax invoice', 'invoice', 'bill to', 'ship to', 'gstin', 'invoice number', 'invoice date'],
      receipt: ['receipt', 'thank you', 'customer copy', 'merchant copy', 'card payment', 'cash payment'],
      fuel_slip: ['fuel', 'petrol', 'diesel', 'gas station', 'litre', 'liter', 'pump', 'bharat petroleum', 'indian oil', 'reliance'],
      travel_ticket: ['ticket', 'boarding pass', 'seat', 'flight', 'train', 'bus', 'journey', 'departure', 'arrival', 'pnr'],
      accommodation: ['hotel', 'accommodation', 'check-in', 'check-out', 'room', 'night', 'guest'],
      food_bill: ['restaurant', 'menu', 'food', 'beverage', 'table', 'waiter', 'tip', 'service charge'],
      bill: ['bill', 'billing', 'due date', 'account number', 'previous balance', 'current charges']
    };
    
    let bestMatch: DocumentType = 'unknown';
    let maxScore = 0;
    
    // Score each document type based on keyword matches
    for (const [docType, keywords] of Object.entries(documentClassifiers)) {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (cleanText.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = docType as DocumentType;
      }
    }
    
    return maxScore > 0 ? bestMatch : 'unknown';
  }

  /**
   * 🧠 ENHANCED EXTRACTION - Document-specific patterns with confidence scoring
   */
  private extractStructuredDataFromText(text: string, module: string, documentType: DocumentType = 'unknown'): ExtractedData {
    const extractedData: ExtractedData = {};
    const confidence: ConfidenceScores = {};
    const ambiguousFields: AmbiguousField[] = [];

    // Clean up text
    const cleanText = text.replace(/\s+/g, ' ').trim();

    // Set document type
    extractedData.documentType = documentType;
    console.log(`🧠 Processing ${documentType} with specialized patterns`);

    // 💰 ENHANCED AMOUNT EXTRACTION with document-specific patterns and fallbacks
    const amountResult = this.extractAmountWithFallbacks(cleanText, documentType);
    if (amountResult.amount) {
      extractedData.amount = amountResult.amount;
      confidence.amount = amountResult.confidence;
      if (amountResult.ambiguous) {
        ambiguousFields.push(amountResult.ambiguous);
      }
    }

    // Extract date patterns - Prioritize Invoice Date over Order Date
    const datePatterns = [
      // Specifically look for Invoice Date first
      /invoice\s*date[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
      /bill\s*date[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
      // General date patterns
      /(\d{2}[-\/]\d{2}[-\/]\d{4})/g,
      /(\d{4}[-\/]\d{2}[-\/]\d{2})/g,
      /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4})/gi
    ];

    for (const pattern of datePatterns) {
      if (pattern.global) {
        const matches = Array.from(cleanText.matchAll(pattern));
        if (matches.length > 0) {
          // Prefer the last date found (usually the invoice date)
          const dateStr = this.normalizeDate(matches[matches.length - 1][0]);
          if (dateStr) {
            extractedData.date = dateStr;
            console.log('📅 Found date:', dateStr);
            break;
          }
        }
      } else {
        const match = cleanText.match(pattern);
        if (match) {
          const dateStr = this.normalizeDate(match[1]);
          if (dateStr) {
            extractedData.date = dateStr;
            console.log('📅 Found date:', dateStr);
            break;
          }
        }
      }
    }

    // Extract vendor/merchant name (usually at the top)
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      // Take the first meaningful line as vendor name
      extractedData.vendorName = lines[0].trim().substring(0, 100);
    }

    // Extract invoice/bill number - Enhanced for Indian formats
    const invoicePatterns = [
      // Look for Invoice Number specifically
      /invoice\s*number\s*#?\s*([a-z0-9\-\/]+)/i,
      /invoice\s*no\.?\s*#?\s*([a-z0-9\-\/]+)/i,
      // Look for specific patterns in the text
      /([a-z]{2,}[0-9]{8,})/i, // Pattern like FAAXXV1800205159
      /(?:invoice|bill|receipt)\s*(?:#|no\.?|number)?\s*:?\s*([a-z0-9\-\/]+)/i,
      /#([a-z0-9\-\/]{5,})/i, // At least 5 characters for invoice numbers
    ];

    for (const pattern of invoicePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const invoiceNum = match[1];
        if (invoiceNum.length >= 3) { // Avoid very short matches like "JE"
          extractedData.invoiceNumber = invoiceNum;
          console.log('📄 Found invoice number:', invoiceNum);
          break;
        }
      }
    }

    // 📅 ENHANCED DATE EXTRACTION
    const dateResult = this.extractDateWithFallbacks(cleanText, documentType);
    if (dateResult.date) {
      extractedData.date = dateResult.date;
      confidence.date = dateResult.confidence;
      if (dateResult.ambiguous) {
        ambiguousFields.push(dateResult.ambiguous);
      }
    }

    // 🏪 ENHANCED VENDOR EXTRACTION
    const vendorResult = this.extractVendorWithFallbacks(cleanText, documentType);
    if (vendorResult.vendor) {
      extractedData.vendorName = vendorResult.vendor;
      confidence.vendor = vendorResult.confidence;
      if (vendorResult.ambiguous) {
        ambiguousFields.push(vendorResult.ambiguous);
      }
    }

    // 📄 ENHANCED INVOICE NUMBER EXTRACTION  
    const invoiceResult = this.extractInvoiceWithFallbacks(cleanText, documentType);
    if (invoiceResult.invoiceNumber) {
      extractedData.invoiceNumber = invoiceResult.invoiceNumber;
      confidence.invoiceNumber = invoiceResult.confidence;
      if (invoiceResult.ambiguous) {
        ambiguousFields.push(invoiceResult.ambiguous);
      }
    }

    // 🧾 ENHANCED GST EXTRACTION for Indian invoices
    const gstResult = this.extractGstDetails(cleanText);
    if (gstResult.cgst !== undefined) extractedData.cgst = gstResult.cgst;
    if (gstResult.sgst !== undefined) extractedData.sgst = gstResult.sgst;
    if (gstResult.igst !== undefined) extractedData.igst = gstResult.igst;
    if (gstResult.gstin) extractedData.gstin = gstResult.gstin;

    // Set description based on available text
    extractedData.description = cleanText.substring(0, 200);

    // 📊 FINALIZE CONFIDENCE AND AMBIGUOUS FIELDS
    confidence.overall = this.calculateOverallConfidence(confidence);
    extractedData.confidence = confidence;
    extractedData.ambiguousFields = ambiguousFields.length > 0 ? ambiguousFields : undefined;

    console.log(`🎯 Extraction complete - Overall confidence: ${Math.round((confidence.overall || 0) * 100)}%`);
    if (ambiguousFields.length > 0) {
      console.log(`⚠️ Ambiguous fields detected:`, ambiguousFields.map(f => f.field));
    }

    return extractedData;
  }

  /**
   * 🧾 GST DETAILS EXTRACTION for Indian invoices
   * Extracts CGST, SGST, IGST amounts and GSTIN from bill text
   */
  private extractGstDetails(text: string): {
    cgst?: number;
    sgst?: number;
    igst?: number;
    gstin?: string;
  } {
    console.log(`🧾 Extracting GST details from invoice text`);
    const result: any = {};
    const cleanText = text.toLowerCase();

    // Extract GSTIN (15-character alphanumeric pattern)
    const gstinPatterns = [
      /gstin[:\s]*([0-9]{2}[a-z]{5}[0-9]{4}[a-z]{1}[1-9a-z]{1}z[0-9a-z]{1})/i,
      /gst\s*no[:\s]*([0-9]{2}[a-z]{5}[0-9]{4}[a-z]{1}[1-9a-z]{1}z[0-9a-z]{1})/i,
      /([0-9]{2}[a-z]{5}[0-9]{4}[a-z]{1}[1-9a-z]{1}z[0-9a-z]{1})/i
    ];

    for (const pattern of gstinPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length === 15) {
        result.gstin = match[1].toUpperCase();
        console.log(`🧾 Found GSTIN: ${result.gstin}`);
        break;
      }
    }

    // Extract GST amounts - Look for CGST, SGST, IGST with amounts
    const gstAmountPatterns = [
      // CGST patterns
      { type: 'cgst', patterns: [
        /cgst[:\s@]*(?:(\d+(?:\.\d+)?)%)?[:\s]*(?:₹|rs\.?|\$)?\s*([\d,]+\.?\d*)/i,
        /central\s*gst[:\s@]*(?:(\d+(?:\.\d+)?)%)?[:\s]*(?:₹|rs\.?|\$)?\s*([\d,]+\.?\d*)/i
      ]},
      // SGST patterns  
      { type: 'sgst', patterns: [
        /sgst[:\s@]*(?:(\d+(?:\.\d+)?)%)?[:\s]*(?:₹|rs\.?|\$)?\s*([\d,]+\.?\d*)/i,
        /state\s*gst[:\s@]*(?:(\d+(?:\.\d+)?)%)?[:\s]*(?:₹|rs\.?|\$)?\s*([\d,]+\.?\d*)/i
      ]},
      // IGST patterns
      { type: 'igst', patterns: [
        /igst[:\s@]*(?:(\d+(?:\.\d+)?)%)?[:\s]*(?:₹|rs\.?|\$)?\s*([\d,]+\.?\d*)/i,
        /integrated\s*gst[:\s@]*(?:(\d+(?:\.\d+)?)%)?[:\s]*(?:₹|rs\.?|\$)?\s*([\d,]+\.?\d*)/i
      ]}
    ];

    for (const { type, patterns } of gstAmountPatterns) {
      for (const pattern of patterns) {
        const match = cleanText.match(pattern);
        if (match) {
          // Extract amount (last capture group)
          const amountStr = match[match.length - 1];
          const amount = parseFloat(amountStr.replace(/,/g, ''));
          
          if (!isNaN(amount) && amount > 0) {
            result[type] = amount;
            console.log(`🧾 Found ${type.toUpperCase()}: ₹${amount}`);
            break; // Take first valid match for each GST type
          }
        }
      }
    }

    console.log(`🧾 GST extraction result:`, result);
    return result;
  }

  /**
   * 💰 SMART AMOUNT EXTRACTION with totals-first, last-value strategy
   * Strategy: 1) Find any total rows/columns, take last value  2) If no totals, search for amount values
   */
  private extractAmountWithFallbacks(cleanText: string, documentType: DocumentType): {
    amount?: number;
    confidence: number;
    ambiguous?: AmbiguousField;
  } {
    console.log(`💰 Starting SMART amount extraction for ${documentType} document`);
    console.log(`💰 Text to analyze: ${cleanText.substring(0, 300)}...`);

    // STEP 1: Parse text into structured lines for table-aware processing
    const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log(`💰 Found ${lines.length} text lines to analyze`);

    // STEP 2: Priority 1 - Look for any total contained rows/columns (take LAST value)
    const totalResult = this.findTotalAmounts(lines);
    if (totalResult.amount) {
      console.log(`💰 ✅ TOTAL found: ₹${totalResult.amount} (${totalResult.source}) - Confidence: ${Math.round(totalResult.confidence * 100)}%`);
      return totalResult;
    }

    // STEP 3: Priority 2 - If no totals, search for amount values  
    const amountResult = this.findAmountValues(lines);
    if (amountResult.amount) {
      console.log(`💰 ✅ AMOUNT found: ₹${amountResult.amount} (${amountResult.source}) - Confidence: ${Math.round(amountResult.confidence * 100)}%`);
      return amountResult;
    }

    // STEP 4: Priority 3 - Fallback to generic number detection
    const fallbackResult = this.findGenericAmounts(cleanText);
    if (fallbackResult.amount) {
      console.log(`💰 ⚠️ FALLBACK found: ₹${fallbackResult.amount} (${fallbackResult.source}) - Confidence: ${Math.round(fallbackResult.confidence * 100)}%`);
      return fallbackResult;
    }

    console.log(`💰 ❌ No amounts found at all`);
    return { confidence: 0 };
  }

  /**
   * 🎯 STEP 1: Find amounts in any row/column containing "total" - take LAST value
   */
  private findTotalAmounts(lines: string[]): {
    amount?: number;
    confidence: number;
    source?: string;
    ambiguous?: AmbiguousField;
  } {
    const totalCandidates: { amount: number; source: string; confidence: number; lineIndex: number }[] = [];

    console.log(`💰 🔍 Searching for TOTAL rows/columns...`);

    // STEP 1: Look for specific TOTAL keyword patterns first (highest priority)
    const allText = lines.join(' ');
    const totalPatterns = [
      { pattern: /\btotal\s*\$?([\d,]+\.?\d*)/i, confidence: 0.98, name: 'Total Keyword' },
      { pattern: /grand\s*total[:\s]*(?:₹|rs\.?|\$)?\s*([\d,]+\.?\d*)/i, confidence: 0.95, name: 'Grand Total' },
      { pattern: /net\s*total[:\s]*(?:₹|rs\.?|\$)?\s*([\d,]+\.?\d*)/i, confidence: 0.92, name: 'Net Total' },
    ];

    for (const { pattern, confidence, name } of totalPatterns) {
      const match = allText.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(/[,\s]/g, ''));
        if (!isNaN(amount) && amount > 0) {
          // Exclude small amounts that might be taxes
          if (amount >= 50) { // Reasonable minimum for total amounts
            console.log(`💰 ✅ Found TOTAL with keyword: ₹${amount} (${name})`);
            return { amount, confidence, source: name };
          }
        }
      }
    }

    // STEP 2: Look for lines containing "total" but EXCLUDE sales tax lines
    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      
      // EXCLUDE sales tax lines completely
      if (lowerLine.includes('sales tax') || lowerLine.includes('tax ') || 
          lowerLine.includes('gst') || lowerLine.includes('vat')) {
        console.log(`💰 ⛔ SKIPPING tax line: "${line}"`);
        return; // Skip this line entirely
      }
      
      // Check if line contains "total" variations (but not tax)
      if (lowerLine.includes('total') || lowerLine.includes('grand total') || 
          lowerLine.includes('net total') || lowerLine.includes('final total')) {
        
        console.log(`💰 📋 Total line ${index}: "${line}"`);
        
        // Extract ALL numbers from this total line
        const numberMatches = line.match(/(?:\$|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g) || [];
        console.log(`💰 📊 Found ${numberMatches.length} numbers in total line:`, numberMatches);
        
        if (numberMatches.length > 0) {
          // Take the LARGEST number (most likely to be the total) 
          const amounts = numberMatches.map(match => parseFloat(match.replace(/[₹,$,\s]/g, '')));
          const maxAmount = Math.max(...amounts);
          
          if (!isNaN(maxAmount) && maxAmount >= 50) { // Reasonable minimum
            const confidence = lowerLine.includes('grand total') ? 0.95 : 
                            lowerLine.includes('net total') ? 0.9 : 0.85;
            
            totalCandidates.push({
              amount: maxAmount,
              source: `Total line (${lowerLine.includes('grand') ? 'Grand Total' : 'Total'})`,
              confidence,
              lineIndex: index
            });
            
            console.log(`💰 ✅ Added total candidate: ₹${maxAmount} from line ${index}`);
          }
        }
      }
    });

    if (totalCandidates.length === 0) {
      console.log(`💰 ❌ No total rows found`);
      return { confidence: 0 };
    }

    // Sort by confidence first, then by line position (later lines preferred)
    totalCandidates.sort((a, b) => b.confidence - a.confidence || b.lineIndex - a.lineIndex);
    
    const bestTotal = totalCandidates[0];
    console.log(`💰 🎯 Selected best total: ₹${bestTotal.amount} from ${bestTotal.source}`);

    return {
      amount: bestTotal.amount,
      confidence: bestTotal.confidence,
      source: bestTotal.source
    };
  }

  /**
   * 🔍 STEP 2: Search for labeled "amount" values (fallback when no totals)
   */
  private findAmountValues(lines: string[]): {
    amount?: number;
    confidence: number;
    source?: string;
  } {
    console.log(`💰 🔍 Searching for AMOUNT labels...`);

    const amountCandidates: { amount: number; source: string; confidence: number }[] = [];

    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      
      // Look for "amount" labels
      if (lowerLine.includes('amount') || lowerLine.includes('amt') || 
          lowerLine.includes('price') || lowerLine.includes('cost')) {
        
        console.log(`💰 💵 Amount line ${index}: "${line}"`);
        
        // Extract numbers from this amount line
        const numberMatches = line.match(/₹?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g) || [];
        
        if (numberMatches.length > 0) {
          // Take the last number in the amount line
          const lastNumber = numberMatches[numberMatches.length - 1];
          const amount = parseFloat(lastNumber.replace(/[₹,\s]/g, ''));
          
          if (!isNaN(amount) && amount > 0) {
            amountCandidates.push({
              amount,
              source: 'Amount label',
              confidence: 0.75
            });
          }
        }
      }
    });

    if (amountCandidates.length === 0) {
      console.log(`💰 ❌ No amount labels found`);
      return { confidence: 0 };
    }

    // Take the largest amount (usually the final amount)
    amountCandidates.sort((a, b) => b.amount - a.amount);
    const bestAmount = amountCandidates[0];

    return {
      amount: bestAmount.amount,
      confidence: bestAmount.confidence,
      source: bestAmount.source
    };
  }

  /**
   * 🔄 STEP 3: Fallback to generic number patterns (last resort)
   */
  private findGenericAmounts(cleanText: string): {
    amount?: number;
    confidence: number;
    source?: string;
  } {
    console.log(`💰 🔍 Fallback: searching for generic amounts...`);

    // Look for currency symbols followed by numbers
    const currencyMatches = cleanText.match(/₹\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g) || [];
    
    if (currencyMatches.length > 0) {
      // Take the largest amount
      const amounts = currencyMatches.map(match => {
        const cleanAmount = match.replace(/[₹,\s]/g, '');
        return parseFloat(cleanAmount);
      }).filter(amount => !isNaN(amount) && amount > 10);

      if (amounts.length > 0) {
        const maxAmount = Math.max(...amounts);
        return {
          amount: maxAmount,
          confidence: 0.6,
          source: 'Generic currency pattern'
        };
      }
    }

    console.log(`💰 ❌ No generic amounts found`);
    return { confidence: 0 };
  }

  /**
   * 📅 DATE EXTRACTION with document-specific patterns and fallbacks
   */
  private extractDateWithFallbacks(cleanText: string, documentType: DocumentType): {
    date?: string;
    confidence: number;
    ambiguous?: AmbiguousField;
  } {
    const candidates: { date: string; pattern: string; confidence: number }[] = [];

    const datePatterns = this.getDatePatterns(documentType);
    
    for (const { pattern, confidence: patternConfidence, name } of datePatterns) {
      if (pattern.global) {
        const matches = Array.from(cleanText.matchAll(pattern));
        matches.forEach(match => {
          const dateStr = this.normalizeDate(match[1] || match[0]);
          if (dateStr) {
            candidates.push({ date: dateStr, pattern: name, confidence: patternConfidence });
          }
        });
      } else {
        const match = cleanText.match(pattern);
        if (match) {
          const dateStr = this.normalizeDate(match[1] || match[0]);
          if (dateStr) {
            candidates.push({ date: dateStr, pattern: name, confidence: patternConfidence });
          }
        }
      }
    }

    if (candidates.length === 0) {
      return { confidence: 0 };
    }

    candidates.sort((a, b) => b.confidence - a.confidence);
    const bestCandidate = candidates[0];

    console.log(`📅 Date extraction - Found: ${bestCandidate.date} (${bestCandidate.pattern}) - Confidence: ${Math.round(bestCandidate.confidence * 100)}%`);
    
    return {
      date: bestCandidate.date,
      confidence: bestCandidate.confidence
    };
  }

  /**
   * 📄 INVOICE NUMBER EXTRACTION with document-specific patterns and fallbacks
   */
  private extractInvoiceWithFallbacks(cleanText: string, documentType: DocumentType): {
    invoiceNumber?: string;
    confidence: number;
    ambiguous?: AmbiguousField;
  } {
    const candidates: { invoiceNumber: string; pattern: string; confidence: number }[] = [];

    const invoicePatterns = this.getInvoicePatterns(documentType);
    
    for (const { pattern, confidence: patternConfidence, name } of invoicePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const invoiceNum = match[1];
        if (invoiceNum && invoiceNum.length >= 3) {
          candidates.push({ invoiceNumber: invoiceNum, pattern: name, confidence: patternConfidence });
        }
      }
    }

    if (candidates.length === 0) {
      return { confidence: 0 };
    }

    candidates.sort((a, b) => b.confidence - a.confidence);
    const bestCandidate = candidates[0];

    console.log(`📄 Invoice number extraction - Found: ${bestCandidate.invoiceNumber} (${bestCandidate.pattern}) - Confidence: ${Math.round(bestCandidate.confidence * 100)}%`);
    
    return {
      invoiceNumber: bestCandidate.invoiceNumber,
      confidence: bestCandidate.confidence
    };
  }

  /**
   * 🏪 VENDOR EXTRACTION with document-specific patterns and fallbacks
   */
  private extractVendorWithFallbacks(cleanText: string, documentType: DocumentType): {
    vendor?: string;
    confidence: number;
    ambiguous?: AmbiguousField;
  } {
    const lines = cleanText.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      return { confidence: 0 };
    }

    let vendor = '';
    let confidence = 0;

    // Try specific vendor patterns first
    const vendorPatterns = [
      // Look for "FROM" section in invoices
      /from\s+([^INVOICE\n]+?)(?:INVOICE|$)/i,
      // Look for company names with Inc., Ltd., Corp., etc.
      /([A-Z][A-Za-z\s]+(?:Inc\.?|Ltd\.?|Corp\.?|LLC|Pvt\.?|Private Limited))/i,
      // Look for capitalized company names
      /([A-Z][A-Za-z]+\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)/,
    ];

    for (const pattern of vendorPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const extracted = match[1].trim();
        if (extracted.length > 3 && extracted.length < 60) {
          vendor = this.cleanVendorName(extracted);
          confidence = 0.85;
          break;
        }
      }
    }

    // Fallback: clean up the first few lines
    if (!vendor) {
      const firstLine = lines[0].trim();
      vendor = this.cleanVendorName(firstLine);
      confidence = vendor.length > 5 ? 0.6 : 0.3;
    }

    console.log(`🏪 Vendor extraction - Found: ${vendor} - Confidence: ${Math.round(confidence * 100)}%`);
    
    return { vendor, confidence };
  }

  /**
   * 🧹 Clean vendor name from OCR noise
   */
  private cleanVendorName(rawVendor: string): string {
    // Remove common OCR artifacts and invoice metadata
    let cleaned = rawVendor
      .replace(/INVOICE\s*(DATE|NUMBER|#).*$/i, '') // Remove invoice metadata
      .replace(/\d{8,}/g, '') // Remove long number sequences
      .replace(/P\.O\.?\s*#.*$/i, '') // Remove P.O. numbers
      .replace(/DUE\s*DATE.*$/i, '') // Remove due dates
      .replace(/[^\w\s\.\-&]/g, ' ') // Keep only letters, numbers, spaces, dots, dashes, ampersands
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    // Extract the first meaningful part (usually company name)
    const words = cleaned.split(' ').filter(word => word.length > 1);
    if (words.length >= 2) {
      // Take first 2-4 words for company name
      return words.slice(0, Math.min(4, words.length)).join(' ');
    }

    return cleaned.substring(0, 50); // Fallback to first 50 chars
  }

  /**
   * 📋 GET DOCUMENT-SPECIFIC AMOUNT PATTERNS
   */
  private getAmountPatterns(documentType: DocumentType): Array<{pattern: RegExp; confidence: number; name: string}> {
    const basePatterns = [
      // HIGHEST PRIORITY: Look for TOTAL keyword first (user requirement)
      { pattern: /\btotal\s*\$?([\d,]+\.?\d*)/i, confidence: 0.98, name: 'Total' },
      { pattern: /grand\s*total[:\s]*(?:₹|rs\.?|\$)?\s*([\d,]+\.?\d*)/i, confidence: 0.95, name: 'Grand Total' },
      { pattern: /net\s*total[:\s]*(?:₹|rs\.?|\$)?\s*([\d,]+\.?\d*)/i, confidence: 0.92, name: 'Net Total' },
      
      // EXCLUDE SALES TAX patterns explicitly (user requirement)
      // NO SALES TAX patterns here - they should never be selected
      
      // Second priority: AMOUNT keyword (user requirement)  
      { pattern: /\bamount[:\s]*(?:₹|rs\.?|\$)?\s*([\d,]+\.?\d*)/i, confidence: 0.85, name: 'Amount' },
      { pattern: /total\s*amount[:\s]*(?:₹|rs\.?|\$)?\s*([\d,]+\.?\d*)/i, confidence: 0.88, name: 'Total Amount' },
      
      // Lower priority fallbacks
      { pattern: /₹\s*([1-9]\d{2,}(?:\.\d{2})?)/g, confidence: 0.7, name: 'Currency Amount' },
      { pattern: /\$\s*([1-9]\d{2,}(?:\.\d{2})?)/g, confidence: 0.7, name: 'Dollar Amount' },
    ];

    // Add document-specific patterns
    switch (documentType) {
      case 'fuel_slip':
        return [
          { pattern: /total\s*amount[:\s]*(?:₹|rs\.?)?\s*([\d,]+\.?\d*)/i, confidence: 0.95, name: 'Fuel Total' },
          { pattern: /amount[:\s]*(?:₹|rs\.?)?\s*([\d,]+\.?\d*)/i, confidence: 0.9, name: 'Fuel Amount' },
          ...basePatterns
        ];
      case 'travel_ticket':
        return [
          { pattern: /fare[:\s]*(?:₹|rs\.?)?\s*([\d,]+\.?\d*)/i, confidence: 0.95, name: 'Ticket Fare' },
          { pattern: /price[:\s]*(?:₹|rs\.?)?\s*([\d,]+\.?\d*)/i, confidence: 0.9, name: 'Ticket Price' },
          ...basePatterns
        ];
      case 'food_bill':
        return [
          { pattern: /bill\s*total[:\s]*(?:₹|rs\.?)?\s*([\d,]+\.?\d*)/i, confidence: 0.95, name: 'Bill Total' },
          { pattern: /net\s*amount[:\s]*(?:₹|rs\.?)?\s*([\d,]+\.?\d*)/i, confidence: 0.9, name: 'Net Amount' },
          ...basePatterns
        ];
      default:
        return basePatterns;
    }
  }

  /**
   * 📅 GET DOCUMENT-SPECIFIC DATE PATTERNS
   */
  private getDatePatterns(documentType: DocumentType): Array<{pattern: RegExp; confidence: number; name: string}> {
    const basePatterns = [
      { pattern: /invoice\s*date[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i, confidence: 0.95, name: 'Invoice Date' },
      { pattern: /bill\s*date[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i, confidence: 0.9, name: 'Bill Date' },
      // Handle concatenated dates like "1110222019"
      { pattern: /invoice\s*date[:\s]*(\d{8,10})/i, confidence: 0.9, name: 'Concatenated Invoice Date' },
      { pattern: /(\d{10})/g, confidence: 0.8, name: 'Concatenated Date' },
      { pattern: /(\d{2}[-\/]\d{2}[-\/]\d{4})/g, confidence: 0.7, name: 'General Date' },
      { pattern: /(\d{4}[-\/]\d{2}[-\/]\d{2})/g, confidence: 0.7, name: 'ISO Date' },
    ];

    switch (documentType) {
      case 'travel_ticket':
        return [
          { pattern: /journey\s*date[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i, confidence: 0.95, name: 'Journey Date' },
          { pattern: /departure[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i, confidence: 0.9, name: 'Departure Date' },
          ...basePatterns
        ];
      case 'accommodation':
        return [
          { pattern: /check[\-\s]*in[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i, confidence: 0.95, name: 'Check-in Date' },
          { pattern: /check[\-\s]*out[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i, confidence: 0.9, name: 'Check-out Date' },
          ...basePatterns
        ];
      default:
        return basePatterns;
    }
  }

  /**
   * 📄 GET DOCUMENT-SPECIFIC INVOICE PATTERNS
   */
  private getInvoicePatterns(documentType: DocumentType): Array<{pattern: RegExp; confidence: number; name: string}> {
    const basePatterns = [
      // Specific patterns for common formats
      { pattern: /invoice\s*#\s*([a-z]{2,}-\d{3,})/i, confidence: 0.98, name: 'Invoice # Format' },
      { pattern: /invoice\s*number\s*#?\s*([a-z0-9\-\/]+)/i, confidence: 0.95, name: 'Invoice Number' },
      { pattern: /invoice\s*no\.?\s*#?\s*([a-z0-9\-\/]+)/i, confidence: 0.9, name: 'Invoice No' },
      // Look for US-001, IN-123 patterns
      { pattern: /([a-z]{2,}-\d{3,})/i, confidence: 0.88, name: 'Letter-Number Format' },
      { pattern: /([a-z]{2,}[0-9]{8,})/i, confidence: 0.85, name: 'Alphanumeric ID' },
      { pattern: /bill\s*no\.?\s*#?\s*([a-z0-9\-\/]+)/i, confidence: 0.8, name: 'Bill Number' },
      { pattern: /#([a-z0-9\-\/]{3,})/i, confidence: 0.7, name: 'Hash Number' },
    ];

    switch (documentType) {
      case 'travel_ticket':
        return [
          { pattern: /pnr[:\s]*([a-z0-9]{6,})/i, confidence: 0.95, name: 'PNR Number' },
          { pattern: /ticket\s*number[:\s]*([a-z0-9\-\/]+)/i, confidence: 0.9, name: 'Ticket Number' },
          ...basePatterns
        ];
      case 'fuel_slip':
        return [
          { pattern: /receipt\s*no\.?[:\s]*([a-z0-9\-\/]+)/i, confidence: 0.9, name: 'Receipt Number' },
          { pattern: /slip\s*no\.?[:\s]*([a-z0-9\-\/]+)/i, confidence: 0.85, name: 'Slip Number' },
          ...basePatterns
        ];
      default:
        return basePatterns;
    }
  }

  /**
   * 📊 CALCULATE OVERALL CONFIDENCE SCORE
   */
  private calculateOverallConfidence(confidence: ConfidenceScores): number {
    const scores = [confidence.amount, confidence.date, confidence.vendor, confidence.invoiceNumber]
      .filter(score => score !== undefined) as number[];
    
    if (scores.length === 0) return 0;
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * 📅 Normalize date to YYYY-MM-DD format
   */
  private normalizeDate(dateStr: string): string | null {
    try {
      // Clean the input
      let cleaned = dateStr.trim();
      
      // Handle concatenated dates like "1110222019" → "11/02/2019"
      if (/^\d{8,10}$/.test(cleaned)) {
        if (cleaned.length === 8) {
          // DDMMYYYY format
          cleaned = `${cleaned.slice(0,2)}/${cleaned.slice(2,4)}/${cleaned.slice(4,8)}`;
        } else if (cleaned.length === 10) {
          // DDMMYYYY or similar - try to parse intelligently
          // Look for patterns like 1110222019 → 11/02/2019
          if (cleaned.slice(2,4) === '02' || cleaned.slice(2,4) === '01' || cleaned.slice(2,4) <= '12') {
            cleaned = `${cleaned.slice(0,2)}/${cleaned.slice(2,4)}/${cleaned.slice(4,8)}`;
          } else {
            // Try YYYYMMDD format
            cleaned = `${cleaned.slice(6,8)}/${cleaned.slice(4,6)}/${cleaned.slice(0,4)}`;
          }
        }
      }
      
      // Handle different date formats
      let normalized = cleaned.replace(/[-\/]/g, '-');
      
      // Parse and validate the date
      const dateParts = normalized.split('-');
      if (dateParts.length !== 3) return null;
      
      let day, month, year;
      
      // Determine format: DD-MM-YYYY or YYYY-MM-DD
      if (dateParts[0].length === 4) {
        // YYYY-MM-DD format
        [year, month, day] = dateParts;
      } else {
        // DD-MM-YYYY format (common in India)
        [day, month, year] = dateParts;
      }
      
      // Validate values
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
        return null;
      }
      
      // Return in YYYY-MM-DD format
      return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get module-specific extraction prompt
   */
  private getExtractionPrompt(module: string): string {
    const baseFields = `
    {
      "amount": number | null,
      "date": "YYYY-MM-DD" | null,
      "vendorName": "string" | null,
      "invoiceNumber": "string" | null,
      "description": "string" | null,
      "items": [
        {
          "description": "string",
          "amount": number,
          "quantity": number | null
        }
      ] | null,
      "taxAmount": number | null,
      "totalAmount": number | null,
      "paymentMethod": "string" | null,
      "merchantAddress": "string" | null,
      "phoneNumber": "string" | null,
      "email": "string" | null,
      "gstin": "string" | null,
      "pan": "string" | null,
      "cgst": number | null,
      "sgst": number | null, 
      "igst": number | null,
      "gstTotal": number | null
    }`;

    switch (module) {
      case 'employee_claim':
        return `Extract data from this expense receipt/bill for an employee expense claim. 
                Focus on: total amount, date, vendor/merchant name, description of expense, and any line items.
                Return JSON in this format: ${baseFields}`;

      case 'vendor_claim':
        return `Extract data from this vendor invoice/bill for payment processing. 
                Focus on: vendor details, invoice number, total amount, due date, tax information (GSTIN, PAN), and line items.
                Return JSON in this format: ${baseFields}`;

      case 'direct_expense':
        return `Extract data from this direct company expense receipt/bill. 
                Focus on: vendor name, amount, date, expense description, and payment details.
                Return JSON in this format: ${baseFields}`;

      case 'bills':
        return `Extract data from this bill/invoice for bill master configuration. 
                Focus on: all available fields including vendor details, amounts, dates, tax info, and itemized details.
                Return JSON in this format: ${baseFields}`;

      default:
        return `Extract all available data from this receipt/bill/invoice. 
                Return JSON in this format: ${baseFields}`;
    }
  }

  /**
   * Validate and clean extracted data
   */
  private validateAndCleanData(data: any): ExtractedData {
    const cleaned: ExtractedData = {};

    // Clean numeric fields
    if (data.amount !== null && !isNaN(parseFloat(data.amount))) {
      cleaned.amount = parseFloat(data.amount);
    }
    if (data.taxAmount !== null && !isNaN(parseFloat(data.taxAmount))) {
      cleaned.taxAmount = parseFloat(data.taxAmount);
    }
    if (data.totalAmount !== null && !isNaN(parseFloat(data.totalAmount))) {
      cleaned.totalAmount = parseFloat(data.totalAmount);
    }

    // Clean GST fields
    if (data.cgst !== null && !isNaN(parseFloat(data.cgst))) {
      cleaned.cgst = parseFloat(data.cgst);
    }
    if (data.sgst !== null && !isNaN(parseFloat(data.sgst))) {
      cleaned.sgst = parseFloat(data.sgst);
    }
    if (data.igst !== null && !isNaN(parseFloat(data.igst))) {
      cleaned.igst = parseFloat(data.igst);
    }
    if (data.gstTotal !== null && !isNaN(parseFloat(data.gstTotal))) {
      cleaned.gstTotal = parseFloat(data.gstTotal);
    }

    // Clean date field
    if (data.date && this.isValidDate(data.date)) {
      cleaned.date = data.date;
    }

    // Clean string fields
    const stringFields = ['vendorName', 'invoiceNumber', 'description', 'paymentMethod', 
                         'merchantAddress', 'phoneNumber', 'email', 'gstin', 'pan'];
    
    stringFields.forEach(field => {
      if (data[field] && typeof data[field] === 'string' && data[field].trim()) {
        cleaned[field] = data[field].trim();
      }
    });

    // Clean items array
    if (Array.isArray(data.items)) {
      cleaned.items = data.items
        .filter((item: any) => item && item.description && !isNaN(parseFloat(item.amount)))
        .map((item: any) => ({
          description: item.description.trim(),
          amount: parseFloat(item.amount),
          quantity: item.quantity && !isNaN(parseFloat(item.quantity)) ? parseFloat(item.quantity) : undefined
        }));
    }

    return cleaned;
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Generate confidence score based on extracted data completeness
   */
  calculateConfidence(data: ExtractedData): number {
    let score = 0;
    const weights = {
      amount: 25,
      date: 20,
      vendorName: 20,
      description: 15,
      invoiceNumber: 10,
      items: 10
    };

    Object.entries(weights).forEach(([field, weight]) => {
      if (data[field] !== undefined && data[field] !== null) {
        if (field === 'items' && Array.isArray(data[field]) && data[field].length > 0) {
          score += weight;
        } else if (field !== 'items') {
          score += weight;
        }
      }
    });

    return Math.min(score / 100, 1); // Normalize to 0-1
  }

  /**
   * Check if file type is supported for OCR
   */
  isSupportedFileType(fileType: string): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'application/pdf'
    ];
    return supportedTypes.includes(fileType.toLowerCase());
  }

  /**
   * Get maximum file size for OCR processing (5MB)
   */
  getMaxFileSize(): number {
    return 5 * 1024 * 1024; // 5MB
  }
}

// Export singleton instance
export const ocrService = new OcrService();