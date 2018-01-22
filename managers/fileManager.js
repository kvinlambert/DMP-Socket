const fs                       = require('fs');
const path                     = require('path');
const mkdirp                   = require('mkdirp');
const dirTree                  = require('directory-tree');
const musicManager             = require('./musicManager');
const { musicTypes, musicDir } = require('../config');

module.exports = {

  createInitialFolder() {
    try {
      if (!fs.statSync(path.join(musicDir))) {
        mkdirp.sync(path.join(musicDir));
      }
      return {
        code: 200,
        text: path.join(musicDir)
      };
    } catch (err) {
      return {
        code: 404,
        text: err
      };
    }
  },

  /**
   * Get JSON Tree of a give path
   *
   * @param {String} _path
   * @return {Object}
   */
  getTree(_path) {
    return dirTree(_path, { exclude: /(.DS_Store|.gitkeep)/ });
  },

  /**
   * Return the number of songs in the music dir
   *
   * @return {Number}
   */
  getTotalSongs() {
    const tree = this.getTree(musicDir);
    const { children } = tree;

    return children.reduce((oldSubdir, newSubdir) => {
      const songs = this.getTree(newSubdir.path).children;
      const musicExtensions = ['.mp3', '.wav'];

      return oldSubdir.concat(songs.filter(song =>
        musicExtensions.includes(song.extension)));
    }, []).length;
  },


  /**
   * Get an array of songs with informations for a given subdir path
   *
   * @param {String} subdirPath
   * @param {Socket} socket
   * @return {Array} [of Songs with properties like song type]
   */
  getArrayOfSongTypes(subdirPath, socket) {
    const roundMetas = this.getRoundMetas(subdirPath);
    const tree = this.getTree(subdirPath);
    const { children } = tree;

    socket.progress.totalSongs = this.getTotalSongs();

    return Promise.all(children.map(song =>
      musicManager.getSongType(roundMetas.type, song, socket)))
      .then((result) => {
        const unknownSongTypes = result.filter(songInfos => songInfos.meta[0].type === 'unknown');

        if (unknownSongTypes.length === 1 && result.length === 5) {
          const missingMusicType = musicManager.getTypeByDeduction(result, roundMetas.type);

          unknownSongTypes[0].meta[0] = {
            type: missingMusicType,
            probability: 0.5
          };
        }

        return result;
      })
      .catch(error => ({ error }));
  },


  /**
   * Get a JSON of all the rounds and their informations, plus all the songs contained in it
   * with their informations also
   *
   * @param {String} _path
   * @param {Socket} socket
   * @return {JSON}
   */
  getRounds(_path, socket) {
    const tree = this.getTree(_path);
    const { children } = tree;
    const dancesOrder = {};

    const songsArrayPromise = Promise.all(tree.children.map(child =>
      this.getArrayOfSongTypes(child.path, socket)));

    const roundsArray = children.map((subdir, index) => {
      const roundMetas = this.getRoundMetas(subdir.path);

      if (!musicTypes[roundMetas.type]) {
        return false;
      }

      Object.keys(musicTypes[roundMetas.type]).forEach((musicType, musicIndex) => {
        dancesOrder[musicType] = musicIndex;
      });

      return {
        id: index,
        time: roundMetas.time,
        category: roundMetas.category,
        round: roundMetas.round,
        type: roundMetas.type,
        isDone: false
      };
    });

    return songsArrayPromise.then(songsArray => songsArray.map((songs, index) => ({
      ...roundsArray[index],
      dances: songs.sort((a, b) => dancesOrder[a.meta[0].type] - dancesOrder[b.meta[0].type])
    }))).catch(err => console.error(err));
  },


  /**
   * Parse the name of a folder to get
   * informations about the round
   *
   * @param {String} subdirPath
   * @return {Object}
   */
  getRoundMetas(subdirPath) {
    const { name } = this.getTree(subdirPath);
    const roundMetas = name.split('-');

    return {
      time: roundMetas[0].trim(),
      category: roundMetas[1].trim(),
      round: roundMetas[2].trim(),
      heats: roundMetas[3].trim(),
      type: roundMetas[4].trim()
    };
  },

  addTextToFile(filePath, textToAdd) {
    if (fs.existsSync(filePath)) {
      const actualFileName = path.basename(filePath);
      const fileExt = path.extname(filePath);
      const fileDirectory = path.dirname(filePath);
      const newFileName = actualFileName.replace(fileExt, ` ${textToAdd}${fileExt}`);

      fs.renameSync(filePath, path.join(fileDirectory, newFileName));
      return 200;
    }
    return 404;
  }
};
