const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../src/generated/prisma');

require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'trudicon' },
    update: {},
    create: {
      name: 'Trudicon BGV',
      slug: 'trudicon',
      status: 'ACTIVE',
    },
  });

  console.log('Tenant ID:', tenant.id);
  console.log('Tenant:', JSON.stringify(tenant, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
