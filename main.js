let localStream; //local camera and video feed && mic audio
let remoteStream; //once connected to the other user it will be that user remote video and audio data
let peerConnection; //manages the offer

let app_id = "8ef820e2fca3423da7f380f5d2341a8a"; //from Agora App id
let token = null;
let uid = String(Math.floor(Math.random() * 10000)); //how we identify who is you or howmany users in the channel

let client; //will be used in logging in
let channel; //will be the room like that 2 users can join

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
  channel = client.createChannel("main");
  await channel.join();

  //if someone calls joind trigger
  channel.on("MemberJoined", handleUserJoined);

  //need response to a message
  client.on("MessageFromPeer", handleMessageFromPeer);

  //request permission to access camera feed
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  document.getElementById("user1").srcObject = localStream;
};

let handleUserJoined = async (MemberId) => {
  console.log("New user joined", MemberId);
  createOffer(MemberId); //pass
};

let handleMessageFromPeer = async (message, MemberId) => {
  console.log('Message: ', message.text);
};

//function to create offer
let createOffer = async (MemberId) => {
  //setting up the peer connection
  peerConnection = new RTCPeerConnection(servers);

  // set up media data and add the data to it after/later
  remoteStream = new MediaStream();
  document.getElementById("user2").srcObject = remoteStream;

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
      console.log("New candidate: ", event.candidate);
    }
  };

  //create the actual offer
  let offer = await peerConnection.createOffer(); //each peercon has an offer/ans
  await peerConnection.setLocalDescription(offer);

  console.log("Offer: ", offer);
  client.sendMessageToPeer({ text: "Halooo" }, MemberId); //send a message to that MemberId
};

cam();
