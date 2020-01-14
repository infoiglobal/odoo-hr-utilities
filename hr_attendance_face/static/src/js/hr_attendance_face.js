odoo.define('hr_attendance_face.kiosk_mode', function (require) {
"use strict";
    
    var KioskMode = require('hr_attendance.kiosk_mode');
    KioskMode.include({

        events: _.extend({}, KioskMode.prototype.events, {
            'click .attendance-video-box': 'start_face_detection_video',
        }),

        start: function (){
            return this._super()
        },

        start_face_detection_video: function(){
            // Prepare and loads models
            var weight_location = "hr_attendance_face/static/src/js/weights";

            // Loading the models
            Promise.all([
                faceapi.nets.tinyFaceDetector.load(weight_location),
                faceapi.nets.faceLandmark68Net.load(weight_location),
                faceapi.nets.faceRecognitionNet.load(weight_location),
                faceapi.nets.faceExpressionNet.load(weight_location),

            ]).then(function() {

                // Streaming the webcam
                var video = document.getElementById('attendance-video-face');
                navigator.getUserMedia(
                    {video: {}},
                    stream => video.srcObject = stream,
                    err => console.error(err)
                );

                // Rendering on playing video
                video.addEventListener('play', function() {
                    const canvas = faceapi.createCanvasFromMedia(video);
                    $(".o_hr_attendance_face_video_box").append(canvas);

                    // Prepare the size for the canvas
                    const CanvasDisplaySize = {
                        width: video.width,
                        height: video.height,
                    }

                    // Fitting the canvas into the size
                    faceapi.matchDimensions(canvas, CanvasDisplaySize);

                    // Render and detect every 1 secs
                    setInterval(async() => {
                        const detections = await faceapi.detectAllFaces(video,
                            new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
                            const resizedDetection = faceapi.resizeResults(detections, CanvasDisplaySize);
                            canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
                            faceapi.draw.drawDetections(canvas, resizedDetection);
                            faceapi.draw.drawFaceExpressions(canvas, resizedDetection);
                    }, 1000)
                });

            })
        },

    });

});