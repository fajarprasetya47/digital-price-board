#!/bin/sh
set -e

echo ">>> Menjalankan migrasi database..."
npx prisma migrate deploy

if [ "${SEED}" = "1" ]; then
  echo ">>> Menjalankan seed..."
  npx prisma db seed
fi

echo ">>> Menjalankan Next.js..."
exec npm run start