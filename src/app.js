const { FriendlyError, CommandoClient } = require('discord.js-commando')
const { Structures } = require('discord.js')
const { oneLine } = require('common-tags')
const path = require('path')
const winstonlib = require('winston')
const dotenv = require('dotenv')

Structures.extend('Guild', function (Guild) {
  class BoatGuild extends Guild {
    constructor (client, data) {
      super(client, data)
      this.isPlaying = false
      this.nowPlaying = null
      this.queue = []
      this.songDispatcher = null
    }
  }
  return BoatGuild
})

if (!process.env.DISCORD_TOKEN) {
  dotenv.config(path.join(__dirname, '..', '.env'))
}

const winston = winstonlib.createLogger({
  transports: [new winstonlib.transports.Console()],
  format: winstonlib.format.simple()
})

const client = new CommandoClient({
  owner: process.env.DISCORD_OWNERS.split(','),
  commandPrefix: process.env.DISCORD_PREFIX,
  unknownCommandResponse: true,
  disableEveryone: true
})

client.on('error', winston.error)
  .on('warn', winston.warn)
  .on('ready', () => {
    winston.info(oneLine`
      [DISCORD]: Client ready!
      Logged in as ${client.user.tag} (${client.user.id})
    `)
  })
  .on('disconnect', () => winston.warn('[DISCORD]: Disconnected!'))
  .on('reconnect', () => winston.warn('[DISCORD]: Reconnecting...'))
  .on('commandRun', (cmd, promise, msg, args) =>
    winston.info(oneLine`
      [DISCORD]: ${msg.author.tag} (${msg.author.id})
      > ${msg.guild ? `${msg.guild.name} (${msg.guild.id})` : 'DM'}
      >> ${cmd.groupID}:${cmd.memberName}
      ${Object.values(args).length ? `>>> ${Object.values(args)}` : ''}
    `)
  )
  .on('unknownCommand', msg => {
    if (msg.channel.type === 'dm') return
    if (msg.author.bot) return
    if (msg.content.split(msg.guild.commandPrefix)[1] === 'undefined') return
    const args = { name: msg.content.split(msg.guild.commandPrefix)[1].toLowerCase() }
    client.registry.resolveCommand('tags:tag').run(msg, args)
  })
  .on('commandError', (cmd, err) => {
    if (err instanceof FriendlyError) return
    winston.error(`[DISCORD]: Error in command ${cmd.groupID}:${cmd.memberName}`, err)
  })
  .on('commandBlocked', (msg, reason) => {
    winston.info(oneLine`
      [DISCORD]: Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
      blocked; User ${msg.author.tag} (${msg.author.id}): ${reason}
    `)
  })
  .on('commandPrefixChange', (guild, prefix) => {
    winston.info(oneLine`
      [DISCORD]: Prefix changed to ${prefix || 'the default'}
      ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
    `)
  })
  .on('commandStatusChange', (guild, command, enabled) => {
    winston.info(oneLine`
      [DISCORD]: Command ${command.groupID}:${command.memberName}
      ${enabled ? 'enabled' : 'disabled'}
      ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
    `)
  })
  .on('groupStatusChange', (guild, group, enabled) => {
    winston.info(oneLine`
      [DISCORD]: Group ${group.id}
      ${enabled ? 'enabled' : 'disabled'}
      ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
    `)
  })

client.registry
  .registerGroups([
    ['music', 'Music Player'],
    ['misc', 'Miscellaneous Utilities']
  ])
  .registerDefaults()
  .registerCommandsIn(path.join(__dirname, 'commands'))

client.login(process.env.DISCORD_TOKEN)
