import * as utils from '@dcl/ecs-scene-utils'

const _scene = new Entity('_scene')
engine.addEntity(_scene)
const transform = new Transform({
  position: new Vector3(0, 0, 0),
  rotation: new Quaternion(0, 0, 0, 1),
  scale: new Vector3(1, 1, 1)
})
_scene.addComponentOrReplace(transform)

const entity = new Entity('entity')
engine.addEntity(entity)
entity.setParent(_scene)
const gltfShape = new GLTFShape("9be6610f-cf2b-47fc-a5bd-c9aa62ea6f8e/FloorFantasyRocks_01/FloorFantasyRocks_01.glb")
gltfShape.withCollisions = true
gltfShape.isPointerBlocker = true
gltfShape.visible = true
entity.addComponentOrReplace(gltfShape)
const transform2 = new Transform({
  position: new Vector3(8, 0, 8),
  rotation: new Quaternion(0, 0, 0, 1),
  scale: new Vector3(1, 1, 1)
})
entity.addComponentOrReplace(transform2)

const entity2 = new Entity('entity2')
engine.addEntity(entity2)
entity2.setParent(_scene)
entity2.addComponentOrReplace(gltfShape)
const transform3 = new Transform({
  position: new Vector3(24, 0, 8),
  rotation: new Quaternion(0, 0, 0, 1),
  scale: new Vector3(1, 1, 1)
})
entity2.addComponentOrReplace(transform3)

const entity3 = new Entity('entity3')
engine.addEntity(entity3)
entity3.setParent(_scene)
entity3.addComponentOrReplace(gltfShape)
const transform4 = new Transform({
  position: new Vector3(8, 0, 24),
  rotation: new Quaternion(0, 0, 0, 1),
  scale: new Vector3(1, 1, 1)
})
entity3.addComponentOrReplace(transform4)

const entity4 = new Entity('entity4')
engine.addEntity(entity4)
entity4.setParent(_scene)
entity4.addComponentOrReplace(gltfShape)
const transform5 = new Transform({
  position: new Vector3(24, 0, 24),
  rotation: new Quaternion(0, 0, 0, 1),
  scale: new Vector3(1, 1, 1)
})
entity4.addComponentOrReplace(transform5)

const bluePinkMysticalMushroomTree = new Entity('bluePinkMysticalMushroomTree')
engine.addEntity(bluePinkMysticalMushroomTree)
bluePinkMysticalMushroomTree.setParent(_scene)
const transform6 = new Transform({
  position: new Vector3(4.5, 0, 28),
  rotation: new Quaternion(0, 0, 0, 1),
  scale: new Vector3(1, 1, 1)
})
bluePinkMysticalMushroomTree.addComponentOrReplace(transform6)
const gltfShape2 = new GLTFShape("01b875ea-95ea-4873-a0a7-a0884ca764e3/Tree_02/Tree_02.glb")
gltfShape2.withCollisions = true
gltfShape2.isPointerBlocker = true
gltfShape2.visible = true
bluePinkMysticalMushroomTree.addComponentOrReplace(gltfShape2)

const redLeafShrub = new Entity('redLeafShrub')
engine.addEntity(redLeafShrub)
redLeafShrub.setParent(_scene)
const transform7 = new Transform({
  position: new Vector3(30, 0, 29),
  rotation: new Quaternion(0, 0, 0, 1),
  scale: new Vector3(1, 1, 1)
})
redLeafShrub.addComponentOrReplace(transform7)
const gltfShape3 = new GLTFShape("4c0ec8ec-63be-4018-8065-2f1569cd8504/Vegetation_08/Vegetation_08.glb")
gltfShape3.withCollisions = true
gltfShape3.isPointerBlocker = true
gltfShape3.visible = true
redLeafShrub.addComponentOrReplace(gltfShape3)

const coffeeHouse = new Entity('coffeeHouse')
engine.addEntity(coffeeHouse)
coffeeHouse.setParent(_scene)
const transform8 = new Transform({
  position: new Vector3(15.5, 0, 7),
  rotation: new Quaternion(0, 0, 0, 1),
  scale: new Vector3(1, 1, 1)
})
coffeeHouse.addComponentOrReplace(transform8)
const gltfShape4 = new GLTFShape("3f4a54e3-35e2-48ac-ba41-10c6e62a6762/Coffee_House.glb")
gltfShape4.withCollisions = true
gltfShape4.isPointerBlocker = true
gltfShape4.visible = true
coffeeHouse.addComponentOrReplace(gltfShape4)

let inflatedScale = new Vector3(0.05, 0.05, 0.065)
let deflatedScale = new Vector3(0.11, 0.11, 0.075)

let isFishInflating: boolean = false

const fish = new Entity('fish')
engine.addEntity(fish)
fish.setParent(_scene)
const transform9 = new Transform({
  position: new Vector3(2.5, 1.5, 20.5),
  rotation: new Quaternion(0, 0, 0, 1),
  scale: deflatedScale, 
})
fish.addComponent(transform9)
const gltfShape5 = new GLTFShape("5e6ada1b-c5e8-4fec-9850-aea242cd7395/Fish.glb")
gltfShape5.withCollisions = true
gltfShape5.isPointerBlocker = true
gltfShape5.visible = true
fish.addComponent(gltfShape5)

fish.addComponent(new OnPointerDown(() => {
	inflatedFish()
}))

fish.addComponent(new utils.TriggerComponent(new utils.TriggerSphereShape(2, Vector3.Zero()), {onCameraEnter: () => {
	inflatedFish()
}}))

function inflatedFish() {
	if (isFishInflating) {
		return 
	}
	isFishInflating = true
	fish.addComponentOrReplace(new utils.ScaleTransformComponent(deflatedScale, inflatedScale, 1, () => {
		fish.addComponentOrReplace(new utils.Delay(2000, () => {
			fish.addComponentOrReplace(new utils.ScaleTransformComponent(inflatedScale, deflatedScale, 3, () => {
				isFishInflating = false
			}, utils.InterpolationType.EASEOUTQUAD))
		}))
  }, utils.InterpolationType.EASEINQUAD))
	log("fish clicked")
}
