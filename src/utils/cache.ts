// Here goes nothing. Caching time!
import type * as discord from 'discord.js';
import * as api from 'discord-api-types/v10';

async function genCachePromises(client: discord.Client, guild_id: string, channel_id: string) {
    const guild: (discord.Guild | null) = await client.guilds.fetch(guild_id)
    const channel: (discord.Channel | null) = await guild.channels.fetch(channel_id, { force: true })

    if (!(guild && channel && channel.type === api.ChannelType.GuildText)) {
        return;
    }

    const requests: Array<Promise<any>> = []
    await channel.messages.fetchPinned(false)
        .then(array => array.forEach(message => requests.push(message.fetch()))) // Unnecessary (and potentially harmful?) to cache pins, therefore cache flag is set to false.
    return requests;
}
export { genCachePromises }