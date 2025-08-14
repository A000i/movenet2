let detector;

async function init() {
  const model = poseDetection.SupportedModels.MoveNet;
  const detectorConfig = {
    modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
    enableTracking: true
  };
  detector = await poseDetection.createDetector(model, detectorConfig);
}

// 複数人用の骨格ライン
const bodyLines = [
  [0, 1], [1, 3], [0, 2], [2, 4],     // 顔まわり
  [5, 7], [7, 9],                     // 左腕
  [6, 8], [8, 10],                    // 右腕
  [5, 6],                             // 肩
  [5, 11], [6, 12], [11, 12],         // 胴体
  [11, 13], [13, 15],                 // 左脚
  [12, 14], [14, 16]                  // 右脚
];

function drawBodyLines(keypoints, ctx) {
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
  ctx.lineWidth = 4;

  for (const [startIdx, endIdx] of bodyLines) {
    const kp1 = keypoints[startIdx];
    const kp2 = keypoints[endIdx];

    if (kp1.score > 0.4 && kp2.score > 0.4) {
      ctx.beginPath();
      ctx.moveTo(kp1.x, kp1.y);
      ctx.lineTo(kp2.x, kp2.y);
      ctx.stroke();
    }
  }
}

function drawKeypoints(keypoints, ctx) {
  ctx.fillStyle = "red";
  for (const kp of keypoints) {
    if (kp.score > 0.4) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

document.getElementById('videoUpload').addEventListener('change', async (event) => {
  const videoFile = event.target.files[0];
  if (!videoFile) return;

  const video = document.getElementById('video');
  const canvas = document.getElementById('output');
  const ctx = canvas.getContext('2d');

  video.src = URL.createObjectURL(videoFile);
  await video.play();

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  async function poseDetectionFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const poses = await detector.estimatePoses(video);

    for (const pose of poses) {
      if (pose.keypoints) {
        drawKeypoints(pose.keypoints, ctx);
        drawBodyLines(pose.keypoints, ctx);
      }
    }

    requestAnimationFrame(poseDetectionFrame);
  }

  poseDetectionFrame();
});

init();