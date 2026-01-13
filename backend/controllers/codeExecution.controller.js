// codeExecution.controller.js - Persistent Docker container per session
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Helper function to extract the public class name from Java code
const extractJavaClassName = (javaCode) => {
  // Match public class declaration
  const classMatch = javaCode.match(/public\s+class\s+(\w+)/);
  if (classMatch && classMatch[1]) {
    return classMatch[1];
  }
  // Default to Main if no public class found
  return 'Main';
};

exports.runCodeSession = async (ws, language, code) => {
  const sessionId = uuidv4();
  const containerName = `compiler-session-${sessionId.substring(0, 8)}`;
  
  try {
    let fileName;
    let javaClassName = null;

    // Determine file name based on language
    switch (language) {
      case 'python3':
        fileName = 'script.py';
        break;
      case 'javascript':
        fileName = 'script.js';
        break;
      case 'c':
        fileName = 'main.c';
        break;
      case 'cpp':
        fileName = 'main.cpp';
        break;
      case 'java':
        javaClassName = extractJavaClassName(code);
        fileName = `${javaClassName}.java`;
        break;
      default:
        throw new Error(`Unsupported language: ${language}`);
    }

    // Create temp directory for this session
    const tempDir = path.join(__dirname, '../temp', `session_${sessionId}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write code to file
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`[${sessionId}] Code written to: ${filePath}`);

    // Create a persistent Docker container with interactive bash shell
    const dockerArgs = [
      'run',
      '--name', containerName,         // Named container for this session
      '--rm',                           // Auto-remove when stopped
      '-i',                             // Interactive mode (no TTY for Windows compatibility)
      '-v', `${tempDir}:/app`,         // Mount temp directory
      '-w', '/app',                     // Working directory
      '--memory', '256m',               // Memory limit
      '--cpus', '0.5',                  // CPU limit
      '--network', 'none',              // No network for security
      'thesis-compiler',                // Your Docker image
      '/bin/bash'                       // Start interactive bash shell
    ];

    console.log(`[${sessionId}] Creating Docker container: ${containerName}`);

    // Spawn Docker container with interactive bash
    const dockerProcess = spawn('docker', dockerArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],  // stdin, stdout, stderr as pipes
      cwd: tempDir
    });

    if (!dockerProcess.pid) {
      throw new Error('Failed to spawn Docker process');
    }

    console.log(`[${sessionId}] Docker container started with PID: ${dockerProcess.pid}`);

    // Create session object
    const session = {
      id: sessionId,
      containerName: containerName,
      dockerProcess: dockerProcess,
      tempDir: tempDir,
      resolved: false,
      language: language
    };

    // Handle stdout from Docker to WebSocket
    dockerProcess.stdout.on('data', (data) => {
      if (!session.resolved && ws.readyState === 1) {
        try {
          const output = data.toString('utf8');
          ws.send(output);
        } catch (err) {
          console.error(`[${sessionId}] Error sending stdout:`, err.message);
        }
      }
    });

    // Handle stderr from Docker to WebSocket
    dockerProcess.stderr.on('data', (data) => {
      if (!session.resolved && ws.readyState === 1) {
        try {
          const output = data.toString('utf8');
          ws.send(output);
        } catch (err) {
          console.error(`[${sessionId}] Error sending stderr:`, err.message);
        }
      }
    });

    // Handle process exit
    dockerProcess.on('exit', (code) => {
      if (!session.resolved) {
        session.resolved = true;
        console.log(`[${sessionId}] Docker container exited with code: ${code}`);
        
        try {
          ws.send(`\r\n\x1b[33m[Container stopped]\x1b[0m\r\n`);
        } catch {}

        // Cleanup temp directory
        setTimeout(() => {
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
            console.log(`[${sessionId}] Cleanup completed`);
          } catch (err) {
            console.error(`[${sessionId}] Cleanup error:`, err.message);
          }
        }, 1000);
      }
    });

    // Handle process errors
    dockerProcess.on('error', (err) => {
      if (!session.resolved) {
        session.resolved = true;
        console.error(`[${sessionId}] Docker error:`, err.message);
        try {
          ws.send(`\x1b[31m[Error: ${err.message}]\x1b[0m\r\n`);
        } catch {}

        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch {}
      }
    });

    // Wait a moment for container to be ready, then execute the code
    setTimeout(() => {
      try {
        let execCommand;
        
        switch (language) {
          case 'python3':
            execCommand = `python3 -u ${fileName}\n`;
            break;
          case 'javascript':
            execCommand = `node ${fileName}\n`;
            break;
          case 'c':
            execCommand = `gcc ${fileName} -o main.out && ./main.out\n`;
            break;
          case 'cpp':
            execCommand = `g++ ${fileName} -o main.out && ./main.out\n`;
            break;
          case 'java':
            execCommand = `javac ${fileName} && java ${javaClassName}\n`;
            break;
        }

        if (dockerProcess.stdin.writable) {
          dockerProcess.stdin.write(execCommand);
          console.log(`[${sessionId}] Executed: ${execCommand.trim()}`);
        }
      } catch (writeError) {
        console.error(`[${sessionId}] Error writing to Docker stdin:`, writeError.message);
        ws.send(`\x1b[31m[Error executing command: ${writeError.message}]\x1b[0m\r\n`);
      }
    }, 500);

    console.log(`[${sessionId}] Session created successfully`);
    return session;

  } catch (err) {
    console.error(`[${sessionId}] Session creation error:`, err.message);
    console.error('Stack trace:', err.stack);
    
    // Try to clean up container if it was created
    try {
      spawn('docker', ['rm', '-f', containerName]);
    } catch {}

    try {
      ws.send(`\x1b[31m[Error: ${err.message}]\x1b[0m\r\n`);
    } catch {}
    throw err;
  }
};

// Helper function to stop a session
exports.stopSession = async (session) => {
  if (!session || !session.containerName) return;

  console.log(`[${session.id}] Stopping session...`);

  try {
    // Kill the Docker process
    if (session.dockerProcess && !session.dockerProcess.killed) {
      session.dockerProcess.kill('SIGTERM');
    }

    // Force remove the container
    spawn('docker', ['rm', '-f', session.containerName]);
    
    console.log(`[${session.id}] Session stopped`);
  } catch (err) {
    console.error(`[${session.id}] Error stopping session:`, err.message);
  }
};