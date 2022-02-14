
var cvs = document.getElementById("set");
var ctx = cvs.getContext("2d");

//var gm = game_manager();
//console.log(gm.getPointsAsArrays());

var colors = {
   red: "#FF0000",
   green: "#00FF00",
   blue: "#0000FF"
}

var options = {
   dim: 2,
   size: 40,
   mult: 2,
   canvas: cvs,
   context: ctx
};

var computed = {
   board: 0,
   possibleX: [],
   possibleY: [],
   points: [],
   squareToArrayHash: [],
   arrayToSquareHash: []
}

function destroyClickedElement(event)
{
   document.body.removeChild(event.target);
};


function handleFileSelect(evt) {
   var files = evt.target.files; // FileList object
   //console.log(files);
   // files is a FileList of File objects. List some properties.
   var file = files[0];
   console.log("Filename: "+file.name);
   if (!file) {
      return;
   }
   var reader = new FileReader();
   reader.onload = function(e) {
      var contents = e.target.result;
      //console.log(contents);
      loadFileContents(contents);
   };
   reader.readAsText(file);
};

function loadFileContents(text){
   var selected = JSON.parse(text);
   selected.forEach(function(array){
      //console.log(array);
      expand_and_draw_star_array(array);
      document.getElementById("counter").innerHTML = computed.board.get_selected_size();
   });
};

var empty = function(e){return;};
var empty_next = {select: empty, unselect: empty, non_available: empty};

function expand_and_draw_star_array(array){
   var index = array.indexOf("*");
   //console.log(array);
   if(index === -1){
      //console.log("Drawing: "+array);
      computed.board.togglePoint(array, empty_next);
   } else {
      array[index] = 1;
      expand_and_draw_star_array(array);
      array[index] = 2;
      expand_and_draw_star_array(array);
      array[index]="*";
   }
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);

function save(){
   //console.log(computed.board.get_selected());
   //console.log(JSON.stringify(computed.board.get_selected()));
   var textToSave = JSON.stringify(computed.board.get_selected());
   var hiddenElement = document.createElement('a');
   //console.log(textToSave);
   hiddenElement.href = 'data:application/octet-stream,' + encodeURIComponent(textToSave);
   // hiddenElement.id = "saveLink";
   hiddenElement.target = '_blank';
   hiddenElement.download = computed.board.get_selected_size() + "capInDim" + options.dim + ".txt";
   hiddenElement.onclick = destroyClickedElement;
   hiddenElement.style.display = "none";
   //console.log(hiddenElement);
   document.body.appendChild(hiddenElement);
   hiddenElement.click();
}

document.getElementById("saveBtn").addEventListener('click', function(evt){
   save();
});

function balance(gm){
   /*return function(){
      var result = 0;
      var average = 0;
      var number = 0;
      //console.log(gm.cardinalityHash);
      for(var i=0; i<gm.cardinalityHash.length; i++){
         average += gm.cardinalityHash[i] * i;
         number += gm.cardinalityHash[i];
      }
      // console.log("Number is "+number);
      if(number == 0){
         return 0;
      }
      average /= number;
      average = 20;
      for(var i=0; i<gm.cardinalityHash.length; i++){
         result += gm.cardinalityHash[i] * (i-average) * (i-average);
      }
      return result/number;
   };*/
   return function(){
      var nonAvailable = gm.get_selected().length;
      for(var i=1; i<gm.cardinalityHash.length; i++){
         nonAvailable += gm.cardinalityHash[i];
      }
      return nonAvailable;
   };
};


function init_board(){
   options.canvas.width = document.body.clientWidth;
   options.canvas.height = document.body.clientHeight-200;
   compute_size();
   computed.possibleX = [];
   computed.possibleY = [];
   computed.squareToArrayHash = [];
   computed.arrayToSquareHash = [];
   //computed.gm = game_manager({dim: options.dim});
   computed.board=board(draw.select, draw.unselect, draw.non_available, {dim: options.dim, balance: balance});
   //console.log(computed.board);
   var pointsAsArrays = computed.board.points;
   computed.points = pointsAsArrays;
   pointsAsArrays.forEach(function(array){
      var square = square_from_array(array);
      //console.log(square);
      draw.unselect(array);
   });
}

function getMousePos(canvas, evt) {
   var rect = canvas.getBoundingClientRect();
   return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
   };
}

var containing_square = function(clickX, clickY){
   var xStart=-1;
   var yStart=-1;
   for(var i=0; i<computed.possibleX.length; i++){
      if((computed.possibleX[i] <= clickX) && (computed.possibleX[i]+options.size > clickX)){
         xStart = computed.possibleX[i];
         break;
      }
   }
   for(var i=0; i<computed.possibleY.length; i++){
      if((computed.possibleY[i] <= clickY) && (computed.possibleY[i]+options.size > clickY)){
         yStart = computed.possibleY[i];
         break;
      }
   }
   if((xStart == -1) || (yStart == -1)){
      return -1;
   }
   return [xStart, yStart];
};

