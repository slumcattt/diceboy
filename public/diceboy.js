// Connect to socket.io
var socket = io();

// Set up a cookie.
var g_cookie = document.cookie;

// Set up the global variables.
var g_audio_click;
var g_audio_roll;
var g_menu;
var g_sound = "true";
var g_template_button
var g_template_result;

var animation_time = 500;
var result_count = 0;
var g_result_index = 0;

// Set the default colour to black.
var g_colour = "000000";

// Create a new array for the colours.
var g_colour_array = new Array();

// Set the message limit.
var g_message_limit = 30;

// Set the message timeout.
var g_message_timeout = 3000;

// Create an array for looking up the message entries.
var g_messages = new Array();

// Set up a variable to store the local socket id.
var g_socket_id = 0;

// Set up a variable to store the room name.
var g_room = "";

// Set up a variable to store the user list.
var g_userlist = new Array();


// Adds a result.
function addResult(in_username, in_colour, in_alias, in_description, in_value, in_roll) {
	// Get the ladder div.
	var e_results = document.getElementById("results");
	
	// Get the username.
	var username = in_username;
	
	// Set up some variable to store the colours.
	var colour = (in_colour ? in_colour : "000000");

	// Determine the symbol colour.
	var colour_symbol = getDiceSymbolColour(colour);

	// Determine the display class.
	var display_class = (in_username == username) ? "result_entry_user" : "result_entry";

	// Set the content display.
	var display_content = "";

	// Set up some variables for the various values.
	var die_html = "&nbsp;";
	var fudge_display = "&nbsp;";
	var fudge_roll = 0;

	// Iterate through the four fudge dice...
	for (var i = 0; i < 4; i++)
	{
		// Get the fudge die result (plus, minus, or blank).
		var fudge_die = in_roll.charAt(i);

		// Switch based on the result...
		switch (fudge_die)
		{
			// If this is a plus die...
			case "+":
				// Set the die html.
				die_html = "<span class = \"die_plus\" id = \"result_" + g_result_index + "_sign_" + i + "\" style = \"color:#" + colour_symbol + "\">+</span>";

				// Increment the roll by one.
				fudge_roll++;

				// Then break out...
				break;


			// If this is a minus die...
			case "-":
				// Set the die html.
				die_html = "<span class = \"die_minus\" id = \"result_" + g_result_index + "_sign_" + i + "\" style = \"color:#" + colour_symbol + "\">&#8211;</span>";

				// Decrement the roll by one.
				fudge_roll--;

				// Then break out...
				break;


			// In all other cases...
			default:
				// Set the die html.
				die_html = "<span class = \"die_blank\" id = \"result_" + g_result_index + "_sign_" + i + "\" style = \"color:#" + colour_symbol + "\">&nbsp;</span>";
		}
		
		// Append the appropriate html to the display content.
		display_content += "<div class = \"result_die_start\" id = \"result_" + g_result_index + "_die_" + i + "\" name = \"result_" + g_result_index + "_die_" + i + "\" style = \"background-color:#" + colour + ";border-color:#" + colour + ";\">" + die_html + "</div>";
	}

	// Determine the descriptor to display.
	var display_value = (in_value >= 0 ? "+" : "") + in_value;

	// Ensure the value lies within the appropriate bounds.
	var fudge_result = in_value + fudge_roll;

	// Determine the display result.
	var display_result = (fudge_result >= 0 ? "+" : "") + fudge_result;
	
	// Determine the name to display.
	var display_name = (in_alias != "") ? (" - " + in_alias + " - ") : in_username;

	// Determine the description text.
	var display_description = (in_description != "") ? in_description : "rolls the dice";

	// Determine the id string.
	var id_string = "result_entry_" + g_result_index;

	// Create the new element.
	var e_message = document.createElement("div");

	// Set the element attributes.
	e_message.setAttribute("class", "result");
	e_message.setAttribute("id", id_string);
	
	// Determine the title text.
	var title_text = display_name + " " + display_description + " @ " + display_value + " [" + in_roll + "] = " + display_result;
	
	// Determine the result style.
	var result_style = (fudge_result > 2) ? "result_entry_total_success" : ((fudge_result < 0) ? "result_entry_total_failure" : "result_entry_total_pass");
	
	// Specify the display result formatting.
	display_result = "<span class = \"" + result_style + "\">" + display_result + "</span>";
	
	// Set the default html.
	var d_html = g_template_result;

	// Set the index value.
	d_html = d_html.replace(/\$/g, g_result_index);

	// Set the various information for the element.
	d_html = d_html.replace('[TITLE]', title_text);
	d_html = d_html.replace('[IS_ALIAS]', ((in_alias != "") ? "_alias" : ""));
	d_html = d_html.replace('[NAME]', display_name);
	d_html = d_html.replace('[DESC]', display_description);
	d_html = d_html.replace('[VALUE]', display_value);
	d_html = d_html.replace('[COLOUR]', colour);
	d_html = d_html.replace('[DISPLAY]', display_content);
	d_html = d_html.replace('[RESULT]', display_result);
	
	// If the sound is off...
	if (g_sound == "false")
	{
		// Replace the audio tag with a dummy.
		d_html = d_html.replace('audio', 'noaudio');
	}

	// Set the html for the element.
	e_message.innerHTML = d_html;

	// Append the child into the ladder list.
	e_results.insertBefore(e_message, e_results.firstChild);

	// If there's a valid element...
	if (e_message)
	{
		// Iterate through the dice...
		for (var i = 0; i < 4; i++)
		{
			// Animate the dice coming in.
			window.setTimeout("onAnimation(\"result_" + g_result_index + "_die_" + i + "\", \"result_die\");", i * animation_time);
		}

		// Ensure the total is animated.
		e_message.timeout_result = window.setTimeout("onAnimation(\"result_entry_" + g_result_index + "_total\", \"result_entry_total\");", animation_time * 5);

		// Push the result entry into the message list.
		g_messages.push("result_entry_" + g_result_index);

		// If we've reached the message limit...
		if (g_messages.length > g_message_limit)
		{
			// Remove the first result in the list.
			removeResult(g_messages[0]);
		}
	}

	// Get the remove result element by its id.
	var e_remove = document.getElementById("result_entry_" + g_result_index + "_remove");

	// If there's an element...
	if (e_remove)
	{
		// Set the removal target.
		var e_target = "result_entry_" + g_result_index;

		// Add an event listener for click events.
		e_remove.addEventListener("click", function(e){
			// Remove the result.
			removeResult(e_target);

			// Ensure the event is valid.
			e = e || window.event

			// If there's a propogation function...
			if (e.stopPropagation)
			{
				// Stop the event propogation.
				e.stopPropagation();
			}
			else
			{
				// Otherwise, for older IE versions, cancel the bubbling.
				window.event.cancelBubble = true;
			}
		});
	}

	// Increment the result count.
	result_count++;

	// Increment the result index.
	g_result_index++;

	// Play the roll sound.
	//g_audio_roll.play();
};


