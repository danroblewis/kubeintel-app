#!/bin/bash

# KubeIntel Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting KubeIntel deployment...${NC}"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed or not in PATH${NC}"
    exit 1
fi

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
    exit 1
fi

# Build Docker image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -t kubeintel:latest .

# Apply Kubernetes manifests
echo -e "${YELLOW}🔧 Applying Kubernetes manifests...${NC}"

# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply RBAC
kubectl apply -f k8s/rbac.yaml

# Apply ConfigMap
kubectl apply -f k8s/configmap.yaml

# Apply Deployment
kubectl apply -f k8s/deployment.yaml

# Apply Service
kubectl apply -f k8s/service.yaml

# Apply Ingress
kubectl apply -f k8s/ingress.yaml

# Wait for deployment to be ready
echo -e "${YELLOW}⏳ Waiting for deployment to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/kubeintel -n kubeintel

# Get service information
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${YELLOW}📋 Service Information:${NC}"
kubectl get pods,svc,ingress -n kubeintel

echo -e "${GREEN}🎉 KubeIntel is now running on your Kubernetes cluster!${NC}"
echo -e "${YELLOW}💡 Access the application at: http://kubeintel.local (or your configured domain)${NC}"
echo -e "${YELLOW}📝 Don't forget to update the ingress host in k8s/ingress.yaml with your actual domain${NC}"