// Use global TensorFlow.js and pose detection objects
const tf = window.tf;
const poseDetection = window.poseDetection;

// Global variables
let detector = null;
let isDetecting = false;
let videoElement = null;
let trainerVideoElement = null;
let canvas = null;
let ctx = null;
let animationFrameId = null;
let isTrainer = window.isTrainer || false;
let trainerPose = null;
let scoreCanvas = null;
let scoreCtx = null;
let currentScore = 0;
let targetScore = 0;
let lastUpdateTime = 0;
let recentScores = [];
const maxRecentScores = 5; // Reduced for more responsive scoring
let lastPoseTimestamp = 0;
const poseUpdateInterval = 50; // Update poses every 50ms for smoother detection
let currentMode = 'live'; // Add mode tracking
let resizeObserver = null; // Add ResizeObserver reference
let resizeListener = null; // Add resize listener reference

// Configuration for pose detection
const config = {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    enableSmoothing: true,
    minPoseScore: 0.25,
    maxPoses: 1
};

// Skeleton connections for drawing
const connections = [
    ['nose', 'left_eye'], ['nose', 'right_eye'],
    ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
    ['left_shoulder', 'right_shoulder'],
    ['left_shoulder', 'left_elbow'], ['right_shoulder', 'right_elbow'],
    ['left_elbow', 'left_wrist'], ['right_elbow', 'right_wrist'],
    ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
    ['left_hip', 'right_hip'],
    ['left_hip', 'left_knee'], ['right_hip', 'right_knee'],
    ['left_knee', 'left_ankle'], ['right_knee', 'right_ankle']
];

// Initialize pose detection
async function initializePoseDetection(video, container) {
    try {

        // Check if TensorFlow.js is loaded
        if (!window.tf) {
            throw new Error('TensorFlow.js is not loaded. Please wait for it to load or refresh the page.');
        }

        // Check if PoseDetection is loaded
        if (!window.poseDetection) {
            throw new Error('PoseDetection is not loaded. Please wait for it to load or refresh the page.');
        }

        if (!video) {
            throw new Error('Video element is required');
        }
        if (!container) {
            throw new Error('Container element is required');
        }

        // Set up mode change handler
        const modeSelect = document.getElementById('poseDetectionMode');
        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                currentMode = e.target.value;

            });
        }

        // Wait for video to be ready
        if (video.readyState < 2) {
            await new Promise((resolve) => {
                video.addEventListener('loadeddata', resolve, { once: true });
            });
        }

        videoElement = video;

        // Find trainer video element with specific selectors for your structure
        const trainerVideoSelectors = [
            '.trainer-video video.vid',
            '.trainer-video video',
            '.video-container.trainer-video video',
            'video.vid',
            '[data-trainer="true"] video',
            '.trainer video'
        ];

        for (const selector of trainerVideoSelectors) {
            const trainerVideo = document.querySelector(selector);
            if (trainerVideo && trainerVideo !== video) {
                trainerVideoElement = trainerVideo;

                // Wait for trainer video to be ready as well
                if (trainerVideo.readyState < 2) {
                    await new Promise((resolve) => {
                        trainerVideo.addEventListener('loadeddata', resolve, { once: true });
                        // Add timeout to avoid hanging
                        setTimeout(resolve, 2000);
                    });
                }
                break;
            }
        }

        // Also check if current video is the trainer based on container class
        if (!trainerVideoElement && video.closest('.trainer-video')) {
            isTrainer = true;
        }

        // Also check for trainer badge to identify trainer
        const trainerBadge = container.querySelector('.video-trainer-badge');
        if (trainerBadge && trainerBadge.textContent.toLowerCase().includes('trainer')) {
            isTrainer = true;
        }

        if (!trainerVideoElement && !isTrainer) {
            console.warn('No trainer video element found - pose comparison will be limited');
        }

        // Create canvas for pose overlay
        canvas = document.createElement('canvas');
        canvas.className = 'pose-canvas';

        // Create score canvas only for non-trainers
        if (isTrainer == false) {
            scoreCanvas = document.createElement('canvas');
            scoreCanvas.className = 'score-canvas';
            scoreCanvas.style.position = 'absolute';
            scoreCanvas.style.top = '10px';
            scoreCanvas.style.right = '10px';
            scoreCanvas.style.width = '120px';  // Base size
            scoreCanvas.style.height = '80px';  // Base size
            scoreCanvas.style.zIndex = '20';
            scoreCanvas.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            scoreCanvas.style.borderRadius = '10px';
            scoreCanvas.style.border = '2px solid #fff';
            scoreCanvas.style.transition = 'all 0.3s ease';
            container.appendChild(scoreCanvas);
            scoreCtx = scoreCanvas.getContext('2d');

            // Set initial canvas size
            updateScoreCanvasSize();

            // Add resize observer for responsive updates
            resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    if (entry.target === container) {
                        updateScoreCanvasSize();
                    }
                }
            });
            resizeObserver.observe(container);
        }

        // Position canvas absolutely over the video
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '10';

        container.appendChild(canvas);
        ctx = canvas.getContext('2d');

        // Load TensorFlow.js and PoseNet
        try {
            await tf.ready();
        } catch (error) {
            throw new Error('Failed to initialize TensorFlow.js: ' + error.message);
        }

        try {
            detector = await poseDetection.createDetector(
                poseDetection.SupportedModels.MoveNet,
                config
            );
        } catch (error) {
            throw new Error('Failed to create pose detector: ' + error.message);
        }

        // Initialize canvas size
        updateCanvasSize();

        // Add resize listener to update canvas size
        resizeListener = updateCanvasSize;
        window.addEventListener('resize', resizeListener);

        isDetecting = true;
        detectPose();

        return true;
    } catch (error) {
        console.error('Error initializing pose detection:', error);
        console.error('Error stack:', error.stack);
        // Clean up any partially initialized resources
        stopDetection();
        return false;
    }
}

