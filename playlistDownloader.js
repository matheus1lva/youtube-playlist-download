const { exec } = require('child_process');

const path = require('path');
const os = require('os');

const fs = require('fs');

const ytlist = require('youtube-playlist');
const youtubedl = require('youtube-dl');
const chalk = require('chalk');

const youtubeFetchVideoInfo = require('youtube-info');
const sanitize = require('sanitize-filename');

class PlaylistDownload {
  constructor(options) {
    this.options = {
      ...options,
      mp4FolderPath: path.resolve(options.outputFolder, 'mp4')
    };
  }

  static getCorrectFFMPEGBinaryPath() {
    const platform = os.platform();
    const architecture = os.arch();
    return `${platform}-${architecture}`;
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

    const ffmpegDistFolder = PlaylistDownload.getCorrectFFMPEGBinaryPath();

    const ffmpegBinary = path.resolve(
      path.join(__dirname, 'node_modules', '@ffmpeg-installer', ffmpegDistFolder, 'ffmpeg')
    );

    return new Promise((resolve, reject) => {
      exec(`${ffmpegBinary} -i "${mp4}" "${mp3}"`, (error) => {
        if (error !== null) {
          reject(error);
        }
        try {
          this.deleteVideo(videoFilename);
        } catch (err) {
          console.log(chalk.red(err));
        }
        console.log(chalk.blue(`-- ${MP3fileName} converted successfully -- \n`));
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
        console.log(chalk.green(`\n-- Downloading "${title}" --\n`));
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
        console.log(chalk.green(`-- ${title} Downloaded successfully -- \n`));
        console.log(chalk.green(`-- Converting ${title} to mp3 -- \n`));
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

    const videosConvertedAndDownloaded = playlistVideos.map(async (video) => {
      const videoInfo = await this.fetchVidInfo(video);
      return this.downloadVideo(video, videoInfo);
    });

    Promise.all(videosConvertedAndDownloaded)
      .then(() => {
        console.log(chalk.blue('Everything is downloaded!'));
        process.exit(0);
      })
      .catch((err) => {
        console.log(chalk.red('ERR', err));
      });
  }
}

module.exports = { PlaylistDownload };
