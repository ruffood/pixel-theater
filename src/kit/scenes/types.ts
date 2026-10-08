import type {Scene} from '../script';

/** 取出某一类场景的数据类型：SceneOf<'title'> */
export type SceneOf<T extends Scene['type']> = Extract<Scene, {type: T}>;

/** 所有场景组件的统一签名。 */
export type SceneComponent<T extends Scene['type']> = React.FC<{scene: SceneOf<T>}>;
