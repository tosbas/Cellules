const app = require("express")();
const express = require("express");
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const fs = require("fs");

app.use(express.static(path.join(__dirname, "../frontend/assets")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

let players = [];

const TIKERATE = 60;

const inputsMap = {};

const playArea = {
  maxWidth: 750,
  maxHeight: 550,
  minWidth: 50,
  minHeigth: 50
};

const canvas = {
  widht: 800,
  height: 600,
}

const maxSpeedForOutArea = 8;
const bouncingWall = 0.5;
const bouncingWallEliminate = 0.1;


class NewPlayer {
  constructor(id, team, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.team = team;
    this.colorState = team;
    this.acceleration = 0.1;
    this.deceleration = 0.1;
    this.maxSpeed = 2;
    this.radius = 7;
    this.state = true;
  }
}

io.on("connection", (socket) => {
  inputsMap[socket.id] = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  const socketId = socket.id;

  logView(`Nouvelle connection ${socketId}`);

  //Player à rejoin une team
  socket.on("team", (team) => {

    const playerInArray = players.find((player) => player.id === socketId);

    if (!playerInArray) {
      logView(`Player ${socketId} à rejoint l'équipe ${team}`);

      const position = positionCell(team);
      const x = position.x;
      const y = position.y;

      const player = new NewPlayer(socketId, team, x, y);
      players.push(player);

      sendTeam(players);

    } else {
      logView(`Player ${socketId} à essayer de faire apparaitre une cellule alors qu'il en posséde dèja une !`);
      io.emit("errorCmd", "Jolie tentative, essaye encore et je te ban !");
    }


  });

  //Player vient de se déconnecter
  socket.on("disconnect", () => {
    logView(`Player ${socketId} à quitter la partie`);
    const index = getPlayerIndex(socket.id);
    const removedPlayer = players[index];

    players.splice(index, 1);

    const teams = teamLength(players);

    const teamRedLength = teams[0];
    const teamBlueLength = teams[1];

    if (players.length !== 0) {
      const removedPlayerId = removedPlayer.id
      io.emit("disconnection", removedPlayerId, teamRedLength, teamBlueLength);

      // Supprimer toutes les cellules ayant le même ID que le joueur déconnecté
      const newPlayers = players.filter(
        (player) => player.id !== removedPlayer.id
      );

      players = newPlayers;
    }

  });

  socket.on("inputs", (inputs) => {
    inputsMap[socket.id] = inputs;
  });
});

const tick = () => {
  for (const player of players) {
    moveCell(player);
    colidCell(players, player, player.id);
  }
  io.emit("players", players);
};




/*
 * Gestion mouvement cellule
 */
const moveCell = (player) => {

  const inputs = inputsMap[player.id];

  player.x += player.vx;
  player.y += player.vy;

  //Mouvement player
  if (inputs.up && player.state) {
    player.vy -= player.acceleration;
  } else if (inputs.down && player.state) {
    player.vy += player.acceleration;
  } else {
    if (player.vy > 0) {
      player.vy = Math.max(0, player.vy - player.deceleration);
    } else {
      player.vy = Math.min(0, player.vy + player.deceleration);
    }
  }

  if (inputs.left && player.state) {
    player.vx -= player.acceleration;
  } else if (inputs.right && player.state) {
    player.vx += player.acceleration;
  } else {
    if (player.vx > 0) {
      player.vx = Math.max(0, player.vx - player.deceleration);
    } else {
      player.vx = Math.min(0, player.vx + player.deceleration);
    }
  }


  if (player.state) {

    //Player zone de jeu
    if (player.x - player.radius < playArea.minWidth) {
      if (player.vx <= -maxSpeedForOutArea) {
        player.state = false;
      } else {
        player.x = playArea.minWidth + player.radius;
        player.vx *= -bouncingWall;
      }

    } else if (player.x + player.radius >= playArea.maxWidth) {
      if (player.vx >= maxSpeedForOutArea) {
        player.state = false;
      } else {
        player.x = playArea.maxWidth - player.radius;
        player.vx *= -bouncingWall;
      }

    } else if (player.y - player.radius <= playArea.minHeigth) {

      if (player.vy <= -maxSpeedForOutArea) {
        player.state = false;
      } else {
        player.y = playArea.minWidth + player.radius;
        player.vy *= -bouncingWall;
      }

    } else if (player.y + player.radius >= playArea.maxHeight) {
      if (player.vy >= maxSpeedForOutArea) {
        player.state = false;
      } else {
        player.y = playArea.maxHeight - player.radius;
        player.vy *= -bouncingWall;
      }
    }

    if (!player.state) {
      logView(`Player ${player.id} à été éliminer`);

      sendTeam(players);
    }

  }


  if (!player.state) {

    if (player.y + player.radius >= playArea.height) {
      player.y = playArea.height - player.radius;
      player.vy *= -bouncingWallEliminate;
    } else if (player.x - player.radius <= 0) {
      player.x = player.radius;
      player.vx *= -bouncingWallEliminate;
    } else if (player.x + player.radius >= canvas.widht) {
      player.x = canvas.widht - player.radius;
      player.vx *= -bouncingWallEliminate;
    }
    else if (player.y - player.radius <= 0) {
      player.y = player.radius;
      player.vy *= -bouncingWallEliminate;
    } else if (player.y + player.radius >= canvas.height) {
      player.y = canvas.height - player.radius;
      player.vy *= -bouncingWallEliminate;
    }

  }

}



/**
 * Gestion positionnement équipe cellule
 */
const positionCell = (team) => {
  const position = { x: 0, y: 0 };

  const bluePos = [340, 60];
  const redPos = [780, 360];

  if (team === "blue") {
    position.x = Math.random() * (bluePos[0] - bluePos[1]) + bluePos[1];
    position.y = Math.random() * (bluePos[0] - bluePos[1]) + bluePos[1];
  } else if (team === "red") {
    position.x = Math.random() * (redPos[0] - redPos[1]) + redPos[1];
    position.y = Math.random() * (redPos[0] - redPos[1]) + redPos[1];
  }

  return position;
};

/**
 * Easy Log
 */
const logView = (text) => {
  const date = new Date();

  dateHours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
  dateMinutes =
    date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
  dateSeconds =
    date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();

  const dateFormat = `${dateHours}:${dateMinutes}:${dateSeconds}`;

  console.log(dateFormat, text);
};

/**
 * Retrouve l'index du player
 */
const getPlayerIndex = (id) => {
  return players.findIndex((player) => player.id === id);
};


/**
 * Gestion de la détection des collisions entre cellules
 */
const detectColidCell = (c1x, c2x, c1y, c2y, c1r, c2r) => {
  const distX = c1x - c2x;
  const distY = c1y - c2y;

  const distance = Math.sqrt(distX * distX + distY * distY);

  const angle = Math.atan2(c2y - c1y, c2x - c1x);

  const distanceMove = c1r + c2r - distance;

  if (distance <= c1r + c2r) {
    return [true, angle, distanceMove];
  }

  return false;
};

/**
 * Vérifie la collisions entre cellules
 */
const colidCell = (players, player, socketId) => {
  if (players.length > 1) {
    players.forEach((element) => {
      if (element.id == socketId) {
        return;
      }
      else {
        const colid = detectColidCell(
          player.x,
          element.x,
          player.y,
          element.y,
          player.radius,
          element.radius
        );
        if (colid[0] && player.team !== element.team) {
          const angle = colid[1];

          const distanceToMove = colid[2];

          player.vx -= Math.cos(angle) * distanceToMove;
          player.vy -= Math.sin(angle) * distanceToMove;

        }
      }
    });
  }
};

const sendTeam = (players) => {
  const teams = teamLength(players);

  const teamRedLength = teams[0];
  const teamBlueLength = teams[1];

  io.emit("connectionTeam", players, teamRedLength, teamBlueLength);
}

const teamLength = (players) => {
  const teamRed = players.filter((player) => player.team === "red" && player.state);
  const teamBlue = players.filter((player) => player.team === "blue" && player.state);

  const teamRedLength = teamRed.length;
  const teamBlueLength = teamBlue.length;

  return [teamRedLength, teamBlueLength];
}

// setInterval((player) => {
//   if (player.colorState == player.team) {
//     player.colorState = "yellow";
//   } else {
//     player.colorState = player.team;
//   }
// })

/**
 * Boucle du serveur
 */
setInterval(tick, 1000 / TIKERATE);

http.listen(3000, function () {
  console.log("Serveur actif sur http://localhost:3000");
});