// Update canvas size to match video dimensions
function updateCanvasSize() {
    if (!canvas || !videoElement) {
        return;
    }

    const container = canvas.parentElement;
    const containerRect = container.getBoundingClientRect();
    const videoRect = videoElement.getBoundingClientRect();

    // Set canvas size to match container
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;

    // Calculate scaling factors based on video dimensions
    const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
    const containerAspectRatio = containerRect.width / containerRect.height;

    let scaleX, scaleY, offsetX, offsetY;

    if (videoAspectRatio > containerAspectRatio) {
        // Video is wider than container
        scaleX = containerRect.width / videoElement.videoWidth;
        scaleY = scaleX;
        offsetX = 0;
        offsetY = (containerRect.height - videoElement.videoHeight * scaleY) / 2;
    } else {
        // Video is taller than container
        scaleY = containerRect.height / videoElement.videoHeight;
        scaleX = scaleY;
        offsetX = (containerRect.width - videoElement.videoWidth * scaleX) / 2;
        offsetY = 0;
    }

    // Store scaling and offset for coordinate conversion
    canvas.scaleX = scaleX;
    canvas.scaleY = scaleY;
    canvas.offsetX = offsetX;
    canvas.offsetY = offsetY;

}

// Update score canvas size based on container size
function updateScoreCanvasSize() {
    if (!scoreCanvas || !scoreCanvas.parentElement) return;

    const container = scoreCanvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calculate size based on container dimensions
    const baseSize = Math.min(containerWidth, containerHeight);
    const scoreSize = Math.max(80, Math.min(120, baseSize * 0.4)); // 40% of container size, min 80px, max 120px

    // Update canvas size
    scoreCanvas.width = scoreSize;
    scoreCanvas.height = scoreSize * 0.8; // Maintain aspect ratio

    // Update style
    scoreCanvas.style.width = `${scoreSize}px`;
    scoreCanvas.style.height = `${scoreSize * 0.8}px`;

    // Redraw if we have a current score
    if (currentScore !== undefined) {
        drawSpeedometer(currentScore);
    }
}

// Start pose detection
function startDetection() {
    if (!isDetecting) {
        isDetecting = true;
        detectPose();
    }
}

