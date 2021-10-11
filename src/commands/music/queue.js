const { Command } = require('discord.js-commando')
const { MessageEmbed } = require('discord.js')

module.exports = class QueueCommand extends Command {
  constructor (client) {
    super(client, {
      name: 'queue',
      group: 'music',
      memberName: 'queue',
      guildOnly: true,
      description: 'Display the song queue'
    })
  }

  run (message) {
    if (message.guild.queue.length === 0) {
      return message.say('There are no songs in queue!')
    }
    const titleArray = []

    message.guild.queue.slice(0, 10).forEach(obj => {
      titleArray.push(obj.title)
    })

    const queueEmbed = new MessageEmbed()
      .setColor('#5dc4ff')
      .setTitle(`Music Queue - ${message.guild.queue.length} items`)
    for (let i = 0; i < titleArray.length; i++) {
      queueEmbed.addField(`${i + 1}:`, `${titleArray[i]}`)
    }
    return message.say(queueEmbed)
  }
}
