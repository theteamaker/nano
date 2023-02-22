require('dotenv').config({ path: __dirname + '/../config/.env' });
const path = require('node:path');
const { commandFiles } = require('./utils/deploy-commands.js');
const { Client, Collection, Events, GatewayIntentBits, Partials, BaseInteraction, Message } = require('discord.js');
const { genCachePromises } = require('./utils/cache.js');

let last_cached: string;
export { last_cached };

async function main() {
    let initialized = false;
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

        if (initialized === false) {
            await interaction.reply({ content: 'The initialization process is still running. If this persists for an extended period of time, contact Eva.', ephemeral: true });
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

    // client.on(Events.InteractionCreate, async( interaction: typeof BaseInteraction) => {
    //     if (!interaction.isButton()) return;
    // })

    client.once(Events.ClientReady, (c: typeof Client) => {
        console.log(`Ready! Logged in as ${c.user.tag}`);
    });

    client.login(TOKEN);

    const guildsJSON = JSON.parse(
        JSON.stringify(require(__dirname + '/../config/guilds.json')));

    const guildPromises: Array<Array<Promise<typeof Message>>> = [];
    const individualPromises: Array<Promise<typeof Message>> = [];
    for (const [key, value] of Object.entries(guildsJSON)) {
        guildPromises.push(genCachePromises(client, key, value));
    }

    // cursed cache initialization
    setInterval(async () => await cache(), 1000 * 30);
    async function cache() {
        Promise.all(guildPromises)
            .then(array => array.forEach(promises => promises.forEach((promise: Promise<typeof Message>) => individualPromises.push(promise))))
            .then(() => Promise.all(individualPromises).then(() => {
                if (initialized === false) {
                    console.log('Initialization has finished.');
                    initialized = true;
                }
                last_cached = Date();
                console.log(`Last cache has finalized as of ${last_cached}.`);
            }));
    }
}

if (require.main === module) {
    main();
}