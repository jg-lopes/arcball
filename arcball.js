var containers;
var camera, scene, raycaster, renderer;
var mouse = new THREE.Vector2();
var isClicking;
var frustumSize = 40;

var mouseVector = new THREE.Vector3();
var mouseEvent = new THREE.Vector2();
var quaternion = new THREE.Quaternion();
var curIntersection = new THREE.Vector2();
var lastIntersection = new THREE.Vector2();

var interactiveBoxes;

var currentClicked;
var activeArcball;

var currentTranslating; 
var mode = {};

init();
animate();

function createCube() {

    var geometry = new THREE.BoxGeometry(1, 1, 1);

    // Colors of the face of the cube (following a Rubik's Cube model)
    // Blue - FRONT // Green - BACK // Yellow - UP // gray - DOWN // Red - RIGHT // Orange - LEFT
    var colors = [ 'red', 'orange', 'yellow', 'gray', 'blue', 'green'];
    for ( var i = 0; i < geometry.faces.length; i += 2 ) {
        var color = new THREE.Color( colors[i/2] );
        geometry.faces[ i ].color.set(color);
        geometry.faces[ i + 1 ].color.set( color);
    }
    var material = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } );

    var box = new THREE.Mesh( geometry, material );

    box.position.x = Math.random() * 30 - 15;
    box.position.y = Math.random() * 30 - 15;
    box.position.z = Math.random() * 30 - 15;

    box.rotation.x = Math.random() * 2 * Math.PI;
    box.rotation.y = Math.random() * 2 * Math.PI;
    box.rotation.z = Math.random() * 2 * Math.PI;

    box.scale.x = Math.random() * 2 + 1;
    box.scale.y = Math.random() * 2 + 1;
    box.scale.z = Math.random() * 2 + 1;
    
    mode[box.id] = "TRANSLATE";

    interactiveBoxes.add( box );
}


function init() {

    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 1000 );
    camera.translateZ(500); 

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf0f0f0 );

    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );


    // Introducing the cube + arcball visualization object
    interactiveBoxes = new THREE.Group();

    for (var i = 0; i < 10; i++) {
        createCube();
    }

    scene.add( interactiveBoxes );

    // camera.zoom = 0.1;
    // camera.updateProjectionMatrix();

    document.addEventListener( 'mousedown', onDocumentMouseDown, false);
    document.addEventListener( 'mouseup', onDocumentMouseUp, false);
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousewheel', onDocumentMouseWheel, false);
    document.addEventListener( 'dblclick', onDocumentDoubleClick, false);

    document.body.appendChild( renderer.domElement );
}

// Declares the start of a click
function onDocumentMouseDown(event) {
    isClicking = true;
    raycaster.setFromCamera(mouseVector, camera);
    var intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        currentTranslating = intersects[0].object;
    }
}

// Declares the ending of a click
function onDocumentMouseUp(event) {
    isClicking = false;
    currentTranslating = undefined;
}

// #############################################################################################
// Double click functions
// #############################################################################################

objPosition = new THREE.Vector3();
function onDocumentDoubleClick(event) {
    // Removes previously placed arcball
    scene.remove(scene.getObjectByName('arcball'));
    // This both allows the mouse to click objects "behind the arcball"
        // and as well allows for seamlessly changing active arcballs

    // Raycaster to discover intersections
    raycaster.setFromCamera(mouseVector, camera);
    var intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        currentClicked = intersects[0].object;
        
        if (mode[currentClicked.id] == "ROTATE") {
            mode[currentClicked.id] = "TRANSLATE";
        } else {
            mode[currentClicked.id] = "ROTATE";
        }

        if (mode[currentClicked.id] == "ROTATE") {
        
            objScale = intersects[0].object.scale;
            // Finds the position of the center of the object in the world coordinates
            scene.updateMatrixWorld();
            objPosition.setFromMatrixPosition (intersects[0].object.matrixWorld);

            createArcball(objScale, objPosition);
        }
    } else {
        currentClicked = interactiveBoxes;

        var boxList = interactiveBoxes.children;

        for (i = 0; i < boxList.length; i++ ){
            mode[boxList[i].id] = "ROTATE";
        }
        mode[interactiveBoxes.id] = "ROTATE";
        
        var positionArcball = new THREE.Vector3(0, 0, 0);
        
        // Finds the centroid of all the existing cubes
        for (i = 0; i < boxList.length; i++) {
            positionArcball.x += boxList[i].position.x;
            positionArcball.y += boxList[i].position.y;
            positionArcball.z += boxList[i].position.z;
        }

        positionArcball.divideScalar(boxList.length);



        var maxDist = 0;
        var distance;
        // Finds the distance to the furthest cube from centroid
        for (i = 0; i < boxList.length; i++) {
            
            var px = boxList[i].position.x - positionArcball.x;
            var py = boxList[i].position.y - positionArcball.y;
            var pz = boxList[i].position.z - positionArcball.z;

            distance = Math.sqrt(px * px + py * py + pz * pz);

            if (distance > maxDist) { 
                maxDist = distance;
            }
        }

        // Square roots it to find correct maxDist
        // Multiplies by 5 since the distances are calculated to the centroid of the boxes
        // Needs to fill the entire box + some extra space 
        maxDist *= 1.2;
        var maxDistVector = new THREE.Vector3(maxDist,maxDist,maxDist);

        createArcball(maxDistVector, positionArcball );
    }
}

