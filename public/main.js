let Peer = require("simple-peer");
let socket = io();
const video = document.querySelector("video");
const filter = document.querySelector("#filter");

let client = {};
let currentFilter;

/** Get stream */
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
.then((stream) => {
  socket.emit("NewClient");
  video.srcObject = stream;
  video.play();

  filter.addEventListener("change", (event) => {
    let changedFilter = event.target.value;
    video.style.filter = changedFilter;
    event.preventDefault();
  })

  /** Initialize a  peer */
  const InitPeer = (type) => {
    let peer = new Peer({ initiator: (type === "init")
      ? true
      : false, 
      stream: stream,
      trickle: false }
    );

    // Create video on connection to stream
    peer.on("stream", () => {
      CreateVideo(stream);
    });

    // Close and destroy peer on event close
    peer.on("close", () => {
      peer.destroy();
    });

    return peer;
  };

  /** Remove video element when a client dosconnects. */
  const RemoveVideo = () => {
    document.getElementById("peerVideo").remove();
  };

  /** For peer of type init */
  const MakePeer = () => {
    client.gotAnswer = false;
    let peer = InitPeer("init");
    peer.on("signal", (data) => {
      if (!client.gotAnswer) {
        socket.emit("Offer", data);
      }
    });

    client.peer = peer;
  };

  /** When we get an offer from a client, send them an answer. */
  const FrontAnswer = (offer) => {
     let peer = InitPeer("initPeer");
     peer.on("signal", (data) => {
       socket.emit("Answer", data);
     });

     peer.signal(offer);
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
  };

  const sessionActive = () => {
    document.write("Session is active. Please come back later.");
  };

  /** Listen for events */
  socket.on("CreatePeer", MakePeer);
  socket.on("BackOffer", FrontAnswer);
  socket.on("BackAnswer", SignalAnswer);
  socket.on("SessionActive", sessionActive);
  socket.on("RemoveVideo", RemoveVideo);
})
.catch((err) => document.write(err));
