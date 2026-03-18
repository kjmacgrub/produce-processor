#!/bin/bash
# Deploy Produce Processor Ingest API to Google Cloud Run
#
# Prerequisites:
#   1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install
#   2. Run: gcloud auth login
#
# First-time setup (run once):
#   ./deploy.sh setup
#
# Deploy:
#   ./deploy.sh

set -e

PROJECT_ID="delivery-worksheet-app"
REGION="us-east1"
SERVICE_NAME="produce-ingest-api"
SECRET_NAME="produce-firebase-service-account"
API_KEY_SECRET="produce-ingest-api-key"

if [ "$1" = "setup" ]; then
    echo "=== First-time setup ==="

    echo "Enabling Cloud Run, Cloud Build, and Secret Manager APIs..."
    gcloud services enable \
        run.googleapis.com \
        cloudbuild.googleapis.com \
        secretmanager.googleapis.com \
        --project=$PROJECT_ID

    echo "Storing Firebase credentials in Secret Manager..."
    gcloud secrets create $SECRET_NAME \
        --replication-policy="automatic" \
        --project=$PROJECT_ID 2>/dev/null || echo "Secret already exists"

    gcloud secrets versions add $SECRET_NAME \
        --data-file=firebase-service-account.json \
        --project=$PROJECT_ID

    echo ""
    echo -n "Enter the API key Clover will use (X-API-Key header): "
    read -r INGEST_API_KEY
    echo "Storing API key in Secret Manager..."
    gcloud secrets create $API_KEY_SECRET \
        --replication-policy="automatic" \
        --project=$PROJECT_ID 2>/dev/null || echo "Secret already exists"
    printf '%s' "$INGEST_API_KEY" | gcloud secrets versions add $API_KEY_SECRET \
        --data-file=- \
        --project=$PROJECT_ID

    PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
    for SECRET in $SECRET_NAME $API_KEY_SECRET; do
        gcloud secrets add-iam-policy-binding $SECRET \
            --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
            --role="roles/secretmanager.secretAccessor" \
            --project=$PROJECT_ID
    done

    echo ""
    echo "=== Setup complete! Now run: ./deploy.sh ==="
    exit 0
fi

echo "=== Deploying Produce Ingest API to Cloud Run ==="

gcloud run deploy $SERVICE_NAME \
    --source . \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --set-secrets="/secrets/firebase-service-account.json=${SECRET_NAME}:latest,INGEST_API_KEY=${API_KEY_SECRET}:latest" \
    --set-env-vars="FIREBASE_SERVICE_ACCOUNT=/secrets/firebase-service-account.json,FIREBASE_STORAGE_BUCKET=process-6d2dc.firebasestorage.app" \
    --memory=256Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=2 \
    --timeout=60

echo ""
echo "=== Deploy complete! ==="
gcloud run services describe $SERVICE_NAME --region $REGION --project $PROJECT_ID --format="value(status.url)"