// Clear the current history.
function clearHistory() {
	// Iterate through each of the results in the messages div...
	$("#results").children(".result").each(function() {
		// Remove each result.
		removeResult(this.id);
	});
};


// Get a value from the cookie.
function getCookieValue(in_key) 
{
	// Get the key name.
	var name = in_key + "=";
	
	// Decode the cookie.
	var decodedCookie = decodeURIComponent(document.cookie);
	
	// Split the decoded cookie.
	var ca = decodedCookie.split(';');
	
	// Iterate through the decoded cookie key/value pairs...
	for (var i = 0; i < ca.length; i++) 
	{
		// Get the key/value at this index.
		var c = ca[i];
		
		// While there's a preceding space...
		while (c.charAt(0) == ' ') 
		{
			// Remove the character.
			c = c.substring(1);
		}
		
		// If this matches the name...
		if (c.indexOf(name) == 0) 
		{
			// Return the value string.
			return c.substring(name.length, c.length);
		}
	}
	
	// Otherwise, return nothing.
	return "";
}


// Initialize the scripts.
function initialize() {
	// Store the roll button template text.
	g_template_button = document.getElementById("db_template_button").text;

	// Store the result template text.
	g_template_result = document.getElementById("db_template_result").text;

	// Initialize the cookies.
	initializeCookies();
	
	// Initialize the audio.
	initializeAudio();

	// Initialize the buttons.
	initializeButtons();
	
	// Initialize the colours.
	initializeColours();
	
	// Initialize the inputs.
	initializeInputs();
}