// Stop pose detection
function stopDetection() {
    isDetecting = false;

    // Cancel animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // Clear canvases
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (scoreCtx && scoreCanvas) {
        scoreCtx.clearRect(0, 0, scoreCanvas.width, scoreCanvas.height);
    }

    // Remove resize listener
    if (resizeListener) {
        window.removeEventListener('resize', resizeListener);
        resizeListener = null;
    }

    // Disconnect ResizeObserver
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }

    // Remove canvases from DOM
    if (canvas && canvas.parentElement) {
        canvas.parentElement.removeChild(canvas);
    }
    if (scoreCanvas && scoreCanvas.parentElement) {
        scoreCanvas.parentElement.removeChild(scoreCanvas);
    }

    // Clear references
    canvas = null;
    ctx = null;
    scoreCanvas = null;
    scoreCtx = null;
    videoElement = null;
    trainerVideoElement = null;
    detector = null;

}

// Normalize pose coordinates using improved method based on TensorFlow Move Mirror
function normalizePose(pose) {
    if (!pose || !pose.keypoints || pose.keypoints.length === 0) return null;

    // Find key reference points for normalization
    const leftShoulder = pose.keypoints.find(k => k.name === 'left_shoulder');
    const rightShoulder = pose.keypoints.find(k => k.name === 'right_shoulder');
    const leftHip = pose.keypoints.find(k => k.name === 'left_hip');
    const rightHip = pose.keypoints.find(k => k.name === 'right_hip');

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip ||
        leftShoulder.score < 0.2 || rightShoulder.score < 0.2 ||
        leftHip.score < 0.2 || rightHip.score < 0.2) {
        return null;
    }

    // Calculate torso bounding box for consistent normalization
    const torsoKeypoints = [leftShoulder, rightShoulder, leftHip, rightHip];
    const minX = Math.min(...torsoKeypoints.map(p => p.x));
    const maxX = Math.max(...torsoKeypoints.map(p => p.x));
    const minY = Math.min(...torsoKeypoints.map(p => p.y));
    const maxY = Math.max(...torsoKeypoints.map(p => p.y));

    // Calculate torso dimensions
    const torsoWidth = maxX - minX;
    const torsoHeight = maxY - minY;

    // Use the larger dimension as the scaling factor for consistent normalization
    const scalingFactor = Math.max(torsoWidth, torsoHeight);

    if (scalingFactor === 0) return null;

    // Calculate torso center
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Normalize all keypoints relative to torso center and scale
    const normalizedKeypoints = pose.keypoints.map(keypoint => ({
        ...keypoint,
        x: (keypoint.x - centerX) / scalingFactor,
        y: (keypoint.y - centerY) / scalingFactor
    }));

    return {
        keypoints: normalizedKeypoints,
        score: pose.score,
        scalingFactor: scalingFactor,
        center: { x: centerX, y: centerY }
    };
}

// Smooth score using simple moving average with less aggressive smoothing
function smoothScore(newScore) {
    recentScores.push(newScore);
    if (recentScores.length > maxRecentScores) {
        recentScores.shift();
    }

    // Simple average for more responsive scoring
    return recentScores.reduce((a, b) => a + b) / recentScores.length;
}

