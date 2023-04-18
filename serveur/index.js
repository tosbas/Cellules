const app = require("express")();
const express = require("express");
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const fs = require("fs");

app.use(express.static(path.join(__dirname + "/../frontend/assets")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/../frontend/index.html"));
});

let clients = [];

const radius = 10;
const shadowOffset = 5;
const shadowBlur = 10;
let shadowOffsetX = 0;
let shadowOffsetY = 0;

class newPlayer {
  constructor(id) {
    this.id = id;
    this.x = Math.random() * 500;
    this.y = Math.random() * 500;
    this.vx = 0;
    this.vy = 0;
    this.speed = 0;
    this.acceleration = 0.01;
    this.deceleration = 0.01;
    this.shadowOffsetX = shadowOffsetX;
    this.shadowOffsetY = shadowOffsetY;
    this.shadowBlur = shadowBlur;
    this.radius = radius;
    this.shadowOffset = shadowOffset;
  }
}

io.on("connection", (socket) => {
  clients.push(new newPlayer(socket.id));
  io.emit("connection", clients);

  socket.on("disconnect", (e) => {
    const indexClient = searchIndexClient(socket.id);
    clients.splice(indexClient, 1);
    io.emit("connection", clients);
  });

  socket.on("draw", (e) => {
    const indexClient = searchIndexClient(socket.id);

    clients[indexClient].x = e.x;
    clients[indexClient].y = e.y;
    clients[indexClient].radius = radius;
    clients[indexClient].id = socket.id;
    clients[indexClient].vx = e.vx;
    clients[indexClient].vy = e.vy;
    clients[indexClient].shadowOffset = shadowOffset;
    clients[indexClient].shadowBlur = shadowBlur;
    clients[indexClient].shadowOffsetX = e.shadowOffsetX;
    clients[indexClient].shadowOffsetY = e.shadowOffsetY;
    io.emit("move", clients[indexClient]);
  });
});

// Search client by socket id in array clients
const searchIndexClient = (id) => {
  const indexClient = clients.findIndex((x) => x.id === id);

  return indexClient;
};

http.listen(3000, function () {
  console.log("Serveur actif sur http://localhost:3000");
});
