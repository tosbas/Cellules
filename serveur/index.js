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

class newPlayer {
  constructor(id) {
    this.id = id;
    this.x = Math.random() * 500;
    this.y = Math.random() * 500;
    this.shadowOffsetX = 0;
    this.shadowOffsetY = 0;
  }
}

io.on("connection", (socket) => {
  console.log("nouvelle connection");
    clients.push(new newPlayer(socket.id));
    io.emit("connection", clients);


  socket.on("disconnect", (e) => {
    console.log("Déconnection");
    const indexClient = searchIndexClient(socket.id);
    clients.splice(indexClient, 1);
    io.emit("connection", clients);
  });

  socket.on("draw", (e) => {
    const indexClient = searchIndexClient(socket.id);
    clients[indexClient].x = e.x;
    clients[indexClient].y = e.y;
    clients[indexClient].shadowOffsetX = e.shadowOffsetX;
    clients[indexClient].shadowOffsetY = e.shadowOffsetY;
    io.emit("move", clients[indexClient]);
  });
});

/**
 * Search client by socket id in array clients
 * @param string id
 * @returns index of Client
 */
const searchIndexClient = (id) => {
  const indexClient = clients.findIndex((x) => x.id === id);

  return indexClient;
};

http.listen(3000, function () {
  console.log("Serveur actif sur http://localhost:3000");
});
