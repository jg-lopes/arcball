var containers;
var camera, scene, raycaster, renderer;
var mouse = new THREE.Vector2();
var isClicking;
var frustumSize = 2;

var mouseVector = new THREE.Vector3();
var quaternion = new THREE.Quaternion();
var curIntersection = new THREE.Vector2();
var lastIntersection = new THREE.Vector2();

var interactiveBoxes;

var currentClicked;
var activeArcball;

var mode = "ROTATION";



init();
animate();

function createCube(scaleVector, translateVector, rotateVector) {

    var geometry = new THREE.BoxGeometry(1, 1, 1);

    // Colors of the face of the cube (following a Rubik's Cube model)
    // Blue - FRONT // Green - BACK // Yellow - UP // White - DOWN // Red - RIGHT // Orange - LEFT
    var colors = [ 'red', 'orange', 'yellow', 'white', 'blue', 'green'];
    for ( var i = 0; i < geometry.faces.length; i += 2 ) {
        var color = new THREE.Color( colors[i/2] );
        geometry.faces[ i ].color.set(color);
        geometry.faces[ i + 1 ].color.set( color);
    }
    var material = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } );

    var box = new THREE.Mesh( geometry, material );


    box.scale.set(scaleVector[0], scaleVector[1], scaleVector[2]);

    box.translateX(translateVector[0]);
    box.translateY(translateVector[1]);
    box.translateZ(translateVector[2]);

    box.rotateX(rotateVector[0]);
    box.rotateY(rotateVector[1]);
    box.rotateZ(rotateVector[2]);

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

    createCube([0.5,0.5,0.5], [-0.5, -0.5, -0.7], [Math.PI/5, Math.PI/5, 0]);
    createCube([0.75,0.75,0.75], [0.3, -0.2, -0.4], [Math.PI/5, Math.PI/5, 0]);

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

function experimentalBall(uv) {
    P = new THREE.Vector3;

    P.set(
        uv.x,
        uv.y,
        0 ); 

    OP_length = P.length();

    if (OP_length <= 1 ){
        P.z = Math.sqrt(1 - OP_length * OP_length);
    } else {
        P = P.normalize();
    }

    return P;
}

function onDocumentMouseDown(event) {
    isClicking = true;
}

objPosition = new THREE.Vector3();
function onDocumentDoubleClick(event) {;
    scene.remove(scene.getObjectByName('arcball'));
    raycaster.setFromCamera(mouseVector, camera);

    var intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {

        currentClicked = intersects[0].object;
        

        var sphereGeom = new THREE.SphereGeometry(1, 100, 100);
        var blueMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.3 } );
        activeArcball = new THREE.Mesh( sphereGeom, blueMaterial );
        
        activeArcball.name = 'arcball';
        objScale = intersects[0].object.scale;

        scene.updateMatrixWorld();
        objPosition.setFromMatrixPosition (intersects[0].object.matrixWorld);

        activeArcball.scale.set(objScale.x, objScale.y, objScale.z);
        activeArcball.position.set(objPosition.x, objPosition.y, objPosition.z);

        scene.add(activeArcball);
        
    } else {
        currentClicked = interactiveBoxes;

        var sphereGeom = new THREE.SphereGeometry(1, 100, 100);
        var blueMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.3 } );
        activeArcball = new THREE.Mesh( sphereGeom, blueMaterial );
        
        activeArcball.name = 'arcball';
        
        var boxList = interactiveBoxes.children;

        var positionArcball = new THREE.Vector3(0, 0, 0);
        
        // Finds the centroid of all the existing cubes
        for (i = 0; i < boxList.length; i++) {
            positionArcball.x += boxList[i].position.x;
            positionArcball.y += boxList[i].position.y;
            positionArcball.z += boxList[i].position.z;
        }

        positionArcball.divideScalar(boxList.length);



        var maxDist = 0;
        var maxBox, distance;
        // Finds the distance to the furthest cube from centroid
        for (i = 0; i < boxList.length; i++) {
            
            px = boxList[i].position.x - positionArcball.x;
            py = boxList[i].position.y - positionArcball.y;
            pz = boxList[i].position.z - positionArcball.z;

            distance = px * px + py * py + pz * pz;

            if (distance > maxDist) { 
                maxDist = distance;
            }
        }

        // Square roots it to find correct maxDist
        // Multiplies by 5 since the distances are calculated to the centroid of the boxes
        // Needs to fill the entire box + some extra space 
        maxDist = Math.sqrt(maxDist) * 5;


        activeArcball.position.set(positionArcball.x, positionArcball.y, positionArcball.z);
        activeArcball.scale.set(maxDist, maxDist, maxDist);
        scene.add(activeArcball);

    }
}

