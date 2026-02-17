import { Object3DNode } from "@react-three/fiber";
import { Mesh, PlaneGeometry, ShaderMaterial, AmbientLight, Plane, BufferGeometry, Material, Group } from "three";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            mesh: Object3DNode<Mesh, typeof Mesh>;
            planeGeometry: Object3DNode<PlaneGeometry, typeof PlaneGeometry>;
            shaderMaterial: Object3DNode<ShaderMaterial, typeof ShaderMaterial>;
            ambientLight: Object3DNode<AmbientLight, typeof AmbientLight>;
            group: Object3DNode<Group, typeof Group>;
            // Add more as needed
        }
    }
}