function createArcball(scaleVector, positionVector) {
    var sphereGeom = new THREE.SphereGeometry(1, 100, 100);
    var blueMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.3 } );
    activeArcball = new THREE.Mesh( sphereGeom, blueMaterial );

    activeArcball.name = 'arcball';

    var maxScale = Math.max(scaleVector.x, scaleVector.y, scaleVector.z);

    activeArcball.scale.set(maxScale, maxScale, maxScale);
    activeArcball.translateX(positionVector.x);
    activeArcball.translateY(positionVector.y);
    activeArcball.translateZ(positionVector.z);

    scene.add(activeArcball);
}


// #############################################################################################
// Mouse movement functions
// #############################################################################################

// Organizes behaviour generated by a mouse movement
var lastInputInside = 1;
function onDocumentMouseMove( event ) {

    mouseEvent.x = event.clientX;
    mouseEvent.y = event.clientY;
    // Transforms the mouse position in normalized device coordinates
    mouseVector.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouseVector.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    
    raycaster.setFromCamera(mouseVector, camera);
    console.log(currentClicked);

    //if (mode == "ROTATION"){ 
        if ( mode[currentClicked.id] == "ROTATE" ) {
            var intersects = raycaster.intersectObject(activeArcball);
            if (intersects.length > 0){
                var temp = intersects[0].point.clone();
                var objPosition = new THREE.Vector3();
                scene.updateMatrixWorld();
                objPosition.setFromMatrixPosition (intersects[0].object.matrixWorld);
                temp.sub(objPosition).normalize();

                arcballManipulation (temp, lastInputInside, 1);
                lastInputInside = 1;
            } else {
                arcballManipulation (getCenterToMouseVector(), lastInputInside, 0);
                lastInputInside = 0;
            }
        }

        // If intersected the arcball
        
    //}
}

// Given a vector clicked outside the arcball, calculates the normalized vector for introducing rotations
function arcballVector(vector) {
    P = new THREE.Vector3;

    P.set( vector.x,vector.y, 0 ); 

    OP_length = P.length();

    if (OP_length <= 1 ){
        P.z = Math.sqrt(1 - OP_length * OP_length);
    } else {
        P = P.normalize();
    }

    return P;
}

// Receives an vector to serve as a manipulator of the arcball, and does the required calculations
function arcballManipulation (inputVector, lastInputInsideValue, desiredInputInside) {
    curIntersection.x = inputVector.x
    curIntersection.y = inputVector.y;

    if (isClicking) {
        va = arcballVector(lastIntersection);
        vb = arcballVector(curIntersection);

        var angle = Math.acos(Math.min(1, va.dot(vb) / va.length() / vb.length()));
        var axis = va.cross(vb).normalize();
        
        // Removes extreme rotations (due to unset last vectors or change between inside/outside, not user input)
        if (lastInputInsideValue == desiredInputInside) {
            executeRotation(axis, angle);
        }
    }

    lastIntersection.x = curIntersection.x;
    lastIntersection.y = curIntersection.y;
}

// Gets a vector pointing from the center of a arcball to the mouse position
function getCenterToMouseVector() {
    var mouse;
    var center = new THREE.Vector3();
    mouse = mouseVector.clone();

    scene.updateMatrixWorld();
    center.setFromMatrixPosition (activeArcball.matrixWorld);
    center.unproject(camera).normalize(); 

    mouse.z = 0;
    center.z = 0;
 


    mouse.sub(center).normalize();
    return mouse;
}

// Executes the rotation defined by axis angle in the clicked object
function executeRotation(axis, angle) {
    if (currentClicked != interactiveBoxes) {
        var temp = interactiveBoxes.quaternion.clone();
        axis.applyQuaternion(temp.conjugate());
        quaternion.setFromAxisAngle(axis, angle);
        currentClicked.quaternion.multiplyQuaternions(quaternion, currentClicked.quaternion);
    } else {
        quaternion.setFromAxisAngle(axis, angle);
        interactiveBoxes.quaternion.multiplyQuaternions(quaternion, interactiveBoxes.quaternion);
    }
}

// #############################################################################################


// Manipulates the camera so resizing has a consistent behaviour
function onWindowResize() {
    

    var aspect = window.innerWidth / window.innerHeight;
    camera.left = - frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = - frustumSize / 2;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

// Mouse wheel regulates the zoom of the camera
function onDocumentMouseWheel(event) {
    

    if (event.deltaY < 0) { 
        if (camera.zoom > 0.1)
            camera.zoom /= 1.25;
    };
    
    if (event.deltaY > 0) { 
        camera.zoom *= 1.25;
    };
    camera.updateProjectionMatrix();

}

function animate() {
    requestAnimationFrame( animate );
    //scene.updateMatrixWorld();

    raycaster.setFromCamera(mouseVector, camera);
    var intersect = raycaster.intersectObjects(interactiveBoxes.children);
    
    if ( intersect.length > 0 && isClicking && mode[intersect[0].object.id] == "TRANSLATE" && currentTranslating == intersect[0].object && currentTranslating != activeArcball) {
        intersect[0].object.position.setX(intersect[0].point.x);
        intersect[0].object.position.setY(intersect[0].point.y);
        currentTranslating = intersect[0].object;

    } else if (intersect.length == 0 && currentTranslating != undefined && currentTranslating != activeArcball) {
        
        mouseEvent = mouseVector.clone();
        mouseEvent.unproject(camera);

        currentTranslating.position.setX(mouseEvent.x);
        currentTranslating.position.setY(mouseEvent.y);
    }
    renderer.render( scene, camera );
}
