import './style.css'
// import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import Scrollbar from 'smooth-scrollbar'
import gsap from 'gsap'

// Clear Scroll Memory
window.history.scrollRestoration = 'manual'

// Scroll Triggers
gsap.registerPlugin(ScrollTrigger)

// 3rd party library setup:
const bodyScrollBar = Scrollbar.init(document.querySelector('#bodyScrollbar'), { damping: 0.1, delegateTo: document })

let scrollY = 0

// Tell ScrollTrigger to use these proxy getter/setter methods for the "body" element: 
ScrollTrigger.scrollerProxy('#bodyScrollbar', {
  scrollTop(value) {
    if (arguments.length) {
      bodyScrollBar.scrollTop = value; // setter
    }
    return bodyScrollBar.scrollTop    // getter
  },
  getBoundingClientRect() {
    return {top: 0, left: 0, width: window.innerWidth, height: window.innerHeight}
  }
})

// when the smooth scroller updates, tell ScrollTrigger to update() too: 
bodyScrollBar.addListener(ScrollTrigger.update);

// Functions
const lerp = (start, end, t) => {
    return start * ( 1 - t ) + end * t;
}

// -----------------------------------------------------------------
/**
 * Base
 */

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Fix Position
bodyScrollBar.addListener(({ offset }) => {  
    canvas.style.top = offset.y + 'px'
})

// Scene
const scene = new THREE.Scene()
// scene.background = new THREE.Color(0xF8F0E3)

/**
 * Loaders
 */
// Loading Manager
const loadingBar = document.getElementById('loadingBar')
const loadingPage = document.getElementById('loadingPage')

const loadingManager = new THREE.LoadingManager(
    // Loaded
    () => {
       
    },
    // Progress
    (itemUrl, itemsLoaded, itemsTotal) => {

    }
)

const images = []

// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.setDRACOLoader(dracoLoader)

// Font Loader
const fontLoader = new FontLoader()

// Lighting

const ambientLight = new THREE.AmbientLight(0xaa00ff, 0.1)
scene.add(ambientLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {    
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Objects

// --------------------

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enabled = false

controls.enableDamping = true
controls.maxPolarAngle = Math.PI/2
// controls.minAzimuthAngle = Math.PI*0/180
// controls.maxAzimuthAngle = Math.PI*90/180
controls.minDistance = 12  
controls.maxDistance = 80

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.CineonToneMapping

// Raycaster
const raycaster = new THREE.Raycaster()

// Parallax Camera Group
const cameraGroup = new THREE.Group
cameraGroup.add(camera)
cameraGroup.position.set(0,0,5)
scene.add(cameraGroup)

// Objects

// Events
const mouse = {
    x: 0,
    y: 0
}

document.addEventListener('pointermove', (e) => {
    mouse.x = e.clientX
    mouse.y = e.clientY
})

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    scrollY = bodyScrollBar.scrollTop
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    if (controls.enabled == true) {
        controls.update()
    }

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

// Moving Photo Divs
let isPhotoHeld = false

let photosArray = document.querySelectorAll('.photoDiv')

let currentZIndex = 0

let currentPhotoCount = 0

const movePhoto = () => {
    let mouseOriginalPosition = {x: 0, y: 0}

    photosArray = document.querySelectorAll('.photoDiv')

    for (let i = currentPhotoCount; i < photosArray.length; i++) {
        photosArray[i].addEventListener('click', (a) => {
            currentZIndex++
            photosArray[i].style.zIndex = currentZIndex

            if (isPhotoHeld == false) {
                isPhotoHeld = true
                document.body.style.cursor = 'grabbing'
            }
            else {
                isPhotoHeld = false
                document.body.style.cursor = 'grab'
            }
           
            photosArray[i].addEventListener('pointermove', (e) => {
                mouseOriginalPosition = {
                    x: mouse.x,
                    y: mouse.y
                }

                if (isPhotoHeld == true) {
                    gsap.to(photosArray[i], {duration: 0.25, x: mouse.x - window.innerWidth/2, y: mouse.y - window.innerHeight/2})
                }
            })

        })
    }
}

// Photo Preview
let photoChoosers, actualPhotos
let isPhotoPreviewed = false

const photoPreview = () => {
    photoChoosers = document.querySelectorAll('.photoChooser')
    actualPhotos = document.querySelectorAll('.actualPhoto')

    // Photo Preview
    for (let i = currentPhotoCount; i < photoChoosers.length; i++) {
        photoChoosers[i].addEventListener('change', () => {
            var oFReader = new FileReader()
            oFReader.readAsDataURL(photoChoosers[i].files[0])
        
            oFReader.onload = function (oFREvent) {
                actualPhotos[i].src = oFREvent.target.result
                isPhotoPreviewed = true
                ableAddPhoto()
            }
        
            setTimeout(() => {
                actualPhotos[i].style.display = 'block'
                addImageButtons[i].style.display = 'none'
            }, 50)
        })
    }
}

// Photo Chooser
let addImageButtons

const photoChooser = () => {
    addImageButtons = document.querySelectorAll('.addImageButton')

    for (let i = 0; i < addImageButtons.length; i++) {
        addImageButtons[i].addEventListener('click', () => {
            photoChoosers[i].click()
        })
    }
}

// Enable Disable Add Photo
const addPhotoButton = document.querySelector('#addPhoto')

const ableAddPhoto = () => {
    if (isPhotoPreviewed == false) {
        gsap.to(addPhotoButton, {duration: 0.25, opacity: '0.5', backgroundColor: '#e0e0e0', boxShadow: 'none', borderWidth: '1px', scale: 0.9})
    }
    else {
        gsap.to(addPhotoButton, {duration: 0.25, opacity: '1', backgroundColor: '#ffffff', boxShadow: '0 0 3px black', scale: 1})
    }
}

// Add Photo
const main = document.querySelector('#main')

addPhotoButton.addEventListener('click', () => {
    if (isPhotoPreviewed == true) {
        currentPhotoCount++

        isPhotoPreviewed = false
        ableAddPhoto()

        const photoDiv = document.createElement('div')
        photoDiv.setAttribute('class', 'photoDiv')
        const photo = document.createElement('div')
        photo.setAttribute('class', 'photo')
        let innerHTMLString = '<button class="addImageButton"><span class="material-symbols-outlined">add_a_photo</span></button><input type="file" class="photoChooser" name="photoFile" accept="image/png, image/gif, image/jpeg" style="display:none"><img class="actualPhoto" src="#" alt="Photo 0" draggable="false"/>'
        photo.innerHTML = innerHTMLString
        const caption = document.createElement('div')
        caption.setAttribute('class', 'caption')         
        caption.innerHTML = '<textarea type="textarea" class="inputText" name="captionText" placeholder="..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>'

        photoDiv.appendChild(photo)
        photoDiv.appendChild(caption)
        main.appendChild(photoDiv)

        photoChooser()
        photoPreview()
        movePhoto()
    }
})

photoChooser()
ableAddPhoto()
photoPreview()
movePhoto()
// tick()