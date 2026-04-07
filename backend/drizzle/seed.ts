import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { organizations, users, patients } from './schema';

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/healthtrack',
  });
  
  const db = drizzle(pool, { schema });

  try {
    // Create sample organization
    const [org] = await db.insert(organizations).values({
      name: 'Sample Clinic',
    }).returning();
    console.log('Created organization:', org.name);

    // Create sample users
    const [admin] = await db.insert(users).values({
      email: 'admin@sampleclinic.com',
      firebaseUid: 'firebase-admin-uid-001',
      name: 'Dr. Admin',
      role: 'org_admin',
      organizationId: org.id,
    }).returning();
    console.log('Created admin user:', admin.name);

    const [doctor] = await db.insert(users).values({
      email: 'doctor@sampleclinic.com',
      firebaseUid: 'firebase-doctor-uid-002',
      name: 'Dr. Smith',
      role: 'doctor',
      organizationId: org.id,
    }).returning();
    console.log('Created doctor user:', doctor.name);

    const [nurse] = await db.insert(users).values({
      email: 'nurse@sampleclinic.com',
      firebaseUid: 'firebase-nurse-uid-003',
      name: 'Nurse Johnson',
      role: 'nurse',
      organizationId: org.id,
    }).returning();
    console.log('Created nurse user:', nurse.name);

    // Create sample patients
    const samplePatients = [
      { name: 'John Doe', dateOfBirth: '1985-03-15', gender: 'Male', email: 'john@example.com', phone: '555-0101' },
      { name: 'Jane Smith', dateOfBirth: '1990-07-22', gender: 'Female', email: 'jane@example.com', phone: '555-0102' },
      { name: 'Robert Brown', dateOfBirth: '1978-11-30', gender: 'Male', phone: '555-0103' },
      { name: 'Emily Davis', dateOfBirth: '1995-01-08', gender: 'Female', email: 'emily@example.com' },
      { name: 'Michael Wilson', dateOfBirth: '1982-06-14', gender: 'Male', phone: '555-0105' },
      { name: 'Sarah Johnson', dateOfBirth: '1988-09-25', gender: 'Female', email: 'sarah@example.com', phone: '555-0106' },
      { name: 'David Lee', dateOfBirth: '1975-12-03', gender: 'Male', phone: '555-0107' },
      { name: 'Lisa Anderson', dateOfBirth: '1992-04-18', gender: 'Female', email: 'lisa@example.com' },
      { name: 'James Taylor', dateOfBirth: '1980-08-07', gender: 'Male', phone: '555-0109' },
      { name: 'Maria Garcia', dateOfBirth: '1993-02-28', gender: 'Female', email: 'maria@example.com', phone: '555-0110' },
    ];

    for (const patient of samplePatients) {
      const [p] = await db.insert(patients).values({
        ...patient,
        organizationId: org.id,
        createdBy: doctor.id,
      }).returning();
      console.log('Created patient:', p.name);
    }

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
