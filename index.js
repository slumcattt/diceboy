var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var util = require("util");
var fs = require('fs');
var os = require('os');
var url = require('url');

// Stores the client information.
//var clients = [];

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});


// When socket.io receives a connection.
io.on('connection', function(socket){
	// Log some information to the console.
	console.log('Diceboy << User Connected');

	// Yep.
	// Create a new data object, set initial values, and push it into the client list.
	//var clientInfo = new Object();
	//clientInfo.id = socket.id;
	//clients.push(clientInfo);

	// Send a message to the client notifying it of its socked id.
	//socket.broadcast.to(socket.id).emit('clientinfo', clientInfo);
	
	// Called when the client disconnects.
	socket.on('disconnect', function(data){
		// Log some information to the console.
		console.log('Diceboy << User Disconnected');
		
		// Iterate through the client list.
		//for (var i = 0, len = clients.length; i < len; ++i){
		//	// Get the specific client.
		//	var c = clients[i];
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
		//console.log('message: ' + msg);
		
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
			id: data.id,
			roll: roll,
			value: data.value
		};
		
		// Emit the message.
		io.emit('diceroll', roll_data);
	});
});


http.listen(3000, function(){
	console.log('Diceboy << Listening on *:3000');
});