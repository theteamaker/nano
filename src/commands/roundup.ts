import * as discord from 'discord.js';
import * as api from 'discord-api-types/v10';

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName('roundup')
        .setDescription('Provides a concise summary of the rips currently in pins.')
        .addBooleanOption(option => option
            .setName('public')
            .setDescription('Decides whether other QoC members can see this message or not.')
            .setRequired(true)),
    async execute(interaction: discord.ChatInputCommandInteraction) {
        await roundup(interaction);
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
    function addAuthor(input: string) {
        return input + ` (<@${message.author.id}>)`;
    }

    try {
        // Byline Parsing.
        const content = message.content.split('```', 3);
        if ((content[0] === undefined) || (content[1] === undefined)) {
            throw (1);
        }

        let byline = content[0]
            .split('\n').find(element => /[Bb][Yy]/.test(element));

        if (byline === undefined) {
            byline = addAuthor(content[0]);
        }

        if (/[Bb][Yy] [Mm][Ee]/.test(byline) === true) {
            byline = addAuthor(byline);
        }
        else if (byline === undefined) {
            byline = addAuthor(content[0]);
        }

        byline = byline.replace(/[*_]|\n/g, '');

        // Title parsing simple simple simple yay
        const title = content[1].split('\n', 2).find(element => /./g.test(element));

        // Reactions parsing
        let reactions = '';

        message.reactions.cache.forEach(reaction => {
            for (let i = 0; i < reaction.count; i++) {
                reactions += ` ${reaction.emoji.toString()} `;
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
        console.log(`https://discordapp.com/channels/${message.guildId}/${message.channelId}/${message.id}`);
        return `https://discordapp.com/channels/${message.guildId}/${message.channelId}/${message.id}`;
    }
}

async function roundup(interaction: discord.ChatInputCommandInteraction) {
    const public_var = interaction.options.getBoolean('public') ?? false;

    let ephemeral_var = true;

    if (public_var === true) {
        ephemeral_var = false;
    }

    await interaction.deferReply({ ephemeral: ephemeral_var });

    const guild = interaction.guild;
    const channel = interaction.channel;

    if (!(guild && channel)) {
        return;
    }

    if (channel.type != api.ChannelType.GuildText) {
        return;
    }

    async function fetch() {
        const fetched_pins: Array<discord.Message> = [];
        if (!channel || channel.type != api.ChannelType.GuildText) {
            return fetched_pins;
        }

        await channel.fetch().then(fetched_channel => fetched_channel.messages.fetchPinned(true)
            .then(async (pins) => await pins.forEach(async (msg) => await msg.fetch(false)
                .then(fetched_msg => fetched_pins.push(fetched_msg)))));

        return fetched_pins;
    }

    const fetched_pins = await fetch().then(array => array.map(message => parseMessage(message)));
    if (fetched_pins.length === 0) {
        await interaction.editReply('Huh... I didn\'t get anything back. Are there really *no* pins?');
        return;
    }

    // All that parsing and logic has been done.
    // Now let's make this look pretty! Embed time.

    const paginatedLists: Array<Array<string>> = [];
    let buffer = 0;
    let toPush: Array<string> = [];
    let count = 0;
    let realCount = 0;

    for (const pin of fetched_pins) {
        if (typeof pin === 'string') {
            realCount++;
            continue;
        }

        const hyperlink = `https://discordapp.com/channels/${interaction.guildId}/${interaction.channel.id}/${pin.id}`;
        if (buffer >= 4096 || toPush.length == 10) {
            paginatedLists.push(toPush);
            buffer = 0;
            toPush = [];
        }
        let stringified = `[${pin.title}](${hyperlink})\n${pin.byline}`;

        if (pin.reactions != '') {
            stringified += `   |   ${pin.reactions}`;
        }

        toPush.push(stringified);
        buffer += stringified.length;
        realCount++;
        count++;
    }

    // Pushing the leftovers!
    paginatedLists.push(toPush);

    const embeds: Array<discord.EmbedBuilder> = [];

    paginatedLists.forEach(paginatedList => {

        let paginatedString = ' ';
        paginatedList.forEach(line => paginatedString += `\n──────────\n${line}`);
        paginatedString += '\n──────────';
        const lagtrainGirlURL = 'https://cdn.discordapp.com/attachments/1054452613111877734/1077685910767927388/artworks-HdxXE6BxJ65FHooi-rtiaPw-t500x500.jpg';

        embeds.push(new discord.EmbedBuilder()
            .setTitle(`#${channel.name}`)
            .setDescription(`${paginatedString}`)
            .setFooter({ text: `Page (${paginatedLists.indexOf(paginatedList) + 1} / ${paginatedLists.length})  |  Until Limit Reached: ${50 - realCount}`, iconURL: lagtrainGirlURL })
            .setAuthor({ name: `Pin Count: ${count}` })
            .setColor(0xACACAC));
    });

    const defaultPage = 0;
    const defaultEmbed = embeds[defaultPage];

    if (typeof defaultEmbed === 'undefined') {
        return;
    }

    const previousButton = new discord.ButtonBuilder()
        .setCustomId('previous')
        .setLabel('Previous')
        .setStyle(discord.ButtonStyle.Primary);

    const nextButton = new discord.ButtonBuilder()
        .setCustomId('next')
        .setLabel('Next')
        .setStyle(discord.ButtonStyle.Primary);

    const unfoldButton = new discord.ButtonBuilder()
        .setCustomId('unfold')
        .setEmoji('⬇️')
        .setStyle(discord.ButtonStyle.Primary);

    const foldButton = new discord.ButtonBuilder()
        .setCustomId('fold')
        .setEmoji('⬆️')
        .setStyle(discord.ButtonStyle.Primary);

    // Initialize things.
    previousButton.setDisabled(true);

    const actionRowFirst = new discord.ActionRowBuilder<discord.ButtonBuilder>()
        .addComponents([previousButton, nextButton, unfoldButton]);

    const mrwor = await interaction.editReply({ embeds: [defaultEmbed], components: [actionRowFirst] });

    const collector = mrwor.createMessageComponentCollector({ componentType: api.ComponentType.Button });

    collector.on('collect', async (buttonInteraction) => {
        switch (buttonInteraction.customId) {
        case 'unfold':
            unfold(buttonInteraction);
            return;
        case 'fold':
            await buttonInteraction.editReply({ embeds: [defaultEmbed], components: [actionRowFirst] });
            return;
        }

        async function unfold(toUnfoldInteraction: discord.ButtonInteraction) {
            previousButton.setDisabled(true);
            nextButton.setDisabled(false);
            const unfoldedActionRow = new discord.ActionRowBuilder<discord.ButtonBuilder>()
                .addComponents([previousButton, nextButton, foldButton]);
            await toUnfoldInteraction.editReply({ embeds: embeds, components: [unfoldedActionRow] });
        }

        await buttonInteraction.deferUpdate();
        if (buttonInteraction.message.embeds[0] === undefined) return;

        const footersplit = buttonInteraction.message.embeds[0].footer?.text.split('/')[0];
        if (footersplit === undefined) return;

        const stringedNumber: string = footersplit.replace(/[^0-9]+/, '');
        let currentPage = 0;

        try {
            currentPage = parseInt(stringedNumber);
        }
        catch {
            return;
        }

        currentPage = currentPage - 1;

        switch (buttonInteraction.customId) {
        case 'next':
            if (currentPage === embeds.length) return;
            currentPage += 1;
            break;
        case 'previous':
            if (currentPage === 0) return;
            currentPage += -1;
            break;
        default:
            return;
        }

        const newEmbed = embeds[currentPage];

        switch (embeds[currentPage - 1]) {
        case undefined:
            previousButton.setDisabled(true);
            break;
        default:
            previousButton.setDisabled(false);
        }

        switch (embeds[currentPage + 1]) {
        case undefined:
            nextButton.setDisabled(true);
            break;
        default:
            nextButton.setDisabled(false);
        }

        const actionRow = new discord.ActionRowBuilder<discord.ButtonBuilder>()
            .addComponents([previousButton, nextButton]);

        if (newEmbed === undefined) {
            return;
        }

        await buttonInteraction.editReply({ embeds: [newEmbed], components: [actionRow] });
    });
}