This is the frontend-only Shrimp News website, built with [Next.js](https://nextjs.org). It does not require a database.

## Market ticker API

The ticker uses built-in demo data unless `NEXT_PUBLIC_MARKET_DATA_API_URL` is set. To connect a live provider, configure that variable in the deployment environment with a public, CORS-enabled HTTPS endpoint.

The endpoint must return the same response shape as the demo adapter:

```json
{
  "items": [
    {
      "symbol": "VAN_C40",
      "label": "Vannamei C40",
      "price": 362,
      "currency": "INR",
      "unit": "kg",
      "changePercent": 8,
      "direction": "up",
      "sourceName": "Market provider",
      "isLive": true,
      "observedAt": "2026-07-17T10:00:00.000Z",
      "updatedAt": "2026-07-17T10:00:00.000Z"
    }
  ],
  "source": "market-provider",
  "isFallback": false,
  "fetchedAt": "2026-07-17T10:00:00.000Z"
}
```

Because the browser calls this endpoint directly, do not put private API keys in `NEXT_PUBLIC_` environment variables. If a provider requires a secret, expose a separate secured proxy endpoint and use its public URL here.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
