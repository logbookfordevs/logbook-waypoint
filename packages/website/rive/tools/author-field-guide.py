"""Author the field guide as native Rive geometry and view-model-driven poses."""
from pathlib import Path
import math
from xml.dom.minidom import parseString

ROOT = Path(__file__).resolve().parents[1] / 'field-guide'
INK='FF173737'; PAPER='FFF5EEDF'; RUST='FFB44C32'; BRASS='FFB3945C'; GREEN='FF56847B'

def paint(color, stroke=False, thickness=1):
    tag='Stroke' if stroke else 'Fill'
    props=f' thickness="{thickness}" cap="round" join="round"' if stroke else ''
    return f'<{tag}{props}><SolidColor colorValue="{color}"/></{tag}>'
def rect(x,y,w,h,color, radius=0, stroke=False):
    return f'<Shape x="{x}" y="{y}"><Rectangle width="{w}" height="{h}" originX="0.5" originY="0.5" cornerRadiusTL="{radius}"/>{paint(color,stroke)}</Shape>'
def circle(x,y,r,color,stroke=False,thickness=1):
    return f'<Shape x="{x}" y="{y}"><Ellipse width="{r*2}" height="{r*2}" originX="0.5" originY="0.5"/>{paint(color,stroke,thickness)}</Shape>'
def path(points,color,closed=False,stroke=True,thickness=1):
    vertices=''.join(f'<StraightVertex x="{x:.2f}" y="{y:.2f}"/>' for x,y in points)
    return f'<Shape><PointsPath isClosed="{str(closed).lower()}">{vertices}</PointsPath>{paint(color,stroke,thickness)}</Shape>'
def node(id,content,x=0,y=0,**attrs):
    extra=' '.join(f'{k}="{v}"' for k,v in attrs.items())
    return f'<Node id="0:{id}" x="{x}" y="{y}" {extra}>{content}</Node>'

# Fine cartographic contours. An authored coordinate study, not a raster imitation.
contours=[]
for ring in range(7):
    pts=[]
    for i in range(121):
        a=i/120*math.tau
        r=44+ring*10+8*math.sin(3*a)+5*math.cos(5*a)
        pts.append((240+math.cos(a)*r,305+math.sin(a)*r*1.35))
    contours.append(path(pts,'FFB7B8A4',True,True,.85))
# Survey route.
route=[]
for j in range(19):
    y=185+j*14
    x=236+math.sin(j*.28)*35
    route.append(path([(x,y),(x+2,y+6)],GREEN,thickness=2))
compass=path([(0,-30),(8,0),(0,30),(-8,0)],BRASS,True,False)+path([(0,-30),(8,0),(0,0)],INK,True,False)+circle(0,0,37,BRASS,True)
map_art=node(120,compass,325,176)+circle(247,293,7,RUST)+circle(247,293,17,RUST,True)+''.join(route)+''.join(contours)
map_art+=path([(141,473),(333,473)],BRASS)+''.join(path([(141+i*24,469),(141+i*24,477)],BRASS) for i in range(9))
# The target specimen: clear browser anatomy, annotation tracks its button.
browser=''
for x in ( -139,-126,-113): browser+=circle(x,-114,3,BRASS)
browser+=rect(0,-83,320,1,'FFD3CCBB')
browser+=rect(-55,-38,172,12,INK,2)+rect(-83,-14,116,8,'FF72847B',2)
browser+=rect(-34,16,214,5,'FFB8BCAE',2)+rect(-52,31,178,5,'FFB8BCAE',2)
browser+=path([(-113,73),(-70,73),(-78,66),(-70,73),(-78,80)],PAPER,thickness=2)
browser+=rect(-90,73,102,30,INK,4)
browser+=circle(102,-26,8,BRASS)
browser+=path([(54,31),(82,-16),(110,31)],GREEN,True,False)
browser+=rect(83,3,80,110,'FFDCE2D4',7)
browser+=rect(0,0,350,267,'FFF9F5EA',10)
browser+=rect(7,11,350,267,'220C302D',10)
# Pin: visible construction with landing ring and cross hair.
pin=circle(0,0,8,PAPER)+circle(0,0,19,RUST)+circle(0,0,31,RUST,True,1.5)
pin+=path([(-45,0),(-35,0)],RUST)+path([(35,0),(45,0)],RUST)+path([(0,-45),(0,-35)],RUST)+path([(0,35),(0,45)],RUST)
pin_node=node(130,pin,510,375,opacity=0,scaleX=.3,scaleY=.3)
# Queue leaves appear behind the captured specimen.
queue=node(140,rect(0,0,320,228,'FFB6C7B8',8)+rect(-13,15,320,228,'FF90A99D',8),640,308,opacity=0,rotation=.08)
# Book leaf and stitching: front-to-back declaration order.
book=path([(457,121),(453,486)],'FFA9A393',thickness=1)
book+=''.join(path([(442,154+i*32),(462,156+i*32)],'FFB8AA8D',thickness=1.3) for i in range(10))
book+=map_art
book+=path([(87,119),(433,99),(452,122),(452,507),(423,490),(87,510)],PAPER,True,False)
book+=path([(453,122),(477,99),(848,124),(848,508),(475,490),(453,507)],'FFEDE5D3',True,False)
book+=path([(77,131),(430,112),(453,134),(480,112),(859,136),(859,520),(480,503),(453,520),(425,503),(77,522)],'FFCDC0A6',True,False)
book+=path([(66,140),(433,122),(453,144),(479,122),(872,143),(872,534),(479,516),(453,532),(428,517),(66,536)],INK,True,False)
book+=rect(476,344,808,392,'140D2828',12)

