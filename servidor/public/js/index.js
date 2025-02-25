const socket = io();
const endpoint = './public/img';

document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
    const socket = io();
    let btnEnviar = document.getElementById('enviar');
    let mensajes = document.getElementById('mensajes');
    let btnRegistro = document.getElementById('btnRegistro');
    let cajaTexto = document.getElementById('mensaje');
    let miNombre = '';

    btnRegistro.addEventListener('click', registro);

    function registro(e) {
        e.preventDefault();
        
        var username = document.getElementById('username').value;
        var status = document.getElementById('status').value;
        var profilePic = document.getElementById('profile-pic').files[0];
        
        if (username !== '' && status !== '' && profilePic) {
            const formData = new FormData();
            formData.append('file', profilePic);

            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('miFoto').src = e.target.result;
            };
            reader.readAsDataURL(profilePic);

            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(() => {
                var usuario = {
                    'username': username,
                    'status': status,
                    'profilePic': profilePic.name
                };

                socket.emit('registroUsuario', usuario);

                socket.on('usuarioNoDisponible', (mensaje) => {
                    document.getElementById('username-error').textContent = mensaje;
                });

                socket.on('usuarioDisponible', () => {
                    socket.username = username;
                    socket.status = status;

                    document.getElementById('miNombre').innerHTML = usuario.username;
                    document.getElementById('miStatus').innerHTML = usuario.status;
                    document.getElementById('registration-container').style.display = 'none';
                    document.getElementById('chat-container').style.display = 'flex';
                    document.getElementById('publico').style.display = 'flex';
                    document.getElementById('usuarios').style.display = 'flex';
                    document.getElementById('chat-publico').style.backgroundColor = 'gainsboro';
                });
            })
            .catch(error => {
                console.error(error);
                alert('Error al subir la imagen');
            });
        } else {
            alert('Por favor, complete todos los campos.');
        }
    }

    btnEnviar.addEventListener('click', () => {
        if (!socket.username) {
            showNotification("Debes registrarte antes de enviar mensajes.");
            return;
        }
        socket.emit('mensaje', {
            username: socket.username,
            mensaje: cajaTexto.value
        });
        cajaTexto.value = ''; 
    });

    cajaTexto.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            btnEnviar.click();
        }
    });

    socket.on('mensaje', (data) => {
        const objeto = document.createElement('li');
        objeto.innerHTML = `${data.username}: ${data.mensaje}`;
        mensajes.appendChild(objeto);
    });

    function showNotification(message) {
        const notification = document.getElementById('notification');
        notification.innerText = message;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    socket.on('imagen', (ruta) => {
        const img = document.createElement('img');
        img.src = ruta;
        img.style.maxWidth = '300px';
        img.style.margin = '10px';
        mensajes.appendChild(img);
    });

    socket.on('conexion', (data) => {
        const conex = document.createElement('li');
        conex.innerHTML = `<em>${data.username}</em>`;
        mensajes.appendChild(conex);
    });

    socket.on('desconexion', (data) => {
        const disco = document.createElement('li');
        disco.innerHTML = `<em>${data.username}</em>`;
        mensajes.appendChild(disco);
    });

    const uploadButton = document.getElementById('uploadButton');
    const fileInput = document.getElementById('fileInput');

    uploadButton.addEventListener('click', () => {
        const file = fileInput.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);

            fetch('/upload', { method: 'POST', body: formData })
                .then(response => response.text())
                .then(ruta => socket.emit('imagen', ruta))
                .catch(error => console.error("Error subiendo imagen:", error));
        } else {
            showNotification("Selecciona un archivo antes de subir.");
        }
    });
}
