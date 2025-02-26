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
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showNotification('Error: ' + data.error);
                    return;
                }
            
                var usuario = {
                    'username': username,
                    'status': status,
                    'profilePic': data.fileName 
                };
            
                socket.emit('registroUsuario', usuario);
            
                socket.on('usuarioNoDisponible', (mensaje) => {
                    document.getElementById('username-error').textContent = mensaje;
                });
            
                socket.on('usuarioDisponible', () => {
                    socket.username = username;
                    socket.status = status;
                    socket.profilePic = data.imageUrl;
            
                    document.getElementById('miFoto').src = data.imageUrl;
            
                    document.getElementById('miNombre').innerHTML = usuario.username;
                    document.getElementById('miStatus').innerHTML = usuario.status;
                    document.getElementById('registration-container').style.display = 'none';
                    document.getElementById('usuarios').style.display = 'flex';
                    document.getElementById('chat-publico').style.display = 'block'; 
                    const chatPublico = document.getElementById('chat-publico');
                    chatPublico.style.display = 'flex';
                    chatPublico.classList.add('visible');
                });
            })
            .catch(error => {
                showNotification('Error al subir la imagen: ' + error.message);
            });
            
        } else {
            showNotification('Por favor, complete todos los campos.');
            document.getElementById('chat-container').style.display = 'none';
        }
    }

    btnEnviar.addEventListener('click', () => {
        if (!socket.username) {
            showNotification("Debes registrarte antes de enviar mensajes.");
            return;
        }
        socket.emit('mensaje', {
            username: socket.username,
            mensaje: cajaTexto.value,
            profilePic: socket.profilePic 
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
        objeto.innerHTML = `<img src="${data.profilePic}" width="30" style="border-radius: 50%;"> <strong>${data.username}:</strong> ${data.mensaje}`;

        mensajes.appendChild(objeto);
        mensajes.scrollTop = mensajes.scrollHeight;

    });

    function showNotification(message) {
        const notification = document.getElementById('notification');
        notification.innerText = message;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }

    socket.off('imagen');
    socket.on('imagen', (imageUrl) => {
    console.log("Imagen recibida:", imageUrl);
    
    if (!imageUrl || typeof imageUrl !== 'string') {
        console.error("URL de imagen inválida:", imageUrl);
        return;
    }

    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.maxWidth = '300px';
    img.style.margin = '10px';

    img.onload = () => {
        mensajes.appendChild(img);
        mensajes.scrollTop = mensajes.scrollHeight;
    };

    img.onerror = () => {
        console.error("Error al cargar la imagen:", imageUrl);
    };
    });


    socket.off('conexion');
    socket.on('conexion', (data) => {
        const mensaje = document.createElement('li');
        mensaje.innerHTML = `<strong>${data.username} se ha conectado</strong>`;
        mensajes.appendChild(mensaje);
    });

    socket.off('desconexion');
    socket.on('desconexion', (data) => {
        const mensaje = document.createElement('li');
        mensaje.innerHTML = `<strong>${data.username} se ha desconectado</strong>`;
        mensajes.appendChild(mensaje);
    });

    socket.off('usuariosActivos');
    socket.on('usuariosActivos', (usuarios) => {
        const listaUsuarios = document.getElementById('lista-usuarios');

        if (!listaUsuarios) return;

        listaUsuarios.innerHTML = '';

        usuarios.forEach(usuario => {
            const item = document.createElement('li');
            item.innerHTML = `
                <img src="${usuario.profilePic}" width="30" style="border-radius: 50%;"> 
                <strong>${usuario.username}</strong>
            `;
            listaUsuarios.appendChild(item);
        });

        document.getElementById('usuarios').style.display = 'block';
    });
    
    const subidaBoton = document.getElementById('subidaBoton');
    const inputArchivos = document.getElementById('inputArchivos');

    subidaBoton.addEventListener('click', () => {
        const file = inputArchivos.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);

            fetch('/upload', { method: 'POST', body: formData })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      showNotification("Error subiendo imagen: " + data.error);
      return;
    }

    socket.emit('imagen', data.imageUrl);
  })
  .catch(error => showNotification("Error subiendo imagen: " + error.message));
        } else {
            showNotification("Selecciona un archivo antes de subir.");
        }
    });
}
