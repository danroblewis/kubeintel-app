import { WebSocketServer, WebSocket } from 'ws';
import { spawn } from 'child_process';
import * as pty from 'node-pty';

export function setupWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'pod_logs':
            handlePodLogs(ws, data);
            break;
          case 'pod_shell':
            handlePodShell(ws, data);
            break;
          case 'kubectl_command':
            handleKubectlCommand(ws, data);
            break;
          default:
            ws.send(JSON.stringify({ error: 'Unknown message type' }));
        }
      } catch (error) {
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
}

function handlePodLogs(ws: WebSocket, data: any) {
  const { kubeconfigPath, context, namespace, podName, container, follow } = data;
  
  const args = [
    '--kubeconfig', kubeconfigPath,
    '--context', context,
    'logs', podName
  ];
  
  if (namespace) {
    args.push('-n', namespace);
  }
  
  if (container) {
    args.push('-c', container);
  }
  
  if (follow) {
    args.push('-f');
  }

  const kubectl = spawn('kubectl', args);

  kubectl.stdout.on('data', (data) => {
    ws.send(JSON.stringify({
      type: 'logs',
      data: data.toString()
    }));
  });

  kubectl.stderr.on('data', (data) => {
    ws.send(JSON.stringify({
      type: 'error',
      data: data.toString()
    }));
  });

  kubectl.on('close', (code) => {
    ws.send(JSON.stringify({
      type: 'close',
      code
    }));
  });

  ws.on('close', () => {
    kubectl.kill();
  });
}

function handlePodShell(ws: WebSocket, data: any) {
  const { kubeconfigPath, context, namespace, podName, container, shell } = data;
  
  const args = [
    '--kubeconfig', kubeconfigPath,
    '--context', context,
    'exec', '-it', podName
  ];
  
  if (namespace) {
    args.push('-n', namespace);
  }
  
  if (container) {
    args.push('-c', container);
  }
  
  args.push('--', shell || '/bin/bash');

  try {
    const ptyProcess = pty.spawn('kubectl', args, {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: process.cwd(),
      env: process.env
    });

    ptyProcess.onData((data: string) => {
      ws.send(JSON.stringify({
        type: 'shell_data',
        data
      }));
    });

    ptyProcess.onExit((exitCode: { exitCode: number; signal?: number }) => {
      ws.send(JSON.stringify({
        type: 'shell_exit',
        code: exitCode.exitCode
      }));
    });

    ws.on('message', (message: string) => {
      try {
        const msg = JSON.parse(message.toString());
        if (msg.type === 'shell_input') {
          ptyProcess.write(msg.data);
        } else if (msg.type === 'shell_resize') {
          ptyProcess.resize(msg.cols, msg.rows);
        }
      } catch (error) {
        // Ignore invalid messages
      }
    });

    ws.on('close', () => {
      ptyProcess.kill();
    });
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'error',
      data: `Failed to start shell: ${error}`
    }));
  }
}

function handleKubectlCommand(ws: WebSocket, data: any) {
  const { kubeconfigPath, context, command } = data;
  
  const args = [
    '--kubeconfig', kubeconfigPath,
    '--context', context,
    ...command.split(' ')
  ];

  const kubectl = spawn('kubectl', args);

  kubectl.stdout.on('data', (data) => {
    ws.send(JSON.stringify({
      type: 'command_output',
      data: data.toString()
    }));
  });

  kubectl.stderr.on('data', (data) => {
    ws.send(JSON.stringify({
      type: 'command_error',
      data: data.toString()
    }));
  });

  kubectl.on('close', (code) => {
    ws.send(JSON.stringify({
      type: 'command_close',
      code
    }));
  });

  ws.on('close', () => {
    kubectl.kill();
  });
}