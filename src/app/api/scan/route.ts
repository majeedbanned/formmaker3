import { spawn } from 'child_process'
import { NextResponse } from 'next/server'
import path from 'path'

interface ScanRequest {
  imagePath: string
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

  const { imagePath, answers } = payload

  // 2) spawn the Python script
  const scriptPath = path.join(process.cwd(), 'python', 'scanner.py')
  const pythonCwd = path.join(process.cwd(), 'python')
  const py = spawn(
    'python3',
    [scriptPath, imagePath, JSON.stringify(answers)],
    { cwd: pythonCwd }
  )

  // 3) collect stdout / stderr
  let stdout = ''
  let stderr = ''
  for await (const chunk of py.stdout) stdout += chunk
  for await (const chunk of py.stderr) stderr += chunk

  const exitCode: number = await new Promise(resolve =>
    py.on('close', resolve)
  )

  // 4) handle errors
  if (exitCode !== 0) {
    return NextResponse.json(
      { error: stderr || 'Python script failed' },
      { status: 500 }
    )
  }

  // 5) parse JSON result
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
