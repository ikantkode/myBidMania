import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../index';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/uploads';

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const userId = (req as any).user?.id;
    const projectId = req.params.id || req.params.projectId;

    if (!userId) {
      return cb(new Error('User not authenticated'), '');
    }

    let uploadPath = path.join(UPLOAD_DIR, userId);

    if (projectId) {
      uploadPath = path.join(uploadPath, projectId);
    }

    try {
      await fs.promises.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif',
    'image/tiff',
    'application/vnd.dwg',
    'application/dxf',
    'application/zip'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX, Images, DWG, DXF, ZIP'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

export async function deleteFile(filePath: string): Promise<void> {
  try {
    const fullPath = path.join(UPLOAD_DIR, filePath);
    await fs.promises.unlink(fullPath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

export async function deleteProjectFiles(projectId: string): Promise<void> {
  const files = await prisma.projectFile.findMany({
    where: { projectId }
  });

  for (const file of files) {
    await deleteFile(file.filePath);
  }

  await prisma.projectFile.deleteMany({
    where: { projectId }
  });
}

export async function deleteAddendumFile(filePath: string): Promise<void> {
  await deleteFile(filePath);
}
