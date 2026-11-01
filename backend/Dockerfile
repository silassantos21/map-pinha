FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Shell form (não exec form) de propósito: precisa expandir $PORT, que a
# Render injeta dinamicamente em produção (padrão ali é não assumir uma porta
# fixa). Sem a env var (ex: build local fora do docker-compose), cai em 8000.
# Sem --reload aqui — é o comando de produção; o docker-compose.yml sobrescreve
# com --reload pro ambiente de desenvolvimento local (ver `command:` lá).
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
