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

        loadLabeledImages: function () {
          const labels = ['phuc', 'hue', 'uyen']
          return Promise.all(
            labels.map(async label => {
              const descriptions = []
              for (let i = 1; i <= 2; i++) {
                const img = await faceapi.fetchImage(`hr_attendance_face/static/src/labelled-images/${label}/${i}.png`)
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                descriptions.push(detections.descriptor)
              }
              return new faceapi.LabeledFaceDescriptors(label, descriptions)
            })
          )
        },


        start_face_detection_video: function(){
            // Prepare and loads models
            var weight_location = "hr_attendance_face/static/src/js/weights";
            var self = this;

            // Loading the models
            Promise.all([
                faceapi.nets.tinyFaceDetector.load(weight_location),
                faceapi.nets.faceLandmark68Net.load(weight_location),
                faceapi.nets.faceRecognitionNet.load(weight_location),
                faceapi.nets.faceExpressionNet.load(weight_location),
                faceapi.nets.ssdMobilenetv1.load(weight_location),

            ]).then(async function() {

                // Streaming the webcam
                var video = document.getElementById('attendance-video-face');
                navigator.getUserMedia(
                    {video: {}},
                    stream => video.srcObject = stream,
                    err => console.error(err)
                );

                const labeledfacedescriptor = await self.loadLabeledImages();
                const facematcher = new faceapi.FaceMatcher(labeledfacedescriptor, 0.6);

                var results = [];

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
                        const detections = await faceapi.detectAllFaces(video)
                            .withFaceLandmarks()
                            .withFaceExpressions()
                            .withFaceDescriptors();

                        const resizedDetections = faceapi.resizeResults(detections, CanvasDisplaySize);
                        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
                        faceapi.draw.drawDetections(canvas, resizedDetections);
                        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

                        // Detect the face
                        results = resizedDetections.map(d => facematcher.findBestMatch(d.descriptor));

                        results.forEach((result, i) => {
                          const box = resizedDetections[i].detection.box
                          const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
                          drawBox.draw(canvas)
                        })

                    }, 1000)
                });

            })
        },

    });

});