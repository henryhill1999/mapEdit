var data = {}; // Global object to hold results from the loadJSON call
var features = []; // Global array to hold all feature objects
var bounds;
var savePath = 'untitled.geo.json';
var mapGraphic
var mode
var closest
var howClose
var selection
var toSelect
var drawClosed
var lastEl, currentEl
var zw, zh, zx, zy
var currentViewW, currentViewH, currentViewX, currentViewY

// Put any asynchronous data loading in preload to complete before "setup" is run
function preload() {
  data = loadJSON('assets/globe.geo.json');
}

// Convert saved Bubble data into Bubble Objects
function loadData() {
  for(let i = 0; i < data['features'].length;i++){
    features.push(new Feature(data['features'][i]['type'],data['features'][i]['properties'],data['features'][i]['bbox'],data['features'][i]['geometry']));
  }
}

function setup() {

  loadData();
  createCanvas(850, 425);

  zw = 1, zh = 1

  zx = 0
  zy = 0

  mapGraphic = createGraphics(850,425);

  createMap(mapGraphic);

  createDiv([])
  var inp = createInput(savePath);
  inp.size(200);
  inp.input(updateSavePath);

  var saveButton = createButton("SAVE");
  saveButton.mousePressed(saveMap);

  var cropButton = createButton("crop");
  cropButton.mousePressed(cropMap);

  var zoomButton = createButton("zoom in");
  zoomButton.mousePressed(zoomMap);

  var zoomOutButton = createButton("zoom out");
  zoomOutButton.mousePressed(zoomOut);

  mode = 'crop';
  closest = null;
  howClose = null;
  lastEl = null;
  currentEl = null;
  selection = [];
  toSelect = mouseCoord();

  var dropdown = createSelect(); // or create dropdown?
  dropdown.option('Crop','crop');
  dropdown.option('Draw Borders','draw');
  dropdown.option('Zoom','zoom');

  dropdown.changed(selectEvent);

  bounds = new Bounds(-180,90);
  bounds.endX = 180
  bounds.endY = -90
}

function draw() {
  mC = mouseCoord()

  if (mode == 'draw' && !toSelect){
    findToSelect();
  }

  background(255);

  image(mapGraphic,0,0);

  //push();

  //translate(width/2,height/2);
  //scale(width/360,-height/180);

  fill(255,0,0);
  strokeWeight(0);

  displayBounds(bounds,color(255,0,0));

  if (mode == 'draw'){
    fill(255,0,0);
    noStroke();
    TSinpx = coordInPix(toSelect[0],toSelect[1])
    ellipse(TSinpx[0],TSinpx[1],2,2);

    stroke(255,0,0);
    strokeWeight(1);
    noFill();
    if(selection.length>0){
      if (drawClosed){
        fill(255,0,0,50);
      }

      beginShape()
      for (let i=0; i<selection.length; i++){
        sinpx = coordInPix(selection[i][0],selection[i][1])
        vertex(sinpx[0],sinpx[1]);
      }

      if (drawClosed){
        endShape(CLOSE);
      }else{
        endShape();
      }
    }
    if(selection.length>0 && sqrt((mC[0]-selection[0][0])**2+(mC[1]-selection[0][1])**2)<5){
      fill(0,0,255);
      //ellipse(mC[0],mC[1],5,5);
    }
  }

  //pop();

  toSelect = null;
}

function createMap(g){
  g.push();

  g.translate(-zw*zx*width/360+width/(2),zh*zy*height/180+height/(2));

  g.scale(zw*width/360,-zh*height/180);

  g.background(100,200,255);

  g.stroke(255);
  g.strokeWeight(0);
  g.fill(0,150,0);

  for (var i = 0; i < features.length; i++) {

    for (var el = 0; el < features[i].geometry.coordinates.length; el++){

      g.beginShape();
      for (var v = 0; v < features[i].geometry.coordinates[el].length; v++){
        coord = features[i].geometry.coordinates[el][v];
        g.vertex(coord[0],coord[1]);
      }
      g.endShape(CLOSE);
    }
  }
  g.pop();
}

function findToSelect(){
  mC = mouseCoord();

  if(selection.length>0 && sqrt((mC[0]-selection[0][0])**2+(mC[1]-selection[0][1])**2)<5){
    toSelect = selection[0];
    currentEl = null;
  }else{

    close = findClosestVertex(mC[0],mC[1]);
    closest = close[1];
    howClose = close[0];

    toSelect = mouseCoord();

    if (closest && howClose<5){
      toSelect = closest;
    }else{
      currentEl = null;
    }
  }
}

function mousePressed() {
  mC = mouseCoord();

  if((mode == 'crop' || mode == 'zoom') && mouseY<height){
    print('pressed')
    bounds.startX = mC[0];
    bounds.endX = mC[0];
    bounds.startY = mC[1];
    bounds.endY = mC[1];
  }else if (mode == 'draw'){
    let l = selection.length;
    if(l>0 && sqrt((mC[0]-selection[0][0])**2+(mC[1]-selection[0][1])**2)<5){
      drawClosed = true;

    }else{
      if (!drawClosed){
        findToSelect();
        if(!selection[0] || toSelect!=selection[0]){
          if (currentEl && lastEl == currentEl) {
            let currentIndex = currentEl.indexOf(toSelect);
            let lastIndex = currentEl.indexOf(selection[selection.length-1]);
            let i = lastIndex;
            if((lastIndex>currentIndex && lastIndex-currentIndex<=currentEl.length/2) || (lastIndex<currentIndex && lastIndex-currentIndex+currentEl.length<=currentEl.length/2)){
              while(i%currentEl.length!=currentIndex && selection.length<currentEl.length) {
                selection.push(currentEl[i%currentEl.length]);
                i--;
              }
            }else{
              i +=currentEl.length;
              while(i%currentEl.length!=currentIndex && selection.length<currentEl.length) {
                selection.push(currentEl[i%currentEl.length]);
                i++;
              }
            }

          }else{
            selection.push(toSelect);
            lastEl = currentEl;
          }
        }
      }
    }
  }
}

