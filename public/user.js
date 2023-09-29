document.addEventListener('DOMContentLoaded', () => {
  const nicknameForm = document.getElementById('nickname-form');
  const nicknameInput = document.getElementById('nickname');
  const waiting = document.getElementById('waiting');
  const errorMessage = document.getElementById('error-message');
  const pingButton = document.getElementById('ping-button');
  const question = document.getElementById('question');
  const answers = document.getElementById('answers');

  let socket;
  let playerUUID;
  let answs = [];

  function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

  nicknameForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nickname = nicknameInput.value;

    // Validate the nickname (e.g., check for an empty nickname)
    if (!nickname) {
      errorMessage.textContent = 'Please enter a valid nickname.';
      return;
    }

    // Create a WebSocket connection
    socket = new WebSocket('ws://localhost:3000'); // Replace with your server URL

    socket.addEventListener('open', () => {
      // Send the nickname to the server to join the game
      socket.send(JSON.stringify({ type: 'join', nickname }));
    });

    socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);

      if(data.type == 'joinResponse' && data.playerid) {
        playerUUID = data.playerid;
        nicknameForm.style.display = 'none';
        waiting.style.display = 'block';
      } else if(data.type == 'gameStarted') {
        waiting.style.display = 'none';
      } else if(data.type == 'count') {
        waiting.style.display = 'block';
        waiting.innerText = data.message + data.no;
      } else if(data.type == 'question') {
        q = JSON.parse(data.message);
        waiting.style.display = 'none';
        question.innerText = q.question;
        for(i = 0; i < q.answers.length; i++) {
          answs.push({id: i, answer: q.answers[i]});
        }
        shuffle(answs);
        answs.forEach((a) => {
          btn = document.createElement('button');
          btn.innerText = a.answer;
          btn.classList.add('buttonAnswer');
          btn.id = a.id;
          answers.appendChild(btn);
        });
        eventToButtons();
      }
    });

    function eventToButtons() {
      document.querySelectorAll('.buttonAnswer').forEach((e) => {
        e.addEventListener('click', (event) => {
          socket.send(JSON.stringify({type: 'answer', playeruuid: playerUUID, id: e.id}));
          answers.style.display = 'none';
          waiting.style.display = 'block';
          waiting.innerText = 'Oczekiwanie na innych graczy..';
        });
      });
    }

    socket.addEventListener('close', () => {
      // WebSocket connection closed; handle accordingly
      // For example, you can disable the ping button
    });
  });
});