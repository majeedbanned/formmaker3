import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '@/lib/mongodb';
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

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
  originalFilename?: string;
  processedFilePath?: string;
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
    const files = formData.getAll('files') as File[];

    if (!examId) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files were uploaded' },
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
    }).toArray();

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found for this exam' },
        { status: 404 }
      );
    }
    
    // Extract the correct answers from the questions
    const correctAnswers = questions.map((q) => {
      // Assuming each question has a correctoption field with values 1-4
      return q.question?.correctoption || 1;
    });

    console.log("correctAnswers", correctAnswers);

    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'scan');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Process each file
    const processingPromises = files.map(async (file) => {
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
      const scriptPath = path.join(process.cwd(), 'python', 'scanner.py');
      const pythonCwd = path.join(process.cwd(), 'python');
      
      return new Promise<ScanResult>((resolve, reject) => {
        const py = spawn('python3', [
          scriptPath,
          absoluteFilePath,
          JSON.stringify(correctAnswers)
        ], { cwd: pythonCwd });
        console.log("py", py);
        let stdout = '', stderr = '';
        py.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        py.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        py.on('error', (error) => {
          reject({ error: error.message, file: file.name });
        });

        py.on('close', (code) => {
          if (code !== 0) {
        console.log("py1",stderr);

            reject({ error: stderr || 'Python script failed', file: file.name });
          } else {
            try {
        console.log("py2","result");

              const result = JSON.parse(stdout) as ScanResult;
              console.log("result", result);
              // Add file info to the result
              result.originalFilename = file.name;
              result.processedFilePath = `/${filePath}`;
              resolve(result);
            } catch {
              // JSON parsing error - ignore the specific error
              reject({ error: 'Invalid JSON from scanner', raw: stdout, file: file.name });
            }
          }
        });
      });
    });

    // Wait for all files to be processed
    const results = await Promise.allSettled(processingPromises);
    
    // Separate successful and failed results
    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<ScanResult> => result.status === 'fulfilled')
      .map(result => result.value);
    
    const failedResults = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason);

    // Save results to the database if there are any successful scans
    if (successfulResults.length > 0) {
      // Get the participants collection
      const participantsCollection = connection.collection('examparticipants');
      
      // Process each result
      for (const result of successfulResults) {
        // If there's a QR code data that identifies the student, we can use it
        if (result.qRCodeData) {
          // Find the participant based on qRCodeData or other identifiers
          // This is an example and would need to be adjusted based on your schema
          const participant = await participantsCollection.findOne({
            examId: examId,
            userId: result.qRCodeData  // Assuming qRCodeData contains userId
          });
          
          if (participant) {
            // Update participant with scan results
            await participantsCollection.updateOne(
              { _id: participant._id },
              { 
                $set: {
                  "answers": result.Useranswers.map((answer: number, index: number) => ({
                    questionId: questions[index]?._id || '',
                    answer: answer.toString(),
                    isCorrect: result.rightAnswers.includes(index + 1),
                    maxScore: questions[index]?.score || 1,
                    earnedScore: result.rightAnswers.includes(index + 1) ? (questions[index]?.score || 1) : 0,
                    needsGrading: false
                  })),
                  "sumScore": result.rightAnswers.length,
                  "maxScore": questions.length,
                  "correctAnswerCount": result.rightAnswers.length,
                  "wrongAnswerCount": result.wrongAnswers.length,
                  "unansweredCount": result.unAnswered.length,
                  "gradingStatus": "scanned",
                  "scanResult": result
                }
              }
            );
          }
        }
      }
    }

    return NextResponse.json({
      results: successfulResults,
      failed: failedResults,
      message: `Successfully processed ${successfulResults.length} out of ${files.length} files`
    });
  } catch (error) {
    console.error('Error processing files:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred during processing' },
      { status: 500 }
    );
  }
} 