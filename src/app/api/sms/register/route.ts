import { NextResponse } from "next/server";
import { DOMParser } from 'xmldom';
import axios from 'axios';
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// Set runtime to nodejs
export const runtime = 'nodejs';

const SMS_API_URL = 'http://185.112.33.61/webservice/send.php';

// Helper to create SOAP envelope for registeruser
const createRegisterUserSoapEnvelope = (data: Record<string, string>): string => {
  let paramsXml = '';
  
  for (const [key, value] of Object.entries(data)) {
    paramsXml += `<${key} xsi:type="xsd:string">${value}</${key}>`;
  }

  return `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope 
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
      xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
      xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
      xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/">
      <soap:Body>
        <registeruser xmlns="urn:Send">
          ${paramsXml}
        </registeruser>
      </soap:Body>
    </soap:Envelope>`;
};

// Parse SOAP response
const parseSoapResponse = (xml: string): string[] | null => {
  try {
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

      console.log("returnElement" ,returnElement.textContent);
      
      // Single return value as array
      return returnElement.textContent ? [returnElement.textContent] : null;
    }
    
    return null;
  } catch (error) {
    console.error("Error parsing SOAP response:", error);
    return null;
  }
};

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get registration data from request
    const registrationData = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'first_name', 'last_name', 'uname', 'upass', 'upass_repeat', 
      'melli_code', 'email', 'mob', 'tel', 'addr'
    ];
    
    for (const field of requiredFields) {
      if (!registrationData[field]) {
        return NextResponse.json(
          { error: `Field ${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Create SOAP envelope
    const soapEnvelope = createRegisterUserSoapEnvelope(registrationData);
    console.log("soapEnvelope" ,soapEnvelope);
    // Make SOAP request
    const response = await axios.post(SMS_API_URL, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'urn:Send#registeruser'
      }
    });
    
    // Parse response
    const result = parseSoapResponse(response.data);
   
    console.log("result" ,result);
    console.log("response.data" ,response.data);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to parse registration response" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error("Error registering SMS user:", error);
    return NextResponse.json(
      { error: "Failed to register SMS user" },
      { status: 500 }
    );
  }
} 