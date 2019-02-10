const path = require('path');

const chalk = require('chalk');
const parse = require('yargs-parser');

const pkg = require('./package.json');

const help = chalk`
  ${pkg.description}
  {underline Usage}
    $ yt-pl-download <playlist URL> <output folder>

  {underline Options}
    --help            Displays this message

  {underline Examples}
    $ yt-pl-download --help
    $ yt-pl-download v016 src
`;

const run = async () => {
  const argv = parse(process.argv.slice(2));
};
