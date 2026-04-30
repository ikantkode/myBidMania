import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create dummy user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@ambcontractors.com' },
    update: {},
    create: {
      email: 'admin@ambcontractors.com',
      password: hashedPassword,
      name: 'Admin User',
    },
  });
  console.log('✅ Created user:', user.email);

  // Create dummy agency
  const agency = await prisma.agency.upsert({
    where: { id: 'default-agency' },
    update: {},
    create: {
      id: 'default-agency',
      name: 'AMB Contractors',
      address: '123 Construction Ave, Building City, BC 12345',
      userId: user.id,
    },
  });
  console.log('✅ Created agency:', agency.name);

  // Create contact persons
  const contact1 = await prisma.contactPerson.create({
    data: {
      name: 'John Smith',
      email: 'john@ambcontractors.com',
      phone: '(555) 123-4567',
      agencyId: agency.id,
    },
  });
  console.log('✅ Created contact:', contact1.name);

  const contact2 = await prisma.contactPerson.create({
    data: {
      name: 'Jane Doe',
      email: 'jane@ambcontractors.com',
      phone: '(555) 987-6543',
      agencyId: agency.id,
    },
  });
  console.log('✅ Created contact:', contact2.name);

  // Create a dummy project
  const project = await prisma.project.create({
    data: {
      schoolName: 'Lincoln Elementary School - LES-001',
      description: 'New wing construction including 6 classrooms, library, and administrative offices. Project includes site work, utilities, and landscaping.',
      bidDueDate: new Date('2026-05-15T17:00:00'),
      preBidWalkthroughDate: new Date('2026-05-01T10:00:00'),
      address: '456 School Street, Education City, EC 54321',
      agencyId: agency.id,
      userId: user.id,
    },
  });
  console.log('✅ Created project:', project.schoolName);

  // Create some addenda
  const addendum1 = await prisma.addendum.create({
    data: {
      projectId: project.id,
      addendumDate: new Date('2026-04-20T14:00:00'),
      hasAttachment: false,
      noAttachment: true,
    },
  });
  console.log('✅ Created addendum 1');

  const addendum2 = await prisma.addendum.create({
    data: {
      projectId: project.id,
      addendumDate: new Date('2026-04-25T09:00:00'),
      hasAttachment: true,
      attachmentPath: 'uploads/addendum2.pdf',
      noAttachment: false,
    },
  });
  console.log('✅ Created addendum 2');

  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Email: admin@ambcontractors.com');
  console.log('  Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
