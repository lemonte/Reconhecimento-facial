
const axios = require('axios');
const cam = document.getElementById('cam')
const api = axios.create({
    baseURL: "http://localhost:3333"
})
//const response = await api.get("/devs")
const startVideo = () => {
    // NavigationPreloadManager.getUserMedia({ vide: true })
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            if (Array.isArray(devices)) {
                devices.forEach(device => {
                    if (device.kind === 'videoinput') {
                        //            console.log(device)
                        if (device.label.includes('')) { // adicione entre as aspas o nome da sua camera
                            navigator.getUserMedia(
                                {
                                    video: {
                                        deviceId: device.deviceId
                                    }
                                },
                                stream => cam.srcObject = stream,
                                error => console.error(error)
                            )
                        }
                    }
                })
            }
        })
}

const loadLabels = () => {
    const labels = ['Geanderson', 'Andreia', 'Julio']
    return Promise.all(labels.map(async label => {
        const descriptions = []
        for (let i = 1; i <= 1; i++) {
            //    const img = await faceapi.fetchImage(`/assets/lib/face-api/labels/${label}/${i}.jpg`)

            const img = await faceapi.fetchImage(`https://avatars1.githubusercontent.com/u/48225849?s=460&u=3f8e9a830d52615b9b00e517f5f82bb8530d4a7b&v=4`)
            const detections = await faceapi
                .detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor()
            descriptions.push(detections.descriptor)
        }
        return new faceapi.LabeledFaceDescriptors("Geanderson", descriptions)
    }))
}

/*
const db = firebase.firestore();
const images = await db.collection("people")
    .get().then(function (querySnapshot) {
        var array = new Array();
        querySnapshot.forEach(async function (doc) {
            array.push(doc.data());
        });
        return array;
    }).catch(function (error) {
        return response.json(error.message);
    });
const loadLabels = () => {
    return Promise.all(images.map(async label => {
        const descriptions = []
        for (let i = 0; i <= label.images.length; i++) {
            const img = await faceapi.fetchImage(`${label.images[i]}`)
            const detections = await faceapi
                .detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor()
            descriptions.push(detections.descriptor)
        }
        return new faceapi.LabeledFaceDescriptors("Geanderson", descriptions)
    }))
}
*/
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.ageGenderNet.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/lib/face-api/models'),
]).then(startVideo)

cam.addEventListener('play', async () => {
    const canvas = faceapi.createCanvasFromMedia(cam)
    const canvasSize = {
        width: cam.width,
        height: cam.height
    }
    const labels = await loadLabels()
    faceapi.matchDimensions(canvas, canvasSize)
    document.body.appendChild(canvas)
    setInterval(async () => {
        const detections = await faceapi
            .detectAllFaces(
                cam,
                new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender()
            .withFaceDescriptors()
        const resizedDetections = faceapi.resizeResults(detections, canvasSize)
        const faceMatcher = new faceapi.FaceMatcher(labels, 0.6)
        const results = resizedDetections.map(d =>
            faceMatcher.findBestMatch(d.descriptor)
        )
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        faceapi.draw.drawDetections(canvas, resizedDetections)
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
        resizedDetections.forEach(detection => {
            const { age, gender, genderProbability } = detection
            new faceapi.draw.DrawTextField([
                `${parseInt(age, 10)} years`,
                `${gender} (${parseInt(genderProbability * 100, 10)})`
            ], detection.detection.box.topRight).draw(canvas)
        })
        results.forEach((result, index) => {
            const box = resizedDetections[index].detection.box
            const { label, distance } = result
            new faceapi.draw.DrawTextField([
                `${label} (${parseInt(distance * 100, 10)})`
            ], box.bottomRight).draw(canvas)
        })
    }, 100)
})