// Calculate similarity score using improved algorithm with cosine similarity approach
function calculatePoseSimilarity(pose1, pose2) {
    if (!pose1 || !pose2) {
        return 0;
    }

    // Normalize both poses
    const normalizedPose1 = normalizePose(pose1);
    const normalizedPose2 = normalizePose(pose2);

    if (!normalizedPose1 || !normalizedPose2) {
        return 0;
    }

    // Create feature vectors for comparison (similar to Move Mirror approach)
    const vector1 = [];
    const vector2 = [];
    const weights = [];

    // Define importance weights for different body parts
    const keypointWeights = {
        'nose': 0.5,
        'left_eye': 0.3, 'right_eye': 0.3,
        'left_ear': 0.2, 'right_ear': 0.2,
        'left_shoulder': 2.0, 'right_shoulder': 2.0,
        'left_elbow': 1.5, 'right_elbow': 1.5,
        'left_wrist': 1.2, 'right_wrist': 1.2,
        'left_hip': 2.0, 'right_hip': 2.0,
        'left_knee': 1.5, 'right_knee': 1.5,
        'left_ankle': 1.0, 'right_ankle': 1.0
    };

    // Build feature vectors with valid keypoints only
    normalizedPose1.keypoints.forEach((point1, index) => {
        const point2 = normalizedPose2.keypoints[index];
        const weight = keypointWeights[point1.name] || 1.0;

        // Only include high-confidence keypoints
        if (point1.score > 0.2 && point2.score > 0.2) {
            vector1.push(point1.x, point1.y);
            vector2.push(point2.x, point2.y);
            weights.push(weight, weight); // x and y components get same weight
        }
    });

    if (vector1.length === 0 || vector2.length === 0) {
        return 0;
    }

    // Calculate weighted cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vector1.length; i++) {
        const w = weights[i];
        const v1 = vector1[i] * w;
        const v2 = vector2[i] * w;

        dotProduct += v1 * v2;
        norm1 += v1 * v1;
        norm2 += v2 * v2;
    }

    if (norm1 === 0 || norm2 === 0) {
        return 0;
    }

    // Cosine similarity ranges from -1 to 1, convert to 0-100 percentage
    const cosineSimilarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));

    // Convert to percentage (0-100) and ensure it's positive
    const similarityPercentage = Math.max(0, (cosineSimilarity + 1) / 2 * 100);

    return smoothScore(similarityPercentage);
}

// Draw speedometer with improved visuals
function drawSpeedometer(score) {
    if (!scoreCtx || !scoreCanvas) {
        return;
    }

    const centerX = scoreCanvas.width / 2;
    const centerY = scoreCanvas.height / 2;
    const radius = Math.min(centerX, centerY) - 8;
    const startAngle = -Math.PI / 2; // Start from top
    const endAngle = Math.PI * 1.5; // Complete circle

    // Clear canvas
    scoreCtx.clearRect(0, 0, scoreCanvas.width, scoreCanvas.height);

    // Draw background circle
    scoreCtx.beginPath();
    scoreCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    scoreCtx.strokeStyle = '#444';
    scoreCtx.lineWidth = Math.max(4, radius * 0.15);
    scoreCtx.stroke();

    // Draw progress arc with gradient
    const normalizedScore = Math.max(0, Math.min(100, score));
    const progressAngle = startAngle + (normalizedScore / 100) * (Math.PI * 2);

    // Create gradient
    const gradient = scoreCtx.createLinearGradient(0, 0, scoreCanvas.width, 0);
    gradient.addColorStop(0, '#ff4444');   // Red for low scores
    gradient.addColorStop(0.5, '#ffbb33'); // Yellow for middle scores
    gradient.addColorStop(1, '#00C851');   // Green for high scores

    // Draw progress arc
    scoreCtx.beginPath();
    scoreCtx.arc(centerX, centerY, radius, startAngle, progressAngle);
    scoreCtx.strokeStyle = gradient;
    scoreCtx.lineWidth = Math.max(4, radius * 0.15);
    scoreCtx.lineCap = 'round'; // Rounded ends
    scoreCtx.stroke();

    // Draw score text
    scoreCtx.font = `bold ${Math.max(20, radius * 0.35)}px Arial`;
    scoreCtx.fillStyle = '#fff';
    scoreCtx.textAlign = 'center';
    scoreCtx.textBaseline = 'middle';
    scoreCtx.fillText(Math.round(normalizedScore) + '%', centerX, centerY);

    // Draw "MATCH" label
    scoreCtx.font = `bold ${Math.max(12, radius * 0.2)}px Arial`;
    scoreCtx.fillStyle = '#ccc';
    scoreCtx.fillText('', centerX, centerY - radius * 0.3);

    // Add subtle glow effect
    scoreCtx.shadowColor = 'rgba(255, 255, 255, 0.3)';
    scoreCtx.shadowBlur = 10;
    scoreCtx.beginPath();
    scoreCtx.arc(centerX, centerY, radius, startAngle, progressAngle);
    scoreCtx.strokeStyle = gradient;
    scoreCtx.lineWidth = Math.max(2, radius * 0.1);
    scoreCtx.stroke();
    scoreCtx.shadowBlur = 0; // Reset shadow
}

