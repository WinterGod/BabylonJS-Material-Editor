﻿module RW.TextureEditor {

    export class CanvasService {
        public static $inject = [
            '$rootScope'
        ]

        private _canvasElement: HTMLCanvasElement;
        private _engine: BABYLON.Engine;
        private _scene: BABYLON.Scene;
        private _textureObject: BABYLON.AbstractMesh;
        private _light: BABYLON.Light;
        private _camera: BABYLON.ArcRotateCamera;
        
        constructor(private $rootScope: TextureEditorRootScope) {
            this._canvasElement = <HTMLCanvasElement> document.getElementById("renderCanvas");
            this._engine = new BABYLON.Engine(this._canvasElement);
            this._scene = this.$rootScope.scene = new BABYLON.Scene(this._engine);

            this._camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", 10, 0.8, 30, new BABYLON.Vector3(0, 0, 0), this._scene);
            this._camera.wheelPrecision = 20;

            this._camera.attachControl(this._canvasElement, false);


            this._engine.runRenderLoop(() => {
                this._scene.render();
            });

            window.addEventListener("resize", () => {
                this._engine.resize();
            });

            this._scene.registerBeforeRender(() => {
                
            });

        }

        public getScene(): BABYLON.Scene {
            return this.$rootScope.scene;
        }

        public getLight(): BABYLON.Light {
            return this._light;
        }

        public getMaterial(): BABYLON.StandardMaterial {
            return this.$rootScope.material;
        }

        public updateTexture(property: string, texture: BABYLON.Texture) {
            this._textureObject.material[property] = texture;
        }

        public resetScene() {
            for (var i = this._scene.meshes.length - 1; i > -1; i--) {
                this._scene.meshes[i].dispose();
            }
            this.createDefaultScene();
            this.$rootScope.$broadcast("sceneReset");
            this.selectObject(this._scene.meshes[0]);
        }

        private createDefaultScene() {
            //taken shamelessly from babylon's playground! 
            var scene = this._scene;

            var box = BABYLON.Mesh.CreateBox("Box", 6.0, scene);
            var sphere = BABYLON.Mesh.CreateSphere("Sphere", 10.0, 10.0, scene);
            var plan = BABYLON.Mesh.CreatePlane("Plane", 10.0, scene);
            var cylinder = BABYLON.Mesh.CreateCylinder("Cylinder", 3, 3, 3, 6, 1, scene);
            var torus = BABYLON.Mesh.CreateTorus("Torus", 5, 1, 10, scene);
            var knot = BABYLON.Mesh.CreateTorusKnot("Knot", 2, 0.5, 128, 64, 2, 3, scene);
            
            box.position = new BABYLON.Vector3(-10, 0, 0);   
            sphere.position = new BABYLON.Vector3(0, 10, 0); 
            plan.position.z = 10;                            
            cylinder.position.z = -10;
            torus.position.x = 10;
            knot.position.y = -10;

            //add actions to each object (hover, select)
            scene.meshes.forEach((mesh) => {
                mesh.material = new BABYLON.StandardMaterial(mesh.name + "Mat", this._scene);
                mesh.actionManager = new BABYLON.ActionManager(this._scene);
                mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOutTrigger, mesh, "renderOutline", false));
                mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOverTrigger, mesh, "renderOutline", true));
                mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnRightPickTrigger, (evt: BABYLON.ActionEvent) => {
                    console.log(evt);
                    this.selectObject(mesh);
                }));
            });
        }

        public initLight(lightType: LightType = LightType.HEMISPHERIC) {
            this._scene.lights.forEach((light) => {
                light.dispose();
            });

            switch (lightType) {
                case LightType.HEMISPHERIC:
                    this._light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this._scene);
                    (<BABYLON.HemisphericLight>this._light).groundColor = new BABYLON.Color3(0, 0, 0);
                    break;
                case LightType.POINT:
                    this._light = new BABYLON.PointLight("light", this._camera.position, this._scene);
                    break;
                case LightType.SPOT:
                    //todo calculate direction!
                    this._light = new BABYLON.SpotLight("light", this._camera.position, new BABYLON.Vector3(0, -1, 0), 0.8, 2, this._scene);
                    break;
            }

            this._light.diffuse = new BABYLON.Color3(0.6, 0.6, 0.6);
            this._light.specular = new BABYLON.Color3(1, 1, 1);

            this.$rootScope.$broadcast("lightChanged", this._light);
        }

        public selectObjectInPosition(position: number) {
            this.selectObject(this._scene.meshes[position]);
        }
         
        public selectObject(mesh: BABYLON.AbstractMesh) {
            this.$rootScope.texturedObject = this._textureObject = mesh;
            this.$rootScope.material = <BABYLON.StandardMaterial> this._textureObject.material;
            this.$rootScope.$broadcast("objectChanged", this._textureObject);
            this.directCameraTo(this._textureObject);
        }

        public directCameraTo(object: BABYLON.AbstractMesh) {
            this._camera.target = object.position;
        }

        public getObjects() {
            return this._scene.meshes;
        }
    }
} 