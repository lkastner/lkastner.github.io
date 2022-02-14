var board = function(draw_select, draw_unselect, draw_non_available, overrideOptions){
   var options = {
      dim: 4,
      balance: function(gm){return function(){
         console.log(gm.cardinalityHash);
         return 0;

      };}
   }
   
   var overrideDefaultOptions = function () {
      // Start of Server creation code
      for (var opt in overrideOptions) {
         if (options.hasOwnProperty(opt)) {
            options[opt] = overrideOptions[opt];
            //console.log("option: " + opt + " set to " + options[opt]);
         }
      }
   };

   var computed = {
      gameManager: 0,
      available: [],
      defectHash: [],
      movesSinceDefectComputation: 0
   }

   function compare_points(a,b){
      for(var i=0; i<a.length; i++){
         if(a[i] != b[i]){
            return false;
         }
      }
      return true;
   };

   function find_array_from_array(inArray){
      var points = computed.gameManager.pointsAsArrays;
      for(var i=0; i<points.length; i++){
         if(compare_points(inArray, points[i])){
            return points[i];
         }
      }
      return -1;
   };

   function sanitize_array(inArray){
      return find_array_from_array(inArray);
   };

   var draw_non_available_upgraded = function(next){
      return function(array, strength){
         var inArray = sanitize_array(array);
         var index = computed.available.indexOf(inArray);
         if(index !== -1){
            computed.available.splice(index,1);
         }
         draw_non_available(inArray, strength);
         next(inArray);
      };
   };
   
   var draw_unselect_upgraded = function(next){
      return function(array){
         var inArray = sanitize_array(array);
         computed.available.push(inArray);
         //console.log(computed.available);
         draw_unselect(inArray);
         next(inArray);
      };
   };

   var draw_select_upgraded = function(next){
      return function(array){
         //console.log("Doing select draw.");
         var inArray = sanitize_array(array);
         var index = computed.available.indexOf(inArray);
         if(index !== -1){
            computed.available.splice(index,1);
         } else {
            console.log("Something went wrong when selecting.");
         }
         draw_select(inArray);
         next(inArray);
      };
   };
   

   function toggle_without_drawing(array){
      var inArray = sanitize_array(array);
      var empty = function(){return;};
      computed.gameManager.togglePoint(inArray,empty, empty, empty);
   };

   function toggle(array, next){
      var inArray = sanitize_array(array);
      computed.gameManager.togglePoint(inArray,
         draw_select_upgraded(next.select),
         draw_unselect_upgraded(next.unselect),
         draw_non_available_upgraded(next.non_available)
      );
   };
   
   function rotate_coordinates(next){
      var saveSelected = [];
      computed.gameManager.get_selected().forEach(function(array){
         saveSelected.push(array);
      });
      //console.log(saveSelected);
      for(var i=0; i<saveSelected.length; i++){
         toggle(saveSelected[i], next);
      }
      //console.log(computed.gameManager.get_selected());
      for(var i=0; i<saveSelected.length; i++){
         var newArray = saveSelected[i].slice(0);
         var last = newArray.pop();
         newArray.unshift(last);
         toggle(newArray, next);
      }
      //console.log(computed.gameManager.get_selected());
   };

   function reverse(next){
      var saveSelected = [];
      computed.gameManager.get_selected().forEach(function(array){
         saveSelected.push(array);
      });
      //console.log(saveSelected);
      for(var i=0; i<saveSelected.length; i++){
         toggle(saveSelected[i], next);
      }
      //console.log(computed.gameManager.get_selected());
      for(var i=0; i<saveSelected.length; i++){
         toggle(saveSelected[i].slice(0).reverse(), next);
      }
      //console.log(computed.gameManager.get_selected());
   };


   var empty = function(e){return;};

   function free_point(inArray){
      var array = sanitize_array(inArray);
      var toRemove = [];
      computed.gameManager.get_selected().forEach(function(arrayA){
         if(toRemove.indexOf(arrayA) !== -1){
            return;
         } else {
            var third = computed.gameManager.third_point_on_line(arrayA, array);
            third = sanitize_array(third);
            if(computed.gameManager.get_selected().indexOf(third) !== -1){
               toRemove.push(third);
               toRemove.push(arrayA);
            }
         }
      });
      toRemove.forEach(function(point){
         toggle(point, {select: empty, unselect: empty, non_available: empty});
      });
   };

   function find_remaining_lines_through_point(inArray){
      var array = sanitize_array(inArray);
      var doubles = [];
      var singles = [];
      computed.available.forEach(function(point){
         if(point == array){
            return;
         }
         if(doubles.indexOf(point) !== -1){
            return;
         }
         if(singles.indexOf(point) !== -1){
            return;
         }
         var third = computed.gameManager.third_point_on_line(array,point);
         third = sanitize_array(third);
         if(computed.available.indexOf(third) !== -1){
            if(doubles.indexOf(third) === -1){
               doubles.push(third);
            }
            if(doubles.indexOf(point) === -1){
               doubles.push(point);
            }
         }
         if(computed.gameManager.get_selected().indexOf(third) !== -1){
            singles.push(point);
         }
      });
      var index = doubles.indexOf(array);
      if(index !== -1){
         doubles.splice(index, 1);
      }
      return {singles: singles, doubles: doubles};
   };


   function draw_remaining_lines_through_point(inArray, draw_line, draw_last){
      var goodPoints = find_remaining_lines_through_point(inArray);
      computed.available.forEach(function(point){
         draw_unselect(point);
      });
      goodPoints.doubles.forEach(function(point){
         draw_line(point);
      });
      goodPoints.singles.forEach(function(point){
         draw_last(point);
      });
   };

   function number_of_remaining_lines_through_point(inArray){
      var goodPoints = find_remaining_lines_through_point(inArray);
      //console.log(goodPoints);
      var result = goodPoints.singles.length;
      var result = result + (goodPoints.doubles.length)/2;
      return result;
   };

   function init(){
      overrideDefaultOptions();
      computed.gameManager = game_manager({dim: options.dim});
      computed.available = [];
      computed.gameManager.pointsAsArrays.forEach(function(array){
         computed.available.push(array);
      });
   };

   init();

   return{
      points: computed.gameManager.pointsAsArrays,
      affine_span: computed.gameManager.get_affine_span,
      scalp: computed.gameManager.scalp,
      available: computed.available,
      togglePoint: toggle,
      toggle_without_drawing: toggle_without_drawing,
      get_balance: options.balance(computed.gameManager),
      get_selected_size: computed.gameManager.get_selected_size,
      get_selected: computed.gameManager.get_selected,
      reverse: reverse,
      rotate_coordinates: rotate_coordinates,
      cardinalityHash: computed.gameManager.cardinalityHash,
      free_point: free_point,
      draw_remaining_lines_through_point: draw_remaining_lines_through_point
   }

}
