# youtube-playlist-download

When you have a decent playlist on youtube and those songs are not available on spotify to hear on the fly... here is where this cli works for you.

It downloads all the songs from the playlist. All you need to do to install is:

`npm install -g youtube-playlist-dld`

## Usage
`youtube-playlist-dld <url> <outputFolder>`

For e.g.: `youtube-playlist-dld http://youtube.com/aosidjaoisjd ./cool-musics`

It uses `ffmpeg` under the hood, which is installed on the fly based on the OS and architecture you have.