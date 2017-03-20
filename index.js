// Requirements.
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var util = require("util");
var fs = require('fs');
var os = require('os');
var url = require('url');

// Store the port number.
var http_port = 8080;

// Statically serv files from the public folder.
app.use(express.static('public'));

// Get everything else as the index file.
app.get('/', function(req, res){
	res.sendFile(__dirname + '/public/index.html');
});


// When socket.io receives a connection.
io.on('connection', function(socket){
	// Log some information to the console.
	//console.log('Diceboy << User Connected');
	
	// Called when the client disconnects.
	socket.on('disconnect', function(data){
		// Log some information to the console.
		//console.log('Diceboy << User Disconnected');
		
		// If there's a current room...
		if (socket.current_room && socket.current_name) {
			// Emit a message to the other clients telling them of the client leaving.
			io.to(socket.current_room).emit('clientpart', socket.current_name);
		}
	});
  
  
	// Called when we receive a roll.
	socket.on('diceroll', function(data){
		//console.log('Dice Roll: ' + data);
		
		// Set the initial result to nothing.
		var roll = "";

		// Iterate through the four fudge dice...
		for (var i = 0; i < 4; i++)
		{
			// Get an integer between -1 and +1.
			var die = Math.floor(Math.random() * 3) - 1;

			// Append the relevant value to the string.
			roll += (die > 0) ? "+" : ((die < 0) ? "-" : " ");
		}

		// Set up the roll data.
		var roll_data = { 
			alias: data.alias,
			colour: data.colour,
			description: data.description,
			roll: roll,
			username: data.username,
			value: data.value
		};
		
		// Emit the message.
		io.to(socket.current_room).emit('diceroll', roll_data);
	});

	
	// Called when we receive a login message.
	socket.on('login', function(data){
		// If there's currently a room...
		if (socket.current_room)
		{
			// Emit a message to the other clients telling them of the client leaving.
			io.to(socket.current_room).emit('clientpart', socket.current_name);
			
			// Leave that room.
			socket.leave(socket.current_room);
		}

		// Set the new username and room.
		socket.current_name = data.username;
		socket.current_room = data.room;

		// Set up a variable to store the list of clients.
		var client_list = new Array();
		
		// Get the room list.
		var room_list = io.sockets.adapter.rooms[socket.current_room];
		
		// If there's a valid room list...
		if (room_list) { 
			// Iterate through the room list...
			Object.keys(room_list.sockets).forEach(function(client_id) 
			{
				// Get the client socket object from its id...
				var client_socket = io.sockets.connected[client_id];
				
				// If there's a valid socket object and a valid name...
				if (client_socket && client_socket.current_name) {
					// Add the name into the list.
					client_list.push(client_socket.current_name);
				}
			}); 
		} 

		// Join the specified room.
		socket.join(socket.current_room);

		// Set up the login data.
		var login_data = {
			id: socket.id,
			room: socket.current_room,
			userlist: JSON.stringify(client_list)
		};
		
		// Emit the login message to the client.
		socket.emit('clientlogin', login_data);
		
		// Emit a message to the other clients telling them of the client joining.
		io.to(socket.current_room).emit('clientjoin', socket.current_name);
	});

	
	// Called when we attempt to change the room.
	socket.on('changeroom', function(data){
		// If there's currently a room...
		if (socket.current_room)
		{
			// Emit a message to the other clients telling them of the client leaving.
			io.to(socket.current_room).emit('clientpart', socket.current_name);
			
			// Leave that room.
			socket.leave(socket.current_room);
		}

		// Set the new room.
		socket.current_room = data.room;

		// Set up a variable to store the list of clients.
		var client_list = new Array();
		
		// Get the room list.
		var room_list = io.sockets.adapter.rooms[socket.current_room];
		
		// If there's a valid room list...
		if (room_list) { 
			// Iterate through the room list...
			Object.keys(room_list.sockets).forEach(function(client_id) 
			{
				// Get the client socket object from its id...
				var client_socket = io.sockets.connected[client_id];
				
				// If there's a valid socket object and a valid name...
				if (client_socket && client_socket.current_name) {
					// Add the name into the list.
					client_list.push(client_socket.current_name);
				}
			}); 
		} 

		// Join the specified room.
		socket.join(socket.current_room);
		
		// Set up the room data.
		var room_data = {
			room: socket.current_room,
			userlist: JSON.stringify(client_list)
		};

		// Emit the room message to the client.
		socket.emit('roomchange', room_data);

		// Emit a message to the other clients telling them of the client joining.
		io.to(socket.current_room).emit('clientjoin', socket.current_name);
	});

	
	// Called when we attempt to change the username.
	socket.on('username', function(data){
		// If there's currently a room...
		if (socket.current_room)
		{
			// Emit a message to the other clients telling them of the client leaving.
			io.to(socket.current_room).emit('clientpart', socket.current_name);
		}

		// Set the new username.
		socket.current_name = data.username;

		// Emit the username message to the client.
		socket.emit('username', socket.current_name);

		// Emit a message to the other clients telling them of the client joining.
		io.to(socket.current_room).emit('clientjoin', socket.current_name);
	});
});


// Begin listening on the specified port.
http.listen(http_port, function(){
	// Echo a message to the console.
	console.log('Diceboy << Listening on *:' + http_port);
});