// Smooth score update with animation
function updateScore(newScore) {
    const now = performance.now();
    const deltaTime = now - lastUpdateTime;
    lastUpdateTime = now;

    // Smooth transition
    const smoothingFactor = Math.min(0.15, deltaTime / 100);
    targetScore = newScore;
    currentScore += (targetScore - currentScore) * smoothingFactor;

    drawSpeedometer(currentScore);
}

// Calculate angle between three points (in radians)
function calculateAngle(point1, point2, point3) {
    const vector1 = {
        x: point1.x - point2.x,
        y: point1.y - point2.y
    };
    const vector2 = {
        x: point3.x - point2.x,
        y: point3.y - point2.y
    };

    const dot = vector1.x * vector2.x + vector1.y * vector2.y;
    const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

    if (mag1 === 0 || mag2 === 0) return 0;

    const cosAngle = dot / (mag1 * mag2);
    return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
}

// Extract key body angles from pose
function extractBodyAngles(keypoints) {
    const angles = {};

    // Helper function to find keypoint by name
    const findPoint = (name) => keypoints.find(k => k.name === name);

    // Define key body angles to analyze
    const angleDefinitions = {
        // Arm angles
        'left_elbow': ['left_shoulder', 'left_elbow', 'left_wrist'],
        'right_elbow': ['right_shoulder', 'right_elbow', 'right_wrist'],
        'left_shoulder': ['left_elbow', 'left_shoulder', 'left_hip'],
        'right_shoulder': ['right_elbow', 'right_shoulder', 'right_hip'],
        'left_armpit': ['left_wrist', 'left_shoulder', 'left_hip'],
        'right_armpit': ['right_wrist', 'right_shoulder', 'right_hip'],

        // Leg angles
        'left_knee': ['left_hip', 'left_knee', 'left_ankle'],
        'right_knee': ['right_hip', 'right_knee', 'right_ankle'],
        'left_hip': ['left_shoulder', 'left_hip', 'left_knee'],
        'right_hip': ['right_shoulder', 'right_hip', 'right_knee'],

        // Torso angles
        'left_torso': ['left_shoulder', 'left_hip', 'left_knee'],
        'right_torso': ['right_shoulder', 'right_hip', 'right_knee'],
        'spine': ['left_shoulder', 'nose', 'left_hip'], // Approximation

        // Cross-body angles for balance
        'left_cross': ['right_shoulder', 'left_hip', 'left_knee'],
        'right_cross': ['left_shoulder', 'right_hip', 'right_knee']
    };

    // Calculate each angle
    Object.entries(angleDefinitions).forEach(([angleName, [p1Name, p2Name, p3Name]]) => {
        const p1 = findPoint(p1Name);
        const p2 = findPoint(p2Name);
        const p3 = findPoint(p3Name);

        // Only calculate if all points exist and have good confidence
        if (p1 && p2 && p3 && p1.score > 0.3 && p2.score > 0.3 && p3.score > 0.3) {
            angles[angleName] = calculateAngle(p1, p2, p3);
        }
    });

    return angles;
}

