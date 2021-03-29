// Buttons
const video_element = document.querySelector('video');
const start_btn = document.querySelector('#startBtn');
const stop_btn = document.querySelector('#stopBtn');
const select_video_btn = document.querySelector('#videoSelectBtn');

//Modules
const { desktopCapturer, remote, dialog } = require('electron');
const { writeFile } = require('original-fs');
const { Menu } = remote;

let mediaRecorder;
let recorded_chunks = [];

// Get the available video sources
const getVideoSources = async () => {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(src => ({
            label: src.name,
            click: () => selectSource(src),
        }))
    );

    videoOptionsMenu.popup();
}

const selectSource = async source => {
    select_video_btn.innerText = source.name;

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id,
            }
        }
    }

    // Create a Stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Preview the source in the video element
    video_element.srcObject = stream;
    video_element.play();

    //Create the Media Recorder
    const options = { mimeType: 'video/webm, codecs=vp9'};
    mediaRecorder = new MediaRecorder(stream, options);

    // Register Event Handlers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

// Captures all recorded chunks
const handleDataAvailable = e => {
    console.log('data available');
    recorded_chunks.push(e.data);
}

// Saves the video file on stop
const handleStop = async e => {
    const blob = new Blob(recorded_chunks, {
        type: 'video/webm; codecs=vp9'
    });

    const buffer = Buffer.from(await blob.arrayBuffer());
    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `vid-${Date.now()}.webm`
    });

    writeFile(filePath, buffer, 
        () => console.log('Video saved successfully!'));
}
// Buttons Assignments
select_video_btn.onclick = getVideoSources;
start_btn.onclick = mediaRecorder.start;
