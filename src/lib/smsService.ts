// @ts-ignore - xmldom types not available
import { DOMParser } from 'xmldom';
import axios from 'axios';
import { connectToDatabase } from './mongodb';
import { logger } from './logger';

const SMS_API_URL = 'http://185.112.33.61/webservice/send.php';

// Interface for SMS credentials
interface SmsCredentials {
  username: string;
  password: string;
}

// Function to get SMS credentials from schools database
async function getSmsCredentials(domain: string, schoolCode?: string): Promise<SmsCredentials> {
  try {
    const connection = await connectToDatabase(domain);
    const schoolsCollection = connection.collection('schools');
    
    let query: Record<string, unknown> = {};
    
    if (schoolCode) {
      // If schoolCode is provided, search by schoolCode
      query = { 'data.schoolCode': schoolCode };
    } else {
      // If no schoolCode, get the first active school with SMS credentials
      query = { 
        'data.isActive': true
      };
      // Add SMS credential filters
      Object.assign(query, {
        'data.SMS_USERNAME': { $exists: true, $ne: null },
        'data.SMS_PASSWORD': { $exists: true, $ne: null }
      });
    }
    
    const school = await schoolsCollection.findOne(query);
    
    if (!school || !school.data) {
      throw new Error(`No school found with SMS credentials for domain: ${domain}${schoolCode ? `, schoolCode: ${schoolCode}` : ''}`);
    }
    
    const smsUsername = school.data.SMS_USERNAME;
    const smsPassword = school.data.SMS_PASSWORD;
    
    if (!smsUsername || !smsPassword) {
      throw new Error(`SMS credentials not configured for school: ${school.data.schoolName || 'Unknown'}`);
    }
    
    logger.info(`Retrieved SMS credentials for school: ${school.data.schoolName}, domain: ${domain}`);
    
    return {
      username: smsUsername,
      password: smsPassword
    };
  } catch (error) {
    logger.error('Error retrieving SMS credentials:', error);
    throw error;
  }
}

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
    logger.error(`Error in SOAP request for ${method}:`, error);
    throw error;
  }
};

// SMS API Methods
export const smsApi = {
  // Get account credit
  getCredit: async (domain: string, schoolCode?: string): Promise<string | null> => {
    const credentials = await getSmsCredentials(domain, schoolCode);
    return makeSoapRequest('GetCredit', {
      Username: credentials.username,
      Password: credentials.password
    }) as Promise<string | null>;
  },
  
  // Send SMS to multiple numbers
  sendSMS: async (domain: string, fromNumber: string, toNumbers: string[], content: string, schoolCode?: string): Promise<string[] | null> => {
    const credentials = await getSmsCredentials(domain, schoolCode);
    return makeSoapRequest('SendSMS', {
      fromNum: fromNumber,
      toNum: toNumbers,
      Content: content,
      Type: '1', // 1 for normal SMS
      Username: credentials.username,
      Password: credentials.password
    }) as Promise<string[] | null>;
  },
  
  // Send multiple contents to multiple numbers
  sendMultiSMS: async (domain: string, fromNumbers: string[], toNumbers: string[], contents: string[], schoolCode?: string): Promise<string[] | null> => {
    const credentials = await getSmsCredentials(domain, schoolCode);
    return makeSoapRequest('SendMultiSMS', {
      fromNum: fromNumbers,
      toNum: toNumbers,
      Content: contents,
      Type: ['1'], // 1 for normal SMS
      Username: credentials.username,
      Password: credentials.password
    }) as Promise<string[] | null>;
  },
  
  // Send SMS to a phonebook
  sendToPhonebook: async (domain: string, fromNumber: string, phonebookId: string, content: string, schoolCode?: string): Promise<string[] | null> => {
    const credentials = await getSmsCredentials(domain, schoolCode);
    return makeSoapRequest('SendOfPhoneBook', {
      fromNum: fromNumber,
      phonebook: phonebookId,
      Content: content,
      Type: '1', // 1 for normal SMS
      Username: credentials.username,
      Password: credentials.password
    }) as Promise<string[] | null>;
  },
  
  // List all phonebooks
  listPhonebooks: async (domain: string, schoolCode?: string): Promise<string[] | null> => {
    const credentials = await getSmsCredentials(domain, schoolCode);
    return makeSoapRequest('listPhonebook', {
      Username: credentials.username,
      Password: credentials.password,
      Name: ''
    }) as Promise<string[] | null>;
  },
  
  // Get numbers in a phonebook
  getPhonebookNumbers: async (domain: string, bookId: string, schoolCode?: string): Promise<string[] | null> => {
    const credentials = await getSmsCredentials(domain, schoolCode);
    return makeSoapRequest('numbersPhonebook', {
      Username: credentials.username,
      Password: credentials.password,
      BookID: bookId
    }) as Promise<string[] | null>;
  },
  
  // Add a new phonebook
  addPhonebook: async (domain: string, name: string, numbers: string[], schoolCode?: string): Promise<string[] | null> => {
    const credentials = await getSmsCredentials(domain, schoolCode);
    return makeSoapRequest('AddPhonebook', {
      Username: credentials.username,
      Password: credentials.password,
      Name: name,
      Numbers: numbers
    }) as Promise<string[] | null>;
  },
  
  // Add numbers to an existing phonebook
  addToPhonebook: async (domain: string, phonebookId: string, numbers: string[], schoolCode?: string): Promise<string[] | null> => {
    const credentials = await getSmsCredentials(domain, schoolCode);
    return makeSoapRequest('AddToPhonebook', {
      Username: credentials.username,
      Password: credentials.password,
      Phonebook: phonebookId,
      Numbers: numbers
    }) as Promise<string[] | null>;
  },
  
  // Delete numbers from a phonebook
  deleteNumbersFromPhonebook: async (domain: string, bookId: string, numbers: string[], schoolCode?: string): Promise<string[] | null> => {
    const credentials = await getSmsCredentials(domain, schoolCode);
    return makeSoapRequest('deleteNumbersOfPhonebook', {
      Username: credentials.username,
      Password: credentials.password,
      BookID: bookId,
      Numbers: numbers
    }) as Promise<string[] | null>;
  },
  
  // Delete a phonebook
  deletePhonebook: async (domain: string, bookId: string, schoolCode?: string): Promise<string[] | null> => {
    const credentials = await getSmsCredentials(domain, schoolCode);
    return makeSoapRequest('deletePhonebook', {
      Username: credentials.username,
      Password: credentials.password,
      BookID: bookId
    }) as Promise<string[] | null>;
  },
  
  // Get account details
  getDetails: async (domain: string, schoolCode?: string): Promise<string | null> => {
    const credentials = await getSmsCredentials(domain, schoolCode);
    return makeSoapRequest('details', {
      Username: credentials.username,
      Password: credentials.password
    }) as Promise<string | null>;
  },
  
  // Get message delivery status
  getStatus: async (domain: string, messageId: string, schoolCode?: string): Promise<string | null> => {
    const credentials = await getSmsCredentials(domain, schoolCode);
    return makeSoapRequest('GetStatus', {
      Username: credentials.username,
      Password: credentials.password,
      MessageID: messageId
    }) as Promise<string | null>;
  }
}; 