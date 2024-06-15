const songTable = document.getElementById('song_table');
const lyricsDisplay = document.querySelector('.lyrics p');
const audioPlayer = document.getElementById('audio_player');
const music_pause = document.getElementById('music_pause');
const localAudio = document.getElementById('local_audio');
const remoteAudio = document.getElementById('remote_audio');

// 监听表格中文字的点击事件
songTable.addEventListener('click', function(event) {
    const target = event.target;
    if (target.tagName === 'TD') { // click 'td' element
        const song = target.getAttribute('song_number'); // 获取点击的歌曲名称
        switch (song) {
            case 'song1':
                loadLyricsAndAudio('Spiral', 'static/songs/spiral.mp3', 'static/lyrics/spiral.txt');
                break;
            case 'song2':
                loadLyricsAndAudio('Fate', 'static/songs/gidle_fate.mp3', 'static/lyrics/gidle_fate_lyrics.txt');
                break;
            case 'song3':
                loadLyricsAndAudio('纸一重', 'static/songs/纸一重.mp3', 'static/lyrics/纸一重.txt');
                break;
            case 'song4':
                loadLyricsAndAudio('apocalypse', 'static/songs/apocalypse.mp3', 'static/lyrics/apocalypse.txt');
                break;
            case 'song5':
                loadLyricsAndAudio('heikousen', 'static/songs/heikousen.mp3', 'static/lyrics/heikousen.txt');
                break;
            case 'song6':
                loadLyricsAndAudio('笼の中に鸟', 'static/songs/笼の中に鸟.mp3', 'static/lyrics/笼の中に鸟.txt');
                break;
            default:
                break;
        }
    }
});

let isMusicPlaying = true;

function loadLyricsAndAudio(songName, audioSrc, lyricsSrc) {
    audioPlayer.src = audioSrc;

    // 使用Ajax加载歌词文件
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                // 成功加载歌词文件，将歌词显示在 lyricsDisplay 区域
                const lyricsLines = xhr.responseText.split('\n'); // 拆分歌词成行
                lyricsDisplay.innerHTML = ''; // 清空歌词显示区域
                // 将每一行歌词作为一个段落添加到歌词显示区域
                lyricsLines.forEach(function(line) {
                    const paragraph = document.createElement('p');
                    paragraph.textContent = line;
                    lyricsDisplay.appendChild(paragraph);
                });
            } else {
                // 加载歌词文件失败
                console.error('Failed to load lyrics.');
            }
        }
    };
    xhr.open('GET', lyricsSrc, true);
    xhr.send();
}

music_pause.addEventListener('click', function() {
    if (isMusicPlaying) {
        audioPlayer.pause();
        isMusicPlaying = false;
    } else {
        audioPlayer.play();
        isMusicPlaying = true;
    }
});




// new
let localStream;
let remoteStream;
let peerConnection;

let servers = {
    iceServers:[
        {
            urls:['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302']
        }
    ]
}

let init = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({video:false, audio:true})

    //remoteStream = new MediaStream()

    //document.getElementById('peer_A').srcObject = localStream
    //document.getElementById('peer_B').srcObject = remoteStream
}

let createOffer = async () => {
    peerConnection = new RTCPeerConnection(servers)

    remoteStream = new MediaStream()
    document.getElementById('peer_B').srcObject = remoteStream

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = async (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if(event.candidate){
            document.getElementById('offer_sdp').value = JSON.stringify(peerConnection.localDescription)
        }
    }

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    document.getElementById('offer_sdp').value = JSON.stringify(offer)

}

let createAnswer = async () => {
    peerConnection = new RTCPeerConnection(servers)

    remoteStream = new MediaStream()
    document.getElementById('peer_B').srcObject = remoteStream

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = async (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if(event.candidate){
            document.getElementById('answer_sdp').value = JSON.stringify(peerConnection.localDescription)
        }
    }

    let offer = document.getElementById('offer_sdp').value
    if(!offer) return alert('Have to retrieve offer from Peer A first')

    offer = JSON.parse(offer)
    await peerConnection.setRemoteDescription(offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    document.getElementById('answer_sdp').value = JSON.stringify(answer)
}

let addAnswer = async () => {
    let answer = document.getElementById('answer_sdp').value
    if(!answer) return alert('Have to retrieve offer from Peer A first')

    answer = JSON.parse(answer)

    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }
}

init()

document.getElementById('create_offer').addEventListener('click', createOffer)
document.getElementById('create_answer').addEventListener('click', createAnswer)
document.getElementById('add_answer').addEventListener('click', addAnswer)
