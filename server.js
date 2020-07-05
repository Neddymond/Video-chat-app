const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;

app.use(express.static(`${__dirname}/public`));

let clients = 0;

io.on("connection", (socket) => {
  socket.on("NewClient", ()=> {
    if (clients < 2) {
      if (clients === 1) {
        this.emit("CreatePeer");
      }
    } else {
      this.emit("SessionActive");
    }

    clients++;
  });

  socket.on("Disconnection", Disconnect);
  socket.on("Offer", SendOffer);
  socket.on("Answer", SendAnswer);
});

const Disconnect = () => {
  if (clients > 0) {
    clients--;
    this.broadcast("RemoveVideo");
  };
};

const SendOffer = (offer) => {
  this.broadcast.emit("BackOffer", offer);
};

const SendAnswer = (data) => {
  this.broadcast.emit("BackAnswer", data);
};

http.listen(port, () => console.log(`Server active on port ${port}`));