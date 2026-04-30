import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticate, requireAgency, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const agencies = await prisma.agency.findMany({
      where: { userId: req.user!.id },
      include: {
        contactPersons: true,
        _count: {
          select: { projects: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(agencies);
  } catch (error) {
    console.error('Get agencies error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', [
  body('name').trim().notEmpty().withMessage('Agency name is required'),
  body('address').trim().notEmpty().withMessage('Address is required')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, address } = req.body;

    const agency = await prisma.agency.create({
      data: {
        name,
        address,
        userId: req.user!.id
      },
      include: {
        contactPersons: true
      }
    });

    res.status(201).json(agency);
  } catch (error) {
    console.error('Create agency error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const agency = await prisma.agency.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      },
      include: {
        contactPersons: true,
        projects: {
          select: {
            id: true,
            schoolName: true,
            bidDueDate: true
          }
        }
      }
    });

    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    res.json(agency);
  } catch (error) {
    console.error('Get agency error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', [
  body('name').trim().notEmpty().withMessage('Agency name is required'),
  body('address').trim().notEmpty().withMessage('Address is required')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, address } = req.body;

    const agency = await prisma.agency.updateMany({
      where: {
        id: req.params.id,
        userId: req.user!.id
      },
      data: { name, address }
    });

    if (agency.count === 0) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    const updatedAgency = await prisma.agency.findUnique({
      where: { id: req.params.id },
      include: { contactPersons: true }
    });

    res.json(updatedAgency);
  } catch (error) {
    console.error('Update agency error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const agency = await prisma.agency.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      },
      include: {
        _count: {
          select: { projects: true }
        }
      }
    });

    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    if (agency._count.projects > 0) {
      return res.status(400).json({
        message: 'Cannot delete agency with associated projects'
      });
    }

    await prisma.agency.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete agency error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/:id/contacts', [
  body('name').trim().notEmpty().withMessage('Contact name is required'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional().trim()
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone } = req.body;

    const agency = await prisma.agency.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    const contact = await prisma.contactPerson.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        agencyId: req.params.id
      }
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id/contacts', async (req: AuthRequest, res) => {
  try {
    const agency = await prisma.agency.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    const contacts = await prisma.contactPerson.findMany({
      where: { agencyId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:agencyId/contacts/:contactId', async (req: AuthRequest, res) => {
  try {
    const agency = await prisma.agency.findFirst({
      where: {
        id: req.params.agencyId,
        userId: req.user!.id
      }
    });

    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    await prisma.contactPerson.delete({
      where: {
        id: req.params.contactId,
        agencyId: req.params.agencyId
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
