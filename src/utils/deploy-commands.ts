const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
require(__dirname + '/../index.js');

const commandFiles = fs.readdirSync(__dirname + '/../commands').filter((file: string) => file.endsWith('.js'));
export { commandFiles };

function deploy() {
    const guilds = [];
    const guildsJson = JSON.parse(
        JSON.stringify(require(__dirname + '/../../config/guilds.json')));
    for (const key of Object.keys(guildsJson)) {
        guilds.push(key);
    }

    const commands: Array<string> = [];

    for (const file of commandFiles) {
        const command = require(__dirname + `/../commands/${file}`);
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(process.env['TOKEN']);

    try {
        console.log(`Started refreshing ${commands.length} application (/) commands for ${guilds.length} servers.`);

        guilds.forEach(async (x: string) => {
            try {
                await rest.put(
                    Routes.applicationGuildCommands(process.env['CLIENT_ID'], x),
                    { body: commands },
                );
            }
            catch (error) {
                console.error(error);
            }
        });
        console.log(`Successfully reloaded ${commands.length} application (/) commands for ${guilds.length} servers.`);
    }
    catch (error) {
        console.error(error);
    }
}

if (require.main === module) {
    deploy();
}