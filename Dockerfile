# --- 1단계: Build 단계 ---
FROM node:18-alpine AS builder

WORKDIR /app

# package.json 먼저 복사 → node_modules 캐싱
COPY package*.json ./
RUN npm install --only=production

# 나머지 소스 복사
COPY . .

# --- 2단계: 실행 단계 ---
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 3000            # ← 여기 3000으로 변경

CMD ["npm", "start"]
