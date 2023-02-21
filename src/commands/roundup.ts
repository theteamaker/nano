import * as discord from 'discord.js';
import * as api from 'discord-api-types/v10';

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName('roundup')
        .setDescription('Provides a concise summary of the rips currently in pins.'),
    async execute(interaction: discord.ChatInputCommandInteraction) {
        roundup(interaction);
    },
};

class PinnedRip {
    byline: string;
    title: string;
    content: string;
    id: string;
    reactions: string;
    link: string;
    constructor(byline: string, title: string, content: string, id: string, reactions: string, link:string) {
        this.byline = byline;
        this.title = title;
        this.content = content;
        this.id = id;
        this.reactions = reactions;
        this.link = link;
    }
}

function parseMessage(message: discord.Message) {
    // Byline Parsing.
    function addAuthor(input: string) {
        return input + ` (${message.author.username})`;
    }

    try {
        const content = message.content.split('```', 3);
        if ((content[0] === undefined) || (content[1] === undefined)) {
            throw (1);
        }

        let byline = content[0]
            .split('\n').find(element => /[Bb][Yy]/.test(element));

        if (byline === undefined) {
            throw (1);
        }

        if (/[Bb][Yy] [Mm][Ee]/.test(byline) === true) {
            byline = addAuthor(byline);
        }
        else if (byline === undefined) {
            byline = addAuthor(content[0]);
        }

        byline = byline.replace(/[*_]|\n/g, '');

        const title = content[1].split('\n', 2).find(element => /./g.test(element));
        let reactions = '';

        // Reactions Parsing
        message.reactions.cache.forEach(reaction => {
            for (let i = 0; i < reaction.count; i++) {
                reactions += reaction.emoji.toString();
            }
        });

        const link = `https://discordapp.com/channels/${message.guildId}/${message.channelId}/${message.id}`;

        if (byline === undefined || title == undefined) {
            throw (1);
        }

        const constructed_class: PinnedRip = new PinnedRip(
            byline, title, message.content, message.id, reactions, link
        );

        return constructed_class;
    }
    catch (err) {
        return `https://discordapp.com/channels/${message.guildId}/${message.channelId}/${message.id}`;
    }
}

async function roundup(interaction: discord.ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const channel = interaction.channel;

    if (!(guild && channel && channel.type === api.ChannelType.GuildText)) {
        return;
    }

    async function fetch() {
        const fetched_pins: Array<discord.Message> = [];
        if (!channel || channel.type != api.ChannelType.GuildText) {
            return fetched_pins;
        }

        await channel.messages.fetchPinned(false)
            .then(async (pins) => await pins.forEach(async (msg) => await msg.fetch(false)
                .then(fetched_msg => fetched_pins.push(fetched_msg))));
        return fetched_pins;
    }

    const fetched_pins = await fetch().then(array => array.map(message => parseMessage(message)));
    if (fetched_pins.length === 0) {
        await interaction.editReply('Huh... I didn\'t get anything back. Are there really *no* pins?');
        return;
    }

    // All that parsing and logic has been done.
    // Now let's make this look pretty!

    await interaction.editReply('fruit');
}