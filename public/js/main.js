(function () {
  window.onpageshow = function(event) {
      if (event.persisted) {
          window.location.reload();
      }
  };
})();


const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');


// // Get username and room from URL
const username= localStorage.getItem("username");

const {room,grp } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

if(grp=="N")
{
  window.location = '../chat_ind.html';
}

// 


// var username = document.getElementById("username").value;
// var pwd = document.getElementById("pwd1").value;
// var user_id = document.getElementById("userid").value;
// var room  = document.getElementById("room").value;
// const {getval} = require("public\js\main1.js");

// import getval from './main1.js';
// var login_val= getval();



// var username = sessionStorage.getItem("username");
// var room = sessionStorage.getItem("room");
// var user_id = sessionStorage.getItem("userid");
sessionStorage.setItem("grpname", room);


// const socket = io();

// Join chatroom
socket.emit('joinRoom', { username, room });

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on('message', (message) => {
  console.log(message);
  outputMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});



// Message submit
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Get message text
  let msg = e.target.elements.msg.value;

  msg = msg.trim();

  if (!msg) {
    return false;
  }

  // Emit message to server
  socket.emit('chatMessage', msg);

  // Clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

// Output message to DOM
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

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

//Prompt the user before leave chat room
document.getElementById('leave-btn').addEventListener('click', () => {
  const leaveRoom = confirm('Are you sure you want to leave the chatroom?');
  if (leaveRoom) {
    socket.emit('leaveroom')
    window.location = '../index.html';
  } else {
  }
});

document.getElementById('leave-grp').addEventListener('click', () => {
  const leaveRoom = confirm('Are you sure you want to leave the group?');

  if (leaveRoom) {
    socket.emit('leavegrp');
    window.location = '../index.html';
  } else {
  }
});
