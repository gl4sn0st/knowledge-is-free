const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const socket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new socket.Server({ server });
const io = socketio(server);

const players = [];
const clients = new Map();
let questions = [];
let question_id = 0;

fs.readFile('questions.json', 'utf8', (err, data) => {
	if(err) {
		console.error('Error reading questions: ', err);
		return;
	}

	try {
		questions = JSON.parse(data);
		console.log(questions.length);
	} catch(err) {
		console.error('Error parsing questions: ', err);
	}
});

const db = new sqlite3.Database('quiz.db');

wss.on('connection', (ws) => {

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'dashboardjoin') {
    	clients.set('dashboard', ws);
    }
    else if (data.type === 'join') {
    	const { nickname } = data;
      const playerid = uuidv4();
      const player = {
      	id: playerid,
      	nickname,
      	points: 0,
      };
      players.push(player);
      ws.send(JSON.stringify({ type: 'joinResponse', playerid: playerid }));
    } else if (data.type === 'requestPlayerList') {
            // Send the player list in response to the request
            const playerList = players.map((player) => ({
                nickname: player.nickname,
                points: player.points,
            }));

            ws.send(JSON.stringify({ type: 'playerList', players: playerList }));
      } else if (data.type === 'startGame') {
      		wss.clients.forEach((client) => {
      			if(client.readyState === socket.OPEN) {
      				client.send(JSON.stringify({type: 'gameStarted'}));
      			}
      		});

      		setTimeout(function() {
  				wss.clients.forEach((client) => {
  					client.send(JSON.stringify({ type: 'question', message: JSON.stringify(questions[question_id])}));
  				});
      		}, 6000);
      } else if (data.type === 'count' && data.how) {
      	let i = data.how;
      	function sendCount() {
      		if(i > 0) {
      			wss.clients.forEach((client) => {
      				if(client.readyState === socket.OPEN) {
						client.send(JSON.stringify({ type: 'count', message: 'Gra zostanie rozpoczęta za.. ', no: i }));
      				}
      			});

      			i--;

      			if(i > 0) {
      				setTimeout(sendCount, 1000);
      			}
      		}
      	}
      	sendCount();
      } else if (data.type === 'nextquestion') {
      	question_id++;
      	setTimeout(function() {
				wss.clients.forEach((client) => {
					client.send(JSON.stringify({ type: 'question', message: JSON.stringify(questions[question_id])}));
				});
  		}, 6000);
      } else if(data.type === 'answer' && data.id && data.playeruuid) {
      		clients.get('dashboard').send(JSON.stringify({type: 'answer', player: players.find(x => x.id == data.playeruuid).nickname, answer: data.id, uuid: data.playeruuid}));
      } else if(data.type === 'correct') {
      	players.find(x => x.id == data.uuid).points += data.points;
      }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    // Remove the WebSocket connection from the set
    
  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html'));
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
	console.log("server running on port ${port}");
});