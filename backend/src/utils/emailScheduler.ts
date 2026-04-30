import nodemailer from 'nodemailer';
import cron from 'node-cron';
import { addDays, differenceInDays, format, startOfDay } from 'date-fns';
import { prisma } from '../index';

const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465, // true for SSL (port 465), false for STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendBidReminder(
  email: string,
  schoolName: string,
  agencyName: string,
  bidDueDate: Date,
  daysUntilDue: number
): Promise<void> {
  const subject = daysUntilDue === 0
    ? `URGENT: ${schoolName} bid due TODAY`
    : `Reminder: ${schoolName} bid due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`;

  const body = `
Dear Bidder,

This is a reminder that the bid for ${schoolName} (${agencyName}) is due on ${format(bidDueDate, 'MMMM d, yyyy')} at ${format(bidDueDate, 'h:mm a')}.

${daysUntilDue === 0 ? '⚠️ This bid is due TODAY. Please submit your bid immediately.' : ''}

Project Details:
- School: ${schoolName}
- Agency: ${agencyName}
- Bid Due Date: ${format(bidDueDate, 'MMMM d, yyyy h:mm a')}
- Days Until Due: ${daysUntilDue}

Please ensure all required documents are submitted before the deadline.

Best regards,
Bids Tracker
`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    });
    console.log(`✅ Email sent to ${email} for ${schoolName}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error);
  }
}

async function checkAndSendReminders(): Promise<void> {
  try {
    const today = startOfDay(new Date());
    const threeDaysFromNow = addDays(today, 3);
    const oneDayFromNow = addDays(today, 1);

    const projects = await prisma.project.findMany({
      where: {
        bidDueDate: {
          gte: today,
          lte: threeDaysFromNow
        }
      },
      include: {
        user: {
          select: { email: true, name: true }
        },
        agency: {
          select: { name: true }
        }
      }
    });

    console.log(`📧 Checking ${projects.length} projects for bid reminders...`);

    for (const project of projects) {
      const daysUntilDue = differenceInDays(startOfDay(project.bidDueDate), today);

      if ([0, 1, 3].includes(daysUntilDue)) {
        await sendBidReminder(
          project.user.email,
          project.schoolName,
          project.agency.name,
          project.bidDueDate,
          daysUntilDue
        );
      }
    }

    console.log('✅ Bid reminder check completed');
  } catch (error) {
    console.error('❌ Error checking bid reminders:', error);
  }
}

export function initEmailScheduler(): void {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️  Email configuration not set. Skipping email scheduler.');
    return;
  }

  cron.schedule('0 8 * * *', checkAndSendReminders, {
    timezone: 'America/New_York'
  });

  console.log('✅ Email scheduler scheduled for 8:00 AM daily');

  setTimeout(checkAndSendReminders, 5000);
}

export { checkAndSendReminders };

// Team notification functions

interface TeamNotificationParams {
  schoolName: string;
  agencyName: string;
  bidDueDate: Date;
  preBidWalkthroughDate?: Date;
  description?: string;
  address?: string;
}

async function sendTeamNotification(
  email: string,
  recipientName: string,
  type: 'new_project' | 'timing_change' | 'new_addendum',
  params: TeamNotificationParams & { addendumDate?: Date; createdBy?: string }
): Promise<void> {
  let subject: string;
  let body: string;

  const projectDetails = `
Project Details:
- School: ${params.schoolName}
- Agency: ${params.agencyName}
- Bid Due Date: ${format(params.bidDueDate, 'MMMM d, yyyy h:mm a')}
${params.preBidWalkthroughDate ? `- Pre-Bid Walkthrough: ${format(params.preBidWalkthroughDate, 'MMMM d, yyyy h:mm a')}` : ''}
${params.address ? `- Address: ${params.address}` : ''}
${params.description ? `- Description: ${params.description}` : ''}
`;

  switch (type) {
    case 'new_project':
      subject = `New Project Added: ${params.schoolName}`;
      body = `
Dear ${recipientName},

A new project has been added to the Bids Tracker system.

${projectDetails}

Please review this project and take appropriate action.

Best regards,
Bids Tracker
`;
      break;

    case 'timing_change':
      subject = `⚠️ Timing Update: ${params.schoolName}`;
      body = `
Dear ${recipientName},

Important timing changes have been made to a project.

${projectDetails}

Please update your schedules accordingly.

Best regards,
Bids Tracker
`;
      break;

    case 'new_addendum':
      subject = `New Addendum: ${params.schoolName}`;
      body = `
Dear ${recipientName},

A new addendum has been added to a project.

${projectDetails}
- Addendum Date: ${params.addendumDate ? format(params.addendumDate, 'MMMM d, yyyy') : 'N/A'}

Please review this addendum as it may affect your bid preparation.

Best regards,
Bids Tracker
`;
      break;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      text: body.trim(),
      html: body.trim().replace(/\n/g, '<br>')
    });
    console.log(`✅ Team notification sent to ${email} for ${params.schoolName} (${type})`);
  } catch (error) {
    console.error(`❌ Failed to send team notification to ${email}:`, error);
  }
}

export async function notifyTeamNewProject(
  schoolName: string,
  agencyName: string,
  bidDueDate: Date,
  preBidWalkthroughDate: Date,
  description: string,
  address: string,
  createdByUserId: string
): Promise<void> {
  try {
    // Get all team members except the creator
    const teamMembers = await prisma.user.findMany({
      where: {
        id: { not: createdByUserId }
      },
      select: {
        email: true,
        name: true
      }
    });

    if (teamMembers.length === 0) {
      console.log('No team members to notify');
      return;
    }

    console.log(`Sending new project notifications to ${teamMembers.length} team members...`);

    for (const member of teamMembers) {
      await sendTeamNotification(
        member.email,
        member.name,
        'new_project',
        {
          schoolName,
          agencyName,
          bidDueDate,
          preBidWalkthroughDate,
          description,
          address
        }
      );
    }
  } catch (error) {
    console.error('Error notifying team about new project:', error);
  }
}

export async function notifyTeamTimingChange(
  projectId: string,
  schoolName: string,
  agencyName: string,
  bidDueDate: Date,
  preBidWalkthroughDate: Date,
  description: string,
  address: string,
  changedByUserId: string
): Promise<void> {
  try {
    // Get all team members except the person who made the change
    const teamMembers = await prisma.user.findMany({
      where: {
        id: { not: changedByUserId }
      },
      select: {
        email: true,
        name: true
      }
    });

    if (teamMembers.length === 0) {
      console.log('No team members to notify');
      return;
    }

    console.log(`Sending timing change notifications to ${teamMembers.length} team members...`);

    for (const member of teamMembers) {
      await sendTeamNotification(
        member.email,
        member.name,
        'timing_change',
        {
          schoolName,
          agencyName,
          bidDueDate,
          preBidWalkthroughDate,
          description,
          address
        }
      );
    }
  } catch (error) {
    console.error('Error notifying team about timing change:', error);
  }
}

export async function notifyTeamNewAddendum(
  projectId: string,
  addendumDate: Date,
  changedByUserId: string
): Promise<void> {
  try {
    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        agency: {
          select: { name: true }
        }
      }
    });

    if (!project) {
      console.error('Project not found for addendum notification');
      return;
    }

    // Get all team members except the person who added the addendum
    const teamMembers = await prisma.user.findMany({
      where: {
        id: { not: changedByUserId }
      },
      select: {
        email: true,
        name: true
      }
    });

    if (teamMembers.length === 0) {
      console.log('No team members to notify');
      return;
    }

    console.log(`Sending addendum notifications to ${teamMembers.length} team members...`);

    for (const member of teamMembers) {
      await sendTeamNotification(
        member.email,
        member.name,
        'new_addendum',
        {
          schoolName: project.schoolName,
          agencyName: project.agency.name,
          bidDueDate: project.bidDueDate,
          preBidWalkthroughDate: project.preBidWalkthroughDate,
          description: project.description,
          address: project.address,
          addendumDate
        }
      );
    }
  } catch (error) {
    console.error('Error notifying team about new addendum:', error);
  }
}
