FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    "fastapi>=0.111.0" \
    "uvicorn>=0.30.0" \
    "firebase-admin>=6.0.0" \
    "python-multipart>=0.0.6"

COPY app.py .

ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port $PORT"]
