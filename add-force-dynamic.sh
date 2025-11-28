#!/bin/bash

# Script to add 'export const dynamic = "force-dynamic";' to all API routes that use Prisma

API_DIR="/Users/nicolashurtadoa/Downloads/Transportes Medellin Travel/app/api"

# Find all route.ts files that contain 'prisma' but don't have 'export const dynamic'
find "$API_DIR" -name "route.ts" -type f | while read -r file; do
    # Check if file contains 'prisma' and doesn't already have 'export const dynamic'
    if grep -q "prisma" "$file" && ! grep -q "export const dynamic" "$file"; then
        echo "Processing: $file"
        
        # Find the line number after the last import
        last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
        
        if [ -n "$last_import_line" ]; then
            # Add the export statement after imports with proper spacing
            sed -i '' "${last_import_line}a\\
\\
// Force dynamic rendering to prevent build-time execution\\
export const dynamic = 'force-dynamic';
" "$file"
            echo "  ✓ Added force-dynamic export"
        fi
    fi
done

echo "Done!"