// Calculate angle similarity between two poses
function calculateAngleSimilarity(pose1, pose2) {
    if (!pose1 || !pose2 || !pose1.keypoints || !pose2.keypoints) {
        return 0;
    }

    const angles1 = extractBodyAngles(pose1.keypoints);
    const angles2 = extractBodyAngles(pose2.keypoints);

    // Define importance weights for different angles
    const angleWeights = {
        // Arms are very important for pose matching
        'left_elbow': 3.0,
        'right_elbow': 3.0,
        'left_shoulder': 2.5,
        'right_shoulder': 2.5,
        'left_armpit': 2.0,
        'right_armpit': 2.0,

        // Legs are important for stance
        'left_knee': 2.5,
        'right_knee': 2.5,
        'left_hip': 2.0,
        'right_hip': 2.0,

        // Torso for overall posture
        'left_torso': 2.0,
        'right_torso': 2.0,
        'spine': 1.5,

        // Cross-body for balance
        'left_cross': 1.0,
        'right_cross': 1.0
    };

    let totalScore = 0;
    let totalWeight = 0;

    // Compare angles that exist in both poses
    Object.keys(angles1).forEach(angleName => {
        if (angles2[angleName] !== undefined) {
            const angle1 = angles1[angleName];
            const angle2 = angles2[angleName];
            const weight = angleWeights[angleName] || 1.0;

            // Calculate angle difference (0 to π)
            let angleDiff = Math.abs(angle1 - angle2);

            // Normalize to 0-1 (0 = identical, 1 = completely different)
            angleDiff = Math.min(angleDiff, Math.PI - angleDiff); // Use smaller angle
            const normalizedDiff = angleDiff / (Math.PI / 2); // Normalize to 0-1

            // Convert to similarity score (1 = identical, 0 = completely different)
            const similarity = Math.max(0, 1 - normalizedDiff);

            totalScore += similarity * weight;
            totalWeight += weight;
        }
    });

    if (totalWeight === 0) return 0;

    // Convert to percentage
    return (totalScore / totalWeight) * 100;
}

// Calculate limb length similarity for additional validation
function calculateLimbLengthSimilarity(pose1, pose2) {
    const getRatio = (keypoints, p1Name, p2Name, p3Name, p4Name) => {
        const p1 = keypoints.find(k => k.name === p1Name);
        const p2 = keypoints.find(k => k.name === p2Name);
        const p3 = keypoints.find(k => k.name === p3Name);
        const p4 = keypoints.find(k => k.name === p4Name);

        if (!p1 || !p2 || !p3 || !p4 ||
            p1.score < 0.3 || p2.score < 0.3 || p3.score < 0.3 || p4.score < 0.3) {
            return null;
        }

        const dist1 = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        const dist2 = Math.sqrt(Math.pow(p4.x - p3.x, 2) + Math.pow(p4.y - p3.y, 2));

        return dist2 !== 0 ? dist1 / dist2 : null;
    };

    const ratios1 = {
        armToForearm: getRatio(pose1.keypoints, 'left_shoulder', 'left_elbow', 'left_elbow', 'left_wrist'),
        thighToCalf: getRatio(pose1.keypoints, 'left_hip', 'left_knee', 'left_knee', 'left_ankle'),
        armToTorso: getRatio(pose1.keypoints, 'left_shoulder', 'left_elbow', 'left_shoulder', 'left_hip')
    };

    const ratios2 = {
        armToForearm: getRatio(pose2.keypoints, 'left_shoulder', 'left_elbow', 'left_elbow', 'left_wrist'),
        thighToCalf: getRatio(pose2.keypoints, 'left_hip', 'left_knee', 'left_knee', 'left_ankle'),
        armToTorso: getRatio(pose2.keypoints, 'left_shoulder', 'left_elbow', 'left_shoulder', 'left_hip')
    };

    let totalSimilarity = 0;
    let validComparisons = 0;

    Object.keys(ratios1).forEach(key => {
        if (ratios1[key] !== null && ratios2[key] !== null) {
            const ratio1 = ratios1[key];
            const ratio2 = ratios2[key];
            const diff = Math.abs(ratio1 - ratio2) / Math.max(ratio1, ratio2);
            const similarity = Math.max(0, 1 - diff);
            totalSimilarity += similarity;
            validComparisons++;
        }
    });

    return validComparisons > 0 ? (totalSimilarity / validComparisons) * 100 : 50;
}

