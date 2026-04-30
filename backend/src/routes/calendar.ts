import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/events', async (req: AuthRequest, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      include: {
        agency: {
          select: {
            id: true,
            name: true
          }
        },
        addenda: true
      },
      orderBy: { bidDueDate: 'asc' }
    });

    const events = projects.flatMap(project => {
      const projectEvents = [
        {
          id: `bid-${project.id}`,
          title: `${project.schoolName} - Bid Due`,
          start: project.bidDueDate.toISOString(),
          backgroundColor: '#ef4444',
          borderColor: '#ef4444',
          extendedProps: {
            type: 'bid',
            projectId: project.id,
            schoolName: project.schoolName,
            address: project.address,
            agency: project.agency.name,
            agencyId: project.agency.id
          }
        },
        {
          id: `walkthrough-${project.id}`,
          title: `${project.schoolName} - Walkthrough`,
          start: project.preBidWalkthroughDate.toISOString(),
          backgroundColor: '#3b82f6',
          borderColor: '#3b82f6',
          extendedProps: {
            type: 'walkthrough',
            projectId: project.id,
            schoolName: project.schoolName,
            address: project.address,
            agency: project.agency.name,
            agencyId: project.agency.id
          }
        },
        ...project.addenda.map(addendum => ({
          id: `addendum-${addendum.id}`,
          title: `${project.schoolName} - Addendum`,
          start: addendum.addendumDate.toISOString(),
          backgroundColor: '#eab308',
          borderColor: '#eab308',
          extendedProps: {
            type: 'addendum',
            projectId: project.id,
            schoolName: project.schoolName,
            address: project.address,
            agency: project.agency.name,
            agencyId: project.agency.id
          }
        }))
      ];

      return projectEvents;
    });

    res.json(events);
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
