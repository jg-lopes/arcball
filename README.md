# Arcball

Project made for Computação Gráfica (EEL882) class at UFRJ (Computer Graphics).

The deployed project is available at https://jg-lopes.github.io/arcball/

### Instructions

1. Each object can be translated by dragging the object
2. In order to switch an object to rotate mode, you can double click it. When this happens, an arcball will spawn.
3. You can click and drag the arcball in order to rotate the object.
4. When an object is in rotate mode, it can be double clicked once again to switch to translate mode.
5. You can also double click the screen, in order to create an arcball that contains all of the objects in the scene. This arcball can also be rotated, and will rotate the entire group of objects. This will also set all of the objects mode to rotate.
6. You can use the scroll whell in order to zoom in and zoom out of the scene.

Note: If an arcball exists while another spawns, the first arcball will be destroyed. This is in order to guarantee that only one arcball is available in the screen, for better user experience. 

This also means that, if an object is in rotate mode but without a spawned arcball, it cannot be either rotated (since it has no arcball) or translated (since it is in rotate mode). This behaviour is made so to be consistent with the requirements of the project regarding the switching of the modes. However, this object can be manipulated once again by double clicking it (switching it to translate mode). 
