/**
 * Patch lib/utils.ts to add options support in WhatsApp message
 * Run with: node scripts/patch-whatsapp-options.js
 */

const fs = require('fs');
const path = require('path');

const utilsPath = path.join(__dirname, '../lib/utils.ts');
const content = fs.readFileSync(utilsPath, 'utf8');

// Find and replace the items.forEach block
const oldCode = `  orderDetails.items.forEach((item, index) => {
    message += \`\${index + 1}. \${item.name}\\n\`;
    message += \`   \${item.quantity}x RM\${item.price.toFixed(2)} = RM\${(item.quantity * item.price).toFixed(2)}\\n\`;
  });`;

const newCode = `  orderDetails.items.forEach((item, index) => {
    message += \`\${index + 1}. \${item.name}\\n\`;
    
    // Display selected options (Phase R4D)
    if (item.selectedOptions && item.selectedOptions.length > 0) {
      item.selectedOptions.forEach((opt) => {
        message += \`   • \${opt.option_name}\`;
        if (opt.price_adjustment > 0) {
          message += \` (+RM\${opt.price_adjustment.toFixed(2)})\`;
        }
        message += \`\\n\`;
      });
    }
    
    message += \`   \${item.quantity}x RM\${item.price.toFixed(2)} = RM\${(item.quantity * item.price).toFixed(2)}\\n\`;
  });`;

if (content.includes(oldCode)) {
  const newContent = content.replace(oldCode, newCode);
  fs.writeFileSync(utilsPath, newContent);
  console.log('✅ Successfully patched lib/utils.ts');
  console.log('   WhatsApp messages will now include selected options');
} else {
  console.log('⚠️  Could not find exact match for patching');
  console.log('   The code may have already been patched or modified');
  console.log('   Please manually review lib/utils-whatsapp-patch.ts and apply changes');
}
