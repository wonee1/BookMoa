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

# 빌드 단계에서 복사한 내용 복사
COPY --from=builder /app /app

# 3000 포트 사용
EXPOSE 3000           

CMD ["npm", "start"]
