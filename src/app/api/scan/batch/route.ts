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
    const scannerScript = (formData.get('scanner') as string) || 'scanner2';
    const files = formData.getAll('files') as File[];

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
    // IMPORTANT: Sort by createdAt descending to match the order in print page
    const examQuestionsCollection = connection.collection('examquestions');
    const questions = await examQuestionsCollection.find({ 
      examId: examId 
    })
    .sort({ createdAt: -1 })
    .toArray();

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
    console.log(`📋 Using scanner script: ${scannerScript}.py`);

    // Get exam details for school code
    const examCollection = connection.collection('exam');
    const examDetails = await examCollection.findOne({ _id: new ObjectId(examId) });
    const schoolCode = examDetails?.schoolCode || '';

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
      const scriptPath = path.join(process.cwd(), 'python', `${scannerScript}.py`);
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
              
              // Make sure correctedImageUrl is accessible from the browser
              if (result.correctedImageUrl && !result.correctedImageUrl.startsWith('http')) {
                // If it's a relative path in the public folder, ensure it has a leading /
                const imagePath = result.correctedImageUrl.startsWith('/') 
                  ? result.correctedImageUrl 
                  : `/${result.correctedImageUrl}`;
                  
                result.correctedImageUrl = imagePath;
              }
              
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
      const examStudentsInfoCollection = connection.collection('examstudentsinfo');
      
      // Process each result
      for (const result of successfulResults) {
        // If there's a QR code data that identifies the student, we can use it
        if (result.qRCodeData) {
          // Parse QR code data - format: studentcode-examcode
          // Extract student code (before the dash)
          const studentCode = result.qRCodeData.includes('-') 
            ? result.qRCodeData.split('-')[0] 
            : result.qRCodeData; // Fallback to whole string if no dash
          
          console.log(`Processing QR code: ${result.qRCodeData}, extracted student code: ${studentCode}`);
          
          // Find the participant based on student code
          const participant = await participantsCollection.findOne({
            examId: examId,
            userId: studentCode
          });
          
          // Calculate total max score from questions
          const totalMaxScore = questions.reduce((sum, q) => sum + (q.score || 1), 0);
          
          // Create the answers array mapped from the questions and scan results
          const answers = questions.map((question, index) => {
            const questionNumber = index + 1;
            const answerValue = result.Useranswers[index] ? result.Useranswers[index].toString() : "";
            const isCorrect = result.rightAnswers.includes(questionNumber);
            const maxScore = question.score || 1;
            const earnedScore = isCorrect ? maxScore : 0;
            
            return {
              questionId: question._id.toString(),
              answer: answerValue,
              examId: examId,
              isCorrect: isCorrect,
              maxScore: maxScore,
              earnedScore: earnedScore,
              category: question.question?.category || "test",
              needsGrading: false
            };
          });
          
          // Create common date objects
          const now = new Date();
          const persianDate = new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }).format(now).replace(/‏/g, '').replace(/،/g, '');
          
          // If participant exists, update participant record
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
          } else {
            // Participant doesn't exist, create a new entry in examparticipants
            await participantsCollection.insertOne({
              examId: examId,
              userId: studentCode,
              answers: result.Useranswers.map((answer: number, index: number) => ({
                questionId: questions[index]?._id || '',
                answer: answer.toString(),
                isCorrect: result.rightAnswers.includes(index + 1),
                maxScore: questions[index]?.score || 1,
                earnedScore: result.rightAnswers.includes(index + 1) ? (questions[index]?.score || 1) : 0,
                needsGrading: false
              })),
              sumScore: result.rightAnswers.length,
              maxScore: questions.length,
              correctAnswerCount: result.rightAnswers.length,
              wrongAnswerCount: result.wrongAnswers.length,
              unansweredCount: result.unAnswered.length,
              gradingStatus: "scanned",
              scanResult: result,
              createdAt: now,
              updatedAt: now
            });
          }
          
          // Check if entry already exists in examstudentsinfo
          const existingEntry = await examStudentsInfoCollection.findOne({
            examId: examId,
            userId: studentCode
          });
          
          if (existingEntry) {
            // Update existing entry
            await examStudentsInfoCollection.updateOne(
              { _id: existingEntry._id },
              {
                $set: {
                  answers: answers,
                  isFinished: true,
                  lastSavedTime: now,
                  updatedAt: now,
                  correctAnswerCount: result.rightAnswers.length,
                  wrongAnswerCount: result.wrongAnswers.length,
                  unansweredCount: result.unAnswered.length,
                  sumScore: result.rightAnswers.length,
                  maxScore: totalMaxScore,
                  gradingStatus: "scanned",
                  gradingTime: now,
                  scanResult: result,
                  qrCodeData: result.qRCodeData // Store full QR code for reference
                }
              }
            );
          } else {
            // Create new entry
            await examStudentsInfoCollection.insertOne({
              examId: examId,
              userId: studentCode,
              schoolCode: schoolCode,
              entryTime: now,
              entryDate: now,
              persianEntryDate: persianDate,
              answers: answers,
              isFinished: true,
              lastSavedTime: now,
              createdAt: now,
              updatedAt: now,
              correctAnswerCount: result.rightAnswers.length,
              wrongAnswerCount: result.wrongAnswers.length,
              unansweredCount: result.unAnswered.length,
              sumScore: result.rightAnswers.length,
              maxScore: totalMaxScore,
              gradingStatus: "scanned",
              gradingTime: now,
              scanResult: result,
              qrCodeData: result.qRCodeData // Store full QR code for reference
            });
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