// Initialize the audio.
function initializeAudio() {
	// Store the audio click element.
	g_audio_click = document.getElementById("audio_click");
	
	// Store the audio roll element.
	g_audio_roll = document.getElementById("audio_roll");
}


// Initialize the buttons.
function initializeButtons() {
	// Get the button list.
	var e_list = document.getElementById("buttons_roll");

	// Iterate through the descriptors and add them to the ladder.
	for (var i = -4; i <= 4; i++)
	{
		// Determine the id string.
		var id_string = "db_result_button_" + (i + 4);
	
		// Create the new element.
		var e_button = document.createElement("div");

		// Set the element attributes.
		e_button.setAttribute("class", "db_button_roll");
		e_button.setAttribute("id", id_string);
		
		// Set the default html.
		var d_html = g_template_button;

		// Set the index value.
		d_html = d_html.replace(/\$/g, (i + 4));

		// Set the various information for the element.
		d_html = d_html.replace('[VALUE]', i);
		d_html = d_html.replace('[TEXT]', (i >= 0 ? "+" : "-") + Math.abs(i));

		// Set the html for the element.
		e_button.innerHTML = d_html;
		
		// Add the button to the list.
		e_list.appendChild(e_button);
	}
}


// Initialize the colours.
function initializeColours() {
	// Very light.
	g_colour_array.push("FF8080");
	g_colour_array.push("FFD080");
	g_colour_array.push("FFFA80");
	g_colour_array.push("FFFF80");
	g_colour_array.push("FAFF80");
	g_colour_array.push("D0FF80");
	g_colour_array.push("80FF80");
	g_colour_array.push("80FFD0");
	g_colour_array.push("80FFFA");
	g_colour_array.push("80FFFF");
	g_colour_array.push("80FAFF");
	g_colour_array.push("80D0FF");
	g_colour_array.push("8080FF");
	g_colour_array.push("D080FF");
	g_colour_array.push("FA80FF");
	g_colour_array.push("FF80FF");

	// Light.
	g_colour_array.push("FF4040");
	g_colour_array.push("FFA040");
	g_colour_array.push("FFF540");
	g_colour_array.push("FFFF40");
	g_colour_array.push("F5FF40");
	g_colour_array.push("A0FF40");
	g_colour_array.push("40FF40");
	g_colour_array.push("40FFA0");
	g_colour_array.push("40FFF5");
	g_colour_array.push("40FFFF");
	g_colour_array.push("40F5FF");
	g_colour_array.push("40A0FF");
	g_colour_array.push("4040FF");
	g_colour_array.push("A040FF");
	g_colour_array.push("F540FF");
	g_colour_array.push("FF40FF");

	// Middle.
	g_colour_array.push("FF0000");
	g_colour_array.push("FF8000");
	g_colour_array.push("FFC000");
	g_colour_array.push("FFFF00");
	g_colour_array.push("C0FF00");
	g_colour_array.push("80FF00");
	g_colour_array.push("00FF00");
	g_colour_array.push("00FF80");
	g_colour_array.push("00FFC0");
	g_colour_array.push("00FFFF");
	g_colour_array.push("00C0FF");
	g_colour_array.push("0080FF");
	g_colour_array.push("0000FF");
	g_colour_array.push("8000FF");
	g_colour_array.push("C000FF");
	g_colour_array.push("FF00FF");

	// Dark.
	g_colour_array.push("C00000");
	g_colour_array.push("C04000");
	g_colour_array.push("C08000");
	g_colour_array.push("C0C000");
	g_colour_array.push("80C000");
	g_colour_array.push("40C000");
	g_colour_array.push("00C000");
	g_colour_array.push("00C040");
	g_colour_array.push("00C080");
	g_colour_array.push("00C0C0");
	g_colour_array.push("0080C0");
	g_colour_array.push("0040C0");
	g_colour_array.push("0000C0");
	g_colour_array.push("4000C0");
	g_colour_array.push("8000C0");
	g_colour_array.push("C000C0");

	// Very dark.
	g_colour_array.push("800000");
	g_colour_array.push("801000");
	g_colour_array.push("804000");
	g_colour_array.push("808000");
	g_colour_array.push("408000");
	g_colour_array.push("108000");
	g_colour_array.push("008000");
	g_colour_array.push("008010");
	g_colour_array.push("008040");
	g_colour_array.push("008080");
	g_colour_array.push("004080");
	g_colour_array.push("001080");
	g_colour_array.push("000080");
	g_colour_array.push("100080");
	g_colour_array.push("400080");
	g_colour_array.push("800080");

	// Greyscale.
	g_colour_array.push("F0F0F0");
	g_colour_array.push("E0E0E0");
	g_colour_array.push("D0D0D0");
	g_colour_array.push("C0C0C0");
	g_colour_array.push("B0B0B0");
	g_colour_array.push("A0A0A0");
	g_colour_array.push("909090");
	g_colour_array.push("808080");
	g_colour_array.push("707070");
	g_colour_array.push("606060");
	g_colour_array.push("505050");
	g_colour_array.push("404040");
	g_colour_array.push("303030");
	g_colour_array.push("202020");
	g_colour_array.push("101010");
	g_colour_array.push("000000");

	// Get the container div.
	var container = document.getElementById("db_colours");

	// Get the current html.
	var html = container.innerHTML;

	// Iterate through the highlight and add them to the container.
	for (var i = 0; i < g_colour_array.length; i++)
	{
		// Get the id string.
		var id_string = "db_colour_" + i;

		// Append the new html.
		html += "<div class = \"menu_colour_list_entry\" onclick = \"onColourPressed('" + g_colour_array[i] + "');\" style = \"background-color:#" + g_colour_array[i] + ";\">";
		html += "	<div class = \"menu_colour_list_entry_symbol\" id = \"" + id_string + "\" style = \"color:#" + getDiceSymbolColour(g_colour_array[i]) + "\">&#10004;</div>";
		html += "</div>";
	}

	// Set the new html.
	container.innerHTML = html;
	
	// Set the colour.
	setColour(g_colour);
};


