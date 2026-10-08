import { Node, Graphics, Color, Label, UITransform, resources, JsonAsset, ScrollView, Mask, Vec2 } from 'cc';
import { container, text, clear } from './UIFactory';
import { artSurface } from './ArtSurface';

// Explicit local design-preview entry only. Never reads or writes story/save state.
export class VisualDraft {
  private stage: Node;
  constructor(canvas: Node) { this.stage = container(canvas, 'VisualDraft'); }
  private box(parent: Node, x: number, y: number, w: number, h: number, color: string): Node {
    const n=container(parent,'Surface',y);n.setPosition(x,y);n.getComponent(UITransform)!.setContentSize(w,h);
    const g=n.addComponent(Graphics);g.fillColor=new Color().fromHEX(color);g.rect(-w/2,-h/2,w,h);g.fill();return n;
  }
  private label(parent: Node, value: string, x: number, y: number, width: number, height: number, size: number, color: string): Label {
    const l=text(parent,value,y,height,size);l.node.setPosition(x,y);l.node.getComponent(UITransform)!.setContentSize(width,height);
    l.color=new Color().fromHEX(color);l.overflow=Label.Overflow.RESIZE_HEIGHT;l.lineHeight=Math.round(size*1.75);return l;
  }
  private touch(n: Node, action: ()=>void): void { n.on(Node.EventType.TOUCH_END,action); }
  private centered(parent: Node, value: string, y: number, width: number, height: number, size: number, color: string): void {
    const label=this.label(parent,value,0,y,width,height,size,color);
    label.overflow=Label.Overflow.CLAMP;label.horizontalAlign=Label.HorizontalAlign.CENTER;label.verticalAlign=Label.VerticalAlign.CENTER;
    label.node.getComponent(UITransform)!.setContentSize(width,height);
  }
  show(kind: string): void { clear(this.stage);if(kind==='desk')this.desk();else this.read(kind==='bus',kind==='decision'); }
  private desk(): void {
    this.box(this.stage,0,0,1080,1920,'#ded6c8');
    artSurface(this.stage,'desk_2037_v1',0,0,1080,1920,true);
    const heading=this.label(this.stage,'余生未寄',180,778,560,100,64,'#f3edde');heading.horizontalAlign=Label.HorizontalAlign.CENTER;
    const date=this.label(this.stage,'2037 · 九月',180,678,560,70,32,'#ddd7c8');date.horizontalAlign=Label.HorizontalAlign.CENTER;
    // A lamp, a closed notebook and the continuation envelope. Props stay separate layers.
    const envelope=artSurface(this.stage,'envelope_v1',55,190,735,368);
    this.centered(envelope,'继续阅读',-91,390,68,44,'#3b3831');this.touch(envelope,()=>this.show('home'));
    const album=artSurface(this.stage,'album_v1',-223,-296,390,390);this.centered(album,'旧相册',58,160,52,27,'#443f35');this.touch(album,()=>this.show('home'));
    const mp3=artSurface(this.stage,'mp3_v1',257,-260,300,400);this.centered(mp3,'01.mp3',75,135,65,26,'#343e33');
    this.label(this.stage,'书桌上的信，接着上次读。',0,-600,700,80,36,'#443f35');
    const setting=this.box(this.stage,352,-817,150,110,'#d9c9ae');this.centered(setting,'Aa',0,110,70,38,'#443f35');this.touch(setting,()=>this.show('home'));
  }
  private read(bus: boolean, decision: boolean): void {
    const paper=bus?'#f0ebdf':'#e4e1d8',ink='#353b39',muted=bus?'#775c41':'#68736f';
    this.box(this.stage,0,0,1080,1920,paper);
    artSurface(this.stage,'paper_v1',0,0,1080,1920,false,bus?'#fff9ef':'#eceee9');
    artSurface(this.stage,bus?'bus_2007_v1':'home_2037_v1',0,642,1080,636,true);
    this.label(this.stage,bus?'2007.09.07 · 17路公交':'2037.09.07 · 雨夜',-40,249,860,62,30,muted);
    this.label(this.stage,bus?'靠窗的位置':'雨夜回家',-40,145,860,100,56,ink);
    const exit=this.box(this.stage,410,140,110,110,paper);this.centered(exit,'Aa',0,90,65,34,muted);this.touch(exit,()=>this.show('desk'));
    if(decision){
      this.label(this.stage,'要怎么向程安然说起许知夏？',-10,-57,850,150,46,ink);
      ['高中同学。','以前喜欢过的人。','以前很熟的朋友。'].forEach((value,i)=>{const item=this.box(this.stage,0,-265-i*173,888,132,'#d3cbb9');this.centered(item,value,0,774,105,42,ink);this.touch(item,()=>this.show('home'))});
      return;
    }
    const area=container(this.stage,'DraftReading',-342);area.getComponent(UITransform)!.setContentSize(900,790);
    const view=container(area,'Viewport');view.getComponent(UITransform)!.setContentSize(900,790);view.addComponent(Mask).type=Mask.Type.GRAPHICS_RECT;
    const content=container(view,'Content');const size=content.getComponent(UITransform)!;size.setAnchorPoint(.5,1);content.setPosition(0,395);
    const scroll=area.addComponent(ScrollView);scroll.content=content;scroll.horizontal=false;scroll.vertical=true;
    const resource=bus?'data/story/chapter01/ep04_mp3':'data/story/chapter01/ep01_home';
    resources.load(resource,JsonAsset,(error,asset)=>{
      if(error||!asset?.json||!content.isValid)return;
      const node=asset.json.nodes.find((n:{id:string})=>n.id===(bus?'CH01_EP04_BUS':'CH01_EP01_N001'));
      if(!node)return;let top=0;const names:Record<string,string>={ANRAN:'程安然',ZHOUXU:'周叙',ZHOUMAN:'周满',XIA_17:'许知夏',ZHOUXU_17:'周叙'};
      for(const p of node.paragraphs as {text:string;speaker?:string}[]){
        if(p.speaker){const speaker=this.label(content,names[p.speaker]||p.speaker,0,-top,870,80,32,muted);speaker.node.getComponent(UITransform)!.setAnchorPoint(.5,1);speaker.updateRenderData(true);top+=speaker.node.getComponent(UITransform)!.height+20;}
        const label=this.label(content,p.text,0,-top,870,100,46,ink);label.node.getComponent(UITransform)!.setAnchorPoint(.5,1);label.updateRenderData(true);top+=label.node.getComponent(UITransform)!.height+42;
      }
      size.setContentSize(900,Math.max(790,top));scroll.scrollToOffset(new Vec2(0,0),0);
    });
    const next=this.box(this.stage,0,-820,888,132,bus?'#d6c9af':'#c7cbbf');this.centered(next,'继续',0,760,110,42,ink);this.touch(next,()=>this.show(bus?'desk':'bus'));
  }
}
