import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '@/lib/mongodb';
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from 'mongodb';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
};

interface ScanResult {
  qRCodeData?: string;
  rightAnswers: number[];
  wrongAnswers: number[];
  multipleAnswers: number[];
  unAnswered: number[];
  Useranswers: number[];
  correctedImageUrl: string;
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get domain from headers (or use default)
    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Parse the multipart form data
    const formData = await request.formData();
    const examId = formData.get('examId') as string;
    const file = formData.get('file') as File;
    const scannerScript = (formData.get('scanner') as string) || 'scanner2';

    // Validate scanner script name to prevent path traversal
    const allowedScanners = ['scanner', 'scanner2', 'scanner3', 'scanner4'];
    if (!allowedScanners.includes(scannerScript)) {
      return NextResponse.json(
        { error: 'Invalid scanner script selected' },
        { status: 400 }
      );
    }

    if (!examId) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No file was uploaded' },
        { status: 400 }
      );
    }

    // For extracting answer keys, we don't need to validate against correct answers
    // We just need to detect what the user marked, regardless if it's "correct" or not
    // Create a dummy array of correct answers (all 1s) for the scanner to work
    // The scanner needs this parameter but we'll use the Useranswers output
    
    // Determine number of questions based on paper size
    // A4 = 120 questions, A5 = 60 questions
    // We'll use 120 as default (A4) - scanner will detect actual paper size
    const dummyCorrectAnswers = Array(120).fill(1);

    // console.log("Scanning answer sheet to extract all marked answers...");

    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'scan');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Generate a unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join('uploads', 'scan', uniqueFilename);
    const absoluteFilePath = path.join(process.cwd(), 'public', filePath);

    // Convert the file to a buffer and save it
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    writeFileSync(absoluteFilePath, buffer);

    // Pass the file to the Python script for processing
    const scriptPath = path.join(process.cwd(), 'python', `${scannerScript}.py`);
    const pythonCwd = path.join(process.cwd(), 'python');
    
    return new Promise<NextResponse>((resolve) => {
      const py = spawn('python3', [
        scriptPath,
        absoluteFilePath,
        JSON.stringify(dummyCorrectAnswers)
      ], { cwd: pythonCwd });

      let stdout = '', stderr = '';
      
      py.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      py.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      py.on('error', (error) => {
        console.error('Python process error:', error);
        resolve(NextResponse.json(
          { error: 'Failed to process answer sheet: ' + error.message },
          { status: 500 }
        ));
      });

      py.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script failed:', stderr);
          resolve(NextResponse.json(
            { error: 'Scanner failed to process the image. Please check if the image is clear and properly aligned.', details: stderr },
            { status: 500 }
          ));
        } else {
          try {
            const result = JSON.parse(stdout) as ScanResult;
            // console.log("Scan result:", result);
            // console.log("User answers extracted:", result.Useranswers);
            
            // Extract user answers (these will become the correct answers for the keys)
            const userAnswers = result.Useranswers;
            
            if (!userAnswers || userAnswers.length === 0) {
              resolve(NextResponse.json(
                { error: 'No answers detected on the answer sheet. Please make sure the sheet is clearly marked and properly aligned.' },
                { status: 400 }
              ));
              return;
            }

            // Filter out answers that are 0 (unanswered questions)
            // Keep track of question numbers
            const extractedAnswers = userAnswers.map((answer, index) => ({
              questionNumber: index + 1,
              answer: answer
            })).filter(item => item.answer > 0); // Only include answered questions

            // console.log(`Extracted ${extractedAnswers.length} answered questions out of ${userAnswers.length} total`);
            
            // Return the extracted answers (all of them, including 0 for unanswered)
            resolve(NextResponse.json({
              success: true,
              answers: userAnswers, // Return all answers including 0s
              totalQuestions: userAnswers.length,
              answeredQuestions: extractedAnswers.length,
              correctedImageUrl: result.correctedImageUrl,
              message: `Successfully extracted ${userAnswers.length} questions (${extractedAnswers.length} answered)`
            }));
          } catch (error) {
            console.error('JSON parsing error:', error, 'Raw output:', stdout);
            resolve(NextResponse.json(
              { error: 'Failed to parse scanner output', raw: stdout },
              { status: 500 }
            ));
          }
        }
      });
    });
  } catch (error) {
    console.error('Error processing answer key scan:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred during processing' },
      { status: 500 }
    );
  }
}