// Initialize the cookies.
function initializeCookies()
{
	// Get the alias from the cookie.
	var cookie_alias = getCookieValue("alias");
	
	// If there's a valid alias...
	if (cookie_alias)
	{
		// Set the alias value from the cookie.
		$('#alias').val(cookie_alias);
	}
	
	// Get the colour from the cookie.
	var cookie_colour = getCookieValue("colour");
	
	// If there's no valid colour...
	if (!cookie_colour)
	{
		// Randomly choose a colour.
		cookie_colour = g_colour_array[Math.floor(Math.random() * g_colour_array.length)];
	}
	
	// Set the initial colour.
	g_colour = cookie_colour;
	
	// Get the description from the cookie.
	var cookie_description = getCookieValue("description");

	// If there's a valid description...
	if (cookie_description)
	{
		// Set the description value from the cookie.
		$('#description').val(cookie_description);
	}
	
	// Get the room from the cookie.
	var cookie_room = getCookieValue("room");

	// If there's a valid room...
	if (cookie_room)
	{
		// Set the room value from the cookie.
		$('#room').val(cookie_room);
	}

	// Get the sound flag from the cookie.
	g_sound = getCookieValue("sound");

	// Attempt to get the enabled sound element.
	var e_sound_on = document.getElementById("db_sound_on");
	
	// If the element exists...
	if (e_sound_on)
	{
		// Show or hide the element as necessary.
		e_sound_on.style.display = (g_sound == "true") ? "block" : "none";
	}
	
	// Attempt to get the disabled sound element.
	var e_sound_off = document.getElementById("db_sound_off");
	
	// If the element exists...
	if (e_sound_off)
	{
		// Show or hide the element as necessary.
		e_sound_off.style.display = (g_sound == "true") ? "none" : "block";
	}
	
	// Get the username from the cookie.
	var cookie_username = getCookieValue("username");

	// If there's a valid username...
	if (cookie_username)
	{
		// Set the username value from the cookie.
		$('#username').val(cookie_username);
	}
};


