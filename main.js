let localStream; //local camera and video feed && mic audio
let remoteStream; //once connected to the other user it will be that user remote video and audio data
let peerConnection; //manages the offer

const servers = {
  iceServer: [
    {
      urls: ["stun:stun.l.google.com:19302, stun:stun2.l.google.com:19302"],
    },
  ],
};

//function to ask a permission to the users camera
let cam = async () => {
  //request permission to access camera feed
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  document.getElementById("user1").srcObject = localStream;
  createOffer();
};

//function to create offer
let createOffer = async () => {
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

  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  console.log("Offer: ", offer);
};

cam();
