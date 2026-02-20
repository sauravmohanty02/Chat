
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
//   const username= localStorage.getItem("username");
  
  const {username,room,grp } = Qs.parse(location.search, {
	ignoreQueryPrefix: true,
  });
  
  const socket = io();  

  if(grp==="N")
  {
  	socket.emit('indroomjoin',{username,room});
  }

  if(grp==="Y")
  {
	socket.emit('grproomjoin',{username,room});
  }
  
  // Message from server
  socket.on('message', (message) => {
	console.log(message);
	outputMessage(message);
  
	// Scroll down
	chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  socket.on('message_usr', (message) => {
	console.log(message);
	outputMessage_usr(message);
  
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
	
	console.log("hello")
	// Emit message to server

	if(grp==="N"){
		socket.emit('ind_message', {username,room,msg});
		location.reload();
	}

	// if(grp==="N"){
	// 	socket.emit('new__message', {username,room,msg},function()
	// {
		// console.log("message sent");
	// });
	// 	location.reload();
	// }

	if(grp==="Y")
	{
		socket.emit('grp_message', {username,room,msg});
		location.reload();
	}
  
	// Clear input
	e.target.elements.msg.value = '';
	e.target.elements.msg.focus();
  });
  
  // Output message to DOM
  function outputMessage_usr(message) {
	const div = document.createElement('div');
	div.classList.add('message');
	const p = document.createElement('p');
	p.classList.add('meta');
	p.innerText = message.username;
	p.innerHTML += ` <span>${message.time}</span>`;
	p.innerHTML += ` <span>${message.status}</span>`;
	div.appendChild(p);
	const para = document.createElement('p');
	para.classList.add('text');
	para.innerText = message.text;
	div.appendChild(para);
	document.querySelector('.chat-messages').appendChild(div);
  }

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
  
  //Prompt the user before leave chat room