// Enhanced pose comparison with multiple metrics
function calculateEnhancedPoseSimilarity(pose1, pose2) {
    if (!pose1 || !pose2) {
        return 0;
    }

    // Get angle-based similarity
    const angleSimilarity = calculateAngleSimilarity(pose1, pose2);

    // Get position-based similarity (your existing method)
    const positionSimilarity = calculatePoseSimilarity(pose1, pose2);

    // Calculate limb length ratios for additional validation
    const lengthSimilarity = calculateLimbLengthSimilarity(pose1, pose2);

    // Weighted combination of different similarity metrics
    const weights = {
        angle: 0.6,      // Angles are most important
        position: 0.3,   // Position provides additional context
        length: 0.1      // Length ratios help with scale invariance
    };

    const finalScore = (
        angleSimilarity * weights.angle +
        positionSimilarity * weights.position +
        lengthSimilarity * weights.length
    );

    return smoothScore(finalScore);
}

// Confidence-based scoring that considers pose detection quality
function calculateConfidenceWeightedScore(pose1, pose2) {
    if (!pose1 || !pose2) return 0;

    // Calculate average confidence for both poses
    const avgConfidence1 = pose1.keypoints.reduce((sum, kp) => sum + kp.score, 0) / pose1.keypoints.length;
    const avgConfidence2 = pose2.keypoints.reduce((sum, kp) => sum + kp.score, 0) / pose2.keypoints.length;

    // Minimum confidence threshold
    const minConfidence = Math.min(avgConfidence1, avgConfidence2);
    const confidenceMultiplier = Math.max(0.3, minConfidence); // Don't go below 30%

    // Get the enhanced similarity score
    const similarity = calculateEnhancedPoseSimilarity(pose1, pose2);

    // Apply confidence weighting
    return similarity * confidenceMultiplier;
}

// Debug function to visualize angles
function drawAngleDebugInfo(keypoints, type = 'user') {
    if (!ctx || !canvas) return;

    const angles = extractBodyAngles(keypoints);

    // Draw angle values on canvas for debugging
    let yOffset = 30;
    ctx.font = '10px Arial';
    ctx.fillStyle = type === 'trainer' ? '#ffffff' : '#00ff00';

    Object.entries(angles).forEach(([name, angle]) => {
        const degrees = (angle * 180 / Math.PI).toFixed(1);
        ctx.fillText(`${name}: ${degrees}°`, 10, yOffset);
        yOffset += 12;
    });
}

// Main pose detection loop
async function detectPose() {
    if (!isDetecting || !detector || !videoElement || !ctx) {
        return;
    }

    try {
        const now = performance.now();
        const timeSinceLastUpdate = now - lastPoseTimestamp;

        // Only update poses at regular intervals
        if (timeSinceLastUpdate >= poseUpdateInterval) {
            lastPoseTimestamp = now;

            // Detect pose for local video
            const localPoses = await detector.estimatePoses(videoElement);
            let localPose = localPoses.length > 0 ? localPoses[0] : null;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (isTrainer == true) {
                // If this is the trainer, draw their skeleton in white
                if (localPose) {
                    drawSkeleton(localPose.keypoints, 'trainer');
                }
            } else {
                // If this is a participant
                if (localPose) {
                    // Draw participant's skeleton in green on their video
                    drawSkeleton(localPose.keypoints, 'user');

                    // Handle different modes
                    if (currentMode === 'live') {
                        // Get trainer's pose for comparison
                        let trainerPoseData = null;
                        if (trainerVideoElement &&
                            trainerVideoElement.readyState >= 2 &&
                            trainerVideoElement.videoWidth > 0 &&
                            trainerVideoElement.videoHeight > 0) {
                            try {


                                const trainerPoses = await detector.estimatePoses(trainerVideoElement);
                                trainerPoseData = trainerPoses.length > 0 ? trainerPoses[0] : null;

                                if (trainerPoseData) {
                                    // Calculate and display similarity score
                                    const similarity = calculateConfidenceWeightedScore(localPose, trainerPoseData);

                                    updateScore(similarity);
                                } else {
                                    updateScore(0);
                                }
                            } catch (error) {
                                updateScore(0);
                            }
                        } else {

                            updateScore(0);
                        }
                    } else if (currentMode === 'captured') {
                        // Get the latest captured pose from the container
                        const capturedImages = document.querySelectorAll('.captured-image');
                        if (capturedImages.length > 0) {
                            const latestImage = capturedImages[capturedImages.length - 1];
                            const capturedPoseData = latestImage.dataset.poseData ?
                                JSON.parse(latestImage.dataset.poseData) : null;

                            if (capturedPoseData) {

                                // Calculate and display similarity score with captured pose
                                const similarity = calculateConfidenceWeightedScore(localPose, capturedPoseData);


                                // Ensure we have valid poses for comparison
                                if (localPose && capturedPoseData &&
                                    localPose.keypoints && capturedPoseData.keypoints &&
                                    localPose.keypoints.length > 0 && capturedPoseData.keypoints.length > 0) {
                                    updateScore(similarity);
                                } else {

                                    updateScore(0);
                                }
                            } else {

                                updateScore(0);
                            }
                        } else {
                            updateScore(0);
                        }
                    }
                } else {
                    updateScore(0);
                }
            }
        }

        // Continue detection loop
        animationFrameId = requestAnimationFrame(detectPose);
    } catch (error) {
        // console.error('Error in pose detection:', error);
        // Continue detection even if there's an error
        animationFrameId = requestAnimationFrame(detectPose);
    }
}