function onDocumentMouseUp(event) {
    isClicking = false;
}

// Declarations outside function to avoid multiple redefinitions of variables
var lastInputInside = 1;
var mouseUnproj = new THREE.Vector3();
var centerUnproj = new THREE.Vector3();
function onDocumentMouseMove( event ) {

    // Transforms the mouse position in normalized device coordinates
    mouseVector.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouseVector.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    
    raycaster.setFromCamera(mouseVector, camera);

    if (mode == "ROTATION"){ 

        if (activeArcball != undefined) {
            var intersects = raycaster.intersectObject(activeArcball);
        }

        // If intersected the arcball
        if (intersects != undefined && intersects.length > 0){  
            curIntersection.x = intersects[0].point.x
            curIntersection.y = intersects[0].point.y;

            if (isClicking) {
                va = experimentalBall(lastIntersection);
                vb = experimentalBall(curIntersection);

                var angle = Math.acos(Math.min(1, va.dot(vb) / va.length() / vb.length()));
                var axis = va.cross(vb).normalize();
                
                // Removes extreme rotations (due to unset last vectors or change between inside/outside, not user input)
                if (lastInputInside == 1) {
                    temp = interactiveBoxes.quaternion.clone();
                    axis.applyQuaternion(temp.conjugate());
                    quaternion.setFromAxisAngle(axis, angle);
                    if (currentClicked != interactiveBoxes) {
                        currentClicked.quaternion.multiplyQuaternions(quaternion, currentClicked.quaternion);
                    } else {
                        interactiveBoxes.quaternion.multiplyQuaternions(quaternion, interactiveBoxes.quaternion);
                    }
                }
                // var string = "IN";
                // console.log({string, axis, angle});
            }

            lastIntersection.x = curIntersection.x;
            lastIntersection.y = curIntersection.y;

            lastInputInside = 1;

        } else {
            mouseUnproj.set(
                ( event.clientX / window.innerWidth ) * 2 - 1,
                - ( event.clientY / window.innerHeight ) * 2 + 1,
                0 );
            
            mouseUnproj.unproject( camera );
        
            var centerUnproj = currentClicked.position.clone();
            centerUnproj.unproject (camera);
            
            mouseUnproj.z = 0;
            centerUnproj.z = 0;
            mouseUnproj.sub(centerUnproj).normalize();

            curIntersection.x = mouseUnproj.x
            curIntersection.y = mouseUnproj.y;

            if (isClicking) {
                va = experimentalBall(lastIntersection);
                vb = experimentalBall(curIntersection);

                var angle = Math.acos(Math.min(1, va.dot(vb) / va.length() / vb.length()));
                var axis = va.cross(vb).normalize();
                
                // Removes extreme rotations (due to unset last vectors or change between inside/outside, not user input)
                if (lastInputInside == 0) {
                    temp = interactiveBoxes.quaternion.clone();
                    axis.applyQuaternion(temp.conjugate());
                    quaternion.setFromAxisAngle(axis, angle);
                    quaternion.setFromAxisAngle(axis, angle);
                    if (currentClicked != interactiveBoxes) {
                        currentClicked.quaternion.multiplyQuaternions(quaternion, currentClicked.quaternion);
                    }else {
                        interactiveBoxes.quaternion.multiplyQuaternions(quaternion, interactiveBoxes.quaternion);
                    }
                }
                // var string = "OUT";
                // console.log({string, axis, angle});
            }

            lastIntersection.x = curIntersection.x;
            lastIntersection.y = curIntersection.y;

            lastInputInside = 0;
        }
    }
}


function onWindowResize() {
    // Manipulates the camera so resizing has a consistent behaviour

    var aspect = window.innerWidth / window.innerHeight;
    camera.left = - frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = - frustumSize / 2;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseWheel(event) {
    // Mouse Wheel regulates the zoom of the camera

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

    //raycaster.setFromCamera(mouseVector, camera);
    // var intersect = raycaster.intersectObjects(interactiveBoxes.children);
    // var objPosition;
    
    // if ( intersect.length > 0 && isClicking && mode == "ROTATION") {
    //     intersect[0].object.position.setX(intersect[0].point.x);
    //     intersect[0].object.position.setY(intersect[0].point.y);
    // }
    renderer.render( scene, camera );
}
