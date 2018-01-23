const fs               = require('fs');
const uuidv4           = require('uuid/v4');
const MusicTempo       = require('music-tempo');
const assignIn         = require('lodash.assignin')
const { AudioContext } = require('web-audio-api');
const childProcess     = require('child_process');
const { musicTypes }   = require('../config');

module.exports = {
  /**
   * Asynchronously return the song type
   *
   * @param {String} roundType
   * @param {Object} _song
   * @param {Socket} socket
   * @return {Promise}
   */
  getSongType(roundType, _song, socket) {
    const song = assignIn({ uuid: uuidv4() }, _song);
    const typeByName = this.getTypeByTitle(roundType, song);

    if (typeByName.meta[0].type !== 'unknown') {
      socket.progress.songsTreated += 1;
      socket.emit('progress-update', socket.progress);
      return Promise.resolve(typeByName);
    }

    return this.getTypeByBpm(roundType, song, socket);
  },


  /**
   * Verify if the title of a song contains enough infos to determine its type
   *
   * @param {String} roundType [category of the song. 'lat' or 'std']
   * @param {Object} song
   * @return {Object}
   */
  getTypeByTitle(roundType, song) {
    const { name, path, uuid } = song;
    const musicTypesEntries = Object.keys(musicTypes[roundType]);
    const songInfos = {
      uuid,
      name,
      path,
      meta: this.resetMeta()
    };

    musicTypesEntries.forEach((type) => {
      const nameModifier = songName => songName.toLowerCase().replace(/(\[(clashes).*\])/g, '');
      const { titles, bpms } = musicTypes[roundType][type];
      const titleMatch = titles.some(title => nameModifier(name).toLowerCase().includes(title));
      const bpmMatch = bpms.some(bpm => nameModifier(name).toLowerCase().includes(bpm));

      // If the song name contains an indicator either with the type name or bpm
      if (titleMatch || bpmMatch) {
        // If the meta are still containing the 'unknown' default object, remove it
        if (songInfos.meta.some(meta => meta.type === 'unknown')) {
          songInfos.meta = [];
        }
        // Add the new possible metas
        songInfos.meta.push({
          type: titleMatch || bpmMatch ? type : null,
          probability: [titleMatch, bpmMatch].reduce((oldVal, val) => oldVal + (val ? 1 : 0))
        });
      }
    });

    // If the song has more than one possible type, filter to keep only the high probability (>= 2)
    if (songInfos.meta.length > 1) {
      songInfos.meta = songInfos.meta.filter(meta => meta.probability >= 2);

      /**
       * If all the type possible were at low probability,
       * just set the meta as unknown, to be handle by bpm
      */
      if (!songInfos.meta.length) {
        songInfos.meta = this.resetMeta();
      }
    }

    return songInfos;
  },


  /**
   * Get the type of the music by checking its bpm
   *
   * @param {String} roundType
   * @param {Object} song
   * @param {Socket} socket
   * @return {Promise}
   */
  getTypeByBpm(roundType, song, socket) {
    const { name, path, uuid } = song;
    const musicTypesEntries = Object.keys(musicTypes[roundType]);
    const songInfos = {
      uuid,
      name,
      path,
      meta: [
        {
          type: 'unknown',
          probability: 0
        }
      ]
    };

    return new Promise((resolve) => {
      const getSongBpmWorker = childProcess.fork('./workers/getSongBpmWorker.js', [
        uuid,
        song.path
      ]);

      getSongBpmWorker.on('message', ({ songUuid, songBpm }) => {
        socket.progress.songsTreated += 1;
        socket.emit('progress-update', socket.progress);
        console.log(songBpm, songUuid, song.uuid, song.name);
        musicTypesEntries.forEach((type) => {
          const { bpms } = musicTypes[roundType][type];

          const isMusicTypeContainingBpm = bpms.some((typeBpm) => {
            const bpmToTest = Math.round(songBpm) / musicTypes[roundType][type].ratio;
            // console.log(name, songBpm, type, typeBpm, Math.round(bpmToTest));
            return typeBpm === Math.round(bpmToTest);
          });

          if (isMusicTypeContainingBpm) {
          // If the meta are still containing the 'unknown' default object, remove it
            if (songInfos.meta.some(meta => meta.type === 'unknown')) {
              songInfos.meta = [];
            }
            // Add the new possible metas
            songInfos.meta.push({
              type,
              probability: 1
            });
          }
        });

        if (songInfos.meta.length > 1) {
          songInfos.meta = this.resetMeta();
        }
        resolve(songInfos);
      });
    });
  },

  /**
   * Determine the type of the last song if every other songs are detected
   *
   * @param {Object} round
   * @param {String} roundType
   * @return {String}
   */
  getTypeByDeduction(round, roundType) {
    const musicTypesEntries = Object.keys(musicTypes[roundType]);
    const missingMusicType = musicTypesEntries.filter(musicType =>
      round.map(song => (musicType === song.meta[0].type)).indexOf(true) === -1);

    return missingMusicType[0];
  },


  /**
   * Get the song BPM
   *
   * @param {Object} song
   * @return {Promise}
   */
  getSongBpm(song) {
    const context = new AudioContext();

    return new Promise((resolve, reject) => {
      context.decodeAudioData(fs.readFileSync(song.path), (buffer) => {
        let audioData = [];
        // Take the average of the two channels
        if (buffer.numberOfChannels === 2) {
          const channel1Data = buffer.getChannelData(0);
          const channel2Data = buffer.getChannelData(1);
          const { length } = channel1Data;
          for (let i = 0; i < length; i += 1) {
            audioData[i] = (channel1Data[i] + channel2Data[i]) / 2;
          }
        } else {
          audioData = buffer.getChannelData(0);
        }
        const mt = new MusicTempo(audioData);

        resolve(parseFloat(mt.tempo, 10));
      }, err => reject(err));
    });
  },

  resetMeta() {
    return [
      {
        type: 'unknown',
        probability: 0
      }
    ];
  }
};
