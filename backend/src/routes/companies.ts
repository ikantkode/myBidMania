import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all companies for the current user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const companies = await prisma.company.findMany({
      where: {
        agencies: {
          some: {
            agency: {
              userId: req.user!.id
            }
          }
        }
      },
      include: {
        agencies: {
          include: {
            agency: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            projects: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get companies by agency
router.get('/agency/:agencyId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { agencyId } = req.params;

    // Verify agency belongs to user
    const agency = await prisma.agency.findFirst({
      where: {
        id: agencyId,
        userId: req.user!.id
      }
    });

    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    const companies = await prisma.company.findMany({
      where: {
        agencies: {
          some: {
            agencyId: agencyId
          }
        }
      },
      include: {
        agencies: {
          include: {
            agency: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies by agency:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single company
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findFirst({
      where: {
        id,
        agencies: {
          some: {
            agency: {
              userId: req.user!.id
            }
          }
        }
      },
      include: {
        agencies: {
          include: {
            agency: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        projects: {
          include: {
            project: {
              select: {
                id: true,
                schoolName: true,
                agency: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create company
router.post('/', [
  body('name').trim().notEmpty().withMessage('Company name is required'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional().trim(),
  body('agencyIds').isArray().withMessage('Agency IDs must be an array')
], authenticate, async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, agencyIds } = req.body;

    // Verify all agencies belong to user
    const agencies = await prisma.agency.findMany({
      where: {
        id: { in: agencyIds },
        userId: req.user!.id
      }
    });

    if (agencies.length !== agencyIds.length) {
      return res.status(400).json({ message: 'One or more agencies not found' });
    }

    const company = await prisma.company.create({
      data: {
        name,
        email,
        phone,
        agencies: {
          create: agencyIds.map((agencyId: string) => ({
            agencyId
          }))
        }
      },
      include: {
        agencies: {
          include: {
            agency: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(company);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update company
router.put('/:id', [
  body('name').trim().notEmpty().withMessage('Company name is required'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional().trim(),
  body('agencyIds').isArray().withMessage('Agency IDs must be an array')
], authenticate, async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, email, phone, agencyIds } = req.body;

    // Verify company belongs to user
    const existingCompany = await prisma.company.findFirst({
      where: {
        id,
        agencies: {
          some: {
            agency: {
              userId: req.user!.id
            }
          }
        }
      }
    });

    if (!existingCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Verify all agencies belong to user
    const agencies = await prisma.agency.findMany({
      where: {
        id: { in: agencyIds },
        userId: req.user!.id
      }
    });

    if (agencies.length !== agencyIds.length) {
      return res.status(400).json({ message: 'One or more agencies not found' });
    }

    // Delete existing agency relationships
    await prisma.companyAgency.deleteMany({
      where: {
        companyId: id
      }
    });

    // Update company and create new agency relationships
    const company = await prisma.company.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        agencies: {
          create: agencyIds.map((agencyId: string) => ({
            agencyId
          }))
        }
      },
      include: {
        agencies: {
          include: {
            agency: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete company
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Verify company belongs to user
    const company = await prisma.company.findFirst({
      where: {
        id,
        agencies: {
          some: {
            agency: {
              userId: req.user!.id
            }
          }
        }
      },
      include: {
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company._count.projects > 0) {
      return res.status(400).json({ message: 'Cannot delete company with associated projects' });
    }

    await prisma.company.delete({
      where: { id }
    });

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
