import { Injectable } from '@angular/core';

export interface CloudTargetPreset {
  id: string;
  name: string;
  provider: 'gcp' | 'aws' | 'vercel' | 'flyio' | 'railway' | 'render' | 'ghcr';
  category: 'containers' | 'serverless' | 'static' | 'paas';
  description: string;
  iconSvg: string;
  requiredSecrets: { key: string; description: string; placeholder: string }[];
  defaultBranch: string;
  yamlTemplate: string;
}

@Injectable({
  providedIn: 'root'
})
export class CloudExportersService {
  readonly presets: CloudTargetPreset[] = [
    {
      id: 'gcp-cloudrun',
      name: 'Google Cloud Run',
      provider: 'gcp',
      category: 'serverless',
      description: 'Deploy auto-scaling containerized microservices to Google Cloud Run with zero cold starts.',
      iconSvg: 'cloud',
      requiredSecrets: [
        { key: 'GCP_PROJECT_ID', description: 'Google Cloud Project ID', placeholder: 'my-gcp-project-12345' },
        { key: 'GCP_SA_KEY', description: 'Service Account JSON Key (Base64 encoded)', placeholder: 'eyJhbGciOiJSUzI1NiIsImt5cCI6IkpXVCJ9...' },
        { key: 'GCP_SERVICE_NAME', description: 'Cloud Run Service Name', placeholder: 'api-production' }
      ],
      defaultBranch: 'main',
      yamlTemplate: `name: Deploy to Google Cloud Run

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  id-token: write

jobs:
  deploy:
    name: Build & Deploy to Cloud Run
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: \${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Google Artifact Registry
        run: |
          gcloud auth configure-docker asia-southeast1-docker.pkg.dev --quiet

      - name: Build & Push Container Image
        run: |
          IMAGE_URI="asia-southeast1-docker.pkg.dev/\${{ secrets.GCP_PROJECT_ID }}/apps/\${{ secrets.GCP_SERVICE_NAME }}:\${{ github.sha }}"
          docker build -t "$IMAGE_URI" .
          docker push "$IMAGE_URI"

      - name: Deploy to Cloud Run
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: \${{ secrets.GCP_SERVICE_NAME }}
          region: asia-southeast1
          image: asia-southeast1-docker.pkg.dev/\${{ secrets.GCP_PROJECT_ID }}/apps/\${{ secrets.GCP_SERVICE_NAME }}:\${{ github.sha }}
          flags: '--allow-unauthenticated --memory=512Mi --cpu=1'
`
    },
    {
      id: 'aws-ecs',
      name: 'AWS ECS & Fargate',
      provider: 'aws',
      category: 'containers',
      description: 'Build Docker container, push to Amazon ECR, and update Amazon ECS task definition.',
      iconSvg: 'dns',
      requiredSecrets: [
        { key: 'AWS_ACCESS_KEY_ID', description: 'AWS IAM User Access Key ID', placeholder: 'AKIAIOSFODNN7EXAMPLE' },
        { key: 'AWS_SECRET_ACCESS_KEY', description: 'AWS IAM User Secret Access Key', placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' },
        { key: 'AWS_REGION', description: 'AWS Region', placeholder: 'us-east-1' },
        { key: 'ECR_REPOSITORY', description: 'Amazon ECR Repository Name', placeholder: 'prod-backend-api' }
      ],
      defaultBranch: 'main',
      yamlTemplate: `name: Deploy to Amazon ECS

on:
  push:
    branches: [ main ]

permissions:
  contents: read

jobs:
  deploy:
    name: Deploy to Amazon ECS Fargate
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: \${{ secrets.AWS_REGION }}

      - name: Log in to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: \${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: \${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/\${{ secrets.ECR_REPOSITORY }}:$IMAGE_TAG .
          docker push $ECR_REGISTRY/\${{ secrets.ECR_REPOSITORY }}:$IMAGE_TAG

      - name: Update ECS Task Definition & Deploy
        uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: task-definition.json
          service: app-service
          cluster: prod-cluster
          wait-for-service-stability: true
`
    },
    {
      id: 'aws-s3-cloudfront',
      name: 'AWS S3 & CloudFront (Static SPA)',
      provider: 'aws',
      category: 'static',
      description: 'Sync static production assets to S3 bucket and issue CloudFront edge cache invalidation.',
      iconSvg: 'web',
      requiredSecrets: [
        { key: 'AWS_ACCESS_KEY_ID', description: 'AWS IAM Access Key ID', placeholder: 'AKIAIOSFODNN7EXAMPLE' },
        { key: 'AWS_SECRET_ACCESS_KEY', description: 'AWS IAM Secret Access Key', placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' },
        { key: 'S3_BUCKET_NAME', description: 'Target S3 Bucket Name', placeholder: 'app-production-assets' },
        { key: 'CLOUDFRONT_DIST_ID', description: 'CloudFront Distribution ID for cache purge', placeholder: 'E1234EXAMPLE' }
      ],
      defaultBranch: 'main',
      yamlTemplate: `name: Deploy SPA to AWS S3 & CloudFront

on:
  push:
    branches: [ main ]

permissions:
  contents: read

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Production Bundle
        run: npm run build

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Sync static files to AWS S3
        run: |
          aws s3 sync dist/ s3://\${{ secrets.S3_BUCKET_NAME }} --delete --cache-control "public, max-age=31536000, immutable"

      - name: Invalidate CloudFront CDN Cache
        run: |
          aws cloudfront create-invalidation --distribution-id \${{ secrets.CLOUDFRONT_DIST_ID }} --paths "/*"
`
    },
    {
      id: 'vercel-deploy',
      name: 'Vercel Preview & Production',
      provider: 'vercel',
      category: 'paas',
      description: 'Deploy frontend frameworks and Next.js / Vite apps with edge network routing.',
      iconSvg: 'bolt',
      requiredSecrets: [
        { key: 'VERCEL_TOKEN', description: 'Vercel Personal Access Token', placeholder: 'vca_xxxxxxxxxxxxxxxxxxxxxxxx' },
        { key: 'VERCEL_ORG_ID', description: 'Vercel Organization ID', placeholder: 'team_xxxxxxxxxxxxxxxxxxxxxxxx' },
        { key: 'VERCEL_PROJECT_ID', description: 'Vercel Project ID', placeholder: 'prj_xxxxxxxxxxxxxxxxxxxxxxxx' }
      ],
      defaultBranch: 'main',
      yamlTemplate: `name: Deploy to Vercel

on:
  push:
    branches: [ main ]

permissions:
  contents: read

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=\${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Artifacts
        run: vercel build --prod --token=\${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=\${{ secrets.VERCEL_TOKEN }}
`
    },
    {
      id: 'ghcr-docker-buildx',
      name: 'GitHub Packages (GHCR) Multi-Arch',
      provider: 'ghcr',
      category: 'containers',
      description: 'Build multi-arch (AMD64 & ARM64) Docker images with Buildx and push to ghcr.io with GitHub token.',
      iconSvg: 'layers',
      requiredSecrets: [
        { key: 'GITHUB_TOKEN', description: 'Automatic runner token (no manual creation required)', placeholder: 'Auto-injected by runner' }
      ],
      defaultBranch: 'main',
      yamlTemplate: `name: Build and Push Multi-Arch Docker Image (GHCR)

on:
  push:
    branches: [ main ]
    tags: [ 'v*.*.*' ]

permissions:
  contents: read
  packages: write

jobs:
  docker-ghcr:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up QEMU (Multi-Arch support)
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry (GHCR)
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata (tags, labels) for Docker
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/\${{ github.repository }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
`
    },
    {
      id: 'flyio-deploy',
      name: 'Fly.io Global Application',
      provider: 'flyio',
      category: 'paas',
      description: 'Deploy lightweight containerized servers worldwide close to users on Fly.io.',
      iconSvg: 'flight_takeoff',
      requiredSecrets: [
        { key: 'FLY_API_TOKEN', description: 'Fly.io Access Token (generated via "fly auth token")', placeholder: 'FlyV1 fm2_xxxxxxxxxxxxxxxxxxxx' }
      ],
      defaultBranch: 'main',
      yamlTemplate: `name: Deploy to Fly.io

on:
  push:
    branches: [ main ]

permissions:
  contents: read

jobs:
  deploy:
    name: Deploy to Fly.io
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - name: Deploy application
        run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: \${{ secrets.FLY_API_TOKEN }}
`
    },
    {
      id: 'railway-deploy',
      name: 'Railway Cloud',
      provider: 'railway',
      category: 'paas',
      description: 'Deploy full-stack web applications and microservices effortlessly with Railway CLI.',
      iconSvg: 'train',
      requiredSecrets: [
        { key: 'RAILWAY_TOKEN', description: 'Railway Project Token', placeholder: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX' }
      ],
      defaultBranch: 'main',
      yamlTemplate: `name: Deploy to Railway

on:
  push:
    branches: [ main ]

permissions:
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Railway CLI
        run: npm i -g @railway/cli
      - name: Deploy to Railway
        run: railway up --service prod-backend --detach
        env:
          RAILWAY_TOKEN: \${{ secrets.RAILWAY_TOKEN }}
`
    }
  ];
}
