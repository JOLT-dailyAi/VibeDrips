// cleanup-old-files.js - Remove old remnant JSON files
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

console.log('🧹 VibeDrips Data Cleanup - Removing Old Files');
console.log('===============================================');

// Files that should always be kept
const KEEP_FILES = [
    'products.csv',        // Source data
    'last_updated.txt'     // Processing summary
];

// Pattern for files that should be kept (current generation)
const KEEP_PATTERNS = [
    /^products-[A-Z]{3}\.json$/,  // products-INR.json, products-USD.json, etc.
    /^currencies\.json$/          // currencies.json
];

function shouldKeepFile(filename) {
    // Always keep specific files
    if (KEEP_FILES.includes(filename)) {
        return true;
    }

    // Check if matches current patterns
    return KEEP_PATTERNS.some(pattern => pattern.test(filename));
}

function cleanupDataDirectory() {
    if (!fs.existsSync(dataDir)) {
        console.log('❌ Data directory does not exist');
        return;
    }

    const files = fs.readdirSync(dataDir);
    let deletedCount = 0;
    let keptCount = 0;

    console.log(`📁 Found ${files.length} files in data directory:`);

    files.forEach(filename => {
        const filePath = path.join(dataDir, filename);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
            if (shouldKeepFile(filename)) {
                console.log(`✅ KEEP: ${filename}`);
                keptCount++;
            } else {
                console.log(`🗑️  DELETE: ${filename}`);
                try {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`   └─ Deleted successfully`);
                } catch (error) {
                    console.log(`   └─ Error deleting: ${error.message}`);
                }
            }
        }
    });

    console.log('\n📊 CLEANUP SUMMARY:');
    console.log(`   • Files kept: ${keptCount}`);
    console.log(`   • Files deleted: ${deletedCount}`);
    console.log(`   • Total processed: ${files.length}`);

    if (deletedCount > 0) {
        console.log('\n✨ Cleanup completed successfully!');
    } else {
        console.log('\n✨ No cleanup needed - all files are current');
    }
}

// Run the cleanup
cleanupDataDirectory();
