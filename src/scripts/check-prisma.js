const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const screens = await prisma.screen.findMany();
    console.log('Screens found:', screens.length);
    const configs = await prisma.config.findMany();
    console.log('Configs found:', configs.length);
    console.log('Prisma check passed!');
  } catch (e) {
    console.error('Prisma check failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
