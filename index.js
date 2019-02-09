const { exec } = require('child_process');
const ytlist = require('youtube-playlist');
const youtubedl = require('youtube-dl');
const path = require('path');
const fs = require('fs');
const fetchVideoInfo = require('youtube-info');
const sanitize = require("sanitize-filename");


class PlaylistDownload {
    constructor(options){
        this.options = options;
    }

    parseMp3(videoFilename, outputFolder){
        const regex = /(\.mp4)/g;
        const MP3fileName = videoFilename.replace(regex, '.mp3');
    
        const mp4 = outputFolder + "/mp4/" + videoFilename;
        const mp3 = outputFolder + MP3fileName;
    
        return new Promise((resolve, reject) => {
            exec('ffmpeg -i "' + mp4 + '" "' + mp3 + '"', (error) => {
                    // app.deleteVideo(fileName, callback);
                    if (error !== null) {
                        reject(error);
                    }
                    resolve();
                }
            );
        })
    }

    async fetchPlaylistVideos(){
        const response = await ytlist(this.options.url, 'url');
        return response.data.playlist || [];
    }

    fetchVideoInfo(video){
        const videoId = video.split('v=')[1];
        
        return new Promise((resolve, reject) => {
            fetchVideoInfo(videoId, (err, videoInfo) => {
                if(err){
                    reject(err);
                }
                resolve(videoInfo);
            });
        })
    }

    async run() {
        const playlistVideos = await this.fetchPlaylistVideos();
        playlistVideos.forEach((video) => {
            const videoInfo = this.fetchVideoInfo(video);
        })
    }
}


ytlist('https://www.youtube.com/playlist?list=PLGEL0vaf2SSFu12LIEyRd2ya29yGllnGe', 'url').then(res => {
    const videos = res.data.playlist;
    videos.forEach((video) => {
        const videoId = video.split('v=')[1];
        fetchVideoInfo(videoId, (err, videoInfo) => {
            const title = videoInfo.title;

            const videoDownload = youtubedl(video);
            var size = 0;
            videoDownload.on('error', function(err) {
                console.log("Error 2:  " + err);
                callback();
            });

            videoDownload.on('info', function(info) {
                size = info.size;
                videoDownload.pipe(fs.createWriteStream(path.resolve(__dirname, 'mp4', sanitize(`${title}.mp4`))));
            });

            var pos = 0;
            videoDownload.on('data', function(data) {
                pos += data.length;
                if (size) {
                    var percent = (pos / size * 100).toFixed(2);
                    if (percent == 100) {
                        return 0;
                    }
                    else {
                        process.stdout.cursorTo(0);
                        process.stdout.clearLine(1);
                        process.stdout.write(percent + '%');
                    }
                }
            });

            videoDownload.on('end', function() {
                process.stdout.cursorTo(0);
                process.stdout.clearLine(1);
                process.stdout.write('---Complete \n');

                
            });
        });
    })
});


