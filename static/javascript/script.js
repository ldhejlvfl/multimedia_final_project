const songTable = document.getElementById('song_table');
const lyricsDisplay = document.querySelector('.lyrics p');
const audioPlayer = document.getElementById('audio_player');
const music_pause = document.getElementById('music_pause');
const localAudio = document.getElementById('local_audio');
const remoteAudio = document.getElementById('remote_audio');

// 監聽表格中文字的點擊事件
songTable.addEventListener('click', function(event) {
    const target = event.target;
    if (target.tagName === 'TD') { // click 'td' element
        const song = target.getAttribute('song_number'); // 獲取點擊的歌曲名稱
        switch (song) {
            case 'song1':
                loadLyricsAndAudio('Spiral', 'static/songs/spiral.mp3', 'static/lyrics/spiral.txt');
                break;
            case 'song2':
                loadLyricsAndAudio('Fate', 'static/songs/gidle_fate.mp3', 'static/lyrics/gidle_fate_lyrics.txt');
                break;
            case 'song3':
                loadLyricsAndAudio('紙一重', 'static/songs/紙一重.mp3', 'static/lyrics/紙一重.txt');
                break;
            case 'song4':
                loadLyricsAndAudio('apocalypse', 'static/songs/apocalypse.mp3', 'static/lyrics/apocalypse.txt');
                break;
            case 'song5':
                loadLyricsAndAudio('heikousen', 'static/songs/heikousen.mp3', 'static/lyrics/heikousen.txt');
                break;
            case 'song6':
                loadLyricsAndAudio('籠の中に鳥', 'static/songs/籠の中に鳥.mp3', 'static/lyrics/籠の中に鳥.txt');
                break;
            default:
                break;
        }
    }
});

let isMusicPlaying = true;

function loadLyricsAndAudio(songName, audioSrc, lyricsSrc) {
    audioPlayer.src = audioSrc;

    // 使用Ajax加載歌詞文件
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                // 成功加載歌詞文件，將歌詞顯示在 lyricsDisplay 區域
                const lyricsLines = xhr.responseText.split('\n'); // 拆分歌詞成行
                lyricsDisplay.innerHTML = ''; // 清空歌詞顯示區域
                // 將每一行歌詞作為一個段落添加到歌詞顯示區域
                lyricsLines.forEach(function(line) {
                    const paragraph = document.createElement('p');
                    paragraph.textContent = line;
                    lyricsDisplay.appendChild(paragraph);
                });
            } else {
                // 加載歌詞文件失敗
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
let ws = new WebSocket('ws://localhost:3000');

// 開啟後執行的動作，指定一個 function 會在連結 WebSocket 後執行
ws.onopen = () => {
    console.log('open connection');
}

// 關閉後執行的動作，指定一個 function 會在連結中斷後執行
ws.onclose = () => {
    console.log('close connection');
}

// 获取本地音频
async function getLocalStream() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        //測試是否讀的到聲音
        localAudio.srcObject = stream;
        return stream;
    } catch (err) {
        console.error('Error accessing media devices.', err);
    }
}

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302']
        }
    ]
};
const peerConnection = new RTCPeerConnection(servers);

peerConnection.ontrack = (event) => {
    document.getElementById('remote_audio').srcObject = event.streams[0];
};

// 處理 ICE 候選
peerConnection.onicecandidate = event => {
    if (event.candidate) {
        ws.send(JSON.stringify({ 'candidate': event.candidate }));
    }
};

// 處理remote_audio
peerConnection.ontrack = event => {
    const remoteAudio = document.getElementById('remote_audio');
    remoteAudio.srcObject = event.streams[0];
};

// RTCPeerConnection
async function startCall() {
    const localStream = await getLocalStream();
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // test message
    // set message handler first
    // ws.onmessage = event => {
    //     console.log(event)
    // }

    // create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // 利用websocket傳送sdp offer
    ws.send(JSON.stringify({ 'sdp': peerConnection.localDescription }));
    
}

ws.onmessage = async (event) => {
    const reader = new FileReader();
    reader.onload = async () => {
        const data = JSON.parse(reader.result);
        console.log('Received data:', data);
        if (data.sdp) {
            const remoteDescription = new RTCSessionDescription(data.sdp);
            console.log('Remote SDP:', remoteDescription);
            if (remoteDescription.type === 'offer') {
                await peerConnection.setRemoteDescription(remoteDescription);
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                ws.send(JSON.stringify({ sdp: peerConnection.localDescription }));
                console.log('Sent answer:', peerConnection.localDescription);
            } else if (remoteDescription.type === 'answer') {
                // Only set the remote description if the connection is in the "have-local-offer" state
                if (peerConnection.signalingState === 'have-local-offer') {
                    await peerConnection.setRemoteDescription(remoteDescription);
                    console.log('Set remote answer:', remoteDescription);
                } else {
                    console.log(`Ignoring answer because signalingState is not 'have-local-offer', current state: ${peerConnection.signalingState}`);
                }
            }
        } else if (data.candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            console.log('Added ICE candidate:', data.candidate);
        }
    };
    reader.readAsText(event.data);
};

// 按下搶麥按鈕
document.querySelector('.grab_button').addEventListener('click', startCall);
