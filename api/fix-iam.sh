#!/bin/bash
set -e

PROJECT=delivery-worksheet-app
SA=481756503401-compute@developer.gserviceaccount.com

echo -n "Enter the API key Clover will use: "
read -r API_KEY

echo "Creating secret..."
gcloud secrets create produce-ingest-api-key \
    --replication-policy="automatic" \
    --project=$PROJECT 2>/dev/null || echo "Secret already exists"

echo "Storing API key value..."
printf '%s' "$API_KEY" | gcloud secrets versions add produce-ingest-api-key \
    --data-file=- \
    --project=$PROJECT

echo "Granting access..."
gcloud secrets add-iam-policy-binding produce-ingest-api-key \
    --member="serviceAccount:${SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --project=$PROJECT

echo "Done. Run ./deploy.sh to deploy."