// Initialize the inputs.
function initializeInputs() {
	// Add a key down event to the alias input box.
	document.getElementById("alias").addEventListener("keydown", function(event) {
		// Get the input event.
		var o_event = event || window.event;
		
		// Get the character code from the event.
		var c_code = o_event.which || o_event.keyCode;

		// If this is the enter key...
		if (c_code == '13') 
		{
			// Trigger the menu cancellation.
			onMenuCancel();
			
			// Stop bubbling.
			return false;
		}
		
		// Return true.
		return true;
	});

	// Add a key down event to the room input box.
	document.getElementById("room").addEventListener("keydown", function(event) {
		// Get the input event.
		var o_event = event || window.event;
		
		// Get the character code from the event.
		var c_code = o_event.which || o_event.keyCode;

		// If this is the enter key...
		if (c_code == '13') 
		{
			// Trigger the login code.
			onLoginAttempt();
			
			// Stop bubbling.
			return false;
		}
		
		// Return true.
		return true;
	});

	// Add a key down event to the username input box.
	document.getElementById("username").addEventListener("keydown", function(event) {
		// Get the input event.
		var o_event = event || window.event;
		
		// Get the character code from the event.
		var c_code = o_event.which || o_event.keyCode;

		// If this is the enter key...
		if (c_code == '13') 
		{
			// Trigger the login code.
			onLoginAttempt();
			
			// Stop bubbling.
			return false;
		}
		
		// Return true.
		return true;
	});
};


// Returns the symbol colour for a die.
function getDiceSymbolColour(in_colour) {
	// If there's no valid colour...
	if (!in_colour)
	{
		// Set the colour to black.
		in_colour = "000000";
	}

	// Get the colour values as integers.
	var colour_red = parseInt(in_colour.charAt(0) + in_colour.charAt(1), 16);
	var colour_green = parseInt(in_colour.charAt(2) + in_colour.charAt(3), 16);
	var colour_blue = parseInt(in_colour.charAt(4) + in_colour.charAt(5), 16);
	
	// Normalize the colour values.
	colour_red = colour_red ? (colour_red / 255.0) : colour_red;
	colour_green = colour_green ? (colour_green / 255.0) : colour_green;
	colour_blue = colour_blue ? (colour_blue / 255.0) : colour_blue;
	
	// Calculate the perceived luminance value.
	var luminance = (0.2126 * colour_red) + (0.7152 * colour_green) + (0.0722 * colour_blue);

	// If the colour is very bright...
	if (luminance >= 0.75)
	{
		// Set the symbol colour to black.
		return "000000";
	}

	// Return white as the colour.
	return "FFFFFF";
};


// Called when the animation is triggered.
function onAnimation(in_element, in_class) {
	// Attempt to find the animation element.
	var e_animation = document.getElementById(in_element);

	// If there's a valid element...
	if (e_animation)
	{
		// Set the new classname.
		e_animation.className = in_class;
	}
};


// Called when a button is pressed.
function onButtonPressed(in_key, in_value)
{
	// Play the click sound.
	playSound('click');

	// Switch based on the key...
	switch (in_key)
	{
		// If this is a roll...
		case "roll":
			// Emit a roll with the appropriate value.
			socket.emit(
				'diceroll', 
				{ 
					alias: $('#alias').val(),
					colour: g_colour,
					description: $('#description').val(),
					username: $('#username').val(),
					value: in_value
				}
			);
			
			// Update the cookie.
			updateCookie();

			// Then break out...
			break;
			

		// In all other cases...
		default:
			// Set the die html.
			console.log("Diceboy >> Unknown Button Press");
	}
};


