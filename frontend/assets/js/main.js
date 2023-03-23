const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 600;

/**
 * Web socket event
 */
const socket = io();

/**
 * Array clients
 */
let clients = [];

/**
 * Client
 */
let client = undefined;

let posX = undefined;
let posY = undefined;
// const arcWidth = 50;
// const arcHeight = 50;
const speedMove = 5;
const radius = 10;
let shadowOffsetX = undefined;
let shadowOffsetY = undefined;
const shadowOffset = 10;
const shadowBlur = 20;
const shadowColor = "red";

socket.on("connection", (e) => {
  console.log("nouvelle connection");
  document.querySelector("#name").innerHTML = socket.id;
  clients = [];
  e.forEach((element) => {
    arc(element.x, element.y, element.id);
    const client = {
      x: element.x,
      y: element.y,
      id: element.id,
      shadowOffsetX: element.shadowOffsetX,
      shadowOffsetY: element.shadowOffsetY,
    };
    clients.push(client);
    console.log(client);
  });
  const indexClient = searchIndexClient(socket.id);
  client = clients[indexClient];

  posX = client.x;
  posY = client.y;
  shadowOffsetX = client.shadowOffsetX;
  shadowOffsetY = client.shadowOffsetY;
});

socket.on("move", (e) => {
  const indexClient = searchIndexClient(e.id);
  clients[indexClient].x = e.x;
  clients[indexClient].y = e.y;
  clients[indexClient].shadowOffsetX = e.shadowOffsetX;
  clients[indexClient].shadowOffsetY = e.shadowOffsetY;
});

socket.on("disconnect", () => {
  console.log(socket.id);
});

/**
 * @param int posX
 * @param int posY
 * @param int shadowOffsetX
 * @param int shadowOffsetY
 * @returns void
 */
const draw = (posX, posY, shadowOffsetX, shadowOffsetY) => {
  client.x = posX;
  client.y = posY;
  client.shadowOffsetX = shadowOffsetX;
  client.shadowOffsetY = shadowOffsetY;
  socket.emit("draw", client);
};

/**
 * @param int x
 * @param int y
 * @param string id
 * @returns void
 */
const arc = (x, y, id, shadowOffsetX, shadowOffsetY) => {
  ctx.beginPath();
  ctx.shadowColor = shadowColor;
  ctx.shadowOffsetX = shadowOffsetX;
  ctx.shadowOffsetY = shadowOffsetY;
  ctx.shadowBlur = shadowBlur;
  ctx.fillStyle = "white";
  ctx.arc(x, y, radius, 0,  2 * Math.PI);
  ctx.fill();
};

const anim = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  requestAnimationFrame(anim);
  clients.forEach((element) => {
    arc(
      element.x,
      element.y,
      element.id,
      element.shadowOffsetX,
      element.shadowOffsetY
    );
  });
};

anim();

/**
 * Search client by id in array client
 * @param string id
 * @returns index of Client
 */
const searchIndexClient = (id) => {
  const indexClient = clients.findIndex((x) => x.id === id);

  return indexClient;
};

window.addEventListener("keydown", (e) => {
  const keycode = e.keyCode;
  switch (keycode) {
    case 39:
      if (posX + radius + speedMove >= canvas.width) {
        return;
      }
      posX += speedMove;
      shadowOffsetX = -shadowOffset;
      shadowOffsetY = 0;
      break;
    case 40:
      if (posY + radius + speedMove >= canvas.height) {
        return;
      }
      posY += speedMove;
      shadowOffsetX = 0;
      shadowOffsetY = -shadowOffset;
      break;
    case 37:
      if (posX - speedMove <= 0) {
        return;
      }
      posX -= speedMove;
      shadowOffsetX = shadowOffset;
      shadowOffsetY = 0;
      break;
    case 38:
      if (posY - speedMove <= 0) {
        return;
      }
      posY -= speedMove;
      shadowOffsetX = 0;
      shadowOffsetY = shadowOffset;
      break;
  }

  draw(posX, posY, shadowOffsetX, shadowOffsetY);
});

window.addEventListener("keyup", () => {
  client.shadowOffsetX = 0;
  client.shadowOffsetY = 0;
  socket.emit("draw", client);
});
