# Studio UDN Next.js

Next.js conversion of the Studio Undesignated homepage with API routes for customer and payment records.

## Development

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run dev
```

Set `NEXT_PUBLIC_TOSS_CLIENT_KEY` and `TOSS_SECRET_KEY` to connect Toss Payments. Without those keys, the checkout form stores a pending local order for development.
