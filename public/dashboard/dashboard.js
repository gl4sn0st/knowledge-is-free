document.addEventListener('DOMContentLoaded', () => {
    const playerListContainer = document.getElementById('players');
    const questionDiv = document.getElementById('question');
    const correctDiv = document.getElementById('correct');
    const answersDiv = document.getElementById('answers');
    let plist;
    
    // Create a WebSocket connection to the server
    const socket = new WebSocket('ws://localhost:3000'); // Replace with your server URL
    
    socket.addEventListener('open', () => {
        console.log('WebSocket connection established');
        socket.send(JSON.stringify({ type: 'dashboardjoin' }));
        
        // Send a request for the player list
        plist = setInterval(function() {
            socket.send(JSON.stringify({ type: 'requestPlayerList' }));
        }, 500);
    });
    
    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'playerList') {
            // Display players along with their points
            displayPlayerList(data.players);
        } else if(data.type === 'question') {
            q = JSON.parse(data.message);
            question.innerText = q.question;
            let i = 0;
            q.answers.forEach((a) => {
                const liItem = document.createElement('li');
                liItem.classList.add('answer');
                liItem.id = i;
                const div1 = document.createElement('div');
                div1.textContent = a;
                const div2 = document.createElement('div');
                div2.id = 'clients';
                liItem.appendChild(div1);
                liItem.appendChild(div2);
                answers.appendChild(liItem);
                i++;
            });
            i = 16;
            let anstime = setInterval(function() {
                correct.innerText = 'Czas na odpowiedź: ' + i;
                i--;
            }, 1000);
            setTimeout(function() {
                clearInterval(anstime);
                correct.innerText = 'Poprawna odpowiedź to: ' + q.answers[0];

                document.querySelectorAll('li.answer').forEach((el) => {
                    if(el.id == 0) {
                        el.querySelector('#clients').querySelectorAll('p').forEach((e) => {
                            socket.send(JSON.stringify({type: 'correct', uuid: e.id, points: q.points}));
                            socket.send(JSON.stringify({ type: 'requestPlayerList' }));
                        });
                    }
                });

            }, 15000);
        } else if(data.type === 'count') {
            question.innerText = data.message + data.no;
        } else if(data.type === 'answer') {
            const p = document.createElement('p');
            p.innerText = data.player;
            p.id = data.uuid;
            document.getElementById(data.answer).querySelector('#clients').appendChild(p);
        }
    });

    document.getElementById('start').addEventListener('click', function() {
        socket.send(JSON.stringify({type: 'startGame'}));
        socket.send(JSON.stringify({type: 'count', how: 5}));
        document.getElementById('start').style.display = 'none';
        clearInterval(plist);
    });
    
    socket.addEventListener('close', () => {
        console.log('WebSocket connection closed');
    });
    
    // Function to display the player list with points
    function displayPlayerList(players) {
        playerListContainer.innerHTML = ''; // Clear the current list
        
        players.forEach((player) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${player.nickname} - Points: ${player.points}`;
            playerListContainer.appendChild(listItem);
        });
    }

});