// Called when a client joins the current room.
function onClientJoin(in_name) {
	// Push the username into the list.
	g_userlist.push(in_name);
	
	// Update the user list.
	updateUserList();
}


// Called when a client leaves the current room.
function onClientPart(in_name) {
	// Iterate through the user list.
	for (var i = 0, len = g_userlist.length; i < len; ++i){
		// Get the specific user.
		var c = g_userlist[i];
	
		// If this is our user...
		if (c == in_name){
			// Remove the user from the list.
			g_userlist.splice(i,1);
			
			// Then exit out.
			break;
		}
	}
		
	// Update the user list.
	updateUserList();
}


// Called when an colour is pressed.
function onColourPressed(in_value) {
	// Play the click sound.
	playSound('click');
	
	// Get the event handler.
	event = event || window.event;
	
	// If there's a stop propagation method...
	if (event.stopPropagation)
	{
		// Stop the event propagation.
		event.stopPropagation();
	}
	else
	{
		// Otherwise, cancel bubbling.
		event.cancelBubble = true;
	}

	// Set the colour.
	setColour(in_value);
	
	// Close the menus.
	onMenuCancel();
	
	// Stop event bubbling.
	return false;
};


// Called to fade out an element.
function onFadeDelete(in_element) {
	// If there's no element, early out...
	if (!in_element)
	{
		return;
	}

	// Get the element by its id.
	var e_fade = document.getElementById(in_element);

	// If there's no element, exit out...
	if (!e_fade)
	{
		return;
	}

	// If the element has a parent...
	if (e_fade.parentNode)
	{
		// Remove the element from its parent.
		e_fade.parentNode.removeChild(e_fade);

		// Decrement the result count (to zero).
		result_count = (result_count >= 1) ? (result_count - 1) : 0;
	}
};


// Called when the client logs in.
function onLogin(in_data) {
	// Update the cookie.
	updateCookie();
	
	// Get the login element.
	var e_login = document.getElementById("db_login");
	
	// If there's a login element...
	if (e_login)
	{
		// Hide the login menu.
		e_login.style.display = "none";
	}

	// Get the interface element.
	var e_interface = document.getElementById("db_interface");
	
	// If there's an interface element...
	if (e_interface)
	{
		// Show the interface menu.
		e_interface.style.display = "block";
	}
	
	// Store the new data.
	g_room = in_data.room;
	g_socket_id = in_data.id;
	g_userlist = JSON.parse(in_data.userlist);
	
	// Update the user list.
	updateUserList();
}


// Called to attempt to login using the current values.
function onLoginAttempt() {
	// Get the current username.
	var s_user = $('#username').val();

	// If there's no username, exit out...
	if (!s_user)
	{
		return false;
	}
	
	// Get the current room.
	var s_room = $('#room');
	
	// If there's no room, exit out...
	if (!s_room)
	{
		return false;
	}
	
	// Get the room value.
	var s_room_value = s_room.val();
	
	// If there's no room value...
	if (!s_room_value)
	{
		// Use a default string.
		s_room_value = "Default";

		// Set the new text.
		s_room.val(s_room_value);
	}
	
	// Emit a login event.
	socket.emit(
		'login', 
		{ 
			room:  s_room_value,
			username: s_user,
		}
	);
};

// Called to logout the current user.
function onLogout() {
	// Get the login element.
	var e_login = document.getElementById("db_login");
	
	// If there's a login element...
	if (e_login)
	{
		// Show the login menu.
		e_login.style.display = "block";
	}

	// Get the interface element.
	var e_interface = document.getElementById("db_interface");
	
	// If there's an interface element...
	if (e_interface)
	{
		// Hide the interface menu.
		e_interface.style.display = "none";
	}
};


