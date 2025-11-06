import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { spawn } from 'child_process';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
const PY_BIN = process.env.PYTHON_BIN
|| '/var/www/formmaker3/python/.venv-aruco/bin/python';
const PY_CWD = process.env.PYTHON_CWD
|| path.join(process.cwd(), 'python');


// Load database configuration
const getDatabaseConfig = () => {
  try {
    const configPath = path.join(process.cwd(), 'src', 'config', 'database.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error loading database config:', error);
    return {};
  }
};

interface DatabaseConfig {
  [domain: string]: {
    schoolCode: string;
    connectionString: string;
    description: string;
  };
}

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

interface JWTPayload {
  userId: string;
  domain: string;
  schoolCode: string;
  role: string;
  userType: string;
  username: string;
  iat?: number;
  exp?: number;
}

interface ScanResult {
  qRCodeData?: string;
  rightAnswers: number[];
  wrongAnswers: number[];
  multipleAnswers: number[];
  unAnswered: number[];
  Useranswers: number[];
  correctedImageUrl: string;
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
};

export async function POST(request: NextRequest) {

  
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت الزامی است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر یا منقضی شده است' },
        { status: 401 }
      );
    }

    // Check if user is teacher or school
    if (decoded.role !== 'teacher' && decoded.role !== 'school' && 
        decoded.userType !== 'teacher' && decoded.userType !== 'school') {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز - فقط معلمان و مدرسه می‌توانند پاسخنامه اسکن کنند' },
        { status: 403 }
      );
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const scannerScript = (formData.get('scanner') as string) || 'scanner2';

    // Validate scanner script name to prevent path traversal
    const allowedScanners = ['scanner', 'scanner2', 'scanner3', 'scanner4'];
    if (!allowedScanners.includes(scannerScript)) {
      return NextResponse.json(
        { success: false, message: 'اسکنر انتخاب شده نامعتبر است' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'فایل تصویر الزامی است' },
        { status: 400 }
      );
    }

    // Load database configuration
    const dbConfig: DatabaseConfig = getDatabaseConfig();
    const domainConfig = dbConfig[decoded.domain];
    
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404 }
      );
    }

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

    // STEP 1: First scan with dummy answers to extract QR code


   // const scriptPath = path.join(process.cwd(), 'python', `${scannerScript}.py`);
   // const pythonCwd = path.join(process.cwd(), 'python');


    const scriptPath = path.join(PY_CWD, `${scannerScript}.py`);
    const pythonCwd = PY_CWD;

    const dummyAnswers = Array(120).fill(1); // Dummy answers for initial scan
    
    console.log("scriptPath", scriptPath);
    console.log("absoluteFilePath", absoluteFilePath);
    console.log("dummyAnswers", dummyAnswers);
    console.log("pythonCwd", pythonCwd);
    
    const initialScan = await new Promise<ScanResult>((resolve, reject) => {
      // const py = spawn('python3', [
      //   scriptPath,
      //   absoluteFilePath,
      //   JSON.stringify(dummyAnswers)
      // ], { cwd: pythonCwd });
      const py = spawn(PY_BIN, [ scriptPath, absoluteFilePath, JSON.stringify(dummyAnswers) ], { cwd: pythonCwd });
   
      console.log("py", py);

      let stdout = '', stderr = '';
      
      py.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      py.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      py.on('error', (error) => {
        reject({ error: error.message });
      });

      py.on('close', (code) => {
        if (code !== 0) {
          console.log("Python error:", stderr);
          reject({ error: stderr || 'خطا در اسکن پاسخنامه' });
        } else {
          try {
            const result = JSON.parse(stdout) as ScanResult;
            resolve(result);
          } catch {
            reject({ error: 'خطا در پردازش نتیجه اسکن' });
          }
        }
      });
    });

    // STEP 2: Extract exam code from QR code
    if (!initialScan.qRCodeData) {
      return NextResponse.json(
        { success: false, message:JSON.stringify(initialScan) },
        { status: 401}
      );
    }

    // Parse QR code data - format: studentcode-examcode
    const qrParts = initialScan.qRCodeData.split('-');
    if (qrParts.length < 2) {
      return NextResponse.json(
        { success: false, message: 'فرمت QR code نامعتبر است. فرمت صحیح: studentcode-examcode' },
        { status: 402 }
      );
    }

    const studentCode = qrParts[0];
    const examCode = qrParts[1];

    console.log(`Extracted from QR: studentCode=${studentCode}, examCode=${examCode}`);

    // STEP 3: Connect to database and find exam by examCode
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    try {
      // Find exam by exam code
      const examDetails = await db.collection('exam').findOne({ 
        'data.examCode': examCode,
         // schoolCode: decoded.schoolCode
      });

      if (!examDetails) {
        await client.close();
        return NextResponse.json(
          { success: false, message: `آزمون با کد ${examCode} یافت نشد` },
          { status: 404 }
        );
      }

      const examId = examDetails._id.toString();
      const schoolCode = examDetails.schoolCode || decoded.schoolCode || '';
      const examName = examDetails.data?.examName || examCode;

      console.log(`Found exam: ${examName} (ID: ${examId})`);

      // STEP 4: Get questions for this exam
      const questions = await db.collection('examquestions').find({ 
        examId: examId 
      })
      .sort({ createdAt: -1 })
      .toArray();

      if (!questions || questions.length === 0) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'سوالی برای این آزمون یافت نشد' },
          { status: 404 }
        );
      }
      
      // Extract the correct answers from the questions
      const correctAnswers = questions.map((q: any) => {
        return q.question?.correctoption || 1;
      });

      console.log(`Found ${questions.length} questions for exam ${examName}`);

      // STEP 5: Re-scan with actual correct answers for grading
      const finalScan = await new Promise<ScanResult>((resolve, reject) => {
        // const py = spawn('python3', [
        //   scriptPath,
        //   absoluteFilePath,
        //   JSON.stringify(correctAnswers)
        // ], { cwd: pythonCwd });

        const py = spawn(PY_BIN, [ scriptPath, absoluteFilePath, JSON.stringify(correctAnswers) ], { cwd: pythonCwd });



        let stdout = '', stderr = '';
        
        py.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        py.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        py.on('error', (error) => {
          reject({ error: error.message });
        });

        py.on('close', (code) => {
          if (code !== 0) {
            console.log("Python error:", stderr);
            reject({ error: stderr || 'خطا در تصحیح پاسخنامه' });
          } else {
            try {
              const result = JSON.parse(stdout) as ScanResult;
              
              // Fix correctedImageUrl path
              // if (result.correctedImageUrl && !result.correctedImageUrl.startsWith('http')) {
              //   const imagePath = result.correctedImageUrl.startsWith('/') 
              //     ? result.correctedImageUrl 
              //     : `/${result.correctedImageUrl}`;
              //   result.correctedImageUrl = imagePath;
              // }

              if (result.correctedImageUrl) {
                  result.correctedImageUrl = result.correctedImageUrl.replace(/^(\.\.\/)?public\//, '/');
                 }
              
              resolve(result);
            } catch {
              reject({ error: 'خطا در پردازش نتیجه تصحیح' });
            }
          }
        });
      });

      // STEP 6: Save results to the database
      const participantsCollection = db.collection('examparticipants');
      const examStudentsInfoCollection = db.collection('examstudentsinfo');
      
      // Calculate total max score from questions
      const totalMaxScore = questions.reduce((sum: number, q: any) => sum + (q.score || 1), 0);
      
      // Create the answers array
      const answers = questions.map((question: any, index: number) => {
        const questionNumber = index + 1;
        const answerValue = finalScan.Useranswers[index] ? finalScan.Useranswers[index].toString() : "";
        const isCorrect = finalScan.rightAnswers.includes(questionNumber);
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
        
      // Create date objects
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
      
      // Check if participant exists
      const participant = await participantsCollection.findOne({
        examId: examId,
        userId: studentCode
      });
      
      if (participant) {
        // Update participant
        await participantsCollection.updateOne(
          { _id: participant._id },
          { 
            $set: {
              "answers": finalScan.Useranswers.map((answer: number, index: number) => ({
                questionId: questions[index]?._id || '',
                answer: answer.toString(),
                isCorrect: finalScan.rightAnswers.includes(index + 1),
                maxScore: questions[index]?.score || 1,
                earnedScore: finalScan.rightAnswers.includes(index + 1) ? (questions[index]?.score || 1) : 0,
                needsGrading: false
              })),
              "sumScore": finalScan.rightAnswers.length,
              "maxScore": questions.length,
              "correctAnswerCount": finalScan.rightAnswers.length,
              "wrongAnswerCount": finalScan.wrongAnswers.length,
              "unansweredCount": finalScan.unAnswered.length,
              "gradingStatus": "scanned",
              "scanResult": finalScan
            }
          }
        );
      } else {
        // Create new participant
        await participantsCollection.insertOne({
          examId: examId,
          userId: studentCode,
          answers: finalScan.Useranswers.map((answer: number, index: number) => ({
            questionId: questions[index]?._id || '',
            answer: answer.toString(),
            isCorrect: finalScan.rightAnswers.includes(index + 1),
            maxScore: questions[index]?.score || 1,
            earnedScore: finalScan.rightAnswers.includes(index + 1) ? (questions[index]?.score || 1) : 0,
            needsGrading: false
          })),
          sumScore: finalScan.rightAnswers.length,
          maxScore: questions.length,
          correctAnswerCount: finalScan.rightAnswers.length,
          wrongAnswerCount: finalScan.wrongAnswers.length,
          unansweredCount: finalScan.unAnswered.length,
          gradingStatus: "scanned",
          scanResult: finalScan,
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
              correctAnswerCount: finalScan.rightAnswers.length,
              wrongAnswerCount: finalScan.wrongAnswers.length,
              unansweredCount: finalScan.unAnswered.length,
              sumScore: finalScan.rightAnswers.length,
              maxScore: totalMaxScore,
              gradingStatus: "scanned",
              gradingTime: now,
              scanResult: finalScan,
              qrCodeData: finalScan.qRCodeData
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
          correctAnswerCount: finalScan.rightAnswers.length,
          wrongAnswerCount: finalScan.wrongAnswers.length,
          unansweredCount: finalScan.unAnswered.length,
          sumScore: finalScan.rightAnswers.length,
          maxScore: totalMaxScore,
          gradingStatus: "scanned",
          gradingTime: now,
          scanResult: finalScan,
          qrCodeData: finalScan.qRCodeData
        });
      }

      await client.close();

      return NextResponse.json({
        success: true,
        message: `پاسخنامه با موفقیت اسکن شد`,
        data: {
          studentCode: studentCode,
          examCode: examCode,
          examName: examName,
          qrCodeData: finalScan.qRCodeData,
          rightAnswers: finalScan.rightAnswers,
          wrongAnswers: finalScan.wrongAnswers,
          multipleAnswers: finalScan.multipleAnswers,
          unAnswered: finalScan.unAnswered,
          correctedImageUrl: finalScan.correctedImageUrl,
          score: finalScan.rightAnswers.length,
          maxScore: questions.length,
          totalQuestions: questions.length,
        }
      });

    } catch (dbError) {
      await client.close();
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به پایگاه داده' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Scan answersheet API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور داخلی', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

