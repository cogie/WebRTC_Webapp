let localStream; //local camera and video feed && mic audio
let remoteStream; //once connected to the other user it will be that user remote video and audio data
let peerConnection; //manages the offer

let cam = async () => {
  //request permission to access camera feed
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  document.getElementById("user1").srcObject = localStream;
  createOffer();
};

let createOffer = async () => {
  peerConnection = new RTCPeerConnection();

  remoteStream = new MediaStream();
  document.getElementById("user2").srcObject = remoteStream;

  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  console.log("Offer: ", offer);
};

cam();
