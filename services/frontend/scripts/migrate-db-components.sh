#!/bin/bash
# DB Component Migration Script

# Move old files to backup
echo "Creating backups of old components..."
mv src/components/setup/DatabaseSetup.tsx src/components/setup/DatabaseSetup.tsx.bak
mv src/components/setup/DatabaseSetupWelcome.tsx src/components/setup/DatabaseSetupWelcome.tsx.bak
mv src/components/settings/DatabaseSettings.tsx src/components/settings/DatabaseSettings.tsx.bak

# Install new files
echo "Installing new components..."
mv src/components/setup/DatabaseSetup.tsx.new src/components/setup/DatabaseSetup.tsx
mv src/components/setup/DatabaseSetupWelcome.tsx.new src/components/setup/DatabaseSetupWelcome.tsx
mv src/components/settings/DatabaseSettings.tsx.new src/components/settings/DatabaseSettings.tsx

echo "Migration complete!"
