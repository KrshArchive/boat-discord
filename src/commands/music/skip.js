const { Command } = require('discord.js-commando')
const { MessageEmbed } = require('discord.js')

module.exports = class SkipCommand extends Command {
  constructor (client) {
    super(client, {
      name: 'skip',
      memberName: 'skip',
      group: 'music',
      description: 'Skip the current playing song',
      guildOnly: true
    })
  }

  run (message) {
    const voiceChannel = message.member.voice.channel
    if (!voiceChannel) {
      return message.reply('You need to join voice channel first')
    }
    if (
      typeof message.guild.songDispatcher === 'undefined' ||
      message.guild.songDispatcher == null
    ) {
      return message.reply('There is no song playing right now!')
    }

    if (!message.guild.voice.connection) {
      return
    }
    const userVoiceChannel = message.member.voice.channel
    if (!userVoiceChannel) {
      return
    }
    const clientVoiceConnection = message.guild.voice.connection
    if (userVoiceChannel === clientVoiceConnection.channel) {
      message.guild.songDispatcher.end()
      const embed = new MessageEmbed()
        .setColor('#5dc4ff')
        .setAuthor(
          'Skip',
          'https://cdn.discordapp.com/attachments/688763072864976906/706472099082141696/661493093811617803.gif'
        )
        .addField(
          '✔ | Successfully skipped',
          `**${message.guild.nowPlaying.title}**`
        )
        .setTimestamp()
        .setFooter(`Skipped by ${message.author.username}`)
      message.say(embed)
    } else {
      message.channel.send(
        'You can only execute this command if you share the same voiceChannel!'
      )
    }
  }
}
