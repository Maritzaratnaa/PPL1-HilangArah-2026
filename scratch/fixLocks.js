const pool = require('../backend/db');

async function fixLocks() {
    try {
        const [processes] = await pool.query('SHOW PROCESSLIST');
        console.log("PROCESSES:", processes);
        
        for (const proc of processes) {
            if (proc.Info && proc.Info.includes('ALTER TABLE')) {
                console.log(`KILLING PROCESS ${proc.Id}`);
                await pool.query(`KILL ${proc.Id}`);
            }
        }
        console.log("DONE KILLING LOCKS");
    } catch(e) {
        console.error("ERROR:", e);
    } finally {
        process.exit(0);
    }
}
fixLocks();
