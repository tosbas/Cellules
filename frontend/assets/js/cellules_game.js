const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const buttonRed = document.querySelector("#red");
const buttonBlue = document.querySelector("#blue");
const socket = io();

let players = [];
let player = {};

const inputs = {
  up: false,
  down: false,
  left: false,
  right: false,
};

let playerId;

canvas.width = 800;
canvas.height = 600;

//Player à choisis une team
socket.on("connectionTeam", (playersReceived, teamRedLength, teamBlueLength) => {
  const socketId = socket.id;

  players = playersReceived;

  const indexPlayer = getPlayerIndex(socketId);
  playerId = socketId;
  player = players[indexPlayer];

  document.querySelector("#teamRed").innerHTML = teamRedLength;
  document.querySelector("#teamBlue").innerHTML = teamBlueLength;

  if (playerId && player) {
    document.querySelector("#menu").remove();
  }

  players.forEach((player) => {
    createCell(player);
  });

  const lastNewPlayer = players[players.length - 1];
  const lastNewPlayerId = lastNewPlayer.id;

  console.log("New player ", lastNewPlayerId, " Join the game");
});

socket.on("players", (serverPlayers) => {
  players = serverPlayers;

  if (playerId && player) {
    player = serverPlayers.find((player) => player.id === socket.id);
  }
});

socket.on("errorCmd", (error) => {
  console.log(error);
})

//Player vient de déconnecter
socket.on("disconnection", (removedPlayerId, teamRedLength, teamBlueLength) => {
  console.log("Player", removedPlayerId, " left the game");
  const index = getPlayerIndex(removedPlayerId);
  players.splice(index, 1);

  document.querySelector("#teamRed").innerHTML = teamRedLength;
  document.querySelector("#teamBlue").innerHTML = teamBlueLength;
});

//Bouton choix team "blue"
buttonBlue.addEventListener("click", () => {
  socket.emit("team", "blue");
});

//Bouton choix team "red"
buttonRed.addEventListener("click", () => {
  socket.emit("team", "red");
});

const createCell = (player) => {
  ctx.beginPath();
  ctx.fillStyle = player.colorState;
  ctx.arc(player.x, player.y, player.radius, 0, 2 * Math.PI);

  ctx.fill();

  if (player.id == playerId) {
    printName("Vous", player);
  } else {
    let playerIdMinimize = "";

    for (let i = 0; i < 4; i++) {
      playerIdMinimize += player.id[i];
    }

    printName(playerIdMinimize, player);
  }
};

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgb(105,105,105)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fill();

  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);

  requestAnimationFrame(gameLoop);

  players.forEach((otherPlayer) => {
    createCell(otherPlayer);
  });
}

const getPlayerIndex = (id) => {
  return players.findIndex((player) => player.id === id);
};

const getPlayer = (id) => {
  return players.find((player) => player.id === id);
};

const printName = (name, player) => {
  const textSize = 20;
  ctx.font = textSize + "px serif";
  ctx.fillStyle = "White";
  ctx.fillText(name, player.x - textSize, player.y - player.radius - 5);
};

// ************************* Mouvement ***************************** \\

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") {
    inputs["up"] = true;
  } else if (e.key === "ArrowDown") {
    inputs["down"] = true;
  } else if (e.key === "ArrowRight") {
    inputs["right"] = true;
  } else if (e.key === "ArrowLeft") {
    inputs["left"] = true;
  }

  socket.emit("inputs", inputs);
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowUp") {
    inputs["up"] = false;
  } else if (e.key === "ArrowDown") {
    inputs["down"] = false;
  } else if (e.key === "ArrowRight") {
    inputs["right"] = false;
  } else if (e.key === "ArrowLeft") {
    inputs["left"] = false;
  }

  socket.emit("inputs", inputs);
});

// **************************** Screen view ********************** \\


// **************************** Game Loop ********************** \\

gameLoop();
