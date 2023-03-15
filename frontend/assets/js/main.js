const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

//Canvas style
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//Web socket event
const socket = io();

let clients = [];

socket.on("connection", (e) => {
  console.log("nouvelle connection");
  console.log(e);
  clients = [];
  e.forEach((element) => {
    rect(element.x, element.y, element.id);
    const client = {x:element.x, y:element.y, id:element.id};
    clients.push(client);
  });
});

socket.on("connect", () => {
  document.querySelector("#name").innerHTML = socket.id
});

socket.on("disconnect", () => {
  console.log(socket.id);
});

let painting = false;

const startPosition = (e) => {
  painting = true;
  draw(e);
};

let posX = 0;
let posY = 0;
const rectWidth = 100;
const rectHeight = 100;

// dessiner
const draw = (e) => {
  if (painting == false) return;
  posX = e.offsetX - rectWidth / 2;
  posY = e.offsetY - rectHeight / 2;
  clients.map(element => {element.x = posX, element.y = posY});
};

const rect = (x, y, id) => {
  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.fillRect(x, y, rectWidth, rectHeight);
  ctx.fillText(`Id : ${id}`, x, y);
  ctx.fill();
};

function anim() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  requestAnimationFrame(anim);
  clients.forEach(element =>{
    rect(element.x, element.y, element.id);
  })
}

anim();

const endPosition = (e) => {
  painting = false;
  ctx.beginPath();
};

canvas.addEventListener("mousedown", startPosition);

canvas.addEventListener("mousemove", draw);

canvas.addEventListener("mouseup", endPosition);