// Called when a menu is cancelled.
function onMenuCancel() {
	// Get the selector div.
	var e_alias = document.getElementById("db_alias_dropdown");

	// If there's a selector...
	if (e_alias)
	{
		// Hide the display.
		e_alias.style.display = "none";
	}
	
	// Get the selector div.
	var e_select = document.getElementById("db_colours");

	// If there's a selector...
	if (e_select)
	{
		// Hide the display.
		e_select.style.display = "none";
	}

	// Get the selector div.
	var e_description = document.getElementById("db_description_dropdown");

	// If there's a selector...
	if (e_description)
	{
		// Hide the display.
		e_description.style.display = "none";
	}

	// Clear the menu value.
	g_menu = "";

	// Update the cookies.
	updateCookie();
};


// Called when the animation is triggered.
function onTotal(in_element, in_class) {
	// Attempt to find the animation element.
	var e_animation = document.getElementById(in_element);

	// If there's a valid element...
	if (e_animation)
	{
		// Set the new classname.
		e_animation.className = in_class;
	}
};


// Play a specified sound.
function playSound(in_sound) {
	// If the sound is disabled, early out...
	if (g_sound == "false")
	{
		return;
	}
	
	// Switch based on the sound tag...
	switch (in_sound)
	{
		// If this is a click...
		case 'click':
			// Play the click sound.
			g_audio_click.play();

			// Then break out...
			break;
			

		// In all other cases...
		default:
			// Echo a warning to the console.
			console.log("Diceboy >> Unknown Sound");
	}
}


// Called to remove a result.
function removeResult(in_element) {
	// If there's no element, early out...
	if (!in_element)
	{
		return;
	}

	// Attempt to find the element in the message list.
	var message_index = g_messages.indexOf(in_element);

	// If the element was found...
	if (message_index != -1)
	{
		// Remove the element from the list.
		g_messages.splice(message_index, 1);
	}

	// Attempt to get the remove element.
	var e_remove = document.getElementById(in_element + "_remove");

	// If there's a remove element...
	if (e_remove)
	{
		// Hide the element.
		e_remove.style.display = "none";
	}

	// Get the element by its id.
	var e_result = document.getElementById(in_element);

	// If there's no element, exit out...
	if (!e_result)
	{
		return;
	}

	// Ensure the total is animated.
	if (e_result.timeout_result)
	{
		// Clear the timeout.
		window.clearTimeout(e_result.timeout_result);

		// Set the animation.
		onAnimation(in_element + "_total", "result_entry_total");
	}

	// Start fading out the element.
	onAnimation(in_element, "result_fade_out");

	// Schedule the element to be deleted.
	e_result.timeout_FadeoutDelete = window.setTimeout("onFadeDelete(\"" + in_element + "\");", 250);
};


// Select a specific menu.
function selectMenuButton(in_button) {
	// Store the previous menu.
	var e_menu = g_menu;

	// Trigger the menu cancellation.
	onMenuCancel();
	
	// Get the event handler.
	event = event || window.event;
	
	// If there's a stop propagation method...
	if (event.stopPropagation)
	{
		// Stop the event propagation.
		event.stopPropagation();
	}
	else
	{
		// Otherwise, cancel bubbling.
		event.cancelBubble = true;
	}
	
	// Play the click sound.
	playSound('click');

	// If we're clicking on the same menu...
	if (e_menu == in_button)
	{
		// Clear the menu value.
		g_menu = "";
	
		// Stop event bubbling.
		return false;
	}

	// Get the selector div.
	var e_select = document.getElementById(in_button);

	// If there's no selector, early out...
	if (!e_select)
	{
		return;
	}

	// Otherwise reveal the display.
	e_select.style.display = (e_select.style.display == "block") ? "none" : "block";
	
	// Update the cookies.
	updateCookie();
	
	// Set the new menu value.
	g_menu = in_button;
	
	// Stop event bubbling.
	return false;
}


