#!/usr/bin/env node

const { execSync } = require('child_process');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const POSTGRES_USER = 'postgres';
const POSTGRES_PASSWORD = 'postgres';
const POSTGRES_DB = 'mydb';
const POSTGRES_HOST = 'localhost';

const POSTGRES_COMPOSE_NAME = 'customer-postgres';

function log(message) {
  console.log(`\x1b[36m[customer-db]\x1b[0m ${message}`);
}

function error(message) {
  console.error(`\x1b[31m[customer-db ERROR]\x1b[0m ${message}`);
}

function success(message) {
  console.log(`\x1b[32m[customer-db]\x1b[0m ${message}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (err) {
    if (!options.ignoreError) {
      throw err;
    }
    return null;
  }
}

async function main() {
  log('Starting customer database...');

  // Check if Docker is running
  try {
    exec('docker info', { silent: true });
  } catch (err) {
    error('Docker is not running. Please start Docker and try again.');
    process.exit(1);
  }

  // Stop existing container if running
  log('Checking for existing container...');
  exec(`docker-compose down ${POSTGRES_COMPOSE_NAME}`, { silent: true, ignoreError: true });

  // Start the database
  log('Starting PostgreSQL container...');
  exec(`docker-compose up ${POSTGRES_COMPOSE_NAME} -d`);
  // Wait for database to be healthy
  log('Waiting for database to be ready...');
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    try {
      const status = exec('docker-compose ps --format json', { silent: true });

      // Try to parse the JSON output
      try {
        const containers = JSON.parse(status);
        const postgresContainer = Array.isArray(containers)
          ? containers.find(c => c.Service === 'postgres')
          : containers;

        if (postgresContainer && postgresContainer.Health === 'healthy') {
          success('Database is healthy!');
          break;
        }
      } catch (parseErr) {
        // Fallback: check if container is running
        const psOutput = exec(`docker-compose ps ${POSTGRES_COMPOSE_NAME}`, { silent: true });
        if (psOutput && psOutput.includes('Up') && psOutput.includes('healthy')) {
          success('Database is healthy!');
          break;
        }
      }
    } catch (err) {
      // Continue waiting
    }

    attempts++;
    if (attempts >= maxAttempts) {
      error('Database failed to become healthy after 30 seconds');
      process.exit(1);
    }

    // Wait 1 second before next attempt
    await sleep(1000);
  }

  // Get the assigned port
  log('Retrieving assigned port...');
  const portOutput = exec(`docker-compose port ${POSTGRES_COMPOSE_NAME} 5432`, { silent: true });

  if (!portOutput) {
    error('Failed to retrieve database port');
    process.exit(1);
  }

  // Parse port from output (format: "0.0.0.0:PORT" or ":::PORT")
  const portMatch = portOutput.trim().match(/:(\d+)$/);

  if (!portMatch) {
    error(`Failed to parse port from output: ${portOutput}`);
    process.exit(1);
  }

  const port = portMatch[1];

  // Construct DSN
  const dsn = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${port}/${POSTGRES_DB}`;

  console.log('\n' + '='.repeat(80));
  success('Customer database is ready!');
  console.log('='.repeat(80));
  console.log();
  console.log(`  \x1b[1mDSN:\x1b[0m  ${dsn}`);
  console.log();
  console.log(`  \x1b[1mHost:\x1b[0m      ${POSTGRES_HOST}`);
  console.log(`  \x1b[1mPort:\x1b[0m      ${port}`);
  console.log(`  \x1b[1mDatabase:\x1b[0m  ${POSTGRES_DB}`);
  console.log(`  \x1b[1mUser:\x1b[0m      ${POSTGRES_USER}`);
  console.log(`  \x1b[1mPassword:\x1b[0m  ${POSTGRES_PASSWORD}`);
  console.log();
  console.log('  \x1b[1mSeeded with:\x1b[0m 20 users in the "users" table');
  console.log();
  console.log('  \x1b[1mConnect with psql:\x1b[0m');
  console.log(`  psql "${dsn}"`);
  console.log();
  console.log('  \x1b[1mStop database:\x1b[0m');
  console.log('  docker-compose down');
  console.log();
  console.log('='.repeat(80));
  console.log();
}

main().catch((err) => {
  error(err.message);
  process.exit(1);
});
