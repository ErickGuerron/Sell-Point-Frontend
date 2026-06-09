import type { APIRoute } from 'astro';

type RuntimeFirebaseConfig = {
  PUBLIC_FIREBASE_API_KEY: string;
  PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  PUBLIC_FIREBASE_PROJECT_ID: string;
  PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  PUBLIC_FIREBASE_APP_ID: string;
};

function readEnv(name: keyof RuntimeFirebaseConfig): string {
  return process.env[name] || import.meta.env[name] || '';
}

export const GET: APIRoute = () => {
  const payload: RuntimeFirebaseConfig = {
    PUBLIC_FIREBASE_API_KEY: readEnv('PUBLIC_FIREBASE_API_KEY'),
    PUBLIC_FIREBASE_AUTH_DOMAIN: readEnv('PUBLIC_FIREBASE_AUTH_DOMAIN'),
    PUBLIC_FIREBASE_PROJECT_ID: readEnv('PUBLIC_FIREBASE_PROJECT_ID'),
    PUBLIC_FIREBASE_STORAGE_BUCKET: readEnv('PUBLIC_FIREBASE_STORAGE_BUCKET'),
    PUBLIC_FIREBASE_MESSAGING_SENDER_ID: readEnv('PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    PUBLIC_FIREBASE_APP_ID: readEnv('PUBLIC_FIREBASE_APP_ID'),
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
};
