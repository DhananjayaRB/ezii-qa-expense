// Server-side smart OCR field mapping utility
export interface SmartMappedData {
  billNo?: string;
  billDate?: string;
  billAmount?: string;
  vendorName?: string;
  description?: string;
}

export function smartMapOcrData(ocrData: any): SmartMappedData {
  if (!ocrData || typeof ocrData !== 'object') {
    return {};
  }

  const mapped: SmartMappedData = {};

  // Smart mapping for Bill Number
  const billNumberFields = [
    'billNumber', 'bill_number', 'billNo', 'bill_no', 
    'invoiceNumber', 'invoice_number', 'invoiceNo', 'invoice_no',
    'number', 'referenceNumber', 'ref_number'
  ];
  
  for (const field of billNumberFields) {
    if (ocrData[field] && String(ocrData[field]).trim()) {
      mapped.billNo = String(ocrData[field]).trim();
      break;
    }
  }

  // Smart mapping for Bill Amount
  const amountFields = [
    'billAmount', 'bill_amount', 'totalAmount', 'total_amount', 
    'amount', 'total', 'invoiceAmount', 'invoice_amount',
    'grandTotal', 'grand_total', 'netAmount', 'net_amount'
  ];
  
  for (const field of amountFields) {
    if (ocrData[field] !== undefined && ocrData[field] !== null && String(ocrData[field]).trim()) {
      // Clean the amount - remove currency symbols and non-numeric characters except decimal
      let cleanAmount = String(ocrData[field]).replace(/[^\d.-]/g, '');
      if (cleanAmount && !isNaN(parseFloat(cleanAmount))) {
        mapped.billAmount = cleanAmount;
        break;
      }
    }
  }

  // Smart mapping for Bill Date
  const dateFields = [
    'billDate', 'bill_date', 'invoiceDate', 'invoice_date',
    'date', 'issuedDate', 'issued_date', 'paidDate', 'paid_date',
    'transactionDate', 'transaction_date'
  ];
  
  for (const field of dateFields) {
    if (ocrData[field] && String(ocrData[field]).trim()) {
      let dateValue = String(ocrData[field]).trim();
      
      // Try to parse various date formats
      try {
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          // Convert to YYYY-MM-DD format for form input
          mapped.billDate = parsedDate.toISOString().split('T')[0];
          break;
        }
      } catch (e) {
        // Try common Indian date formats like DD/MM/YYYY or DD-MM-YYYY
        const dateFormats = [
          /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,  // DD/MM/YYYY or DD-MM-YYYY
          /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/   // YYYY/MM/DD or YYYY-MM-DD
        ];
        
        for (const format of dateFormats) {
          const match = dateValue.match(format);
          if (match) {
            try {
              let year, month, day;
              if (format === dateFormats[0]) {
                // DD/MM/YYYY format
                day = parseInt(match[1]);
                month = parseInt(match[2]);
                year = parseInt(match[3]);
              } else {
                // YYYY/MM/DD format
                year = parseInt(match[1]);
                month = parseInt(match[2]);
                day = parseInt(match[3]);
              }
              
              const parsedDate = new Date(year, month - 1, day);
              if (!isNaN(parsedDate.getTime())) {
                mapped.billDate = parsedDate.toISOString().split('T')[0];
                break;
              }
            } catch (e) {
              continue;
            }
          }
        }
        if (mapped.billDate) break;
      }
    }
  }

  // Smart mapping for Vendor Name
  const vendorFields = [
    'vendorName', 'vendor_name', 'merchantName', 'merchant_name',
    'name', 'companyName', 'company_name', 'supplierName', 'supplier_name',
    'from', 'seller', 'store', 'business', 'vendor', 'merchant'
  ];
  
  for (const field of vendorFields) {
    if (ocrData[field] && String(ocrData[field]).trim()) {
      mapped.vendorName = String(ocrData[field]).trim();
      break;
    }
  }

  // Smart mapping for Description
  const descriptionFields = [
    'description', 'notes', 'particulars', 'details', 'purpose',
    'itemDescription', 'item_description', 'remarks', 'comments'
  ];
  
  for (const field of descriptionFields) {
    if (ocrData[field] && String(ocrData[field]).trim()) {
      mapped.description = String(ocrData[field]).trim();
      break;
    }
  }

  console.log('🤖 SMART MAPPING (SERVER):', {
    input: ocrData,
    output: mapped
  });

  return mapped;
}