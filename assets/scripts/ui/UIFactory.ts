import { Node, Canvas, Camera, UITransform, Label, Graphics, Color, Layers, Button, view, ResolutionPolicy, profiler } from 'cc';
export function container(parent: Node, name: string, y = 0): Node {
  const node = new Node(name); node.layer = Layers.Enum.UI_2D; parent.addChild(node);
  node.addComponent(UITransform).setContentSize(960, 1600); node.setPosition(0, y); return node;
}
export function makeCanvas(parent: Node): Node {
  profiler.hideStats();
  view.setDesignResolutionSize(1080, 1920, ResolutionPolicy.SHOW_ALL);
  const node = container(parent, 'Canvas');
  node.getComponent(UITransform)!.setContentSize(1080, 1920);
  const cameraNode = new Node('UICamera'); parent.addChild(cameraNode); cameraNode.setPosition(0, 0, 1000);
  const camera = cameraNode.addComponent(Camera); camera.projection = Camera.ProjectionType.ORTHO;
  camera.orthoHeight = 960; camera.near = 0.1; camera.far = 2000; camera.visibility = Layers.Enum.UI_2D;
  camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
  camera.clearColor = new Color(35, 38, 39, 255);
  const canvas = node.addComponent(Canvas); canvas.cameraComponent = camera;
  return node;
}
export function text(parent: Node, value: string, y: number, height = 350, size = 42): Label {
  const node = container(parent, 'Text', y); node.getComponent(UITransform)!.setContentSize(900, height);
  const label = node.addComponent(Label); label.string = value; label.fontSize = size; label.lineHeight = size + 18;
  label.color = new Color(235, 231, 220); label.horizontalAlign = Label.HorizontalAlign.LEFT;
  label.verticalAlign = Label.VerticalAlign.CENTER; label.overflow = Label.Overflow.SHRINK; label.enableWrapText = true;
  return label;
}
export function button(parent: Node, title: string, y: number, action: () => void): Button {
  const node = container(parent, 'Button', y); node.getComponent(UITransform)!.setContentSize(900, 110);
  const g = node.addComponent(Graphics); g.fillColor = new Color(63, 67, 65); g.rect(-450, -55, 900, 110); g.fill();
  const label = text(node, title, 0, 90, 36); label.horizontalAlign = Label.HorizontalAlign.CENTER;
  const b = node.addComponent(Button); b.transition = Button.Transition.NONE;
  node.on(Node.EventType.TOUCH_END, () => { if (b.interactable) action() });
  return b;
}
export function clear(parent: Node): void { for (const node of [...parent.children]) node.destroy() }
