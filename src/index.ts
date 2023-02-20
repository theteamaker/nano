const path = require('node:path');
const { commandFiles } = require('./utils/deploy-commands.js');
const { Client, Collection, Events, GatewayIntentBits, Partials, BaseInteraction } = require('discord.js');

require('dotenv').config({ path: __dirname + '/../config/.env' });

function main() {
    const TOKEN = process.env['TOKEN'];
    const client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
        partials: [Partials.Message, Partials.Reaction],
    });

    client.commands = new Collection();
    const commandsPath = path.join(__dirname, 'commands');

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
        else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }

    client.on(Events.InteractionCreate, async (interaction: typeof BaseInteraction) => {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        }
        catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    });

    client.once(Events.ClientReady, (c: typeof Client) => {
        console.log(`Ready! Logged in as ${c.user.tag}`);
    });

    client.login(TOKEN);
}

if (require.main === module) {
    main();
}