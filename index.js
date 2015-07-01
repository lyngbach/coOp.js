var express = require('express');
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http);

// app routing
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
	app.use("/css", express.static(__dirname + "/css"));
	app.use("/js", express.static(__dirname + "/js"));
	app.use("/node_modules", express.static(__dirname + "/node_modules"));
});

io.sockets.on('connection', function (socket) {
	console.log('a user session', socket.id);

	socket.on('sendText', function (paragraphs) {
		console.log('server recived text:', paragraphs);

		console.log('sending to all other users');

		socket.broadcast.emit('msgBroadcast', paragraphs);
	});
});

http.listen(5000, function () {
	console.log('listening on *:5000');
});