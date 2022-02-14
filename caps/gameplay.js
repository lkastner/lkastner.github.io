var game_manager = function(overrideOptions){
   var options = {
      dim: 4
   }

   var overrideDefaultOptions = function () {
      // Start of Server creation code
      for (var opt in overrideOptions) {
         if (options.hasOwnProperty(opt)) {
            options[opt] = overrideOptions[opt];
            console.log("option: " + opt + " set to " + options[opt]);
         }
      }
   };

   var computed = {
      pointsAsArrays: [],
      arrayToPointHash: [],
      selected: [],
      linesThroughPointHash: [],
      cardinalityHash: []
   }
   
   var generate_points = function(){
      var points = f3dPoints_in_dim(options.dim);
      points.map(function(point){
         computed.pointsAsArrays.push(point.content);
         computed.arrayToPointHash[point.content] = point;
         computed.linesThroughPointHash[point.content] = 0;
      });
      computed.cardinalityHash[0] = points.length;
      for(var i=1; i<points.length/2; i++){
         computed.cardinalityHash[i] = 0;
      }
   };

   function f3dPoint(c){
      // console.log("In pt fct.");
      this.content = [];
      if(c instanceof Array){
         this.content = c.map(function(entry){
            if(entry === parseInt(entry,10)){
               var result = entry;
               result %= 3;
               result += 3;
               result %= 3;
               return result;
            } else {
               throw "Input array does not contain integers.";
            }
         });
      } else if (c === parseInt(c, 10)){
         this.content = [ c%3 ];
      } else {
         throw "Input is not an integer, nor an array.";
      }
   };

   f3dPoint.prototype.dim = function(){
      return this.content.length;
   };

   f3dPoint.prototype.add = function(p){
      var result = [];
      if(this.dim() == p.dim()){
         for(var i=0; i<this.dim(); i++){
            result[i] = this.content[i] + p.content[i];
            result[i] %= 3;
         }
      } else {
         throw "Dimensions do not agree.";
      }
      return new f3dPoint(result);
   };

   f3dPoint.prototype.append_entry = function(newEntry){
      // console.log("Adding new entry. " + newEntry + " " + this.content);
      if(newEntry === parseInt(newEntry, 10)){
         return new f3dPoint(this.content.concat([newEntry]));
      } else {
         throw "Input is not an integer.";
      }
   };

   function third_point_on_line(a,b){
      var result=[];
      for(var i=0; i<a.dim(); i++){
         result[i] = -a.content[i]-b.content[i];
      }
      return new f3dPoint(result);
   };

   var compute_affine_span = function(){
        var orth = f3dPoints_in_dim(options.dim);
        var result = [];
        if(computed.selected.length == 0){
            return [];
        }
        orth.forEach(function(pt){
            // console.log(computed.selected[0]);
            var s = scalp(pt.content, computed.selected[0]);
            var test = 1;
            computed.selected.forEach(function(array){
                // console.log("Array is " + array);
                if(scalp(pt.content, array) != s){
                    test = 0;
                    return;
                }
            });
            if(test == 1){
                result.push([pt.content, s]);
            }
        });

        return result;
   };

   var scalp = function(array1, array2){
        var result = 0;
        for(var i=0; i<array1.length; i++){
            result += array1[i] * array2[i];
        }
        return result % 3;
   };

   var are_kollinear = function(a,b,c){
      var test = a.add(b).add(c);
      // console.log("test " + test.content);
      var result = true;
      for(var i=0; i<a.dim(); i++){
         result &= (test.content[i] == 0);
      }
      return result;
   };

   var f3dPoints_in_dim = function(dim){
      if(dim == 1){
         var result = [new f3dPoint(0), new f3dPoint(1), new f3dPoint(2)];
         return result;
      } else if (dim > 1){
         var preResult = f3dPoints_in_dim(dim - 1);
         // console.log("Adding entry 0");
         var result = preResult.map(function(p){
            return p.append_entry(0);
         });
         result = result.concat(preResult.map(function(p){
            return p.append_entry(1);
         }));
         result = result.concat(preResult.map(function(p){
            return p.append_entry(2);
         }));
         delete preResult;
         return result;
      }
   };





   var select_point = function(array, draw_select, draw_non_available){
      computed.selected.forEach(function(selectedArray){
         var third = third_point_on_line(new f3dPoint(array), new f3dPoint(selectedArray)).content;
         computed.cardinalityHash[computed.linesThroughPointHash[third]]--;
         computed.linesThroughPointHash[third]++;
         computed.cardinalityHash[computed.linesThroughPointHash[third]]++;
         draw_non_available(third, computed.linesThroughPointHash[third]);
      });
      computed.selected.push(array);
      computed.cardinalityHash[0]--;
      draw_select(array);
   };

   var unselect_point = function(array, draw_unselect, draw_non_available){
      var index = computed.selected.indexOf(array);
      computed.selected.splice(index,1);
      computed.selected.forEach(function(selectedArray){
         var third = third_point_on_line(new f3dPoint(array), new f3dPoint(selectedArray)).content;
         computed.cardinalityHash[computed.linesThroughPointHash[third]]--;
         computed.linesThroughPointHash[third]--;
         computed.cardinalityHash[computed.linesThroughPointHash[third]]++;
         if(computed.linesThroughPointHash[third] == 0){
            draw_unselect(third);
         } else {
            draw_non_available(third, computed.linesThroughPointHash[third]);
         }
      });
      computed.cardinalityHash[0]++;
      draw_unselect(array);
   };


   var toggle = function(array, draw_select, draw_unselect, draw_non_available){
      if(computed.selected.indexOf(array) === -1){
         if(computed.linesThroughPointHash[array] == 0){
            // console.log("I went in here.");
            select_point(array, draw_select, draw_non_available);
         } else {
            console.log("Point cannot be selected. "+array);
         }
      } else {
         unselect_point(array, draw_unselect, draw_non_available);
      }
   };

   var init = function(){
      overrideDefaultOptions();
      generate_points();
   }
   init();

   return{
      pointsAsArrays: computed.pointsAsArrays,
      togglePoint: toggle,
      get_selected_size: function(){
         return computed.selected.length;
      },
      get_selected: function(){
         return computed.selected;
      },
      linesThroughPointsHash: computed.linesThroughPointHash,
      cardinalityHash: computed.cardinalityHash,
      third_point_on_line: function(arrayA, arrayB){
         var third = third_point_on_line(new f3dPoint(arrayA), new f3dPoint(arrayB));
         return third.content;
      },
      get_affine_span: function(){
         return compute_affine_span();
      },
      scalp: scalp
   }

}

//exports.game_manager = game_manager;

