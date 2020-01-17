odoo.define('hr_attendance_face.kiosk_mode', function (require) {
"use strict";
    
    var KioskMode = require('hr_attendance.kiosk_mode');
    KioskMode.include({

        init: function(parent, action) {
            var self = this;
            self._super(parent, action);
        },

        checkin_confirm_action: function(barcode) {
            var self = this;
            this._rpc({
                    model: 'hr.employee',
                    method: 'get_employee_from_code',
                    args: [barcode, ],
                })
                .then(function (result) {

                    if (!!result) {
                        var action = {
                            type: 'ir.actions.client',
                            name: 'Confirm',
                            tag: 'hr_attendance_kiosk_confirm',
                            employee_id: result.employee_id,
                            employee_name: result.employee_name,
                            employee_state: result.employee_state,
                            employee_hours_today: result.employee_hours_today,
                        };
                        self.do_action(action);
                    }
                });
        },

        start: function (){
            var self = this;
            return this._super().then(async function(){
                var weight_location = "hr_attendance_face/static/src/js/weights";
                Promise.all(
                    [
                        faceapi.nets.faceLandmark68Net.load(weight_location),
                        faceapi.nets.faceRecognitionNet.load(weight_location),
                        faceapi.nets.faceExpressionNet.load(weight_location),
                        faceapi.nets.ssdMobilenetv1.load(weight_location)
                    ]
                ).then(async function() {
                    self.streaming_and_recognize();
                })

            });
        },

        get_max_occur: function(arr){
            return arr.sort((a,b) =>
                  arr.filter(v => v===a).length
                - arr.filter(v => v===b).length
            ).pop();
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

        streaming_and_recognize: async function() {
            var self = this;
            // Streaming the webcam
            var video = document.getElementById('attendance-video-face');

            // Since Get User Media is deprecated
            navigator.getUserMedia = (
                    navigator.getUserMedia ||
                    navigator.webkitGetUserMedia ||
                    navigator.mozGetUserMedia ||
                    navigator.msGetUserMedia);

            navigator.getUserMedia(
                {video: {}},
                stream => video.srcObject = stream,
                err => console.error(err)
            );

            const labeledfacedescriptor = await this.loadLabeledImages();
            const facematcher = new faceapi.FaceMatcher(labeledfacedescriptor, 0.6);

            var results = [];

            // Rendering on playing video
            const canvas = faceapi.createCanvasFromMedia(video);
            $(".o_hr_attendance_face_video_box").append(canvas);

            // Prepare the size for the canvas
            const CanvasDisplaySize = {
                width: video.width,
                height: video.height,
            }

            // Fitting the canvas into the size
            faceapi.matchDimensions(canvas, CanvasDisplaySize);

            var detected_names = [];
            // Render and detect every 1 secs
            var refreshId = setInterval(async() => {
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
                    if (result._label != 'unknown') {
                        detected_names.push(result._label);
                    }
                })

                // Do it 5 secs and stop
                if (detected_names.length > 7) {
                    clearInterval(refreshId);

                    var barcode = self.get_max_occur(detected_names);
                    // Doing the actions
                    self.checkin_confirm_action(barcode);
                }

            }, 50)
            // });
        },


    });

});