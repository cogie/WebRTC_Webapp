let localStream; //local camera and video feed && mic audio
let remoteStream; //once connected to the other user it will be that user remote video and audio data
let peerConnection; //manages the offer

let app_id = "8ef820e2fca3423da7f380f5d2341a8a"; //from Agora App id
let token = null;
let uid = String(Math.floor(Math.random() * 10000)); //how we identify who is you or howmany users in the channel

let client; //will be used in logging in
let channel; //will be the room like that 2 users can join

let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get("room");

//verify if users has a rooms ID if none redirect to lobby page
if (!roomId) {
  window.location = "lobby.html";
}

//setup ice server and pass to rtcPeercon
const servers = {
  iceServer: [
    {
      urls: ["stun:stun.l.google.com:19302, stun:stun2.l.google.com:19302"],
    },
  ],
};

//function to ask a permission to the users camera
let cam = async () => {
  client = await AgoraRTM.createInstance(app_id);

  //login
  await client.login({ uid, token });

  //index.htm?room=87723 create channel
  channel = client.createChannel(roomId);
  await channel.join();

  //if someone calls joind trigger
  channel.on("MemberJoined", handleUserJoined);

  //if users leave
  channel.on("MemberLeft", handleUserleft);

  //need response to a message
  client.on("MessageFromPeer", handleMessageFromPeer);

  //request permission to access camera feed
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  document.getElementById("user1").srcObject = localStream;
};

//handle users left
let handleUserleft = async (MemberId) => {
  document.getElementById("user2").style.display = "none"; //if users leave it will hide it
};

// let handleMessageFromPeer = async (message, MemberId) => {
//   message = JSON.parse(message.text); //parse the msg

//   //process the offer/asnwer
//   if (message.type === "offer") {
//     createAnswer(MemberId, message.offer);
//   }

//   if (message.type === "answer") {
//     adddAnswer(message.answer);
//   }

//   if (message.type === "candidate") {
//     if (peerConnection) {
//       peerConnection.addIceCandidate(message.candidate);
//     }
//   }

//   console.log("Message: ", message);
// };

let handleUserJoined = async (MemberId) => {
  console.log("New user joined", MemberId);
  createOffer(MemberId); //pass
};

let createPeerConnection = async (MemberId) => {
  //setting up the peer connection
  peerConnection = new RTCPeerConnection(servers);

  // set up media data and add the data to it after/later
  remoteStream = new MediaStream();
  document.getElementById("user2").srcObject = remoteStream;
  document.getElementById("user2").style.display = "block"; //block the user 2 if its not active

  //to prevent a restart
  if (!localStream) {
    //request permission to access camera feed
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    document.getElementById("user1").srcObject = localStream;
  }

  //loop through single tracks and aad
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  //event listner
  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  //event listner evry single time we create an icecandidate
  peerConnection.onicecandidate = async (event) => {
    //check if theres candidate
    if (event.candidate) {
      client.sendMessageToPeer(
        {
          text: JSON.stringify({
            type: "candidate",
            candidate: event.candidate,
          }),
        },
        MemberId
      );
    }
  };
};

//function to create offer
let createOffer = async (MemberId) => {
  //call this function to handle the offers
  await createPeerConnection(MemberId);

  //create the actual offer
  let offer = await peerConnection.createOffer(); //each peercon has an offer/ans
  await peerConnection.setLocalDescription(offer);

  console.log("Offer: ", offer);

  //SDP
  client.sendMessageToPeer(
    { text: JSON.stringify({ type: "offer", offer: offer }) },
    MemberId
  ); //send a message to that MemberId
};

//function to respond to offer. "answer"
let createAnswer = async (MemberId, offer) => {
  //call this function to handle the answers
  await createPeerConnection(MemberId);

  //set remoteDescription
  await peerConnection.setRemoteDescription(offer);

  let answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  //SDP
  client.sendMessageToPeer(
    { text: JSON.stringify({ type: "answer", answer: answer }) },
    MemberId
  ); //send a answer to that MemberId
};

//
let addAnswer = async (answer) => {
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(answer);
  }
};

let leaveChannel = async () => {
  await channel.leave();
  await client.logout();
};

let handleMessageFromPeer = async (message, MemberId) => {
  message = JSON.parse(message.text);

  if (message.type === "offer") {
    createAnswer(MemberId, message.offer);
  }

  if (message.type === "answer") {
    addAnswer(message.answer);
  }

  if (message.type === "candidate") {
    if (peerConnection) {
      peerConnection.addIceCandidate(message.candidate);
    }
  }
};

//function for controls for camera
let toggleCamera = async () => {
  let videoTrack = localStream
    .getTracks()
    .find((track) => track.kind === "video");

  //if video track enable
  if (videoTrack.enabled) {
    videoTrack.enabled = false;
    document.getElementById("camera-btn").style.backgroundColor =
      "rgb(255, 80, 80)";
  } else {
    videoTrack.enabled = true;
    document.getElementById("camera-btn").style.backgroundColor =
      "rgb(179, 102, 249, .9)";
  }
};
//function for controls for audio
let toggleMic = async () => {
  let audioTrack = localStream
    .getTracks()
    .find((track) => track.kind === "audio");

  //if video track enable
  if (audioTrack.enabled) {
    audioTrack.enabled = false;
    document.getElementById("mic-btn").style.backgroundColor =
      "rgb(255, 80, 80)";
  } else {
    audioTrack.enabled = true;
    document.getElementById("mic-btn").style.backgroundColor =
      "rgb(179, 102, 249, .9)";
  }
};
//this handles when a client leave via exiting the tab
window.addEventListener("beforeunload", leaveChannel);

//for cammera
document.getElementById("camera-btn").addEventListener("click", toggleCamera);
document.getElementById("mic-btn").addEventListener("click", toggleMic);
cam();
