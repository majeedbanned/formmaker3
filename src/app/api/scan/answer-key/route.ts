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

    // Connect to MongoDB using the utility
    const connection = await connectToDatabase(domain);
    if (!connection) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    // Get questions for this exam from the database
    const examQuestionsCollection = connection.collection('examquestions');
    const questions = await examQuestionsCollection.find({ 
      examId: examId 
    })
    .sort({ createdAt: -1 })
    .toArray();

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found for this exam. Please add questions or define exam keys first.' },
        { status: 404 }
      );
    }
    
    // Extract the correct answers from the questions
    const correctAnswers = questions.map((q) => {
      return q.question?.correctoption || 1;
    });

    console.log("Using correct answers for validation:", correctAnswers);

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
        JSON.stringify(correctAnswers)
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
            console.log("Scan result:", result);
            
            // Extract user answers (these will become the correct answers for the keys)
            const userAnswers = result.Useranswers;
            
            // Return the extracted answers
            resolve(NextResponse.json({
              success: true,
              answers: userAnswers,
              totalQuestions: userAnswers.length,
              correctedImageUrl: result.correctedImageUrl,
              message: `Successfully extracted ${userAnswers.length} answers from the answer sheet`
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

