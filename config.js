const path = require('path');
const os = require('os');

/**
 * Config for Node
 * @type {Object}
 */
exports.nodeConfig = {
  port: 3000,
  host: 'localhost',
  routes: {
    cors: true
  }
};

/**
 * Location of the music folder
 * @type {String}
 */
exports.musicDir = path.join(__dirname, '..', 'music');

/**
 * Location of the timing file
 * @type {String}
 */
exports.timingPath = path.join(__dirname, '..', 'timing.xlsx');

/**
 * Associative object of column order
 * @type {Object}
 */
exports.timingColumnOrder = {
  time: 0,
  category: 1,
  round: 3,
  heats: 4,
  type: 2
};

/**
 * All types of music and their properties
 * @type {Object}
 */
exports.musicTypes = {
  lat: {
    samba: {
      titles: [
        'samba',
        'sb'
      ],
      bpms: [
        50,
        51,
        52
      ],
      ratio: 4
    },
    chacha: {
      titles: [
        'chacha',
        'chachacha',
        ' cc',
        '(cc',
        ' ch',
        '(ch'
      ],
      bpms: [
        30,
        31,
        32
      ],
      ratio: 4
    },
    rumba: {
      titles: [
        'rumba',
        'rb'
      ],
      bpms: [
        22,
        23,
        24,
        25
      ],
      ratio: 4
    },
    pasodoble: {
      titles: [
        'pasodoble',
        'paso doble',
        'pd',
        'espana cani',
        'gipsy'
      ],
      bpms: [
        59,
        60,
        61,
        62
      ],
      ratio: 2
    },
    jive: {
      titles: [
        'jive',
        'jv'
      ],
      bpms: [
        41,
        42,
        43,
        44
      ],
      ratio: 4
    }
  },
  std: {
    english: {
      titles: [
        'english',
        'sw ',
        ' sw2',
        ' sw3',
        '(sw',
        'lw ',
        ' lw2',
        ' lw3',
        '(lw'
      ],
      bpms: [
        28,
        29,
        30
      ],
      ratio: 6
    },
    tango: {
      titles: [
        'tango',
        'tg'
      ],
      bpms: [
        31,
        32
      ],
      ratio: 4
    },
    viennese: {
      titles: [
        'viennese',
        ' vw',
        'vw ',
        '(vw'
      ],
      bpms: [
        58,
        59,
        60
      ],
      ratio: 3
    },
    slowfox: {
      titles: [
        'slowfox',
        'foxtrot',
        'slow-fox',
        'sf'
      ],
      bpms: [
        28,
        29,
        30
      ],
      ratio: 4
    },
    quickstep: {
      titles: [
        'quickstep',
        'quick step',
        'qs'
      ],
      bpms: [
        49,
        50,
        51,
        52
      ],
      ratio: 2
    }
  }
};

