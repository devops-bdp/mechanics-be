# Deployment Guide untuk Backend ke Vercel

## Prerequisites
1. Akun Vercel (https://vercel.com)
2. Database sudah di-setup (PostgreSQL)
3. Environment variables sudah disiapkan

## Langkah-langkah Deployment

### 1. Install Vercel CLI (jika belum)
```bash
npm install -g vercel
```

### 2. Login ke Vercel
```bash
vercel login
```

### 3. Setup Environment Variables di Vercel Dashboard
Setelah project dibuat di Vercel, tambahkan environment variables berikut:
- `DATABASE_URL` - Connection string ke PostgreSQL database
- `DIRECT_URL` - Direct connection string (optional, untuk connection pooling)
- `JWT_SECRET` - Secret key untuk JWT token
- `NODE_ENV` - Set ke "production"
- `CLOUDINARY_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

### 4. Deploy ke Vercel

**Opsi A: Deploy via Vercel Dashboard (Recommended)**
1. Push code ke GitHub/GitLab/Bitbucket
2. Import project di Vercel Dashboard
3. Set Root Directory ke `mar-be`
4. Set Build Command: `npm run vercel-build`
5. Set Output Directory: (kosongkan, karena ini serverless function)
6. Set Install Command: `npm install`
7. Deploy!

**Opsi B: Deploy via CLI**
```bash
cd mar-be
vercel
```

### 5. Set Environment Variables via CLI (Alternatif)
```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add NODE_ENV
vercel env add CLOUDINARY_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
```

### 6. Production Deployment
```bash
vercel --prod
```

## Catatan Penting

1. **TIDAK PERLU `npm run build` secara manual** - Vercel akan otomatis menjalankan build command yang sudah dikonfigurasi di `package.json` (script `vercel-build`)

2. **Prisma Generate** - Script `vercel-build` sudah include `prisma generate`, jadi Prisma Client akan otomatis di-generate saat build

3. **Database Connection** - Pastikan `DATABASE_URL` sudah di-set di Vercel Environment Variables

4. **CORS** - Sudah dikonfigurasi di `src/index.ts` untuk allow semua origin. Jika perlu, sesuaikan untuk production.

5. **File Structure** - Vercel akan menggunakan `src/index.ts` sebagai entry point (sudah dikonfigurasi di `vercel.json`)

## Troubleshooting

### Error: Cannot find module
- Pastikan semua dependencies sudah di-install
- Pastikan `prisma generate` sudah dijalankan (sudah include di `vercel-build`)

### Database Connection Error
- Pastikan `DATABASE_URL` sudah benar di Vercel Environment Variables
- Pastikan database allow connection dari Vercel IP

### Build Error
- Check log di Vercel Dashboard
- Pastikan TypeScript compilation berhasil
- Pastikan semua dependencies compatible

## Testing Deployment

Setelah deploy, test endpoint:
```
https://your-project.vercel.app/api/auth/login
```

## Update Frontend API URL

Setelah backend ter-deploy, update `NEXT_PUBLIC_API_URL` di frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=https://your-project.vercel.app
```

