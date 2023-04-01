const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// window.addEventListener("touchmove", ()=>{
//   console.log(ca)
// })

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
 * Bas
 */
const event1 = () => {
  let event1 = new KeyboardEvent("keydown", {
    keyCode: 40,
    repeat: true,
  });
  window.dispatchEvent(event1);
};

/**
 * Droite
 */
const event2 = () => {
  let event2 = new KeyboardEvent("keydown", {
    keyCode: 38,
    repeat: true,
  });
  window.dispatchEvent(event2);
};

/**
 * Gauche
 */
const event3 = () => {
  let event3 = new KeyboardEvent("keydown", {
    keyCode: 37,
    repeat: true,
  });
  window.dispatchEvent(event3);
};

/**
 * Haut
 */
const event4 = () => {
  let event4 = new KeyboardEvent("keydown", {
    keyCode: 39,
    repeat: true,
  });
  window.dispatchEvent(event4);
};

/**
 * Client
 */
let client = undefined;

/**
 * Client style cellule
 */
let posX = undefined;
let posY = undefined;
const speedMove = 0.5;
const radius = 10;
let shadowOffsetX = undefined;
let shadowOffsetY = undefined;
const shadowOffset = 10;
const shadowBlur = 10;
const shadowColor = "red";

socket.on("connection", (e) => {
  console.log("nouvelle connection");
  document.querySelector("#name").innerHTML = socket.id;
  clients = [];
  e.forEach((element) => {
    cellule(element.x, element.y, element.id);
    const client = {
      x: element.x,
      y: element.y,
      id: element.id,
      shadowOffsetX: element.shadowOffsetX,
      shadowOffsetY: element.shadowOffsetY,
    };
    clients.push(client);
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
 * @param int shadowOffsetX
 * @param int shadowOffsetY
 * @returns void
 */
const cellule = (x, y, id, shadowOffsetX, shadowOffsetY) => {
  ctx.beginPath();
  ctx.shadowColor = shadowColor;
  ctx.shadowOffsetX = shadowOffsetX;
  ctx.shadowOffsetY = shadowOffsetY;
  ctx.shadowBlur = shadowBlur;
  ctx.fillStyle = "white";
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
};

const anim = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  requestAnimationFrame(anim);
  clients.forEach((element) => {
    cellule(
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
 * search client by id in array client
 * @param string id
 * @returns index of Client
 */
const searchIndexClient = (id) => {
  const indexClient = clients.findIndex((x) => x.id === id);

  return indexClient;
};

let arrayTouch = [];

window.addEventListener("keydown", (e) => {
  shadowOffsetX = 0;
  shadowOffsetY = 0;
  const keycode = e.keyCode;
  arrayTouch.push(keycode);

  arrayTouch = arrayTouch.filter((x, i, a) => a.indexOf(x) == i);

  if (posX + radius >= canvas.width) {
    posX = canvas.width - radius;
  }

  if (posY + radius >= canvas.height) {
    posY = canvas.height - radius;
  }

  if (posX - radius <= 0) {
    posX = 0 + radius;
  }

  if (posY - radius <= 0) {
    posY = 0 + radius;
  }

  if (
    (arrayTouch[0] == 39 || arrayTouch[0] == 38) &&
    (arrayTouch[1] == 38 || arrayTouch[1] == 39)
  ) {
    posX += speedMove;
    posY -= speedMove;
    shadowOffsetX =- shadowOffset;
    shadowOffsetY = shadowOffset; 
  } else if (arrayTouch[0] == 39) {
    posX += speedMove;
    shadowOffsetX =- shadowOffset;
  } else if (arrayTouch[0] == 38) {
    posY -= speedMove;
    shadowOffsetY = shadowOffset;
  }

  if (
    (arrayTouch[0] == 39 || arrayTouch[0] == 40) &&
    (arrayTouch[1] == 40 || arrayTouch[1] == 39)
  ) {
    posX += speedMove;
    posY += speedMove;
   console.log("ici");
    shadowOffsetX =- shadowOffset;
    shadowOffsetY =- shadowOffset; 
  } else if (arrayTouch[0] == 39) {
    console.log('ici2');
    posX += speedMove;
    shadowOffsetX =- shadowOffset;
  } else if (arrayTouch[0] == 40) {
    posY += speedMove;
    console.log("ici3")
    shadowOffsetY = shadowOffset;
  }

  if (
    (arrayTouch[0] == 37 || arrayTouch[0] == 40) &&
    (arrayTouch[1] == 40 || arrayTouch[1] == 37)
  ) {
    posX -= speedMove;
    posY += speedMove;

    shadowOffsetX = shadowOffset;
    shadowOffsetY =- shadowOffset; 
  } else if (arrayTouch[0] == 37) {
    posX -= speedMove;
    shadowOffsetX = shadowOffset;
  } else if (arrayTouch[0] == 40) {
    posY += speedMove;
    shadowOffsetY =- shadowOffset;
  }

  if (
    (arrayTouch[0] == 37 || arrayTouch[0] == 38) &&
    (arrayTouch[1] == 38 || arrayTouch[1] == 37)
  ) {
    posX -= speedMove;
    posY -= speedMove;
    shadowOffsetX = shadowOffset;
    shadowOffsetY = shadowOffset; 
  } else if (arrayTouch[0] == 37) {
    posX -= speedMove;
    shadowOffsetX = shadowOffset;
  } else if (arrayTouch[0] == 38) {
    posY -= speedMove;
    shadowOffsetY = shadowOffset;
  }

  draw(posX, posY, shadowOffsetX, shadowOffsetY);
});

setInterval(() => {
 
  switch (arrayTouch[0]) {
    case 40:
      event1();
      break;
    case 38:
      event2();
      break;
    case 37:
      event3();
      break;
    case 39:
      event4();
      break;
  }
}, 10);

window.addEventListener("keyup", (e) => {
  const keyCode = e.keyCode;
  const indexTouch = arrayTouch.findIndex((x) => x === keyCode);
  arrayTouch.splice(indexTouch, 1);
  client.shadowOffsetX = 0;
  client.shadowOffsetY = 0;
  socket.emit("draw", client);
});