// Selects a sound button.
function selectSoundButton(in_toggle) {
	// Set the new sound value.
	g_sound = in_toggle;

	// Attempt to get the enabled sound element.
	var e_sound_on = document.getElementById("db_sound_on");
	
	// If the element exists...
	if (e_sound_on)
	{
		// Show or hide the element as necessary.
		e_sound_on.style.display = (g_sound == "true" ) ? "block" : "none";
	}
	
	// Attempt to get the disabled sound element.
	var e_sound_off = document.getElementById("db_sound_off");
	
	// If the element exists...
	if (e_sound_off)
	{
		// Show or hide the element as necessary.
		e_sound_off.style.display = (g_sound == "true") ? "none" : "block";
	}

	// Update the cookie.
	updateCookie();

	// Get the event handler.
	event = event || window.event;
	
	// If there's a stop propagation method...
	if (event.stopPropagation)
	{
		// Stop the event propagation.
		event.stopPropagation();
	}
	else
	{
		// Otherwise, cancel bubbling.
		event.cancelBubble = true;
	}

	// Stop event bubbling.
	return false;
}


// Called to set the local colour.
function setColour(in_colour) {
	// Store the colour.
	g_colour = in_colour;

	// Iterate through the highlight and add them to the container.
	for (var i = 0; i < g_colour_array.length; i++)
	{
		// Get the id string.
		var id_string = "db_colour_" + i;

		// Get the element from its id string.
		var e_colour = document.getElementById(id_string);

		// If there's no element, skip the rest...
		if (!e_colour)
		{
			continue;
		}

		// Set the display value.
		e_colour.style.display = (g_colour_array[i] == in_colour) ? "block" : "none";
	}

	// Get the colour choice option.
	var e_colour = document.getElementById("db_colour_choice");

	// If there's an element...
	if (e_colour)
	{
		// Set the background colour.
		e_colour.style.backgroundColor = "#" + in_colour;
	}

	// Get the colour choice sign.
	var e_sign = document.getElementById("db_colour_choice_sign");

	// If there's an element...
	if (e_sign)
	{
		// Set the colour.
		e_sign.style.color = "#" + getDiceSymbolColour(in_colour);
	}
};


// Set a key-value pair for the cookie.
function setCookieValue(in_key, in_value)
{
	// Create an expiry date in 28 days time.
	var o_date = new Date();
	o_date.setTime(o_date.getTime() + (28 * 24 * 60 * 60 * 1000));

	// Set the data.
	document.cookie = in_key + "=" + in_value + ";expires=" + o_date.toUTCString() + ";path=/";
}


// Update the cookie.
function updateCookie()
{
	// Set the cookie values.
	setCookieValue("alias", $('#alias').val());
	setCookieValue("colour", g_colour);
	setCookieValue("description", $('#description').val());
	setCookieValue("room", $('#room').val());
	setCookieValue("sound", g_sound)
	setCookieValue("username", $('#username').val());
};


// Updates the user list.
function updateUserList()
{
	// Get the user list.
	var e_list = document.getElementById("db_userlist");
	
	// If there's no list, early out...
	if (!e_list)
	{
		return;
	}
	
	// Set up a variable to store the html.
	var d_html = "";
	
	// Set the room prefix.
	d_html += "#" + g_room + ":  ";
	
	// Sort the user list alphabetically.
	g_userlist.sort();
	
	// Iterate through the user list.
	for (var i = 0; i < g_userlist.length; i++)
	{
		// If this isn't the first name...
		if (i != 0) 
		{
			// Prepend a comma and a space.
			d_html += ", ";
		}

		// Append the user name to the string.
		d_html += g_userlist[i];
	}

	// Set the new html.
	db_userlist.innerHTML = d_html;
}


// Called when this client connects.
socket.on('clientlogin', function(msg){
	// Trigger the callback.
	onLogin(msg);
});


// Called when this client joins a room.
socket.on('clientjoin', function(msg){
	// Trigger the callback.
	onClientJoin(msg);
});


// Called when this client leaves a room.
socket.on('clientpart', function(msg){
	// Trigger the callback.
	onClientPart(msg);
});



// Called when a dice roll is received from the server.
socket.on('diceroll', function(msg){
	// Trigger the appropriate function.
	addResult(msg.username, msg.colour, msg.alias, msg.description, msg.value, msg.roll);
});
