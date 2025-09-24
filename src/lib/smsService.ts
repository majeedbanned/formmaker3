import { DOMParser } from 'xmldom';
import axios from 'axios';

const SMS_API_URL = 'http://185.112.33.61/webservice/send.php';
const SMS_USERNAME ="majeedbanned"; process.env.SMS_USERNAME || '';
const SMS_PASSWORD ="6323905";// process.env.SMS_PASSWORD || '';

// Helper to create SOAP envelope
const createSoapEnvelope = (method: string, params: Record<string, string | string[]>): string => {
  let paramsXml = '';
  
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      paramsXml += `<${key} xsi:type="SOAP-ENC:Array" SOAP-ENC:arrayType="xsd:string[${value.length}]">`;
      value.forEach(item => {
        paramsXml += `<item xsi:type="xsd:string">${item}</item>`;
      });
      paramsXml += `</${key}>`;
    } else {
      paramsXml += `<${key} xsi:type="xsd:string">${value}</${key}>`;
    }
  }

  return `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope 
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
      xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
      xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
      xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/">
      <soap:Body>
        <${method} xmlns="urn:Send">
          ${paramsXml}
        </${method}>
      </soap:Body>
    </soap:Envelope>`;
};

// Parse SOAP response
const parseSoapResponse = (xml: string): string | string[] | null => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  
  // Extract the return value from SOAP response
  const returnElements = doc.getElementsByTagName('return');
  
  if (returnElements.length > 0) {
    const returnElement = returnElements[0];
    
    // Check if return contains array items
    const items = returnElement.getElementsByTagName('item');
    
    if (items.length > 0) {
      const result: string[] = [];
      for (let i = 0; i < items.length; i++) {
        result.push(items[i].textContent || '');
      }
      return result;
    }
    
    // Single return value
    return returnElement.textContent;
  }
  
  return null;
};

// Generic SOAP request
const makeSoapRequest = async (method: string, params: Record<string, string | string[]>): Promise<string | string[] | null> => {
  try {
    const soapEnvelope = createSoapEnvelope(method, params);
    
    const response = await axios.post(SMS_API_URL, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `urn:Send#${method}`
      }
    });
    
    return parseSoapResponse(response.data);
  } catch (error) {
    console.error(`Error in SOAP request for ${method}:`, error);
    throw error;
  }
};

// SMS API Methods
export const smsApi = {
  // Get account credit
  getCredit: async (): Promise<string | null> => {
    return makeSoapRequest('GetCredit', {
      Username: SMS_USERNAME,
      Password: SMS_PASSWORD
    }) as Promise<string | null>;
  },
  
  // Send SMS to multiple numbers
  sendSMS: async (fromNumber: string, toNumbers: string[], content: string): Promise<string[] | null> => {
    return makeSoapRequest('SendSMS', {
      fromNum: fromNumber,
      toNum: toNumbers,
      Content: content,
      Type: '1', // 1 for normal SMS
      Username: SMS_USERNAME,
      Password: SMS_PASSWORD
    }) as Promise<string[] | null>;
  },
  
  // Send multiple contents to multiple numbers
  sendMultiSMS: async (fromNumbers: string[], toNumbers: string[], contents: string[]): Promise<string[] | null> => {
    return makeSoapRequest('SendMultiSMS', {
      fromNum: fromNumbers,
      toNum: toNumbers,
      Content: contents,
      Type: ['1'], // 1 for normal SMS
      Username: SMS_USERNAME,
      Password: SMS_PASSWORD
    }) as Promise<string[] | null>;
  },
  
  // Send SMS to a phonebook
  sendToPhonebook: async (fromNumber: string, phonebookId: string, content: string): Promise<string[] | null> => {
    return makeSoapRequest('SendOfPhoneBook', {
      fromNum: fromNumber,
      phonebook: phonebookId,
      Content: content,
      Type: '1', // 1 for normal SMS
      Username: SMS_USERNAME,
      Password: SMS_PASSWORD
    }) as Promise<string[] | null>;
  },
  
  // List all phonebooks
  listPhonebooks: async (): Promise<string[] | null> => {
    return makeSoapRequest('listPhonebook', {
      Username: SMS_USERNAME,
      Password: SMS_PASSWORD,
      Name: ''
    }) as Promise<string[] | null>;
  },
  
  // Get numbers in a phonebook
  getPhonebookNumbers: async (bookId: string): Promise<string[] | null> => {
    return makeSoapRequest('numbersPhonebook', {
      Username: SMS_USERNAME,
      Password: SMS_PASSWORD,
      BookID: bookId
    }) as Promise<string[] | null>;
  },
  
  // Add a new phonebook
  addPhonebook: async (name: string, numbers: string[]): Promise<string[] | null> => {
    return makeSoapRequest('AddPhonebook', {
      Username: SMS_USERNAME,
      Password: SMS_PASSWORD,
      Name: name,
      Numbers: numbers
    }) as Promise<string[] | null>;
  },
  
  // Add numbers to an existing phonebook
  addToPhonebook: async (phonebookId: string, numbers: string[]): Promise<string[] | null> => {
    return makeSoapRequest('AddToPhonebook', {
      Username: SMS_USERNAME,
      Password: SMS_PASSWORD,
      Phonebook: phonebookId,
      Numbers: numbers
    }) as Promise<string[] | null>;
  },
  
  // Delete numbers from a phonebook
  deleteNumbersFromPhonebook: async (bookId: string, numbers: string[]): Promise<string[] | null> => {
    return makeSoapRequest('deleteNumbersOfPhonebook', {
      Username: SMS_USERNAME,
      Password: SMS_PASSWORD,
      BookID: bookId,
      Numbers: numbers
    }) as Promise<string[] | null>;
  },
  
  // Delete a phonebook
  deletePhonebook: async (bookId: string): Promise<string[] | null> => {
    return makeSoapRequest('deletePhonebook', {
      Username: SMS_USERNAME,
      Password: SMS_PASSWORD,
      BookID: bookId
    }) as Promise<string[] | null>;
  },
  
  // Get account details
  getDetails: async (): Promise<string | null> => {
    return makeSoapRequest('details', {
      Username: SMS_USERNAME,
      Password: SMS_PASSWORD
    }) as Promise<string | null>;
  },
  
  // Get message delivery status
  getStatus: async (messageId: string): Promise<string | null> => {
    return makeSoapRequest('GetStatus', {
      Username: SMS_USERNAME,
      Password: SMS_PASSWORD,
      MessageID: messageId
    }) as Promise<string | null>;
  }
}; 