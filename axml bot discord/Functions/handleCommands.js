const fs = require('node:fs');
const path = require('node:path');

module.exports = async (client) => {
    client.commands.clear();

    const commandsPath = path.join(__dirname, '..', 'commands');

    function loadCommands(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                loadCommands(filePath);
            } else if (file.endsWith('.js')) {
                delete require.cache[require.resolve(filePath)];
                const command = require(filePath);
                if (command.name && command.execute) {
                    client.commands.set(command.name, command);
                    console.log(`[INFO] Loaded command: ${command.name}`);
                }
            }
        }
    }

    loadCommands(commandsPath);
};
