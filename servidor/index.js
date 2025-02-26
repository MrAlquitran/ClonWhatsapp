const express = require('express');
const { createServer } = require('node:http');
const path = require('path');
const fs = require('fs');
const formidable = require('formidable');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;
let numUsuario = 0;

const imgDir = path.join(__dirname, 'public', 'img');
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});
app.post('/upload', (req, res) => {
  const form = new formidable.IncomingForm({
    uploadDir: imgDir,
    keepExtensions: true,
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Error al parsear el formulario:', err);
      return res.status(500).json({ error: 'Error al subir el archivo.' });
    }

    const file = files.file[0]; 
    if (!file || !file.originalFilename) {
      console.error('No se encontró el archivo o no tiene nombre.');
      return res.status(400).json({ error: 'No se seleccionó ningún archivo.' });
    }

    let fileName = file.originalFilename;
    let fileExtension = path.extname(fileName);
    let baseName = path.basename(fileName, fileExtension);
    let newPath = path.join(imgDir, fileName);
    let counter = 1;

    while (fs.existsSync(newPath)) {
      fileName = `${baseName}_${counter}${fileExtension}`;
      newPath = path.join(imgDir, fileName);
      counter++;
    }

    fs.rename(file.filepath, newPath, (err) => {
      if (err) {
        console.error('Error al mover el archivo:', err);
        return res.status(500).json({ error: 'Error al mover el archivo.' });
      }

      const imageUrl = `/img/${fileName}`;
      console.log(`Imagen subida: ${imageUrl}`);

      res.json({ imageUrl, fileName });
    });
  });
});

const usuariosConectados = {};

io.on('connection', (socket) => {
  socket.on('enviar', (datos) => {
    console.log("Estos datos y = " + datos);
    socket.emit('server', "HOLA DESDE SERVER");
  });
  socket.on('mensaje', (datos) => {
    io.emit('mensaje', datos);
  });
  socket.on('imagen', (imageUrl) => {
    io.emit('imagen', imageUrl);
  });
  socket.on('registroUsuario', (usuario) => {
    if (usuariosConectados[usuario.username]) {
      socket.emit('usuarioNoDisponible', 'El nombre de usuario ya está en uso.');
    } else {
      socket.emit('usuarioDisponible');
      socket.username = usuario.username;
      socket.profilePic = `/img/${usuario.profilePic}`;

      usuariosConectados[socket.username] = {
        username: usuario.username,
        status: usuario.status,
        profilePic: socket.profilePic
      };

      io.emit('usuariosActivos', Object.values(usuariosConectados));
      io.emit('conexion', { username: usuario.username });
    }
  });

  socket.on('disconnect', () => {
    if (socket.username && usuariosConectados[socket.username]) {
      const usuarioDesconectado = usuariosConectados[socket.username];
      delete usuariosConectados[socket.username];

      io.emit('desconexion', usuarioDesconectado);
      io.emit('usuariosActivos', Object.values(usuariosConectados));
    }
  });
});

app.use(express.static(path.join(__dirname, 'public')));

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