function mouseCoord(){
  return[(mouseX-width/2)*(360/(zw*width))+zx,(mouseY-height/2)*(-(180)/(height*zh))+zy];
}

function coordInPix(x,y){
  return[width/2+(x-zx)/(360/(zw*width)),(y-zy)/(-180/(height*zh))+height/2];
}

function mouseDragged() {
  if(mode == 'crop' || mode == 'zoom'){
    mc = mouseCoord()
    bounds.endX = mc[0];
    bounds.endY = mc[1];
  }else if (mode == 'draw'){

  }
}

function mouseReleased() {
  if (bounds.width()<2 || bounds.height()<2){
    bounds.startX = -180+zx
    bounds.startY = 90-zy
    bounds.endX = zx+360/(2*zw)
    bounds.endY = zy-180/(2*zh)
  }
}

function selectEvent() {
  var selected = this.selected();
  mode = selected;
}

function findClosestVertex(x,y){
  let min = width**2;
  let minCoord = [-181,91];
  for (var i = 0; i < features.length; i++) {
    for (var el = 0; el < features[i].geometry.coordinates.length; el++){
      for (var v = 0; v < features[i].geometry.coordinates[el].length; v++){
        coord = features[i].geometry.coordinates[el][v];
        distance = (coord[0]-x)**2 + (coord[1]-y)**2;
        if(distance < min){
          min = distance;
          minCoord = coord;
          currentEl = features[i].geometry.coordinates[el];
        }
      }
    }
  }
  return [min,minCoord]
}

function cropMap() {
  for (var i = 0; i < features.length; i++) {
    features[i].crop();
    if(features[i].geometry.coordinates.length==0){
      features.splice(i,1);
      i--;
    }
  }

  createMap(mapGraphic);
}

function zoomOut(){
  bounds = new Bounds(-180,90)
  bounds.endX = 180
  bounds.endY = -90

  zoomMap()
}

function zoomMap() {
  //cropMap()

  zx = (bounds.width()/2+bounds.topLeftX())
  zy = (-bounds.height()/2+bounds.topLeftY())

  zw *= (360/zw)/(bounds.width())
  zh *= (180/zh)/(bounds.height())

  createMap(mapGraphic);

}

function mouseWheel(event) {

  k = 0.001
  sgnX = Math.sign(bounds.startX - bounds.endX)
  bounds.startX += sgnX*k*event.delta*mouseX
  bounds.endX -= sgnX*k*event.delta*(width-mouseX)

  sgnY = Math.sign(bounds.startY - bounds.endY)
  bounds.startY += sgnY*k*event.delta*mouseY
  bounds.endY -= sgnY*k*event.delta*(height-mouseY)

  zoomMap()
}

function updateSavePath(){
  savePath = this.value();
}

function saveMap() {
  let fc = new FeatureCollection(features)
  saveJSON(fc, savePath);
}

function displayBounds(b,c) {
  noFill();
  stroke(c);
  strokeWeight(1);
  TL = coordInPix(b.topLeftX(),b.topLeftY())
  rect(TL[0],TL[1],(width*zw/360)*b.width(),(height*zh/180)*b.height());
}

function Bounds(startX,startY) {
  this.startX = startX;
  this.startY = startY;
  this.endX = startX;
  this.endY = startY;

  this.width = function(){
    return abs(this.startX-this.endX);
  };

  this.height = function(){
    return abs(this.startY-this.endY);
  };

  this.topLeftX = function(){
    if (this.startX<this.endX) {
      return this.startX
    }
    return this.endX;
  };

  this.topLeftY = function(){
    if (this.startY>this.endY) {
      return this.startY
    }

    return this.endY;
  };

  this.containsPoint = function(ps){
    tlx = min(this.startX,this.endX);
    tly = min(this.startY,this.endY);

    ret = false

    if (tlx>ps[0]) {
      ps[0]=tlx;
      ret = ps;
    }else if (ps[0]-tlx>this.width()) {
      ps[0]=this.width()+tlx;
      ret = ps;
    }

    if (tly>ps[1]) {
      ps[1]=tly;
      ret = ps;
    }else if (ps[1]-tly>this.height()) {
      ps[1]=this.height()+tly;
      ret = ps;
    }

    return ret;
  };
}

function Feature(type, properties, bbox, geometry) {
  this.type = type;
  this.properties = properties;
  this.bbox = bbox;
  this.geometry = geometry;

  this.crop = function() {
    let last;
    let hasSome;
    for (var el = 0; el < this.geometry.coordinates.length; el++){
      hasSome = false;
      for (var v = 0; v < this.geometry.coordinates[el].length; v++){
        if(r = bounds.containsPoint(this.geometry.coordinates[el][v])){
          this.geometry.coordinates[el][v] = r
        }else{
          hasSome = true;
        }
      }

      let last = this.geometry.coordinates[el][0];
      let current = this.geometry.coordinates[el][1];
      let next
      for (var v = 1; v < this.geometry.coordinates[el].length-1; v++){
        next = this.geometry.coordinates[el][v];

        if((last[0]==current[0] && current[0]==next[0])||(last[1]==current[1] && current[1]==next[1])){
          this.geometry.coordinates[el].splice(v,1);
          v--;
        }else{
          last=current;
        }

        current = next;
      }

      if (!hasSome){
        this.geometry.coordinates.splice(el,1)
      }
    }
  };
}

function FeatureCollection(fs){
  this.features = fs;
}
