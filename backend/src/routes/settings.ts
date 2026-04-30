import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const SALT_ROUNDS = 10;

router.use(authenticate);

// Get current user settings
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email required')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email } = req.body;
    const updateData: any = {};
    const userId = req.user!.id;

    // Regular users can only change their name
    if (name) {
      updateData.name = name;
    }

    // Only admins can change email
    if (email) {
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Only admins can change email' });
      }

      // Check if email is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      updateData.email = email;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Change password
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get email settings (admin only)
router.get('/email', async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const emailSettings = {
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: process.env.SMTP_PORT || '',
      smtpUser: process.env.SMTP_USER || '',
      emailFrom: process.env.EMAIL_FROM || '',
      // Don't send the password for security
      hasPassword: !!process.env.SMTP_PASS
    };

    res.json(emailSettings);
  } catch (error) {
    console.error('Get email settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update email settings (admin only)
router.put('/email', [
  body('smtpHost').notEmpty().withMessage('SMTP host is required'),
  body('smtpPort').notEmpty().withMessage('SMTP port is required'),
  body('smtpUser').notEmpty().withMessage('SMTP username is required'),
  body('emailFrom').notEmpty().withMessage('From email is required')
], async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { smtpHost, smtpPort, smtpUser, smtpPass, emailFrom } = req.body;

    // In a real application, you would update environment variables or a config file
    // For now, we'll just confirm the settings (they would need to be manually updated in .env)
    // Alternatively, you could store these in a database settings table

    // Update the .env file (this is a simplified approach)
    const fs = await import('fs');
    const path = await import('path');

    try {
      const envPath = path.join(process.cwd(), '.env');
      let envContent = fs.readFileSync(envPath, 'utf8');

      // Update each setting
      const settings = [
        { key: 'SMTP_HOST', value: smtpHost },
        { key: 'SMTP_PORT', value: smtpPort },
        { key: 'SMTP_USER', value: smtpUser },
        { key: 'EMAIL_FROM', value: emailFrom }
      ];

      if (smtpPass) {
        settings.push({ key: 'SMTP_PASS', value: smtpPass });
      }

      for (const setting of settings) {
        const regex = new RegExp(`^${setting.key}=.*$`, 'm');
        if (envContent.match(regex)) {
          envContent = envContent.replace(regex, `${setting.key}=${setting.value}`);
        } else {
          envContent += `\n${setting.key}=${setting.value}`;
        }
      }

      fs.writeFileSync(envPath, envContent);

      // Note: The application needs to be restarted for these changes to take effect
      res.json({
        message: 'Email settings updated. Restart the application for changes to take effect.',
        needsRestart: true
      });
    } catch (fileError) {
      console.error('Error updating .env file:', fileError);
      return res.status(500).json({ message: 'Failed to update email settings' });
    }
  } catch (error) {
    console.error('Update email settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
