import cors from 'cors';
import express from 'express';
import { config, getEnabledSocialProviders } from './config.js';
import authRoutes from './auth/routes.js';
import oauthRoutes from './auth/oauth.js';
import conversationRoutes from './conversations/routes.js';

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    socialProviders: getEnabledSocialProviders()
  });
});

app.use('/api/auth', authRoutes);
app.use(oauthRoutes);
app.use('/api/conversations', conversationRoutes);

app.use((error, _req, res, _next) => {
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: '허용되지 않은 요청 출처입니다.' });
  }
  console.error('[server]', error);
  return res.status(500).json({ message: '요청을 처리하지 못했습니다.' });
});

app.listen(config.port, () => {
  console.log(`Maeumari API listening on http://localhost:${config.port}`);
  console.log(`Enabled social providers: ${getEnabledSocialProviders().join(', ') || 'none'}`);
});
