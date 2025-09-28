import { exec } from 'child_process';
import fs from 'fs';

// Function to check environment variables
function checkEnvVariables(): boolean {
    const requiredEnvVars = [
        'STRIPE_SECRET_KEY',
        'OWNER_STRIPE_ACCOUNT_ID',
        'PORT',
        'STRIPE_WEBHOOK_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error(`Missing environment variables: ${missingVars.join(', ')}`);
        return false;
    }
    return true;
}

// Function to check if the server can start
function checkServerStart(): Promise<void> {
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

// Function to monitor log files
function monitorLogs(): void {
    const logFile = 'server.log';
    
    if (fs.existsSync(logFile)) {
        fs.watchFile(logFile, (curr, prev) => {
            console.log(`Log file updated: ${curr.mtime}`);
        });
    } else {
        console.warn('Log file not found, creating one...');
        fs.writeFileSync(logFile, '');
    }
}

// Main monitoring function
async function startMonitoring(): Promise<void> {
    console.log('Starting server monitoring...');
    
    if (!checkEnvVariables()) {
        process.exit(1);
    }
    
    try {
        await checkServerStart();
        monitorLogs();
        console.log('Monitoring started successfully');
    } catch (error) {
        console.error('Failed to start monitoring:', error);
        process.exit(1);
    }
}

// Start monitoring if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    startMonitoring();
}

export { checkEnvVariables, checkServerStart, monitorLogs, startMonitoring };