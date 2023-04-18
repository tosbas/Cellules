const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 600;

// Web socket event
const socket = io();

// All clients
let clients = [];

// The client
let client = undefined;

// Shadow color
const shadowColor = "red";

/**
 * As soon as a connection is detected by the backend it sends back to the frontend an array containing all the customers, once received,
 * browses the table to display the cells of the players and creates a cell for each customer,
 * have recovered the customer at the same time to differentiate it from others
 */
socket.on("connection", (e) => {
  document.querySelector("#name").innerHTML = socket.id;
  // Empty the array containing all customers
  clients = [];

  // Iterates through the array coming from the server
  e.forEach((element) => {
    cellule(
      element.x,
      element.y,
      element.radius,
      element.speed,
      element.shadowOffset,
      element.shadowBlur,
      element.shadowOffsetX,
      element.shadowOffsetY
    );
    const client = {
      x: element.x,
      y: element.y,
      id: element.id,
      radius: element.radius,
      vx: element.vx,
      vy: element.vy,
      speed: element.speed,
      acceleration: element.acceleration,
      deceleration: element.deceleration,
      shadowOffset: element.shadowOffset,
      shadowBlur: element.shadowBlur,
      shadowOffsetX: element.shadowOffsetX,
      shadowOffsetY: element.shadowOffsetY,
    };
    // Pushes each cell object into the "customers" array
    clients.push(client);
  });

  // Get client index, by socket.id
  const indexClient = searchIndexClient(socket.id);

  // "Client" now contains the player
  client = clients[indexClient];
});
 
// When a client moves, it sends a "move" event, which allows the real-time positions of the players to be updated on the client.
socket.on("move", (e) => {
  //Recovery of the player who issued the event
  const indexClient = searchIndexClient(e.id);

  // Recovery of the player who emitted the event by his index
  clients[indexClient].x = e.x;
  clients[indexClient].y = e.y;
  clients[indexClient].radius = e.radius;
  clients[indexClient].speed = e.speed;
  clients[indexClient].shadowOffset = e.shadowOffset;
  clients[indexClient].shadowBlur = e.shadowBlur;
  clients[indexClient].shadowOffsetX = e.shadowOffsetX;
  clients[indexClient].shadowOffsetY = e.shadowOffsetY;
});

socket.on("disconnect", () => {
  console.log(socket.id);
});

// Function used to send the "client" object to the backend with in an event named "draw"
const draw = (x,y,radius,id,shadowOffset,shadowBlur,shadowOffsetX,shadowOffsetY) => {
  client.x = x;
  client.y = y;
  client.radius = radius;
  client.id = id;
  client.shadowOffset = shadowOffset;
  client.shadowBlur = shadowBlur;
  client.shadowOffsetX = shadowOffsetX;
  client.shadowOffsetY = shadowOffsetY;
  socket.emit("draw", client);
};

// Creating a cell
const cellule = (x,y,radius,shadowBlur,shadowOffset,shadowOffsetX,shadowOffsetY) => {
  ctx.beginPath();
  ctx.shadowColor = shadowColor;
  ctx.shadowOffset = shadowOffset;
  ctx.shadowOffsetX = shadowOffsetX;
  ctx.shadowOffsetY = shadowOffsetY;
  ctx.shadowBlur = shadowBlur;
  ctx.fillStyle = "white";
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
};

function update() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  clients.forEach((element) => {
    cellule(
      element.x,
      element.y,
      element.radius,
      element.shadowBlur,
      element.shadowOffset,
      element.shadowOffsetX,
      element.shadowOffsetY
    );
  });

  if (client !== undefined) {
    // Calculate the new position of the cell based on its speed
    client.x += client.vx;
    client.y += client.vy;

    // Manage canvas overflow
    if (client.x < 0 + client.radius) {
      client.x = client.radius;
      client.vx *= -0.5;
    }
    if (client.x > canvas.width - client.radius) {
      client.x = canvas.width - client.radius;
      client.vx *= -0.5;
    }
    if (client.y < 0 + client.radius) {
      client.y = client.radius;
      client.vy *= -0.5;
    }
    if (client.y > canvas.height - client.radius) {
      client.y = canvas.height - client.radius;
      client.vy *= -0.5;
    }

    // Manage the movement of the cell
    if (isKeyPressed("ArrowUp")) {
      // Speed up
      client.vy -= client.acceleration;
      client.shadowOffsetY = client.shadowOffset;
    }
    if (isKeyPressed("ArrowDown")) {
      // Speed down
      client.vy += client.acceleration;
      client.shadowOffsetY =- client.shadowOffset;
    }
    if (isKeyPressed("ArrowLeft")) {
      // Speed left
      client.vx -= client.acceleration;
      client.shadowOffsetX = client.shadowOffset;
    }
    if (isKeyPressed("ArrowRight")) {
      // Speed right
      client.vx += client.acceleration;
      client.shadowOffsetX =- client.shadowOffset;
    }

    // Manage deceleration
    if (!isKeyPressed("ArrowUp") && !isKeyPressed("ArrowDown")) {
      if (client.vy > 0) {
        client.vy = Math.max(0, client.vy - client.deceleration);
      } else {
        client.vy = Math.min(0, client.vy + client.deceleration);
      }
      client.shadowOffsetY = 0;
    }

    if (!isKeyPressed("ArrowLeft") && !isKeyPressed("ArrowRight")) {
      if (client.vx > 0) {
        client.vx = Math.max(0, client.vx - client.deceleration);
      } else {
        client.vx = Math.min(0, client.vx + client.deceleration);
      }
      client.shadowOffsetX = 0;
    }

    // Limit the speed of the cell
    client.speed = Math.sqrt(client.vx * client.vx + client.vy * client.vy);
    if (client.speed > 2) {
      client.vx *= 2 / client.speed;
      client.vy *= 2 / client.speed;
    }

    // Send new coordinates to backend
    draw(
      client.x,
      client.y,
      client.radius,
      client.id,
      client.shadowOffset,
      client.shadowBlur,
      client.shadowOffsetX,
      client.shadowOffsetY
    );
  }

  requestAnimationFrame(update);
}

let keys = {};

document.addEventListener("keydown", function (event) {
  keys[event.code] = true;
});

document.addEventListener("keyup", function (event) {
  keys[event.code] = false;

});

// Function to check if a key is pressed
function isKeyPressed(key) {
  return keys[key] === true;
}

// Function to search for a client index by its id
const searchIndexClient = (id) => {
  const indexClient = clients.findIndex((x) => x.id === id);

  return indexClient;
};

update();
