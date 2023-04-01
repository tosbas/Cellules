const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 600;

// Web socket event
const socket = io();

// all clients
let clients = [];

/**
 * bottom
 */
const event1 = () => {
  let event1 = new KeyboardEvent("keydown", {
    keyCode: 40,
    repeat: true,
  });
  window.dispatchEvent(event1);
};

/**
 * Right
 */
const event2 = () => {
  let event2 = new KeyboardEvent("keydown", {
    keyCode: 38,
    repeat: true,
  });
  window.dispatchEvent(event2);
};

/**
 * Left
 */
const event3 = () => {
  let event3 = new KeyboardEvent("keydown", {
    keyCode: 37,
    repeat: true,
  });
  window.dispatchEvent(event3);
};

/**
 * Top
 */
const event4 = () => {
  let event4 = new KeyboardEvent("keydown", {
    keyCode: 39,
    repeat: true,
  });
  window.dispatchEvent(event4);
};

//The client
let client = undefined;

//Position in x and y
let posX = undefined;
let posY = undefined;

//Movement speed
const speedMove = 0.5;

//Radius
const radius = 10;

//Shadow in x and y, blur, size and color
let shadowOffsetX = undefined;
let shadowOffsetY = undefined;
const shadowOffset = 10;
const shadowBlur = 10;
const shadowColor = "red";

/**
 * As soon as a connection is detected by the backend it sends back to the frontend an array containing all the customers, once received,
 * browses the table to display the cells of the players and creates a cell for each customer,
 * have recovered the customer at the same time to differentiate it from others
 */
socket.on("connection", (e) => {
  document.querySelector("#name").innerHTML = socket.id;
  //Empty the array containing all customers
  clients = [];

  //Iterates through the array coming from the server
  e.forEach((element) => {
    cellule(element.x, element.y, element.id);
    const client = {
      x: element.x,
      y: element.y,
      id: element.id,
      shadowOffsetX: element.shadowOffsetX,
      shadowOffsetY: element.shadowOffsetY,
    };
    //Pushes each cell object into the "customers" array
    clients.push(client);
  });

  //Get client index, by socket.id
  const indexClient = searchIndexClient(socket.id);

  //"Client" now contains the player
  client = clients[indexClient];

  /*posX and posY become equal to the value of the position x, y of the client
   *and shadowOffsetX and shadowOffsetY to the value of the shadow in x and y of the client
   */
  posX = client.x;
  posY = client.y;
  shadowOffsetX = client.shadowOffsetX;
  shadowOffsetY = client.shadowOffsetY;
});

//When a client moves, it sends a "move" event, which allows the real-time positions of the players to be updated on the client.
socket.on("move", (e) => {
  //Recovery of the player who issued the event
  const indexClient = searchIndexClient(e.id);

  //Recovery of the player who emitted the event by his index and updates the positions and the shadow in the "array" customers
  clients[indexClient].x = e.x;
  clients[indexClient].y = e.y;
  clients[indexClient].shadowOffsetX = e.shadowOffsetX;
  clients[indexClient].shadowOffsetY = e.shadowOffsetY;
});

socket.on("disconnect", () => {
  console.log(socket.id);
});

/**
 * Function used to send the "client" object to the backend with in an event named "draw", 
 * updates the position in x and y, and its shadow in x and y
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
 * Creating a cell
 * @param int x the position in x
 * @param int y the position in y
 * @param string his id
 * @param int shadowOffsetX The shadow in x
 * @param int shadowOffsetY The shadow in y
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

/**
 *Allows you to continuously clean the canvas, and browse the "arrayTouch" array to draw all the cells
 */
const anim = () => {
  //Clean the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //The function will call itself
  requestAnimationFrame(anim);
  //Iterates through the array "clients" and draws a cell for each cell stored in the array
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

//Call of the function
anim();

/**
 * Search client by id in array "client"
 * @param string id
 * @returns index of Client
 */
const searchIndexClient = (id) => {
  const indexClient = clients.findIndex((x) => x.id === id);

  return indexClient;
};

//Arrray which will contain the pressed keys
let arrayTouch = [];

//Event when a key is pressed
window.addEventListener("keydown", (e) => {
  //Reset shadow in x and y
  shadowOffsetX = 0;
  shadowOffsetY = 0;

  //Get the code of the key pressed
  const keycode = e.keyCode;

  //Pushes the key code into the "arrayTouch" array
  arrayTouch.push(keycode);

  //Purge duplicates in the array "arrayTouch"
  arrayTouch = arrayTouch.filter((x, i, a) => a.indexOf(x) == i);

  //Detect cell position to avoid canvas overflow
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

  /** 
    Detects the keys contained in the "arrayTouch" array, 
    adjusts the x and y position of the cell, and its shadow
  */
  if (
    (arrayTouch[0] == 39 || arrayTouch[0] == 38) &&
    (arrayTouch[1] == 38 || arrayTouch[1] == 39)
  ) {
    posX += speedMove;
    posY -= speedMove;
    shadowOffsetX = -shadowOffset;
    shadowOffsetY = shadowOffset;
  } else if (arrayTouch[0] == 39) {
    posX += speedMove;
    shadowOffsetX = -shadowOffset;
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
    shadowOffsetX = -shadowOffset;
    shadowOffsetY = -shadowOffset;
  } else if (arrayTouch[0] == 39) {
    console.log("ici2");
    posX += speedMove;
    shadowOffsetX = -shadowOffset;
  } else if (arrayTouch[0] == 40) {
    posY += speedMove;
    console.log("ici3");
    shadowOffsetY = shadowOffset;
  }

  if (
    (arrayTouch[0] == 37 || arrayTouch[0] == 40) &&
    (arrayTouch[1] == 40 || arrayTouch[1] == 37)
  ) {
    posX -= speedMove;
    posY += speedMove;
    shadowOffsetX = shadowOffset;
    shadowOffsetY = -shadowOffset;
  } else if (arrayTouch[0] == 37) {
    posX -= speedMove;
    shadowOffsetX = shadowOffset;
  } else if (arrayTouch[0] == 40) {
    posY += speedMove;
    shadowOffsetY = -shadowOffset;
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

  //Calls the draw function with the new x and y position, and the cell shadow in x and y
  draw(posX, posY, shadowOffsetX, shadowOffsetY);
});

/**
 * Create a continuous listening on the pressed key, because during the diagonal movement,
 * if a key remains pressed, the keydown event stops, so to return to the keydown event,
 * I go through a custom event which allows me to return to the keydown
 * this is all in a setinterval to stay tuned
 */
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

//Events when a key is released
window.addEventListener("keyup", (e) => {
  //Get the code of the key released
  const keyCode = e.keyCode;
  //Look for the index of the released key in the array "arrayTouch"
  const indexTouch = arrayTouch.findIndex((x) => x === keyCode);
  //Remove the key by its index return by "indexTouch"
  arrayTouch.splice(indexTouch, 1);
  //Reset shadow in x and y
  client.shadowOffsetX = 0;
  client.shadowOffsetY = 0;
  //Sends the client object to the backend
  socket.emit("draw", client);
});
