const WebSocket = require('ws');
const { runCodeSession, stopSession } = require('./controllers/codeExecution.controller');

const wss = new WebSocket.Server({ port: 5001 });

wss.on('connection', (ws) => {
  console.log('✓ Client connected');
  
  ws.on('message', async (msg) => {
    // Convert buffer to string if necessary
    if (Buffer.isBuffer(msg)) msg = msg.toString('utf8');

    try {
      // Try to parse as JSON (control commands)
      let parsed;
      try {
        parsed = JSON.parse(msg);
      } catch (e) {
        parsed = null;
      }

      // Handle control commands
      if (parsed && typeof parsed === 'object' && parsed.type) {
        console.log(`[CMD] ${parsed.type}`);

        if (parsed.type === 'start') {
          // Stop previous session if exists (silently, no messages)
          if (ws.session) {
            console.log(`[CLEANUP] Stopping previous session before new start`);
            try {
              // Mark session as resolved to prevent cleanup messages
              ws.session.resolved = true;
              await stopSession(ws.session);
            } catch (err) {
              console.error('[CLEANUP] Error stopping previous session:', err.message);
            }
            ws.session = null;
            ws.sessionStarted = false;
          }

          try {
            console.log(`[START] Starting new session for ${parsed.language}`);
            
            // Create new Docker container session
            ws.session = await runCodeSession(ws, parsed.language, parsed.code);
            ws.sessionStarted = true;

            // Send confirmation
            ws.send(`\x1b[32m[Session ${ws.session.id.substring(0, 8)} started - Container: ${ws.session.containerName}]\x1b[0m\r\n`);
          } catch (err) {
            console.error('[ERROR] Session start failed:', err.message);
            ws.sessionStarted = false;
            ws.send(`\x1b[31m[Error: ${err.message}]\x1b[0m\r\n`);
          }
        } 
        else if (parsed.type === 'interrupt') {
          // Send Ctrl+C to the running program inside container
          if (ws.session && ws.session.dockerProcess && ws.session.dockerProcess.stdin.writable) {
            try {
              // Send Ctrl+C character
              ws.session.dockerProcess.stdin.write('\x03');
              console.log(`[INTERRUPT] Sent Ctrl+C to container`);
            } catch (err) {
              console.error('[INTERRUPT] Error:', err.message);
            }
          }
        } 
        else if (parsed.type === 'eof') {
          // Send EOF (Ctrl+D) to container
          if (ws.session && ws.session.dockerProcess && ws.session.dockerProcess.stdin.writable) {
            try {
              ws.session.dockerProcess.stdin.write('\x04');
              console.log(`[EOF] Sent Ctrl+D to container`);
            } catch (err) {
              console.error('[EOF] Error:', err.message);
            }
          }
        }
        else if (parsed.type === 'resize') {
          // Terminal resize - Docker doesn't support this easily in this setup
          // but we log it for future implementation
          console.log(`[RESIZE] Terminal resized to ${parsed.cols}x${parsed.rows}`);
        }
        else {
          ws.send(`\x1b[31m[Unknown command: ${parsed.type}]\x1b[0m\r\n`);
        }
      } 
      else if (ws.sessionStarted && ws.session && ws.session.dockerProcess) {
        // Send raw user input to Docker container's stdin
        try {
          if (ws.session.dockerProcess.stdin.writable) {
            ws.session.dockerProcess.stdin.write(msg);
            console.log(`[INPUT] Sent to container: ${msg.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}`);
          } else {
            console.warn(`[INPUT] Container stdin not writable`);
            ws.send(`\x1b[31m[Error: Container stdin not available]\x1b[0m\r\n`);
          }
        } catch (err) {
          console.error('[INPUT] Error writing to container stdin:', err.message);
          ws.send(`\x1b[31m[Error: ${err.message}]\x1b[0m\r\n`);
        }
      } 
      else {
        console.warn(`[INPUT] No active session`);
        ws.send(`\x1b[31m[Error: No active session. Click Run to start.]\x1b[0m\r\n`);
      }
    } catch (err) {
      console.error('[FATAL] Unexpected error:', err.message);
      console.error(err.stack);
      ws.send(`\x1b[31m[Fatal Error: ${err.message}]\x1b[0m\r\n`);
    }
  });

  ws.on('close', () => {
    console.log('✓ Client disconnected');
    // Stop Docker container when client disconnects
    if (ws.session) {
      stopSession(ws.session);
    }
  });

  ws.on('error', (err) => {
    console.error('[WS-ERROR]', err.message);
  });
});

console.log('🚀 WebSocket server running on ws://localhost:5001');