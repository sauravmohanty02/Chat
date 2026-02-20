

// const { grpname } = Qs.parse(location.search, {
//     ignoreQueryPrefix: true,
//   });
const roomName = document.getElementById('room-name');

const grpname= sessionStorage.getItem("grpname");
roomName.innerText = grpname;


  function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    const p = document.createElement('p');
    p.classList.add('meta');
    p.innerText = message.username;
    p.innerHTML += ` <span>${message.time}</span>`;
    div.appendChild(p);
    const para = document.createElement('p');
    para.classList.add('text');
    para.innerText = message.text;
    div.appendChild(para);
    document.querySelector('.chat-messages').appendChild(div);
  }

  console.log(grpname);

  const socket = io();

  socket.emit('receive', grpname);

  socket.on('message', (message) => {
    console.log(message);
    outputMessage(message);
  
    // Scroll down
    // chatMessages.scrollTop = chatMessages.scrollHeight;
  });
  

