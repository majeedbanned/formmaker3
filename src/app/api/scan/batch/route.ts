import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '@/lib/mongodb';
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from 'mongodb';

// NOTE: If this is App Router (app/.../route.ts), this block is ignored.
// If it’s Pages Router (pages/api/*) you can keep it.
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
};

// CHANGE 1: Force Node runtime so spawn is allowed
export const runtime = 'nodejs';

// CHANGE 2: Use the venv Python + fixed python cwd
const PY_BIN = process.env.PYTHON_BIN
  || '/var/www/formmaker3/python/.venv-aruco/bin/python';
const PY_CWD = process.env.PYTHON_CWD
  || path.join(process.cwd(), 'python');

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

// CHANGE 3: Safe runner with timeout (place above POST)
function runScanner(args: string[], cwd: string, timeoutMs = 60_000): Promise<ScanResult> {
  return new Promise((resolve, reject) => {
    const py = spawn(PY_BIN, args, { cwd });
    let stdout = '', stderr = '';
    const timer = setTimeout(() => { try { py.kill('SIGKILL'); } catch {} }, timeoutMs);

    py.stdout.on('data', d => { stdout += d.toString(); });
    py.stderr.on('data', d => { stderr += d.toString(); });
    py.on('error', err => { clearTimeout(timer); reject({ error: err.message }); });
    py.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) return reject({ error: stderr || 'Python script failed' });
      try { resolve(JSON.parse(stdout) as ScanResult); }
      catch { reject({ error: 'Invalid JSON from scanner', raw: stdout }); }
    });
  });
}

