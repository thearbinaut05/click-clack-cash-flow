import { exec } from 'child_process';
import fs from 'fs';

// Function to check environment variables
function checkEnvVariables() {
    const requiredEnvVars = [
        'STRIPE_SECRET_KEY',
        'OWNER_STRIPE_ACCOUNT_ID',
        'PORT',
        'STRIPE_WEBHOOK_SECRET'
    ];

    let missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error(`Missing environment variables: ${missingVars.join(', ')}`);
        return false;
    }
    return true;
}

// Function to check if the server can start
function checkServerStart() {
    return new Promise((resolve, reject) => {
        exec('node src/server.js', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error starting server: ${stderr}`);
                reject(error);
            } else {
                console.log(`Server started successfully: ${stdout}`);
                resolve();
            }
        });
    });
}

// Function to run tests
function runTests() {
    return new Promise((resolve, reject) => {
        exec('npm test', (error, stdout, stderr) => {
            if (error) {
                console.error(`Test failed: ${stderr}`);
                reject(error);
            } else {
                console.log(`Tests passed: ${stdout}`);
                resolve();
            }
        });
    });
}

// Main function to run checks and start the server
async function main() {
    if (!checkEnvVariables()) {
        console.error('Please fix the environment variables before starting the app.');
        return;
    }

    try {
        await runTests();
        await checkServerStart();
    } catch (error) {
        console.error('An error occurred during startup:', error);
    }
}

main();
