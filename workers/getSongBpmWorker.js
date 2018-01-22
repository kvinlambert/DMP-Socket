const fs = require('fs');
const MusicTempo = require('music-tempo');
const { AudioContext } = require('web-audio-api');

const songUuid = process.argv[2];
const songPath = process.argv[3];
const context = new AudioContext();

console.log(songPath);

context.decodeAudioData(fs.readFileSync(songPath), (buffer) => {
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

  process.send({
    songUuid,
    songBpm: parseFloat(mt.tempo)
  });
}, err => process.send(err));
