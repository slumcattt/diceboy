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
	console.log('Diceboy << User Connected');
	
	// Send a message to the client that just connected.
	//socket.emit('client_connected', socket.id);

	// Create a new data object, set initial values, and push it into the client list.
	//var clientInfo = new Object();
	//clientInfo.id = socket.id;
	//g_clients.push(clientInfo);

	// Send a message to the client notifying it of its socked id.
	//socket.broadcast.to(socket.id).emit('clientinfo', clientInfo);
	
	// Called when the client disconnects.
	socket.on('disconnect', function(data){
		// Log some information to the console.
		console.log('Diceboy << User Disconnected');
		
		// If there's a current room...
		if (socket.current_room && socket.current_name) {
			// Emit a message to the other clients telling them of the client leaving.
			io.to(socket.current_room).emit('clientpart', socket.current_name);
		}
		
		// Iterate through the client list.
		//for (var i = 0, len = g_clients.length; i < len; ++i){
		//	// Get the specific client.
		//	var c = g_clients[i];
		//
		//	// If this is our client...
		//	if (c.clientId == socket.id){
		//		// Remove the client from the list.
		//		clients.splice(i,1);
		//		
		//		// Then exit out.
		//		break;
		//	}
		//}
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
		socket.join(data.room);

		// Set up the login data.
		var login_data = {
			id: socket.id,
			room: data.room,
			userlist: JSON.stringify(client_list)
		};
		
		// Emit the login message to the client.
		socket.emit('clientlogin', login_data);
		
		// Emit a message to the other clients telling them of the client joining.
		io.to(socket.current_room).emit('clientjoin', socket.current_name);
	});

});


// Begin listening on the specified port.
http.listen(http_port, function(){
	// Echo a message to the console.
	console.log('Diceboy << Listening on *:' + http_port);
});
