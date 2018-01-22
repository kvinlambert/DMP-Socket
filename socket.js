"use strict";

const app            = require('express')();
const http           = require('http').Server(app);
const io             = require('socket.io')(http);
const path           = require('path');
const jsonfile       = require('jsonfile');
const timingManager  = require('./managers/timingManager');
const fileManager    = require('./managers/fileManager');
const musicManager   = require('./managers/musicManager');
const { musicTypes, musicDir } = require('./config');

app.get('/', (req, res) => {
  res.send('Hello World!');
});

io.on('connection', (socket) => {
  console.log('user is connected');

  socket.progress = {
    totalSongs: 0,
    songsTreated: 0
  };

  socket.on('test', (reply) => {
    reply('test');
  });

  socket.on('musictypes', (reply) => {
    reply(musicTypes);
  });

  socket.on('edit-song', (res) => {
    const { songPath, type } = res;

    try {
      const responseCode = fileManager.addTextToFile(songPath, type);

      socket.emit('edit-song-response', {
        code: responseCode
      });
    } catch (err) {
      socket.emit('edit-song-response', {
        code: 400,
        error: err
      });
    }
  });

  socket.on('create-folders', () => {
    try {
      timingManager.createFolders();

      socket.emit('create-folders-response', {
        code: 200
      });
    } catch (err) {
      socket.emit('create-folders-response', {
        code: 400,
        error: err
      });
    }
  });

  socket.on('init', (reply) => {
    try {
     reply(fileManager.createInitialFolder());
    } catch (err) {
      reply({
        code: 400,
        error: err
      });
    }
  });

  socket.on('generate', () => {
    socket.progress.songsTreated = 0;
    socket.progress.totalSongs = 0;

    fileManager.getRounds(musicDir, socket)
      .then((res) => {
        jsonfile.writeFileSync(path.join('data', 'db.json'), res);
        socket.emit('generate-response', res);
      }).catch(err => console.error(err));
  });

  socket.on('get-rounds', () => {
    const jsonTiming = jsonfile.readFileSync(path.join('data', 'db.json'));
    socket.emit('get-rounds-response', jsonTiming);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});