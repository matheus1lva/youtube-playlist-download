const path = require('path');

const chalk = require('chalk');
const parse = require('yargs-parser');
const { PlaylistDownload } = require('./playlistDownloader');
const pkg = require('./package.json');

const help = chalk`
  ${pkg.description}
  {underline Usage}
    $ yt-pl-download <playlist URL> <output folder>

  {underline Options}
    --help            Displays this message

  {underline Examples}
    $ yt-pl-download --help
`;

const run = async () => {
  const { _: [playlistUrl, outputPath] } = parse(process.argv.slice(2));
  const playlistDownloader = new PlaylistDownload({
    url: playlistUrl,
    outputFolder: outputPath
  });
  await playlistDownloader.run();
};

run();