export async function POST(request: Request) {
  try {
    // Auth
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Form data
    const formData = await request.formData();
    const examId = formData.get('examId') as string;
    const scannerScript = (formData.get('scanner') as string) || 'scanner2';
    const files = formData.getAll('files') as File[];

    const allowedScanners = ['scanner', 'scanner2', 'scanner3', 'scanner4'];
    if (!allowedScanners.includes(scannerScript)) {
      return NextResponse.json({ error: 'Invalid scanner script selected' }, { status: 400 });
    }

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
    }

    // CHANGE 4: Validate examId before ObjectId usage
    if (!ObjectId.isValid(examId)) {
      return NextResponse.json({ error: 'Invalid examId' }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files were uploaded' }, { status: 400 });
    }

    // DB
    const connection = await connectToDatabase(domain);
    if (!connection) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Questions
    const examQuestionsCollection = connection.collection('examquestions');
    const questions = await examQuestionsCollection.find({ examId })
      .sort({ createdAt: -1 })
      .toArray();

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions found for this exam' }, { status: 404 });
    }

    const correctAnswers = questions.map(q => q.question?.correctoption || 1);
    // console.log("correctAnswers", correctAnswers);
    // console.log(`📋 Using scanner script: ${scannerScript}.py`);

    // Exam details
    const examCollection = connection.collection('exam');
    const examDetails = await examCollection.findOne({ _id: new ObjectId(examId) });
    const schoolCode = examDetails?.schoolCode || '';

    // Upload dir
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'scan');
    if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

    // Process each file
    const processingPromises = files.map(async (file) => {
      // Filenames/paths
      const fileExtension = (file.name.split('.').pop() || 'jpg').toLowerCase();

      // CHANGE 5: Quick file-type & size guards (before saving)
      if (!['jpg','jpeg','png'].includes(fileExtension)) {
        return Promise.reject({ error: `Unsupported file type: ${fileExtension}`, file: file.name });
      }
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length > 15 * 1024 * 1024) {
        return Promise.reject({ error: 'File too large (max 15MB)', file: file.name });
      }

      const uniqueFilename = `${uuidv4()}.${fileExtension}`;
      const filePath = path.join('uploads', 'scan', uniqueFilename);
      const absoluteFilePath = path.join(process.cwd(), 'public', filePath);

      // Save upload
      writeFileSync(absoluteFilePath, buffer);

      // Paths for Python
      // CHANGE 6: Use constants for script/cwd
      const scriptPath = path.join(PY_CWD, `${scannerScript}.py`);
      const pythonCwd = PY_CWD;

      // Run scanner
      const result = await runScanner(
        [scriptPath, absoluteFilePath, JSON.stringify(correctAnswers)],
        pythonCwd
      );

      // Attach helpful info
      result.originalFilename = file.name;
      result.processedFilePath = `/${filePath}`;

      // CHANGE 7: Normalize correctedImageUrl → web-root relative
      if (result.correctedImageUrl) {
        result.correctedImageUrl = result.correctedImageUrl.replace(/^(\.\.\/)?public\//, '/');
      }

      return result;
    });

    // Await all
    const results = await Promise.allSettled(processingPromises);

    const successfulResults = results
      .filter((r): r is PromiseFulfilledResult<ScanResult> => r.status === 'fulfilled')
      .map(r => r.value);

    const failedResults = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason);

    // Persist successful scans
    if (successfulResults.length > 0) {
      const participantsCollection = connection.collection('examparticipants');
      const examStudentsInfoCollection = connection.collection('examstudentsinfo');

      for (const result of successfulResults) {
        if (!result.qRCodeData) continue;

        const studentCode = result.qRCodeData.includes('-')
          ? result.qRCodeData.split('-')[0]
          : result.qRCodeData;

        const participant = await participantsCollection.findOne({ examId, userId: studentCode });
        const totalMaxScore = questions.reduce((sum, q) => sum + (q.score || 1), 0);

        const answers = questions.map((question, index) => {
          const questionNumber = index + 1;
          const answerValue = result.Useranswers[index] ? result.Useranswers[index].toString() : "";
          const isCorrect = result.rightAnswers.includes(questionNumber);
          const maxScore = question.score || 1;
          const earnedScore = isCorrect ? maxScore : 0;
          return {
            questionId: question._id.toString(),
            answer: answerValue,
            examId,
            isCorrect,
            maxScore,
            earnedScore,
            category: question.question?.category || "test",
            needsGrading: false
          };
        });

        const now = new Date();
        const persianDate = new Intl.DateTimeFormat('fa-IR', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        }).format(now).replace(/‏/g, '').replace(/،/g, '');

        if (participant) {
          await participantsCollection.updateOne(
            { _id: participant._id },
            {
              $set: {
                answers: result.Useranswers.map((answer: number, i: number) => ({
                  questionId: questions[i]?._id || '',
                  answer: answer.toString(),
                  isCorrect: result.rightAnswers.includes(i + 1),
                  maxScore: questions[i]?.score || 1,
                  earnedScore: result.rightAnswers.includes(i + 1) ? (questions[i]?.score || 1) : 0,
                  needsGrading: false
                })),
                sumScore: result.rightAnswers.length,
                maxScore: questions.length,
                correctAnswerCount: result.rightAnswers.length,
                wrongAnswerCount: result.wrongAnswers.length,
                unansweredCount: result.unAnswered.length,
                gradingStatus: "scanned",
                scanResult: result
              }
            }
          );
        } else {
          await participantsCollection.insertOne({
            examId,
            userId: studentCode,
            answers: result.Useranswers.map((answer: number, i: number) => ({
              questionId: questions[i]?._id || '',
              answer: answer.toString(),
              isCorrect: result.rightAnswers.includes(i + 1),
              maxScore: questions[i]?.score || 1,
              earnedScore: result.rightAnswers.includes(i + 1) ? (questions[i]?.score || 1) : 0,
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

        const existingEntry = await examStudentsInfoCollection.findOne({ examId, userId: studentCode });

        if (existingEntry) {
          await examStudentsInfoCollection.updateOne(
            { _id: existingEntry._id },
            {
              $set: {
                answers,
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
                qrCodeData: result.qRCodeData
              }
            }
          );
        } else {
          await examStudentsInfoCollection.insertOne({
            examId,
            userId: studentCode,
            schoolCode,
            entryTime: now,
            entryDate: now,
            persianEntryDate: persianDate,
            answers,
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
            qrCodeData: result.qRCodeData
          });
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
