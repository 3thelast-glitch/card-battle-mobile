const fs = require('fs');

const files = [
    'a:/020/card-battle-mobile-main/card-battle-mobile-main/app/screens/splash.tsx',
    'a:/020/card-battle-mobile-main/card-battle-mobile-main/app/screens/game-mode.tsx',
    'a:/020/card-battle-mobile-main/card-battle-mobile-main/app/screens/rounds-config.tsx',
    'a:/020/card-battle-mobile-main/card-battle-mobile-main/app/screens/leaderboard.tsx',
    'a:/020/card-battle-mobile-main/card-battle-mobile-main/app/screens/card-selection.tsx',
    'a:/020/card-battle-mobile-main/card-battle-mobile-main/app/screens/battle-results.tsx',
    'a:/020/card-battle-mobile-main/card-battle-mobile-main/app/screens/stats.tsx',
    'a:/020/card-battle-mobile-main/card-battle-mobile-main/app/screens/difficulty.tsx',
    'a:/020/card-battle-mobile-main/card-battle-mobile-main/components/ui/ProButton.tsx'
];

let changedAny = false;
files.forEach(f => {
    if (!fs.existsSync(f)) {
        console.log('Not found:', f);
        return;
    }

    let content = fs.readFileSync(f, 'utf-8');
    let original = content;

    // Replace font weights -> fontFamily
    content = content.replace(/fontWeight:\s*['"](?:900|800|bold)['"]/g, 'fontFamily: FONT_FAMILY.bold');
    content = content.replace(/fontWeight:\s*['"](?:700|600|semibold)['"]/g, 'fontFamily: FONT_FAMILY.medium');
    content = content.replace(/fontWeight:\s*['"](?:500|400|300|regular|normal)['"]/g, 'fontFamily: FONT_FAMILY.regular');

    // Ensure FONT_FAMILY is imported
    if (content !== original) {
        if (!content.includes('FONT_FAMILY')) {
            content = content.replace(/import\s*\{([^}]*)\}\s*from\s*['"]@\/components\/ui\/design-tokens['"]/, (match, p1) => {
                return 'import {' + p1 + ', FONT_FAMILY } from \'@/components/ui/design-tokens\'';
            });
            // Handle local import in ProButton
            content = content.replace(/import\s*\{([^}]*)\}\s*from\s*['"]\.\/design-tokens['"]/, (match, p1) => {
                return 'import {' + p1 + ', FONT_FAMILY } from \'./design-tokens\'';
            });
        }
        fs.writeFileSync(f, content);
        console.log('Updated:', f);
        changedAny = true;
    }
});

if (!changedAny) console.log('No files needed updates.');
else console.log('Done.');
