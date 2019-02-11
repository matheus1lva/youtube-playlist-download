const { exec } = require('child_process');

const path = require('path');

const fs = require('fs');

const ytlist = require('youtube-playlist');
const youtubedl = require('youtube-dl');

const youtubeFetchVideoInfo = require('youtube-info');
const sanitize = require('sanitize-filename');

class PlaylistDownload {
  constructor(options) {
    this.options = {
      ...options,
      mp4FolderPath: path.resolve(options.outputFolder, 'mp4')
    };
  }

  async fetchPlaylistVideos() {
    const response = await ytlist(this.options.url, 'url');
    return response.data.playlist || [];
  }

  deleteVideo(videoFilename) {
    fs.unlinkSync(path.resolve(this.options.mp4FolderPath, videoFilename));
  }

  parseMp3(videoFilename) {
    const regex = /(\.mp4)/g;
    const MP3fileName = videoFilename.replace(regex, '.mp3');

    const mp4 = `${this.options.outputFolder}/mp4/${videoFilename}`;
    const mp3 = `${this.options.outputFolder}/${MP3fileName}`;

    return new Promise((resolve, reject) => {
      exec(`ffmpeg -i "${mp4}" "${mp3}"`, (error) => {
        if (error !== null) {
          reject(error);
        }
        this.deleteVideo(videoFilename);
        process.stdout.write('-- Mp3 converted successfully -- \n');
        resolve();
      });
    });
  }

  // eslint-disable-next-line
  fetchVidInfo(video) {
    // eslint-disable-next-line
    const [_, videoId] = video.split('v=');

    return new Promise((resolve, reject) => {
      youtubeFetchVideoInfo(videoId, (err, videoInfo) => {
        if (err) {
          reject(err);
        }
        resolve(videoInfo);
      });
    });
  }

  downloadVideo(video, videoInfo) {
    const videoFolder = this.options.mp4FolderPath;
    if (!fs.existsSync(videoFolder)) {
      fs.mkdirSync(videoFolder);
    }

    return new Promise((resolve, reject) => {
      const title = sanitize(videoInfo.title);
      const mp4TitleWithExtension = `${title}.mp4`;
      const videoDownload = youtubedl(video);
      let size = 0;
      videoDownload.on('error', (err) => {
        console.log(`Error 2:  ${err}`);
        reject(err);
      });

      videoDownload.on('info', ({ size: downloadSize }) => {
        size = downloadSize;
        videoDownload.pipe(fs.createWriteStream(path.resolve(videoFolder, mp4TitleWithExtension)));
        process.stdout.write(`Downloading "${title}"`);
      });

      let pos = 0;
      // eslint-disable-next-line
      videoDownload.on('data', (data) => {
        pos += data.length;
        if (size) {
          const percent = ((pos / size) * 100).toFixed(2);
          if (percent === 100) {
            return 0;
          }
          process.stdout.cursorTo(0);
          process.stdout.clearLine(1);
          process.stdout.write(`${percent}%`);
        }
      });

      videoDownload.on('end', async () => {
        process.stdout.cursorTo(0);
        process.stdout.clearLine(1);
        process.stdout.write(`-- ${title} Downloaded successfully -- \n`);
        process.stdout.write(`-- Converting ${title} to mp3 -- \n`);
        await this.parseMp3(mp4TitleWithExtension);
        resolve();
      });
    });
  }

  async run() {
    if (!fs.existsSync(path.resolve(this.options.outputFolder))) {
      fs.mkdirSync(path.resolve(this.options.outputFolder));
    }

    const playlistVideos = await this.fetchPlaylistVideos();

    playlistVideos.forEach(async (video) => {
      const videoInfo = await this.fetchVidInfo(video);
      await this.downloadVideo(video, videoInfo);
    });
  }
}

module.exports = { PlaylistDownload };
