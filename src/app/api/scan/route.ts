import { spawn } from 'child_process'
import { NextResponse } from 'next/server'
import path from 'path'
import { existsSync } from 'fs'

interface ScanRequest {
  imagePath: string      // e.g. "/input.jpg"
  answers: number[]
}

export async function POST(request: Request) {
  // 1) parse body
  let payload: ScanRequest
  try {
    payload = (await request.json()) as ScanRequest
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { imagePath: clientPath, answers } = payload

  // 2) build the absolute path to public/<whatever>
  //    strip leading slash then join into <projectRoot>/public
  const relative = clientPath.replace(/^\/+/, '')            // "input.jpg"
  const absImagePath = path.join(process.cwd(), 'public', relative)

  // 3) sanity‐check it exists
  if (!existsSync(absImagePath)) {
    return NextResponse.json(
      { error: `File not found on disk: ${absImagePath}` },
      { status: 400 }
    )
  }

  // 4) now spawn your Python script with the real path
  const scriptPath = path.join(process.cwd(), 'python', 'scanner.py')
  const pythonCwd  = path.join(process.cwd(), 'python')
  const py = spawn('python3', [
    scriptPath,
    absImagePath,
    JSON.stringify(answers)
  ], { cwd: pythonCwd })

  // 5) collect stdout / stderr
  let stdout = '', stderr = ''
  for await (const chunk of py.stdout) stdout += chunk
  for await (const chunk of py.stderr) stderr += chunk

  const exitCode: number = await new Promise(resolve =>
    py.on('close', resolve)
  )

  // 6) handle errors
  if (exitCode !== 0) {
    return NextResponse.json(
      { error: stderr || 'Python script failed' },
      { status: 500 }
    )
  }

  // 7) parse JSON result
  try {
    const data = JSON.parse(stdout)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON from scanner', raw: stdout },
      { status: 500 }
    )
  }
}
