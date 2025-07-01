# KubeIntel Web Deployment

This document describes how to deploy KubeIntel as a web application on your Kubernetes cluster, replacing the original Tauri desktop application.

## 🚀 Quick Start

### Prerequisites

- Kubernetes cluster (v1.19+)
- kubectl configured to access your cluster
- Docker for building the container image
- NGINX Ingress Controller (for external access)

### One-Command Deployment

```bash
./deploy.sh
```

This script will:
1. Build the Docker image
2. Apply all Kubernetes manifests
3. Wait for the deployment to be ready
4. Display access information

## 📋 Manual Deployment

### 1. Build the Application

```bash
# Install frontend dependencies
pnpm install

# Build frontend
pnpm build

# Install server dependencies
cd server && npm install

# Build server
npm run build
```

### 2. Build Docker Image

```bash
docker build -t kubeintel:latest .
```

### 3. Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/

# Or apply individually
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### 4. Verify Deployment

```bash
kubectl get pods,svc,ingress -n kubeintel
```

## 🔧 Configuration

### Environment Variables

Configure the application through the ConfigMap in `k8s/configmap.yaml`:

```yaml
data:
  NODE_ENV: "production"
  PORT: "3001"
  FRONTEND_URL: "https://your-domain.com"  # Optional: for CORS
```

### Ingress Configuration

Update the ingress host in `k8s/ingress.yaml`:

```yaml
spec:
  rules:
  - host: your-domain.com  # Change this to your actual domain
```

For HTTPS, uncomment and configure the TLS section:

```yaml
tls:
- hosts:
  - your-domain.com
  secretName: kubeintel-tls
```

### Kubeconfig Setup

The application can access the cluster in several ways:

1. **Service Account (Recommended)**: Uses the RBAC configuration in `k8s/rbac.yaml`
2. **Kubeconfig Secret**: Create a secret with your kubeconfig:

```bash
kubectl create secret generic kubeconfig \
  --from-file=config=/path/to/your/kubeconfig \
  -n kubeintel
```

## 🔐 Security

### RBAC Permissions

The application requires specific permissions to manage Kubernetes resources. The `k8s/rbac.yaml` file defines:

- **ClusterRole**: Permissions to read/list/watch most resources
- **ServiceAccount**: Identity for the application pods
- **ClusterRoleBinding**: Links the role to the service account

### Network Policies

Consider implementing network policies to restrict traffic:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: kubeintel-netpol
  namespace: kubeintel
spec:
  podSelector:
    matchLabels:
      app: kubeintel
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 6443  # Kubernetes API
```

## 🏗️ Architecture

### Components

1. **Frontend**: React application served as static files
2. **Backend**: Node.js/Express API server
3. **WebSocket**: Real-time features (logs, shell access)
4. **kubectl**: Command-line tool for Kubernetes operations

### API Endpoints

- `GET /health` - Health check
- `POST /api/kubernetes/*` - Kubernetes operations
- `POST /api/credentials/*` - Credential management
- `POST /api/config/*` - Configuration operations
- `WebSocket /ws` - Real-time features

### Data Flow

```
Browser → Ingress → Service → Pod → Kubernetes API
                              ↓
                         kubectl commands
```

## 🔄 Development

### Local Development

1. Start the backend:
```bash
cd server
npm run dev
```

2. Start the frontend:
```bash
pnpm dev
```

The frontend will proxy API calls to the backend running on port 3001.

### Hot Reload

Both frontend and backend support hot reload during development:

- Frontend: Vite HMR
- Backend: tsx watch mode

## 📊 Monitoring

### Health Checks

The application includes health check endpoints:

- **Liveness Probe**: `/health`
- **Readiness Probe**: `/health`

### Logging

Logs are written to stdout and can be viewed with:

```bash
kubectl logs -f deployment/kubeintel -n kubeintel
```

### Metrics

Consider adding Prometheus metrics for monitoring:

```bash
# Install Prometheus operator
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml

# Add ServiceMonitor for KubeIntel
kubectl apply -f monitoring/servicemonitor.yaml
```

## 🚨 Troubleshooting

### Common Issues

1. **Pod not starting**:
   ```bash
   kubectl describe pod -l app=kubeintel -n kubeintel
   kubectl logs -l app=kubeintel -n kubeintel
   ```

2. **Cannot access application**:
   - Check ingress configuration
   - Verify DNS resolution
   - Check ingress controller logs

3. **Kubernetes API errors**:
   - Verify RBAC permissions
   - Check service account configuration
   - Ensure kubectl is available in the container

4. **WebSocket connection issues**:
   - Check ingress WebSocket configuration
   - Verify proxy settings
   - Check firewall rules

### Debug Commands

```bash
# Check deployment status
kubectl get deployment kubeintel -n kubeintel -o wide

# Check pod logs
kubectl logs -f -l app=kubeintel -n kubeintel

# Check ingress
kubectl describe ingress kubeintel -n kubeintel

# Test internal connectivity
kubectl exec -it deployment/kubeintel -n kubeintel -- curl localhost:3001/health
```

## 🔄 Updates

### Updating the Application

1. Build new image:
```bash
docker build -t kubeintel:v1.1.0 .
```

2. Update deployment:
```bash
kubectl set image deployment/kubeintel kubeintel=kubeintel:v1.1.0 -n kubeintel
```

3. Monitor rollout:
```bash
kubectl rollout status deployment/kubeintel -n kubeintel
```

### Rolling Back

```bash
kubectl rollout undo deployment/kubeintel -n kubeintel
```

## 📝 Migration from Tauri

### Key Changes

1. **Invoke calls → HTTP API calls**: All `invoke()` calls replaced with fetch requests
2. **File system access**: Limited to server-side operations
3. **Clipboard**: Uses Web API instead of Tauri plugin
4. **Process management**: Handled server-side via kubectl
5. **Window management**: Standard web browser behavior

### Breaking Changes

- No longer runs as a desktop application
- File picker functionality requires manual kubeconfig upload/paste
- Some system-level operations may be restricted
- Terminal access through WebSocket instead of native PTY

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with both development and production deployments
5. Submit a pull request

## 📄 License

This project maintains the same license as the original KubeIntel application.