objects=pin_node+node(110,browser,600,302,rotation=-.025)+queue+node(100,book)
# Each pose keys every owned property; Rive interpolates the poses itself.
poses=[
 {100:{13:0,14:0,16:1,17:1,18:1},110:{13:600,14:302,16:1,17:1,15:-.025},130:{13:510,14:375,16:.3,17:.3,18:0},140:{18:0,13:640,14:308}},
 {100:{13:-22,14:7,16:1,17:1,18:1},110:{13:583,14:292,16:1.12,17:1.12,15:0},130:{13:482,14:374,16:1,17:1,18:1},140:{18:0,13:640,14:308}},
 {100:{13:-40,14:24,16:.91,17:.91,18:.4},110:{13:640,14:290,16:.87,17:.87,15:0},130:{13:562,14:354,16:.72,17:.72,18:1},140:{18:1,13:656,14:310}}
]
anims=''
for i, pose in enumerate(poses):
    keys=''
    for obj, props in pose.items():
        keys+=f'<KeyedObject objectId="0:{obj}">'+''.join(f'<KeyedProperty propertyKey="{key}"><KeyFrameDouble value="{value}"/></KeyedProperty>' for key,value in props.items())+'</KeyedObject>'
    anims+=f'<LinearAnimation id="0:{200+i}" name="{["Observe","Annotate","Queue"][i]}" duration="60">{keys}</LinearAnimation>'
states=''
for i in range(3):
    transitions=''
    for j in range(3):
        if i==j: continue
        transitions+=f'''<StateTransition stateToId="0:{310+j}" duration="950" interpolationType="cubic" enableEarlyExit="true"><CubicEaseInterpolator x1="0.22" y1="1" x2="0.36" y2="1"/><TransitionViewModelCondition opValue="equal"><TransitionPropertyViewModelComparator><BindablePropertyNumber><DataBindContext sourcePathIds="0:400-0:402" propertyKey="636"/></BindablePropertyNumber></TransitionPropertyViewModelComparator><TransitionValueNumberComparator value="{j}"/></TransitionViewModelCondition></StateTransition>'''
    states+=f'<AnimationState id="0:{310+i}" x="{200+i*210}" y="0" animationId="0:{200+i}">{transitions}</AnimationState>'
sm=f'<StateMachine name="FieldGuide" id="0:300"><StateMachineLayer name="Chapter"><AnyState x="200" y="-160"/><ExitState x="440" y="-160"/><EntryState><StateTransition stateToId="0:310"/></EntryState>{states}</StateMachineLayer></StateMachine>'
vm='<ViewModel name="FieldGuide" id="0:400" defaultInstanceId="0:401"><ViewModelPropertyNumber name="chapter" id="0:402"/><ViewModelInstance name="Default" id="0:401" exports="true"><ViewModelInstanceNumber viewModelPropertyId="0:402" propertyValue="0"/></ViewModelInstance></ViewModel>'
source = f'<Rive version="1" kind="fragment"><Artboard name="Field guide" id="0:1" styleId="0:500" width="960" height="640" defaultStateMachineId="0:300" viewModelId="0:400" viewModelInstanceId="0:401"><LayoutComponentStyle id="0:500"/>{objects}{anims}{sm}</Artboard>{vm}</Rive>\n'
(ROOT/'scene.rml').write_text(parseString(source).toprettyxml(indent='  '))
