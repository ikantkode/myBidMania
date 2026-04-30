import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { upload, deleteProjectFiles } from '../utils/fileUpload';
import { notifyTeamNewProject, notifyTeamTimingChange, notifyTeamNewAddendum } from '../utils/emailScheduler';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
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
        addenda: true,
        companies: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        _count: {
          select: { files: true }
        }
      },
      orderBy: { bidDueDate: 'asc' }
    });

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', [
  body('schoolName').trim().notEmpty().withMessage('School name/code is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('bidDueDate').isISO8601().withMessage('Valid bid due date required'),
  body('preBidWalkthroughDate').isISO8601().withMessage('Valid walkthrough date required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('agencyId').notEmpty().withMessage('Agency is required')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      schoolName,
      description,
      bidDueDate,
      preBidWalkthroughDate,
      address,
      agencyId,
      contactPersonId,
      addenda,
      companyIds
    } = req.body;

    const agency = await prisma.agency.findFirst({
      where: {
        id: agencyId,
        userId: req.user!.id
      }
    });

    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    const project = await prisma.project.create({
      data: {
        schoolName,
        description,
        bidDueDate: new Date(bidDueDate),
        preBidWalkthroughDate: new Date(preBidWalkthroughDate),
        address,
        agencyId,
        userId: req.user!.id,
        addenda: addenda ? {
          create: addenda.map((addendum: any) => ({
            addendumDate: new Date(addendum.addendumDate),
            hasAttachment: addendum.hasAttachment || false,
            noAttachment: addendum.noAttachment || false,
            attachmentPath: addendum.attachmentPath || null
          }))
        } : undefined,
        companies: companyIds && companyIds.length > 0 ? {
          create: companyIds.map((companyId: string) => ({
            companyId
          }))
        } : undefined
      },
      include: {
        agency: true,
        addenda: true,
        companies: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    // Notify team members about new project
    notifyTeamNewProject(
      project.schoolName,
      project.agency.name,
      project.bidDueDate,
      project.preBidWalkthroughDate,
      project.description,
      project.address,
      req.user!.id
    ).catch(err => console.error('Failed to send team notifications:', err));

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      },
      include: {
        agency: {
          include: {
            contactPersons: true
          }
        },
        addenda: true,
        files: true,
        companies: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', [
  body('schoolName').trim().notEmpty().withMessage('School name/code is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('bidDueDate').isISO8601().withMessage('Valid bid due date required'),
  body('preBidWalkthroughDate').isISO8601().withMessage('Valid walkthrough date required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('agencyId').notEmpty().withMessage('Agency is required')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      schoolName,
      description,
      bidDueDate,
      preBidWalkthroughDate,
      address,
      agencyId,
      companyIds
    } = req.body;

    // Get the old project to check for timing changes
    const oldProject = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      },
      include: {
        agency: true
      }
    });

    if (!oldProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const newBidDueDate = new Date(bidDueDate);
    const newPreBidDate = new Date(preBidWalkthroughDate);
    const oldBidDueDate = new Date(oldProject.bidDueDate);
    const oldPreBidDate = new Date(oldProject.preBidWalkthroughDate);

    // Check if timing changed
    const bidDateChanged = newBidDueDate.getTime() !== oldBidDueDate.getTime();
    const preBidDateChanged = newPreBidDate.getTime() !== oldPreBidDate.getTime();
    const timingChanged = bidDateChanged || preBidDateChanged;

    const project = await prisma.project.updateMany({
      where: {
        id: req.params.id,
        userId: req.user!.id
      },
      data: {
        schoolName,
        description,
        bidDueDate: newBidDueDate,
        preBidWalkthroughDate: newPreBidDate,
        address,
        agencyId
      }
    });

    if (project.count === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Update company relationships if provided
    if (companyIds !== undefined) {
      // Delete existing company relationships
      await prisma.projectCompany.deleteMany({
        where: {
          projectId: req.params.id
        }
      });

      // Create new company relationships
      if (companyIds.length > 0) {
        await prisma.projectCompany.createMany({
          data: companyIds.map((companyId: string) => ({
            projectId: req.params.id,
            companyId
          }))
        });
      }
    }

    const updatedProject = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        agency: true,
        addenda: true,
        files: true,
        companies: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    // Notify team members if timing changed
    if (timingChanged && updatedProject) {
      notifyTeamTimingChange(
        updatedProject.id,
        updatedProject.schoolName,
        updatedProject.agency.name,
        updatedProject.bidDueDate,
        updatedProject.preBidWalkthroughDate,
        updatedProject.description,
        updatedProject.address,
        req.user!.id
      ).catch(err => console.error('Failed to send timing change notifications:', err));
    }

    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await deleteProjectFiles(req.params.id);

    await prisma.project.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/:id/addenda', [
  body('addendumDate').isISO8601().withMessage('Valid addendum date required'),
  body('noAttachment').isBoolean().withMessage('No attachment must be a boolean')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { addendumDate, noAttachment, attachmentPath } = req.body;

    if (!noAttachment && !attachmentPath) {
      return res.status(400).json({
        message: 'Attachment is required unless "No attachment" is checked'
      });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const addendum = await prisma.addendum.create({
      data: {
        projectId: req.params.id,
        addendumDate: new Date(addendumDate),
        hasAttachment: !!attachmentPath,
        noAttachment,
        attachmentPath: attachmentPath || null
      }
    });

    // Notify team members about new addendum
    notifyTeamNewAddendum(
      req.params.id,
      new Date(addendumDate),
      req.user!.id
    ).catch(err => console.error('Failed to send addendum notifications:', err));

    res.status(201).json(addendum);
  } catch (error) {
    console.error('Create addendum error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id/addenda/:addendumId', async (req: AuthRequest, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await prisma.addendum.delete({
      where: {
        id: req.params.addendumId,
        projectId: req.params.id
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete addendum error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/:id/files', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { fileType } = req.body;

    if (!['drawing', 'spec'].includes(fileType)) {
      return res.status(400).json({ message: 'Invalid file type. Must be "drawing" or "spec"' });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const file = await prisma.projectFile.create({
      data: {
        projectId: req.params.id,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });

    res.status(201).json(file);
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id/files', async (req: AuthRequest, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const files = await prisma.projectFile.findMany({
      where: { projectId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(files);
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id/files/:fileId', async (req: AuthRequest, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const file = await prisma.projectFile.findFirst({
      where: {
        id: req.params.fileId,
        projectId: req.params.id
      }
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const fs = await import('fs');
    try {
      fs.unlinkSync(file.filePath);
    } catch (err) {
      console.error('Error deleting file from disk:', err);
    }

    await prisma.projectFile.delete({
      where: { id: req.params.fileId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
