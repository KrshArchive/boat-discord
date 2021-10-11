# boat-discord

## Inspiration

This project was made because of the shutdown of Groovy and Rhythm. This project was inspired by the connecting two APIs workshop.

## What it does

Plays Music. It can play music from yt vids, yt playlists, yt livestreams and more.

## How we built it

1. Set up the basic GitHub Repo
2. Use core commando functionality
3. Add the music commands

## Challenges we ran into

- **Syncing the commands together.**
  Later we used Structures.extend discord.js feature to fix that issue

- **Making ffmpeg work on every machine, without the complex installation**
  Found the "ffmpeg-static" package which would install automatically, Now the bot is up and running after `npm i`

## What we learned

- YouTube Data API v3
- Discord.js and Discord.js-Commando
- How to handle audio using ytdl-core in node

## What's next for Boat

- Audio Effects
- Something like the linux `man`
- More platforms like Spotify