function rgbToHex(R,G,B) {return "#"+toHex(R)+toHex(G)+toHex(B)}

function toHex(n) {
   n = parseInt(n,10);
   if (isNaN(n)) return "00";
   n = Math.max(0,Math.min(n,255));
   return "0123456789ABCDEF".charAt((n-n%16)/16) + "0123456789ABCDEF".charAt(n%16);
};

function compute_size(){
   var size = Math.min(vertical_size(), horizontal_size());
   if(size<0 && options.mult == 1){
      console.log("Dimension is too big.");
      options.size = 1;
   } else if (size<=10 && options.mult>1){
      options.mult--;
      compute_size();
   } else if (size>100 && options.mult < 3){
      options.mult++;
      compute_size();
   } else {
      options.size = size;
   }
   //console.log("Size set to: "+size);
};

function vertical_size(){
   var canvas_width = options.canvas.width;
   var numblocks = Math.pow(3, parseInt(Math.floor((options.dim+1)/2),10));
   var subtractor = 0;
   for(var i=0; i<Math.floor((options.dim+1)/2); i++){
      subtractor += (1+2*i)*Math.pow(3,Math.floor((options.dim+1)/2)-i);
   }
   //console.log("There are "+numblocks+"blocks");
   return parseInt((canvas_width-options.mult*subtractor)/numblocks);
};

function horizontal_size(){
   var canvas_height = options.canvas.height;
   var numblocks = Math.pow(3, Math.floor(options.dim/2));
   var subtractor = 0;
   for(var i=0; i<options.dim/2; i++){
      subtractor += 2*i*Math.pow(3,Math.floor(options.dim/2)-i+1);
   }
   return parseInt((canvas_height-options.mult*subtractor)/numblocks);
};

function get_unselect_color(array){
   var greenVal = 0;
   greenVal = (array[array.length-1]+3)*255/5;
   greenVal = parseInt(greenVal,10);
   var blueVal = 0;
   if(array.length>2){
      blueVal = (array[array.length-2]+3)*255/5;
      blueVal = parseInt(blueVal,10);
   }
   return {red: 0, green: greenVal, blue: blueVal};
}

var draw = {
   select: function(array){
      var square = computed.arrayToSquareHash[array];
      options.context.fillStyle = "#000000";
      options.context.fillRect(square[0], square[1], options.size, options.size);
      options.context.fillStyle = "#FFFFFF";
      options.context.fillRect(square[0]+2, square[1]+2, options.size-4, options.size-4);
      //draw_square(computed.arrayToSquareHash[array], rgbToHex(0,0,255));
   },
   affine: function(array){
      var square = computed.arrayToSquareHash[array];
      var len = options.size / 4;
      options.context.fillStyle="#FF6600";
      options.context.fillRect(square[0]+len, square[1]+len, options.size-2*len, options.size-2*len);
      //draw_square(computed.arrayToSquareHash[array], rgbToHex(0,0,255));
   },
   unselect: function(array){
      var rgb = get_unselect_color(array);
      draw_square(computed.arrayToSquareHash[array], rgbToHex(rgb.red, rgb.green, rgb.blue));
   },
   non_available: function(array, strength){
      //console.log("Drawing non-available." + array + " -- "+computed.available.indexOf(array));
      var redVal = 255 - 10*(strength-1);
      redVal = Math.max(redVal, 10);
      draw_square(computed.arrayToSquareHash[array], rgbToHex(redVal,0,0));
   }
};

function draw_defects(num){
   computed.board.draw_defects(num, function(point){
      draw_square(computed.arrayToSquareHash[point], rgbToHex(255, 200, 200));
   });
};

function draw_remaining_lines_through_point(array){
   computed.board.draw_remaining_lines_through_point(array, function(point){
      draw_square(computed.arrayToSquareHash[point], rgbToHex(255, 255, 0));
   }, function(point){
      draw_square(computed.arrayToSquareHash[point], rgbToHex(255, 255, 255));
   });
};


var square_from_array = function(array){
   //console.log(array);
   if(!computed.arrayToSquareHash[array]){
      var d = array.length;
      var mult = options.mult;
      var size = options.size;
      var yStart = 0;
      var xStart = 0;
      var yStep = size;
      var xStep = size;
      for(var i = 0; i<d; i++){
         var j = i+1;
         if(i%2 == 0){
            xStart += array[i]*(xStep + mult*j);
            if(i>0){yStep = 3*yStep + 2*mult*j;}
         } else {
            yStart += array[i]*(yStep + mult*j);
            xStep = 3*xStep + 2*mult*j;
         }
      }
      var square = [xStart, yStart];
      computed.arrayToSquareHash[array] = square;
      computed.squareToArrayHash[square] = array;
      if(computed.possibleX.indexOf(xStart) === -1){
         computed.possibleX.push(xStart);
      }
      if(computed.possibleY.indexOf(yStart) === -1){
         computed.possibleY.push(yStart);
      }
   }
   return computed.arrayToSquareHash[array];
};