// Draw skeleton on canvas with improved visuals
function drawSkeleton(keypoints, type = 'user', opacity = 1.0) {
    if (!ctx || !canvas || !keypoints) {
        return;
    }

    // Set colors based on type
    let lineColor, pointColor;
    if (type === 'trainer') {
        lineColor = `rgba(255, 255, 255, ${opacity})`; // White for trainer
        pointColor = `rgba(0, 100, 255, ${opacity})`; // Blue points for trainer
    } else {
        lineColor = `rgba(0, 255, 0, ${opacity})`; // Green for user
        pointColor = `rgba(0, 255, 0, ${opacity})`; // Green points for user
    }

    // Draw connections
    connections.forEach(([p1, p2]) => {
        const point1 = keypoints.find(k => k.name === p1);
        const point2 = keypoints.find(k => k.name === p2);

        if (point1 && point2 && point1.score > 0.3 && point2.score > 0.3) {
            // Convert video coordinates to canvas coordinates
            const x1 = point1.x * canvas.scaleX + canvas.offsetX;
            const y1 = point1.y * canvas.scaleY + canvas.offsetY;
            const x2 = point2.x * canvas.scaleX + canvas.offsetX;
            const y2 = point2.y * canvas.scaleY + canvas.offsetY;

            // Draw line
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });

    // Draw keypoints
    keypoints.forEach(keypoint => {
        if (keypoint.score > 0.3) {
            const x = keypoint.x * canvas.scaleX + canvas.offsetX;
            const y = keypoint.y * canvas.scaleY + canvas.offsetY;

            ctx.beginPath();
            ctx.arc(x, y, type === 'trainer' ? 6 : 4, 0, 2 * Math.PI); // Larger points for trainer
            ctx.fillStyle = pointColor;
            ctx.fill();

            // Add stroke for better visibility
            ctx.strokeStyle = type === 'trainer' ?
                `rgba(255, 255, 255, ${opacity})` :
                `rgba(0, 0, 0, ${opacity * 0.5})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    });
}

// Function to store pose data with an image
function storePoseDataWithImage(imgElement, poseData) {
    if (!imgElement || !poseData) {
        console.warn('Invalid parameters for storePoseDataWithImage');
        return false;
    }

    try {
        // Ensure we have valid keypoints
        if (!poseData.keypoints || poseData.keypoints.length === 0) {
            console.warn('No valid keypoints in pose data');
            return false;
        }

        // Store the pose data as a dataset attribute
        imgElement.dataset.poseData = JSON.stringify(poseData);

        // Add a visual indicator that pose data is available
        imgElement.classList.add('has-pose-data');


        return true;
    } catch (error) {
        console.error('Error storing pose data with image:', error);
        return false;
    }
}

// Export the enhanced functions
export {
    initializePoseDetection,
    startDetection,
    stopDetection,
    calculateAngle,
    extractBodyAngles,
    calculateAngleSimilarity,
    calculateEnhancedPoseSimilarity,
    calculateConfidenceWeightedScore,
    drawAngleDebugInfo,
    storePoseDataWithImage
};