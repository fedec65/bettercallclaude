import cors from 'cors';

export const corsMiddleware = cors({
  origin: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
});