function draw_affine_span(){
    if(computed.board.get_selected_size() == 0){
        // console.log("Will not draw anything.");
        return;
    }
    var hyperplanes = computed.board.affine_span();

    
    computed.board.available.forEach(function(array){
        draw.unselect(array);
        var test = 1;
        hyperplanes.forEach(function(hp){
            // console.log("hp: " + hp);
            var val = hp[1];
            var vector = hp[0];
            var check = computed.board.scalp(vector, array);
            // console.log("pt: " + array + " vec: " + vector + " val: " + val + " check: " + check);
            if(check != val){
                test = 0;
            }
        });
        if(test == 1){
            draw.affine(array);
        }
    });
};

function find_and_draw_taboo_points(desired){
   // console.log("Available in balance method")
   // console.log(computed.available);
   var availableToValueHash = [];
   var available = computed.board.available;
   var selected = computed.board.get_selected();
   var maximum = -100;
   for(var i=0; i<available.length; i++){
      var point = available[i];
      computed.board.toggle_without_drawing(point);
      availableToValueHash[i] = computed.board.cardinalityHash[0];
      maximum = Math.max(availableToValueHash[i], maximum);
      computed.board.toggle_without_drawing(point, empty_next);
      draw.unselect(point);
   }
   for(var i=0; i<available.length; i++){
      if(availableToValueHash[i] + selected.length < desired){
         // console.log("Drawing " + available[i]);
         draw_square(computed.arrayToSquareHash[available[i]], rgbToHex(255, 255, 255));
      }
      if(availableToValueHash[i] == maximum){
         // console.log("Drawing " + available[i]);
         draw_square(computed.arrayToSquareHash[available[i]], rgbToHex(200, 255, 200));
      }
   }
};

function find_and_draw_optimal_points(){
   function empty_draw(){return;};
   // console.log("Available in balance method")
   // console.log(computed.available);
   var availableToValueHash = [];
   var minimum = 100;
   var maximum = -100;
   var available = computed.board.available;
   var currentBalance = computed.board.get_balance();
   console.log("Current balance: "+currentBalance);
   for(var i=0; i<available.length; i++){
      var point = available[i];
      computed.board.toggle_without_drawing(point);
      availableToValueHash[i] = computed.board.get_balance() - currentBalance;
      // console.log("Future balance: "+computed.gm.get_balance()+" if we move with "+point);
      minimum = Math.min(minimum, availableToValueHash[i]);
      maximum = Math.max(maximum, availableToValueHash[i]);
      computed.board.toggle_without_drawing(point, empty_next);
      draw.unselect(point);
   }
   // console.log("The minimum is "+minimum);
   for(var i=0; i<available.length; i++){
      if(availableToValueHash[i] == minimum){
         // console.log("Drawing " + available[i]);
         draw_square(computed.arrayToSquareHash[available[i]], rgbToHex(255, 255, 0));
      }
      if(availableToValueHash[i] == maximum){
         // console.log("Drawing " + available[i]);
         draw_square(computed.arrayToSquareHash[available[i]], rgbToHex(255, 0, 255));
      }
   }
};

var draw_square = function(square, color){
   options.context.fillStyle = color;
   options.context.fillRect(square[0], square[1], options.size, options.size);
}

document.getElementById("submitBtn").addEventListener('click', function(evt){
   ctx.clearRect(0,0,options.canvas.width, options.canvas.height);
   var newDim = document.getElementById("desiredDim").value;
   options.dim = parseInt(newDim,10);
   init_board();
});

document.getElementById("balanceBtn").addEventListener('click', function(evt){
   find_and_draw_optimal_points();
});

document.getElementById("affineBtn").addEventListener('click', function(evt){
   draw_affine_span();
});

document.getElementById("reverseBtn").addEventListener('click', function(evt){
   computed.board.reverse(empty_next);
});

document.getElementById("rotateBtn").addEventListener('click', function(evt){
   computed.board.rotate_coordinates(empty_next);
});

options.canvas.addEventListener('click', function(evt) {
   var mousePos = getMousePos(options.canvas, evt);
   var contSquare = containing_square(mousePos.x, mousePos.y);
   if(contSquare == -1){
      console.log("There is nothing here.");
      return;
   }
   var array = computed.squareToArrayHash[contSquare];
   // console.log("Received click on " + array);
   computed.board.togglePoint(array, empty_next);
   console.log("Current balance: "+computed.board.get_balance());
   document.getElementById("counter").innerHTML = computed.board.get_selected_size();
   document.getElementById("available").innerHTML = computed.board.available.length;
}, false);

init_board();




