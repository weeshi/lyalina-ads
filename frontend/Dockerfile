# ═══════════════════════════════════════════════════════════════
#  مرحلة البناء (Build) — Node 20 + pnpm
# ═══════════════════════════════════════════════════════════════
FROM node:20-alpine AS build

# تفعيل pnpm (Corepack)
RUN corepack enable && corepack prepare pnpm@latest --activate

# مجلد العمل داخل الحاوية
WORKDIR /app

# نسخ ملفات الاعتماديات أولاً (للاستفادة من التخزين المؤقت للطبقات)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# نسخ باقي الكود المصدري وبناء الإنتاج
COPY . .
# تمرير متغيرات البناء عبر --build-arg (أو ملف .env.docker)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_FIREBASE_APP_PATH
ARG VITE_GEMINI_API_KEY
RUN pnpm build

# ═══════════════════════════════════════════════════════════════
#  مرحلة التشغيل (Runtime) — Nginx لخدمة الملفات الثابتة (SPA)
# ═══════════════════════════════════════════════════════════════
FROM nginx:1.27-alpine AS runtime

# نسخ ناتج البناء إلى مجلد خادم Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# تهيئة Nginx مع دعم التوجيه SPA (fallback إلى index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
