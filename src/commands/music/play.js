const { Command } = require('discord.js-commando')
const { MessageEmbed } = require('discord.js')
const Youtube = require('simple-youtube-api')
const ytdl = require('ytdl-core')
const youtube = new Youtube(process.env.YOUTUBE_TOKEN)

module.exports = class PlayCommand extends Command {
  constructor (client) {
    super(client, {
      name: 'play',
      memberName: 'play',
      group: 'music',
      description: 'Plays a song from YouTube',
      guildOnly: true,
      clientPermissions: ['SPEAK', 'CONNECT', 'VIEW_CHANNEL'],
      throttling: {
        usages: 2,
        duration: 10
      },
      args: [
        {
          key: 'query',
          prompt: 'What song or playlist would you like to listen to?',
          type: 'string',
          default: (message) => message.author.id,
          validate: function (query) {
            return query.length > 0 && query.length < 200
          }
        }
      ]
    })
  }

  async run (message, { query }) {
    const vc = message.member.voice.channel

    if (!vc) {
      return message.say(
        `I can't surf to you unless you tell me the address. Please join a voice channel.${
          this.client.voice.connections.has(message.guild.id) ? ` Perhaps, You could surf over to me: ${this.client.voice.connections.get(vc.guild.id).channel.name}` : ''
        }!`
      )
    }
    if (!vc || !vc.joinable) {
      return message.reply(
        "You're address is restricted to me. Please check my permissions"
      )
    }

    if (message.guild.isPlaying === true && vc.id !== this.client.voice.connections.get(vc.guild.id).channel.id) {
      return message.channel.send({
        embed: {
          description: `You need to be inside the room: **${this.client.voice.connections.get(vc.guild.id).channel.name} for having access over the boombox** `,
          color: '#ff0000'
        }
      })
    }

    if (
      query.match(
        /^(?!.*\?.*\bv=)https:\/\/www\.youtube\.com\/.*\?.*\blist=.*$/
      )
    ) {
      const playlist = await youtube.getPlaylist(query).catch(function () {
        return message.say(
          "Are you sure that playlist exists? I went surfing through YouTube but couldn't find it. Perhaps, It's private"
        )
      })

      const videosObject = await playlist.getVideos().catch(function () {
        return message.say(
          "I can't find this video inside of the playlist. I went surfing through YouTube but couldn't find it. Perhaps, It's private"
        )
      })

      for (let i = 0; i < videosObject.length; i++) {
        const video = await videosObject[i].fetch()
        message.guild.queue.push(
          PlayCommand.constructSongObj(video, vc, message.member.user)
        )
      }

      if (message.guild.isPlaying === false) {
        message.guild.isPlaying = true
        return PlayCommand.playSong(message.guild.queue, message)
      } else if (message.guild.isPlaying === true) {
        const PlayListEmbed = new MessageEmbed()
          .setColor('#5dc4ff')
          .setTitle(`${playlist.title}`)
          .addField(
            `It was a long journey across the ocean! Finally got ${message.guild.queue.length} Song CDs to play! Added them to the queue`,
            playlist.url
          )
          .setThumbnail(playlist.thumbnails.high.url)
          .setURL(playlist.url)

        return message.say(PlayListEmbed)
      }
    }

    if (query.match(/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/)) {
      query = query
        .replace(/(>|<)/gi, '')
        .split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/)

      const id = query[2].split(/[^0-9a-z_-]/i)[0]

      const video = await youtube.getVideoByID(id).catch(function () {
        return message.say(
          "I can't find this video inside of the playlist. I went surfing through YouTube but couldn't find it. Perhaps, It's private"
        )
      })

      message.guild.queue.push(
        PlayCommand.constructSongObj(video, vc, message.member.user)
      )

      if (
        message.guild.isPlaying === false ||
        typeof message.guild.isPlaying === 'undefined'
      ) {
        message.guild.isPlaying = true

        return PlayCommand.playSong(message.guild.queue, message)
      } else if (message.guild.isPlaying === true) {
        const addedEmbed = new MessageEmbed()
          .setColor('#5dc4ff')
          .setTitle(`${video.title}`)
          .setDescription(
            'It was a long journey across the ocean to find this CD. Added it to the queue'
          )
          .setThumbnail(video.thumbnails.high.url)
          .setURL(video.url)

        return message.say(addedEmbed)
      }
    }

    const videos = await youtube.searchVideos(query, 5).catch(function () {
      return message.say(
        "I went surfing through YouTube but couldn't find it. Perhaps, It's private"
      )
    })
    if (videos.length < 5) {
      return message.say(
        'Where do I land in that continent? Could you be more specific on the address'
      )
    }

    const songEmbed = await message.react('✅').then(function () {
      const videoIndex = parseInt(1)
      youtube
        .getVideoByID(videos[videoIndex - 1].id)
        .then(function (video) {
          message.guild.queue.push(
            PlayCommand.constructSongObj(video, vc, message.member.user)
          )

          if (message.guild.isPlaying === false) {
            message.guild.isPlaying = true
            if (songEmbed) {
              songEmbed.delete()
            }
            PlayCommand.playSong(message.guild.queue, message)
          } else if (message.guild.isPlaying === true) {
            if (songEmbed) {
              songEmbed.delete()
            }
            const addedEmbed = new MessageEmbed()
              .setColor('#5dc4ff')
              .setTitle(`${video.title}`)
              .setDescription(
                'It was a long journey across the ocean to find this CD. Added it to the queue'
              )
              .setThumbnail(video.thumbnails.high.url)
              .setURL(video.url)
            message.say(addedEmbed)
          }
        })
        .catch(function () {
          if (songEmbed) {
            songEmbed.delete()
          }
          return message.say(
            "I went surfing across YouTube but can't find that song! Perhaps, It's private"
          )
        })
    })
  }

  static playSong (queue, message) {
    const classThis = this
    queue[0].voiceChannel
      .join()
      .then(function (connection) {
        const dispatcher = connection
          .play(
            ytdl(queue[0].url, {
              quality: 'highestaudio',
              highWaterMark: 1024 * 1024 * 10
            })
          )
          .on('start', function () {
            message.guild.songDispatcher = dispatcher

            const videoEmbed = new MessageEmbed()
              .setAuthor('Playing...')
              .setTitle('')
              .setThumbnail(queue[0].thumbnail)
              .setColor('#5dc4ff')
              .setDescription(
                `**[${queue[0].title}](${queue[0].url})** \nDuration: **[${queue[0].duration}]** \nRequested by: **${queue[0].memberDisplayName}**`
              )

            if (queue[1]) {
              videoEmbed.addField(
                'Next Song:',
                `**[${queue[1].title}](${queue[1].url})** \nDuration: **[${queue[1].duration}]**`
              )
            }
            message.say(videoEmbed).then((msg) => {
              msg.react('▶').then((r) => {
                msg.react('⏸')
                msg.react('⏹')
                msg.react('❌')
                const backwardsFilter = (reaction, user) =>
                  reaction.emoji.name === '▶' && user.id === message.author.id
                const fowardsFilter = (reaction, user) =>
                  reaction.emoji.name === '⏸' && user.id === message.author.id
                const stopFilter = (reaction, user) =>
                  reaction.emoji.name === '⏹' && user.id === message.author.id
                const nextFilter = (reaction, user) =>
                  reaction.emoji.name === '❌' && user.id === message.author.id
                const backwards = msg.createReactionCollector(backwardsFilter)
                const fowards = msg.createReactionCollector(fowardsFilter)
                const stop = msg.createReactionCollector(stopFilter)
                const next = msg.createReactionCollector(nextFilter)
                backwards.on('collect', () => {
                  message.guild.songDispatcher.resume()
                  msg.reactions.resolve('▶').users.remove(message.author.id)
                  message.channel.send('▶ Resumed').then(async (message) => {
                    message.delete({ timeout: 2000 })
                  })
                })

                fowards.on('collect', () => {
                  message.guild.songDispatcher.pause()
                  msg.reactions.resolve('⏸').users.remove(message.author.id)
                  message.channel
                    .send('⏸ Song Paused')
                    .then(async (message) => {
                      message.delete({ timeout: 2000 })
                    })
                })
                stop.on('collect', () => {
                  message.guild.songDispatcher.resume()
                  message.guild.songDispatcher.end()
                  msg.reactions.resolve('⏹').users.remove(message.author.id)
                  message.channel
                    .send('⏹ Song Stopped.')
                    .then(async (message) => {
                      message.delete({ timeout: 2000 })
                    })
                })
                next.on('collect', () => {
                  message.guild.songDispatcher.resume()
                  message.guild.songDispatcher.end()
                  message.guild.queue.length = 0
                  msg.reactions.resolve('❌').users.remove(message.author.id)
                  message.channel
                    .send('❌ Stopping all song.')
                    .then(async (message) => {
                      message.delete({ timeout: 2000 })
                    })
                })
              })
            })
            message.guild.nowPlaying = queue[0]
            return queue.shift()
          })
          .on('finish', function () {
            if (queue.length >= 1) {
              return classThis.playSong(queue, message)
            } else {
              const embods = new MessageEmbed()
                .setDescription('The song/music has ended.')
                .setColor('#5dc4ff')
              message.say(embods)
              message.guild.isPlaying = false
              message.guild.nowPlaying = null
              message.guild.songDispatcher = null
              return message.guild.me.voice.channel.leave()
            }
          })
          .on('error', function (e) {
            message.say('Looks like this cd is corrupt')
            console.error(e)
            message.guild.queue.length = 0
            message.guild.isPlaying = false
            message.guild.nowPlaying = null
            message.guild.songDispatcher = null
            return message.guild.me.voice.channel.leave()
          })
      })
      .catch(function (e) {
        console.error(e)
        return message.guild.me.voice.channel.leave()
      })
  }

  static constructSongObj (video, voiceChannel, user) {
    let duration = this.formatDuration(video.duration)
    if (duration === '00:00') duration = ' Live Stream'
    return {
      url: `https://www.youtube.com/watch?v=${video.raw.id}`,
      title: video.title,
      rawDuration: video.duration,
      duration,
      thumbnail: video.thumbnails.high.url,
      voiceChannel,
      memberDisplayName: user.tag
    }
  }

  static formatDuration (durationObj) {
    const duration = `${durationObj.hours ? durationObj.hours + ':' : ''}${
      durationObj.minutes ? durationObj.minutes : '00'
    }:${
      durationObj.seconds < 10
        ? '0' + durationObj.seconds
        : durationObj.seconds
        ? durationObj.seconds
        : '00'
    }`
    return duration
  }
}
