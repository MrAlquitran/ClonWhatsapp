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
        uploadDir: path.join(__dirname, 'public', 'img'), 
        keepExtensions: true, 
    });

    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error('Error al parsear el formulario:', err);
            res.status(500).send('Error al subir el archivo.');
            return;
        }

        const file = files.filetoupload;
        if (!file || !file.originalFilename) {
            console.error('No se encontró el archivo o no tiene nombre.');
            res.status(400).send('No se seleccionó ningún archivo.');
            return;
        }

        const oldPath = file.filepath;
        const newPath = path.join(__dirname, 'public', 'img', file.originalFilename);

        fs.rename(oldPath, newPath, (err) => {
            if (err) {
                console.error('Error al mover el archivo:', err);
                res.status(500).send('Error al mover el archivo.');
                return;
            }

            res.status(200).send('Imagen subida exitosamente.');
            io.emit('imagen', `/img/${file.originalFilename}`);
        });
    });
});

io.on('connection', (socket) => {
  numUsuario++;
    console.log('a user connected, hay ' + numUsuario + ' usuarios');
    socket.on('disconnect', () => {
        numUsuario--;
        console.log('user disconnected, hay ' + numUsuario + ' usuarios');
    });
    socket.on('enviar',(datos)=>{
      console.log("Estos datos y = "+datos);
      socket.emit('server',"HOLA DESDE SERVER")
    })
    // socket.on('escribiendo', (datos)=>{
    //   console.log("escribiendo "+datos);
    //   socket.broadcast.emit('escribiendo',datos);
    // })
    socket.on('mensaje', (datos)=>{
      io.emit('mensaje',datos);
    });
    socket.on('imagen', (datos) =>{
      io.emit('imagen', datos);
    });
    socket.on('nuevoUsuario', (nombre) => {
      console.log('Nuevo usuario: ' + nombre);
      io.emit('conexion', `${nombre} se ha unido a la conversación.`);
    });
    socket.on('desconectar', (nombre) => {
      console.log('Usuario desconectado: ' + nombre);
      io.emit('desconexion', `${nombre} se ha desconectado.`);
    });
    socket.on('registroUsuario', (usuario) => {
        const nombreUsado = false; 
        if (nombreUsado) {
            socket.emit('usuarioNoDisponible', 'El nombre de usuario ya está en uso.');
        } else {
            socket.emit('usuarioDisponible');
            console.log('Usuario registrado:', usuario);
        }
    });
});

app.use(express.static(path.join(__dirname, 'public')))

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})