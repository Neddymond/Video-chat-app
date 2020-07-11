let Peer = require("simple-peer");
let socket = io();
const video = document.querySelector("video");
const filter = document.querySelector("#filter");
const checkBox = document.querySelector("#theme");

let client = {};
let currentFilter;

/** Get stream */
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
.then((stream) => {
  socket.emit("NewClient");
  video.srcObject = stream;
  video.play();

  filter.addEventListener("change", (event) => {
    let currentFilter = event.target.value;
    video.style.filter = currentFilter;
    SendFilter(currentFilter);
    event.preventDefault();
  });

  /** Initialize a  peer */
  function InitPeer(type) {
    let peer = new Peer({ initiator: (type === "init")
      ? true
      : false, 
      stream,
      trickle: false }
    );

    // Create video on connection to stream
    peer.on("stream", function() {
      CreateVideo(stream);
    });

    peer.on("data", function(data) {
      let decodedData = new TextDecoder("utf-8").decode(data);
      let peervideo = document.querySelector("#peerDiv");
      peervideo.style.filter = decodedData;
    });

    return peer;
  };

  /** Remove video element when a client dosconnects. */
  function RemovePeer() {
    document.getElementById("peerVideo").remove();
    document.getElementById("muteText").remove();
    if (client.peer) {
        client.peer.destroy()
    }
  };

  /** For peer of type init */
  function MakePeer() {
    client.gotAnswer = false;
    let peer = InitPeer("init");
    peer.on("signal", function(data) {
      if (!client.gotAnswer) {
        socket.emit("Offer", data);
      }
    });

    client.peer = peer;
  };

  /** When we get an offer from a client, send them an answer. */
  const FrontAnswer = (offer) => {
    let peer = InitPeer("notInit");
    peer.on("signal", (data) => {
      socket.emit("Answer", data);
    });

    peer.signal(offer);
    client.peer = peer;
  };

  /** When we get an answer from the backend, set the client's "gotAnswer" variable to true. */
  const SignalAnswer = (answer) => {
    client.gotAnswer = true;
    let peer = client.peer;
    peer.signal(answer);
  };

  /** Create a video element */
  const CreateVideo = (stream) => {
    let video = document.createElement("video");
    video.id = "peerVideo";
    video.srcObject = stream;
    video.class = "embed-responsive-item";
    document.querySelector("#peerDiv").appendChild(video);
    video.play();
    setTimeout(() => SendFilter(currentFilter), 500);
  };

  const sessionActive = () => {
    document.write("Session is active. Please come back later.");
  };

  function SendFilter(filter) {
    if (client.peer) {
      client.peer.send(filter);
    }
  };

  /** Listen for events */
  socket.on("CreatePeer", MakePeer);
  socket.on("BackOffer", FrontAnswer);
  socket.on("BackAnswer", SignalAnswer);
  socket.on("SessionActive", sessionActive);
  socket.on("Disconnect", RemovePeer);
})
.catch((err) => document.write(err));

checkBox.addEventListener("click", () => {
  checkBox.checked === true
    ? document.body.style.backgroundColor = "#212529"
    : document.body.style.backgroundColor = "#fff"
});