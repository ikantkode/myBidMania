import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { checkAndSendReminders } from '../utils/emailScheduler';

const router = Router();

router.use(authenticate);

router.post('/send-reminders', async (req: AuthRequest, res) => {
  try {
    await checkAndSendReminders();
    res.json({ message: 'Bid reminders sent successfully' });
  } catch (error) {
    console.error('Send reminders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/status', async (req: AuthRequest, res) => {
  try {
    const hasEmailConfig = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

    res.json({
      emailConfigured: hasEmailConfig,
      smtpHost: process.env.SMTP_HOST || null,
      emailFrom: process.env.EMAIL_FROM || null
    });
  } catch (error) {
    console.error('Get notification status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
