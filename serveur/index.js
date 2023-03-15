const app = require("express")();
const express = require("express");
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const fs = require("fs");
const { dirname } = require("path");

app.use(express.static(path.join(__dirname + "/../frontend/assets")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + '/../frontend/index.html'));
});

let clients = [];

class newPlayer {
  constructor(id) {
    this.id = id;
    this.x = Math.random() * 500;
    this.y = Math.random() * 500;
  }
}

io.on("connection", (socket) => {
  console.log("nouvelle connection");

  clients.push(new newPlayer(socket.id));
  
  io.emit("connection", clients);

  socket.on("disconnect", (e) => {
    console.log("Déconnection");
    const idDisconnect = clients.findIndex((x) => x.id === socket.id);
    clients.splice(idDisconnect,1);
    io.emit("connection", clients);
  });
});



http.listen(3000, function () {
  console.log("Serveur actif sur http://localhost:3000");
});
